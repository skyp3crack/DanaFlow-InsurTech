import type { ReactElement } from 'react';
import {
  IoCarOutline,
  IoCheckmarkCircle,
  IoCloudOfflineOutline,
  IoDocumentTextOutline,
  IoFlash,
  IoHandLeftOutline,
  IoHomeOutline,
  IoMedkitOutline,
} from 'react-icons/io5';
import { MOCK_POLICIES } from '../mock/policies';
import type { Navigation } from '../navigation';
import { useStore } from '../services/store';

const POLICY_META: Record<string, { icon: ReactElement; accent: string }> = {
  'Auto Insurance': { icon: <IoCarOutline size={22} />, accent: '#00B4B6' },
  'Health Insurance': { icon: <IoMedkitOutline size={22} />, accent: '#7EDDD4' },
  'Home Insurance': { icon: <IoHomeOutline size={22} />, accent: '#F4A261' },
};

const getPolicyMeta = (type: string) =>
  POLICY_META[type] ?? { icon: <IoDocumentTextOutline size={22} />, accent: '#B0B0B0' };

export default function WalletScreen({ navigation }: { navigation: Navigation }) {
  const { claims, queue } = useStore();
  const openClaims = claims.length;
  // One claim can be both a pending write and a queued photo, so count distinct claims.
  const waitingToSync = new Set([...queue.map((q) => q.claimId), ...claims.filter((c) => c.hasPendingWrites).map((c) => c.id)]).size;

  return (
    <div className="screen">
      <div className="scroll wallet-content">
        <div className="top-bar">
          <div>
            <div className="greeting">
              <span>Good day</span>
              <IoHandLeftOutline size={14} color="#B0B0B0" />
            </div>
            <h1 className="header">My Wallet</h1>
          </div>
          <div className="avatar-circle">U</div>
        </div>

        <div className="summary-banner">
          <div className="summary-item">
            <div className="summary-value">{MOCK_POLICIES.length}</div>
            <div className="summary-label">Active Policies</div>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            <div className="summary-value">{openClaims}</div>
            <div className="summary-label">Pending Claims</div>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            {waitingToSync > 0 ? (
              <>
                <IoCloudOfflineOutline size={26} color="#F4A261" />
                <div className="summary-label">{waitingToSync} Waiting to Sync</div>
              </>
            ) : (
              <>
                <IoCheckmarkCircle size={26} color="#4CAF50" />
                <div className="summary-label">All Synced</div>
              </>
            )}
          </div>
        </div>

        <h2 className="section-title">Your Active Policies</h2>

        {MOCK_POLICIES.map((item) => {
          const meta = getPolicyMeta(item.type);
          return (
            <div className="policy-card" key={item.id + item.name}>
              <div className="policy-accent" style={{ background: meta.accent }} />
              <div className="policy-content">
                <div className="icon-badge" style={{ background: `${meta.accent}22`, color: meta.accent }}>
                  {meta.icon}
                </div>
                <div className="policy-info">
                  <div className="policy-name">{item.name}</div>
                  <div className="policy-type">{item.type}</div>
                  <div className="policy-id">ID: {item.id}</div>
                </div>
                <div className="policy-right">
                  <div className="status-badge">
                    <span className="status-dot" />
                    <span className="status-text">{item.status}</span>
                  </div>
                  <span className="expiry-text">Exp</span>
                  <span className="expiry-date">{item.expiryDate}</span>
                </div>
              </div>
            </div>
          );
        })}

        <button type="button" className="cta-button" onClick={() => navigation.navigate('Claims')}>
          <IoFlash size={20} />
          <span>File a New Claim</span>
        </button>
      </div>
    </div>
  );
}
