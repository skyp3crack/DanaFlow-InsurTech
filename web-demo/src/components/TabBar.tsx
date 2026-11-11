import { IoDocumentTextOutline, IoSettingsOutline, IoTimeOutline, IoWalletOutline } from 'react-icons/io5';
import type { IconType } from 'react-icons';
import type { TabName } from '../navigation';

const TABS: { name: TabName; label: string; icon?: IconType }[] = [
  { name: 'Wallet', label: 'Home', icon: IoWalletOutline },
  { name: 'Claims', label: 'Claims', icon: IoDocumentTextOutline },
  { name: 'Advocate', label: '' }, // centre FAB, always index 2
  { name: 'History', label: 'History', icon: IoTimeOutline },
  { name: 'Settings', label: 'Settings', icon: IoSettingsOutline },
];

/** DanaFlowTabBar from App.tsx: a floating pill with a raised centre AI button. */
export default function TabBar({ active, onSelect }: { active: TabName; onSelect: (tab: TabName) => void }) {
  return (
    <div className="tab-wrapper">
      <div className="tab-bar">
        {TABS.map((tab, index) => {
          const focused = tab.name === active;

          if (index === 2) {
            return (
              <button
                key={tab.name}
                type="button"
                className="center-wrapper"
                aria-label="AI Advocate"
                aria-current={focused ? 'page' : undefined}
                onClick={() => onSelect(tab.name)}
              >
                <span className={`center-glow ${focused ? 'active' : ''}`} />
                <span className={`center-button ${focused ? 'active' : ''}`}>AI</span>
              </button>
            );
          }

          const Icon = tab.icon!;
          return (
            <button
              key={tab.name}
              type="button"
              className={`tab-item ${focused ? 'focused' : ''}`}
              aria-label={tab.label}
              aria-current={focused ? 'page' : undefined}
              onClick={() => onSelect(tab.name)}
            >
              <Icon size={22} style={{ marginBottom: 2 }} />
              <span className="tab-label">{tab.label}</span>
              {focused && <span className="active-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
