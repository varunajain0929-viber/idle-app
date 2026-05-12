import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as morningBell from '@/lib/morningBell';

type SettingsContextValue = {
  hydrated: boolean;
  morningBellEnabled: boolean;
  setMorningBellEnabled: (next: boolean) => Promise<boolean>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [morningBellEnabled, setMorningBellState] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await morningBell.isStoredEnabled();
      setMorningBellState(stored);
      setHydrated(true);
      morningBell.reconcileOnBoot().catch(() => {});
    })();
  }, []);

  const setMorningBellEnabled = useCallback(async (next: boolean) => {
    if (next) {
      const ok = await morningBell.enable();
      setMorningBellState(ok);
      return ok;
    }
    await morningBell.disable();
    setMorningBellState(false);
    return true;
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ hydrated, morningBellEnabled, setMorningBellEnabled }),
    [hydrated, morningBellEnabled, setMorningBellEnabled],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
