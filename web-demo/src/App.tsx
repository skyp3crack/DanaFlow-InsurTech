import { useEffect, useState } from 'react';
import { IoBatteryFull, IoCellularOutline, IoWifiOutline } from 'react-icons/io5';
import DemoPanel from './components/DemoPanel';
import { PORTFOLIO_URL } from './constants';
import { DialogHost } from './components/dialogs';
import TabBar from './components/TabBar';
import { type TabName, useNavigation } from './navigation';
import ChatAdvocate from './screens/ChatAdvocate';
import ClaimsScreen from './screens/ClaimsScreen';
import LoginScreen from './screens/LoginScreen';
import PlaceholderScreen from './screens/PlaceholderScreen';
import WalletScreen from './screens/WalletScreen';
import * as store from './services/store';
import { useStore } from './services/store';

function StatusBar({ onWhite }: { onWhite: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const { online } = useStore();

  return (
    <div className={`statusbar ${onWhite ? 'on-white' : ''}`} aria-hidden="true">
      <span>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}</span>
      <span className="icons">
        {online ? <IoWifiOutline /> : <span style={{ fontSize: 10 }}>No internet</span>}
        <IoCellularOutline />
        <IoBatteryFull />
      </span>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [visited, setVisited] = useState<TabName[]>(['Wallet']);
  const { stack, tab, navigation } = useNavigation();
  const { userEmail } = useStore();

  useEffect(() => {
    void store.init().then(() => setReady(true));
  }, []);

  // Signing out from the demo panel returns to the login screen.
  useEffect(() => {
    if (ready && !userEmail && stack === 'Main') {
      navigation.replace('Login');
      setVisited(['Wallet']);
    }
  }, [ready, userEmail, stack, navigation]);

  // Keep visited tabs mounted (like a React Navigation tab navigator) so form and chat state survive tab switches.
  useEffect(() => {
    setVisited((v) => (v.includes(tab) ? v : [...v, tab]));
  }, [tab]);

  // NetInfo.addEventListener -> processOfflineQueue() is handled inside store.setOnline()
  if (!ready) return null;

  const screen = (name: TabName) => {
    switch (name) {
      case 'Wallet':
        return <WalletScreen navigation={navigation} />;
      case 'Claims':
        return <ClaimsScreen navigation={navigation} />;
      case 'Advocate':
        return <ChatAdvocate navigation={navigation} />;
      case 'History':
        return <PlaceholderScreen title="Claims History" />;
      case 'Settings':
        return <PlaceholderScreen title="Settings" />;
    }
  };

  return (
    <div className="stage">
      <header className="topbar">
        <span>
          <b>DanaFlow</b>
          <span className="desc"> · Agentic Insurtech · static demo with simulated Firebase and AI</span>
        </span>
        <span className="topbar-actions">
          <button type="button" className="panel-toggle" onClick={() => setPanelOpen(!panelOpen)}>
            {panelOpen ? 'Close demo tools' : 'Demo tools'}
          </button>
          <a href={PORTFOLIO_URL}>Back to portfolio</a>
        </span>
      </header>

      <main className="layout">
        <div className="phone">
          <div className="phone-screen">
            <StatusBar onWhite={stack === 'Main' && tab === 'Advocate'} />
            <div className="app-view">
              {stack === 'Login' ? (
                <LoginScreen navigation={navigation} />
              ) : (
                <>
                  <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    {visited.map((name) => (
                      <div
                        key={name}
                        style={{ flex: 1, minHeight: 0, display: name === tab ? 'flex' : 'none', flexDirection: 'column' }}
                      >
                        {screen(name)}
                      </div>
                    ))}
                  </div>
                  <TabBar active={tab} onSelect={navigation.navigate} />
                </>
              )}
              <DialogHost />
            </div>
          </div>
        </div>

        <DemoPanel open={panelOpen} />
      </main>

    </div>
  );
}
