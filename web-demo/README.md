# DanaFlow Web Demo

A browser version of the DanaFlow mobile app, so the whole flow can be tried from a link without an emulator, Firebase project or API key. It lives in its own folder and does not touch the React Native code.

The screens, colours and behaviour are ported from `App.tsx` and `android/app/src/views/`:

| App feature | In the demo |
|---|---|
| Email / password sign-in and **Create Account** (Firebase Auth) | Accounts in `localStorage`, with Firebase-style error messages |
| **Quick Login (Face / Touch ID)** (`react-native-biometrics`) | A simulated fingerprint sheet. The sensor can be switched to "not set up" to see the *Not Supported* path |
| **My Wallet**: policies from `mock/policies.ts`, summary banner, *File a New Claim* | Same data and layout |
| **File a Claim**: description, photo, *Submit Claim* | Photo from the camera on a phone, or the file picker on desktop (compressed like `quality: 0.5`) |
| **Offline-first claims**: Firestore persistence, `OFFLINE_IMAGE_QUEUE`, sync on reconnect (NetInfo) | A Network switch in the demo panel. Claims filed offline are cached and their photo is queued, then both sync when you go back online |
| **AI Advocate** with the `update_claim_status` function call | A scripted assistant that makes the same decision with rules. When the accident is described clearly it updates the latest claim to *AI Reviewing* and shows the *Database Updated By AI* alert |
| Floating AI tab bar, History and Settings ("Coming soon") | Same |

The right-hand **Demo tools** panel shows the simulated Firestore `claims` documents, the offline queue and an activity log, which is where the agent's database update becomes visible.

## What is simulated

Firebase (Auth, Firestore, Storage), Gemini and the device APIs (NetInfo, biometrics, camera) are replaced by `src/services/`. Nothing is sent to a server: accounts, claims and photos stay in your browser's local storage. The assistant is rule-based rather than a live LLM, and the label in the chat header says so.

Two small differences from the app: the *Pending Claims* counter reflects the claims you file (it is a fixed `0` in the app), and the claim form is cleared after submitting.

## Demo account

`ahmad@example.com` / `demo1234`

## Run

```bash
cd web-demo
npm install
npm run dev       # http://localhost:5173
npm run build     # static files in dist/
```

## Deploy on Vercel

Import the repository and set **Root Directory** to `web-demo`. The Vite preset is detected automatically.
