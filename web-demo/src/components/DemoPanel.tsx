import { PORTFOLIO_URL } from '../constants';
import * as store from '../services/store';
import { useStore } from '../services/store';

const time = (t: number) => new Date(t).toLocaleTimeString([], { hour12: false });

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="toggle-row">
      <div>
        <div style={{ fontWeight: 700 }}>{label}</div>
        <div style={{ color: '#6b8588' }}>{hint}</div>
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />
    </div>
  );
}

export default function DemoPanel({ open }: { open: boolean }) {
  const { online, biometricsAvailable, claims, queue, logs, userEmail } = useStore();

  return (
    <aside className={`panel ${open ? 'open' : ''}`} aria-label="Demo tools">
      <div className="panel-card">
        <h2>Demo tools</h2>
        <p>
          This is a browser version of the DanaFlow mobile app. Firebase, Gemini and the device sensors are simulated
          locally, so everything below stays on your device.
        </p>
        <h3>Try this</h3>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Sign in with the demo account (or use Quick Login).</li>
          <li>
            Switch the network <b>offline</b>, then file a claim with a photo. It is saved on the device and queued.
          </li>
          <li>Switch back <b>online</b> and watch the queued photo sync.</li>
          <li>
            Open the <b>AI</b> tab and describe the accident. The agent updates the claim to <i>AI Reviewing</i>.
          </li>
        </ol>
      </div>

      <div className="panel-card">
        <h3>Device</h3>
        <Toggle label="Network" hint={online ? 'Online' : 'Offline (airplane mode)'} on={online} onChange={store.setOnline} />
        <Toggle
          label="Biometric sensor"
          hint={biometricsAvailable ? 'Available' : 'Not set up on this device'}
          on={biometricsAvailable}
          onChange={store.setBiometricsAvailable}
        />
        <div className="toggle-row">
          <span>Signed in as</span>
          <b>{userEmail ?? 'nobody'}</b>
        </div>
        <div className="toggle-row">
          <span>Offline image queue</span>
          <span className={`pill ${queue.length ? 'warn' : 'ok'}`}>{queue.length} waiting</span>
        </div>
      </div>

      <div className="panel-card">
        <h3>Firestore: claims ({claims.length})</h3>
        {claims.length === 0 && <div className="empty">No claims yet. File one from the Claims tab.</div>}
        {claims.map((claim) => (
          <div className="doc" key={claim.id}>
            {claim.photoPreview ? <img src={claim.photoPreview} alt="" /> : <img alt="" />}
            <div className="meta">
              <div>
                <span className={`pill ${claim.status === 'AI Reviewing' ? 'ai' : 'pending'}`}>{claim.status}</span>{' '}
                {claim.hasPendingWrites && <span className="pill warn">pending write</span>}{' '}
                {claim.photoUrl === store.OFFLINE_SENTINEL && <span className="pill warn">photo not uploaded</span>}
              </div>
              <div className="desc">{claim.description}</div>
              {claim.aiSummary && (
                <div style={{ color: '#5b34d6', fontSize: 12 }}>
                  <b>aiSummary:</b> {claim.aiSummary}
                </div>
              )}
              <code>
                {claim.id} · photoUrl: {claim.photoUrl === store.OFFLINE_SENTINEL ? claim.photoUrl : 'uploaded'}
              </code>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-card">
        <h3>Activity log</h3>
        <div className="log">
          {logs.length === 0 && <div className="empty">Nothing yet.</div>}
          {logs.map((entry) => (
            <div key={entry.id}>
              <time>{time(entry.time)}</time>
              <span className="tag">{entry.tag}</span>
              {entry.text}
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-actions">
          {userEmail && (
            <button type="button" onClick={store.signOut}>
              Sign out
            </button>
          )}
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (window.confirm('Reset the demo? This clears accounts, claims and the offline queue stored in this browser.')) {
                void store.resetDemo();
              }
            }}
          >
            Reset demo data
          </button>
          <a href={PORTFOLIO_URL} style={{ alignSelf: 'center', color: '#0b7e80', fontWeight: 700 }}>
            Back to portfolio
          </a>
        </div>
      </div>
    </aside>
  );
}
