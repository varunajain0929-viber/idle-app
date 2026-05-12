import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/store/auth';
import { pullAll, pushDirty, deleteRemote } from '@/lib/sync';

export type TaskStatus = 'open' | 'done' | 'refused' | 'burned';

export type Task = {
  id: string;
  text: string;
  why: string;
  status: TaskStatus;
  createdAt: number;
  addedAt: string;
  closedAt?: string;
  reclaimedMin?: number;
  // Sync metadata — set locally, never read by UI.
  dirty?: boolean;
  updatedAt?: number;
};

export type ChallengeState = 'day1' | 'day2' | 'day3' | 'done';

type MetaState = {
  challengeState: ChallengeState;
  onboardedAt?: number;
  day3At?: number;
  lastSeenDate?: string;
  milestonesShown: number[];
};

const LEGACY_STORAGE_KEY = 'idle.tasks.v2';
const ONBOARDED_KEY = 'idle.onboarded.v1';
const META_KEY = 'idle.meta.v1';
const MAX_OPEN = 5;
const SYNC_DEBOUNCE_MS = 500;

// Per-user cache key. Keeps signed-out devices from leaking tasks across accounts.
function cacheKeyFor(userId: string) {
  return `idle.tasks.v3.${userId}`;
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
function dayLabel(d: Date = new Date()) {
  return DAYS[d.getDay()];
}

function dateKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function stamp(): { updatedAt: number; dirty: boolean } {
  return { updatedAt: Date.now(), dirty: true };
}

const DEFAULT_META: MetaState = {
  challengeState: 'done',
  milestonesShown: [],
};

function buildSeed(): Task[] {
  const now = Date.now();
  return [
    {
      id: makeId(),
      text: 'Write the founder letter',
      why: 'A reader is waiting on this.',
      status: 'open',
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
      addedAt: 'MON',
      ...stamp(),
    },
    {
      id: makeId(),
      text: 'Walk for forty minutes',
      why: 'Because I sat all morning.',
      status: 'open',
      createdAt: now - 1000 * 60 * 60 * 24,
      addedAt: 'TUE',
      ...stamp(),
    },
    {
      id: makeId(),
      text: 'Delete this example',
      why: 'Learning by deleting. Welcome to Idle.',
      status: 'open',
      createdAt: now,
      addedAt: dayLabel(),
      ...stamp(),
    },
  ];
}

type CarrySnapshot = {
  count: number;
  ids: string[];
};

type TasksContextValue = {
  tasks: Task[];
  openTasks: Task[];
  openCount: number;
  doneCount: number;
  refusedCount: number;
  burnedCount: number;
  reclaimedTotalMin: number;
  isAtCap: boolean;
  history: Task[];
  challengeState: ChallengeState;
  onboardedAt?: number;
  carry: CarrySnapshot | null;
  milestonesShown: number[];
  hydrated: boolean;
  addTask: (text: string, why: string) => boolean;
  complete: (id: string) => void;
  refuse: (id: string) => void;
  reopen: (id: string) => void;
  burn: () => void;
  reset: () => void;
  setEstimate: (id: string, minutes: number) => void;
  dismissCarry: () => void;
  refuseCarry: () => void;
  setChallengeState: (next: ChallengeState) => void;
  markMilestoneShown: (n: number) => void;
  finishOnboarding: () => void;
  devReplaceAll: (next: Task[]) => void;
  devClearStorage: () => Promise<void>;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<MetaState>(DEFAULT_META);
  const [carry, setCarry] = useState<CarrySnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const tasksRef = useRef<Task[]>([]);
  const metaRef = useRef<MetaState>(DEFAULT_META);
  const userIdRef = useRef<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeleteIds = useRef<Set<string>>(new Set());

  // -------------------------- HYDRATE FROM LOCAL CACHE --------------------------
  // Whenever the signed-in user changes, swap to that user's cache. This makes
  // the app feel instant — paint from disk, sync from cloud in the background.
  useEffect(() => {
    setHydrated(false);
    if (!userId) {
      setTasks([]);
      tasksRef.current = [];
      userIdRef.current = null;
      setHydrated(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const [rawTasks, rawMeta, onboarded, legacyTasks] = await Promise.all([
        AsyncStorage.getItem(cacheKeyFor(userId)),
        AsyncStorage.getItem(META_KEY),
        AsyncStorage.getItem(ONBOARDED_KEY),
        AsyncStorage.getItem(LEGACY_STORAGE_KEY),
      ]);

      let loadedTasks: Task[] = [];
      let usedLegacy = false;
      if (rawTasks) {
        try {
          const parsed = JSON.parse(rawTasks) as Task[];
          if (Array.isArray(parsed)) loadedTasks = parsed;
        } catch {
          /* corrupt cache, ignore */
        }
      } else if (legacyTasks) {
        // First sign-in after the auth upgrade: migrate pre-auth cache into
        // this user's cache and mark every row dirty so it uploads.
        try {
          const parsed = JSON.parse(legacyTasks) as Task[];
          if (Array.isArray(parsed)) {
            loadedTasks = parsed.map(t => ({ ...t, ...stamp() }));
            usedLegacy = true;
          }
        } catch {
          /* ignore */
        }
      }

      let loadedMeta: MetaState = { ...DEFAULT_META };
      if (rawMeta) {
        try {
          const parsed = JSON.parse(rawMeta) as Partial<MetaState>;
          loadedMeta = {
            challengeState: parsed.challengeState ?? 'done',
            onboardedAt: parsed.onboardedAt,
            day3At: parsed.day3At,
            lastSeenDate: parsed.lastSeenDate,
            milestonesShown: Array.isArray(parsed.milestonesShown) ? parsed.milestonesShown : [],
          };
        } catch {
          /* ignore */
        }
      }

      const today = dateKey();
      const openOnLoad = loadedTasks.filter(t => t.status === 'open');
      if (
        loadedMeta.lastSeenDate &&
        loadedMeta.lastSeenDate !== today &&
        openOnLoad.length > 0
      ) {
        setCarry({ count: openOnLoad.length, ids: openOnLoad.map(t => t.id) });
      }
      loadedMeta = { ...loadedMeta, lastSeenDate: today };

      // Note: we no longer seed locally on `!onboarded`. The seed is decided
      // after we hear back from the server (see syncWithServer below) so a
      // brand-new account gets the example tasks, but returning users don't.
      void onboarded;
      void usedLegacy;

      if (cancelled) return;
      setTasks(loadedTasks);
      tasksRef.current = loadedTasks;
      setMeta(loadedMeta);
      metaRef.current = loadedMeta;
      userIdRef.current = userId;
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // -------------------------- WRITE-THROUGH TO LOCAL CACHE --------------------------
  useEffect(() => {
    tasksRef.current = tasks;
    if (hydrated && userId) {
      AsyncStorage.setItem(cacheKeyFor(userId), JSON.stringify(tasks)).catch(() => {});
    }
  }, [tasks, hydrated, userId]);

  useEffect(() => {
    metaRef.current = meta;
    if (hydrated) {
      AsyncStorage.setItem(META_KEY, JSON.stringify(meta)).catch(() => {});
    }
  }, [meta, hydrated]);

  // -------------------------- CLOUD SYNC --------------------------
  const flushDeletes = useCallback(async () => {
    if (!userIdRef.current) return;
    const ids = Array.from(pendingDeleteIds.current);
    if (ids.length === 0) return;
    const ok = await deleteRemote(ids, userIdRef.current);
    if (ok) ids.forEach(id => pendingDeleteIds.current.delete(id));
  }, []);

  const pushLocal = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    const snapshot = tasksRef.current.filter(t => t.dirty);
    if (snapshot.length === 0) return;
    const snapByUpdatedAt = new Map(snapshot.map(t => [t.id, t.updatedAt ?? 0]));
    const pushed = await pushDirty(snapshot, uid);
    if (pushed.size === 0) return;
    setTasks(prev =>
      prev.map(t => {
        if (!pushed.has(t.id)) return t;
        if ((t.updatedAt ?? 0) !== snapByUpdatedAt.get(t.id)) return t; // changed mid-push
        return { ...t, dirty: false };
      }),
    );
  }, []);

  const syncWithServer = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;

    await flushDeletes();
    await pushLocal();

    const server = await pullAll(uid);
    if (!server) return; // network failure; keep local

    const localNow = tasksRef.current;

    if (server.length === 0 && localNow.length === 0) {
      // Brand-new account on a brand-new device — drop the welcome examples.
      const seeds = buildSeed();
      setTasks(seeds);
      // Push immediately so the cloud has them too.
      const pushed = await pushDirty(seeds, uid);
      if (pushed.size > 0) {
        setTasks(prev => prev.map(t => (pushed.has(t.id) ? { ...t, dirty: false } : t)));
      }
      return;
    }

    // Last-write-wins merge: server values overwrite local non-dirty rows;
    // local-dirty rows are preserved (they'll go up on the next pushLocal).
    setTasks(prev => {
      const dirtyById = new Map(prev.filter(t => t.dirty).map(t => [t.id, t]));
      const merged: Task[] = [];
      for (const s of server) {
        const localDirty = dirtyById.get(s.id);
        merged.push(localDirty ?? s);
      }
      // Append any local-only rows (e.g. tasks added offline that the server hasn't seen yet).
      const serverIds = new Set(server.map(s => s.id));
      for (const l of prev) {
        if (!serverIds.has(l.id)) merged.push(l);
      }
      return merged;
    });

    // Anything still dirty? Push it.
    await pushLocal();
  }, [flushDeletes, pushLocal]);

  // Run a full sync whenever the user changes (after hydration).
  useEffect(() => {
    if (!hydrated || !userId) return;
    syncWithServer().catch(() => {});
  }, [hydrated, userId, syncWithServer]);

  // Debounced sync after any local change.
  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      syncWithServer().catch(() => {});
    }, SYNC_DEBOUNCE_MS);
  }, [syncWithServer]);

  // Sync when app comes back to the foreground, or when we regain network.
  useEffect(() => {
    if (!userId) return;
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') syncWithServer().catch(() => {});
    };
    const sub = AppState.addEventListener('change', onAppState);
    const unsub = NetInfo.addEventListener(s => {
      if (s.isConnected && s.isInternetReachable !== false) {
        syncWithServer().catch(() => {});
      }
    });
    return () => {
      sub.remove();
      unsub();
    };
  }, [userId, syncWithServer]);

  // -------------------------- DERIVED STATE --------------------------
  const openTasks = useMemo(() => tasks.filter(t => t.status === 'open'), [tasks]);
  const history = useMemo(() => tasks.filter(t => t.status !== 'open'), [tasks]);
  const openCount = openTasks.length;
  const doneCount = useMemo(() => tasks.filter(t => t.status === 'done').length, [tasks]);
  const refusedCount = useMemo(() => tasks.filter(t => t.status === 'refused').length, [tasks]);
  const burnedCount = useMemo(() => tasks.filter(t => t.status === 'burned').length, [tasks]);
  const reclaimedTotalMin = useMemo(
    () =>
      tasks.reduce(
        (sum, t) => (t.status === 'refused' ? sum + (t.reclaimedMin ?? 0) : sum),
        0,
      ),
    [tasks],
  );
  const isAtCap = openCount >= MAX_OPEN;

  // -------------------------- MUTATIONS --------------------------
  const advanceChallengeOnAdd = useCallback(() => {
    setMeta(prev => (prev.challengeState === 'day1' ? { ...prev, challengeState: 'day2' } : prev));
  }, []);

  const advanceChallengeOnClose = useCallback(() => {
    setMeta(prev =>
      prev.challengeState === 'day2'
        ? { ...prev, challengeState: 'day3', day3At: Date.now() }
        : prev,
    );
  }, []);

  const addTask = useCallback(
    (text: string, why: string) => {
      const trimmedText = text.trim();
      const trimmedWhy = why.trim();
      if (!trimmedText || !trimmedWhy) return false;
      const currentOpen = tasksRef.current.filter(t => t.status === 'open').length;
      if (currentOpen >= MAX_OPEN) return false;
      setTasks(prev => [
        ...prev,
        {
          id: makeId(),
          text: trimmedText,
          why: trimmedWhy,
          status: 'open',
          createdAt: Date.now(),
          addedAt: dayLabel(),
          ...stamp(),
        },
      ]);
      advanceChallengeOnAdd();
      scheduleSync();
      return true;
    },
    [advanceChallengeOnAdd, scheduleSync],
  );

  const complete = useCallback(
    (id: string) => {
      setTasks(prev =>
        prev.map(t =>
          t.id === id && t.status === 'open'
            ? { ...t, status: 'done', closedAt: dayLabel(), ...stamp() }
            : t,
        ),
      );
      advanceChallengeOnClose();
      scheduleSync();
    },
    [advanceChallengeOnClose, scheduleSync],
  );

  const refuse = useCallback(
    (id: string) => {
      setTasks(prev =>
        prev.map(t =>
          t.id === id && t.status === 'open'
            ? { ...t, status: 'refused', closedAt: dayLabel(), ...stamp() }
            : t,
        ),
      );
      advanceChallengeOnClose();
      scheduleSync();
    },
    [advanceChallengeOnClose, scheduleSync],
  );

  const reopen = useCallback(
    (id: string) => {
      setTasks(prev =>
        prev.map(t =>
          t.id === id && (t.status === 'done' || t.status === 'refused')
            ? { ...t, status: 'open', closedAt: undefined, reclaimedMin: undefined, ...stamp() }
            : t,
        ),
      );
      scheduleSync();
    },
    [scheduleSync],
  );

  const burn = useCallback(() => {
    const stampDay = dayLabel();
    setTasks(prev =>
      prev.map(t =>
        t.status === 'open' ? { ...t, status: 'burned', closedAt: stampDay, ...stamp() } : t,
      ),
    );
    scheduleSync();
  }, [scheduleSync]);

  const reset = useCallback(() => {
    const ids = tasksRef.current.map(t => t.id);
    ids.forEach(id => pendingDeleteIds.current.add(id));
    setTasks([]);
    scheduleSync();
  }, [scheduleSync]);

  const setEstimate = useCallback(
    (id: string, minutes: number) => {
      setTasks(prev =>
        prev.map(t =>
          t.id === id && t.status === 'refused' ? { ...t, reclaimedMin: minutes, ...stamp() } : t,
        ),
      );
      scheduleSync();
    },
    [scheduleSync],
  );

  const dismissCarry = useCallback(() => {
    setCarry(null);
  }, []);

  const refuseCarry = useCallback(() => {
    const ids = carry?.ids ?? [];
    if (ids.length === 0) {
      setCarry(null);
      return;
    }
    const stampDay = dayLabel();
    setTasks(prev =>
      prev.map(t =>
        ids.includes(t.id) && t.status === 'open'
          ? { ...t, status: 'refused', closedAt: stampDay, ...stamp() }
          : t,
      ),
    );
    setCarry(null);
    scheduleSync();
  }, [carry, scheduleSync]);

  const setChallengeState = useCallback((next: ChallengeState) => {
    setMeta(prev => ({ ...prev, challengeState: next }));
  }, []);

  const markMilestoneShown = useCallback((n: number) => {
    setMeta(prev =>
      prev.milestonesShown.includes(n)
        ? prev
        : { ...prev, milestonesShown: [...prev.milestonesShown, n] },
    );
  }, []);

  const finishOnboarding = useCallback(() => {
    setMeta(prev => ({
      ...prev,
      challengeState: 'day1',
      onboardedAt: Date.now(),
      lastSeenDate: dateKey(),
    }));
  }, []);

  // Dev-only escape hatches. Wrapped in __DEV__ so a production build can't
  // wipe a real user's tasks even if the dev route is somehow reached.
  const devReplaceAll = useCallback(
    (next: Task[]) => {
      if (!__DEV__) return;
      const stamped = next.map(t => ({ ...t, ...stamp() }));
      // Anything currently on the device that's not in the new set should be deleted remotely too.
      const nextIds = new Set(stamped.map(t => t.id));
      for (const t of tasksRef.current) {
        if (!nextIds.has(t.id)) pendingDeleteIds.current.add(t.id);
      }
      setTasks(stamped);
      setCarry(null);
      scheduleSync();
    },
    [scheduleSync],
  );

  const devClearStorage = useCallback(async () => {
    if (!__DEV__) return;
    const allKeys = await AsyncStorage.getAllKeys();
    const idleKeys = allKeys.filter(k => k.startsWith('idle.'));
    if (idleKeys.length > 0) {
      await AsyncStorage.multiRemove(idleKeys);
    }
  }, []);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      openTasks,
      openCount,
      doneCount,
      refusedCount,
      burnedCount,
      reclaimedTotalMin,
      isAtCap,
      history,
      challengeState: meta.challengeState,
      onboardedAt: meta.onboardedAt,
      carry,
      milestonesShown: meta.milestonesShown,
      hydrated,
      addTask,
      complete,
      refuse,
      reopen,
      burn,
      reset,
      setEstimate,
      dismissCarry,
      refuseCarry,
      setChallengeState,
      markMilestoneShown,
      finishOnboarding,
      devReplaceAll,
      devClearStorage,
    }),
    [
      tasks,
      openTasks,
      openCount,
      doneCount,
      refusedCount,
      burnedCount,
      reclaimedTotalMin,
      isAtCap,
      history,
      meta.challengeState,
      meta.onboardedAt,
      meta.milestonesShown,
      carry,
      hydrated,
      addTask,
      complete,
      refuse,
      reopen,
      burn,
      reset,
      setEstimate,
      dismissCarry,
      refuseCarry,
      setChallengeState,
      markMilestoneShown,
      finishOnboarding,
      devReplaceAll,
      devClearStorage,
    ],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within TasksProvider');
  return ctx;
}

export const TASKS_MAX_OPEN = MAX_OPEN;
export const META_STORAGE_KEY = META_KEY;

export function daysSince(timestamp?: number): number {
  if (!timestamp) return 0;
  const start = new Date(timestamp);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((today - startDay) / 86400000));
}
