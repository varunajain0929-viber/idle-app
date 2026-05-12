import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AppState } from './timeGate';

export type Override = 'auto' | AppState;

type Ctx = {
  override: Override;
  cycle: () => void;
  set: (v: Override) => void;
};

const CYCLE: Override[] = ['auto', 'open', 'locked', 'burn'];

const DevOverrideContext = createContext<Ctx | null>(null);

export function DevOverrideProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<Override>('auto');

  const cycle = useCallback(() => {
    setOverride(prev => {
      const idx = CYCLE.indexOf(prev);
      return CYCLE[(idx + 1) % CYCLE.length];
    });
  }, []);

  const value = useMemo(() => ({ override, cycle, set: setOverride }), [override, cycle]);

  return <DevOverrideContext.Provider value={value}>{children}</DevOverrideContext.Provider>;
}

export function useDevOverride() {
  const ctx = useContext(DevOverrideContext);
  if (!ctx) throw new Error('useDevOverride must be used within DevOverrideProvider');
  return ctx;
}

export function applyOverride(actual: AppState, override: Override): AppState {
  return override === 'auto' ? actual : override;
}
