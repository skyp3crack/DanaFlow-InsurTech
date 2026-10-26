/**
 * Browser stand-ins for the native services the app uses:
 *   @react-native-firebase/auth       -> signIn / signUp / signOut
 *   @react-native-firebase/firestore  -> the `claims` collection (with offline persistence)
 *   @react-native-firebase/storage    -> uploadFile
 *   @react-native-community/netinfo   -> online flag (toggled from the demo panel)
 *   @react-native-async-storage       -> the OFFLINE_IMAGE_QUEUE
 *   react-native-biometrics           -> biometric availability flag
 * State is kept in localStorage so claims survive a refresh.
 */
import { useSyncExternalStore } from 'react';

export type ClaimStatus = 'pending' | 'AI Reviewing';

export interface Claim {
  id: string;
  description: string;
  /** Download URL once uploaded, or the sentinel used by the app while waiting for a connection. */
  photoUrl: string;
  photoPreview?: string;
  status: ClaimStatus;
  createdAt: number;
  updatedAt?: number;
  aiSummary?: string;
  /** Written locally but not yet acknowledged by the server (Firestore offline persistence). */
  hasPendingWrites: boolean;
}

export interface QueueItem {
  claimId: string;
  uri: string;
}

export type LogTag = 'AUTH' | 'FIRESTORE' | 'STORAGE' | 'NETINFO' | 'QUEUE' | 'AI' | 'BIOMETRICS';

export interface LogEntry {
  id: number;
  time: number;
  tag: LogTag;
  text: string;
}

interface StoredUser {
  email: string;
  hash: string;
}

interface State {
  online: boolean;
  biometricsAvailable: boolean;
  userEmail: string | null;
  claims: Claim[];
  queue: QueueItem[];
  logs: LogEntry[];
}

export const OFFLINE_SENTINEL = 'offline_pending_upload';
export const DEMO_ACCOUNT = { email: 'ahmad@example.com', password: 'demo1234' };

const STORAGE_KEY = 'danaflow-demo-v1';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let users: StoredUser[] = [];
let state: State = {
  online: true,
  biometricsAvailable: true,
  userEmail: null,
  claims: [],
  queue: [],
  logs: [],
};
let logSeq = 0;
const listeners = new Set<() => void>();

// ─── Plumbing ─────────────────────────────────────────────────────────────────

function emit(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getState = () => state;
export const useStore = () => useSyncExternalStore(subscribe, getState);

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ users, claims: state.claims, queue: state.queue }));
  } catch {
    // storage unavailable: data lasts for this page view only
  }
}

export function log(tag: LogTag, text: string) {
  const entry: LogEntry = { id: ++logSeq, time: Date.now(), tag, text };
  emit({ logs: [entry, ...state.logs].slice(0, 60) });
}

async function hash(password: string): Promise<string> {
  const data = new TextEncoder().encode(`danaflow:${password}`);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `plain:${password}`;
}

export async function init() {
  let stored: { users?: StoredUser[]; claims?: Claim[]; queue?: QueueItem[] } = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    // start fresh
  }
  users = stored.users?.length ? stored.users : [{ email: DEMO_ACCOUNT.email, hash: await hash(DEMO_ACCOUNT.password) }];
  emit({ claims: stored.claims ?? [], queue: stored.queue ?? [] });
  persist();
}

export async function resetDemo() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
  users = [{ email: DEMO_ACCOUNT.email, hash: await hash(DEMO_ACCOUNT.password) }];
  emit({ claims: [], queue: [], logs: [], userEmail: null, online: true, biometricsAvailable: true });
  persist();
}

// ─── Auth (firebase auth) ─────────────────────────────────────────────────────

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signIn(email: string, password: string) {
  await sleep(500);
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!EMAIL_PATTERN.test(email.trim())) {
    throw new Error('[auth/invalid-email] The email address is badly formatted.');
  }
  if (!user || user.hash !== (await hash(password))) {
    log('AUTH', `signInWithEmailAndPassword failed for ${email.trim()}`);
    throw new Error('[auth/invalid-credential] The supplied auth credential is incorrect, malformed or has expired.');
  }
  emit({ userEmail: user.email });
  log('AUTH', `Signed in as ${user.email}`);
}

export async function signUp(email: string, password: string) {
  await sleep(600);
  const normalised = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalised)) {
    throw new Error('[auth/invalid-email] The email address is badly formatted.');
  }
  if (password.length < 6) {
    throw new Error('[auth/weak-password] The given password is invalid. [ Password should be at least 6 characters ]');
  }
  if (users.some((u) => u.email === normalised)) {
    throw new Error('[auth/email-already-in-use] The email address is already in use by another account.');
  }
  users = [...users, { email: normalised, hash: await hash(password) }];
  persist();
  emit({ userEmail: normalised });
  log('AUTH', `createUserWithEmailAndPassword: new account ${normalised}`);
}

