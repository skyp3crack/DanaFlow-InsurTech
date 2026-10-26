/**
 * Tiny stand-in for React Navigation: a Login -> Main stack, and the five bottom tabs of MainTabs in App.tsx.
 */
import { useCallback, useRef, useState } from 'react';

export type TabName = 'Wallet' | 'Claims' | 'Advocate' | 'History' | 'Settings';
export type StackName = 'Login' | 'Main';

export interface Navigation {
  navigate: (tab: TabName) => void;
  goBack: () => void;
  replace: (stack: StackName) => void;
}

export function useNavigation() {
  const [stack, setStack] = useState<StackName>('Login');
  const [tab, setTab] = useState<TabName>('Wallet');
  const history = useRef<TabName[]>([]);

  const navigate = useCallback(
    (next: TabName) => {
      if (next === tab) return;
      history.current.push(tab);
      setTab(next);
    },
    [tab],
  );

  // navigation.goBack(): the tab you came from, or the first tab
  const goBack = useCallback(() => {
    setTab(history.current.pop() ?? 'Wallet');
  }, []);

  const replace = useCallback((next: StackName) => {
    setStack(next);
    setTab('Wallet');
    history.current = [];
  }, []);

  const navigation: Navigation = { navigate, goBack, replace };
  return { stack, tab, navigation };
}