/** react-native-biometrics success: the device vouches for the stored session. */
export function biometricSignIn() {
  emit({ userEmail: DEMO_ACCOUNT.email });
  log('BIOMETRICS', 'Biometric confirmation accepted, session unlocked');
}

export function signOut() {
  if (state.userEmail) log('AUTH', 'Signed out');
  emit({ userEmail: null });
}

// ─── Device capabilities (netinfo, biometrics) ────────────────────────────────

export function setBiometricsAvailable(available: boolean) {
  emit({ biometricsAvailable: available });
  log('BIOMETRICS', available ? 'Biometric sensor available' : 'No biometrics enrolled on this device');
}

/** NetInfo.fetch() */
export const isConnected = () => state.online;

export function setOnline(online: boolean) {
  if (state.online === online) return;
  emit({ online });
  log('NETINFO', online ? 'Connection restored' : 'Connection lost, switching to offline mode');
  if (online) {
    flushPendingWrites();
    void processOfflineQueue();
  }
}

// ─── Storage + Firestore ──────────────────────────────────────────────────────

export function newClaimId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** storage().ref(...).putFile() + getDownloadURL() */
export async function uploadFile(dataUrl: string, claimId: string): Promise<string> {
  if (!state.online) throw new Error('storage/retry-limit-exceeded');
  const filename = `claims/${Date.now()}.jpg`;
  log('STORAGE', `Uploading ${filename} (${Math.round(dataUrl.length / 1024)} KB)`);
  await sleep(1200);
  if (!state.online) throw new Error('storage/retry-limit-exceeded');
  log('STORAGE', `Upload complete for claim ${claimId.slice(0, 6)}...`);
  return `https://firebasestorage.googleapis.com/v0/b/danaflow-demo.appspot.com/o/${encodeURIComponent(filename)}?alt=media`;
}

/** firestore().collection('claims').doc(id).set(...) */
export function setClaim(claim: Omit<Claim, 'hasPendingWrites'>) {
  const full: Claim = { ...claim, hasPendingWrites: !state.online };
  emit({ claims: [full, ...state.claims.filter((c) => c.id !== claim.id)] });
  persist();
  log(
    'FIRESTORE',
    state.online
      ? `claims/${claim.id.slice(0, 6)}... written (status: ${claim.status})`
      : `claims/${claim.id.slice(0, 6)}... saved to the local cache, will sync when online`,
  );
}

/** firestore().collection('claims').doc(id).update(...) */
export function updateClaim(id: string, patch: Partial<Claim>) {
  emit({ claims: state.claims.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)) });
  persist();
}

/** .collection('claims').orderBy('createdAt', 'desc').limit(1) */
export const latestClaim = (): Claim | undefined =>
  [...state.claims].sort((a, b) => b.createdAt - a.createdAt)[0];

function flushPendingWrites() {
  if (!state.claims.some((c) => c.hasPendingWrites)) return;
  emit({ claims: state.claims.map((c) => ({ ...c, hasPendingWrites: false })) });
  persist();
  log('FIRESTORE', 'Local cache synced with the server');
}

// ─── Offline image queue (AsyncStorage: OFFLINE_IMAGE_QUEUE) ──────────────────

export function enqueueImage(claimId: string, uri: string) {
  emit({ queue: [...state.queue, { claimId, uri }] });
  persist();
  log('QUEUE', `Image for claim ${claimId.slice(0, 6)}... added to the offline queue`);
}

let processing = false;

/** Mirrors processOfflineQueue() in App.tsx: upload each queued image, then patch the claim's photoUrl. */
export async function processOfflineQueue() {
  if (processing || state.queue.length === 0) return;
  processing = true;
  log('QUEUE', `Internet restored! Processing ${state.queue.length} queued image(s)...`);

  const remaining: QueueItem[] = [];
  for (const item of [...state.queue]) {
    try {
      const url = await uploadFile(item.uri, item.claimId);
      updateClaim(item.claimId, { photoUrl: url });
      log('FIRESTORE', `claims/${item.claimId.slice(0, 6)}... photoUrl updated`);
    } catch {
      log('QUEUE', 'Sync failed for an item, keeping it in the queue');
      remaining.push(item);
    }
  }
  emit({ queue: remaining });
  persist();
  processing = false;
}
