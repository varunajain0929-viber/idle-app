import AsyncStorage from '@react-native-async-storage/async-storage';
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
};

export type ChallengeState = 'day1' | 'day2' | 'day3' | 'done';

type MetaState = {
  challengeState: ChallengeState;
  onboardedAt?: number;
  day3At?: number;
  lastSeenDate?: string;
  milestonesShown: number[];
};

const STORAGE_KEY = 'idle.tasks.v2';
const ONBOARDED_KEY = 'idle.onboarded.v1';
const META_KEY = 'idle.meta.v1';
const MAX_OPEN = 5;

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

const DEFAULT_META: MetaState = {
  challengeState: 'done',
  milestonesShown: [],
};

const SEED_TASKS: Task[] = [
  {
    id: makeId(),
    text: 'Write the founder letter',
    why: 'A reader is waiting on this.',
    status: 'open',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    addedAt: 'MON',
  },
  {
    id: makeId(),
    text: 'Walk for forty minutes',
    why: 'Because I sat all morning.',
    status: 'open',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    addedAt: 'TUE',
  },
  {
    id: makeId(),
    text: 'Delete this example',
    why: 'Learning by deleting. Welcome to Idle.',
    status: 'open',
    createdAt: Date.now(),
    addedAt: dayLabel(),
  },
];

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<MetaState>(DEFAULT_META);
  const [carry, setCarry] = useState<CarrySnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const tasksRef = useRef<Task[]>([]);
  const metaRef = useRef<MetaState>(DEFAULT_META);

  useEffect(() => {
    (async () => {
      const [rawTasks, rawMeta, onboarded] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(META_KEY),
        AsyncStorage.getItem(ONBOARDED_KEY),
      ]);

      let loadedTasks: Task[] = [];
      if (rawTasks) {
        try {
          const parsed = JSON.parse(rawTasks) as Task[];
          if (Array.isArray(parsed)) loadedTasks = parsed;
        } catch {
          /* corrupt cache, ignore */
        }
      } else if (!onboarded) {
        loadedTasks = SEED_TASKS;
        await AsyncStorage.setItem(ONBOARDED_KEY, '1');
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

      setTasks(loadedTasks);
      setMeta(loadedMeta);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    tasksRef.current = tasks;
    if (hydrated) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, hydrated]);

  useEffect(() => {
    metaRef.current = meta;
    if (hydrated) {
      AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
    }
  }, [meta, hydrated]);

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
        },
      ]);
      advanceChallengeOnAdd();
      return true;
    },
    [advanceChallengeOnAdd],
  );

  const complete = useCallback(
    (id: string) => {
      setTasks(prev =>
        prev.map(t =>
          t.id === id && t.status === 'open'
            ? { ...t, status: 'done', closedAt: dayLabel() }
            : t,
        ),
      );
      advanceChallengeOnClose();
    },
    [advanceChallengeOnClose],
  );

  const refuse = useCallback(
    (id: string) => {
      setTasks(prev =>
        prev.map(t =>
          t.id === id && t.status === 'open'
            ? { ...t, status: 'refused', closedAt: dayLabel() }
            : t,
        ),
      );
      advanceChallengeOnClose();
    },
    [advanceChallengeOnClose],
  );

  const reopen = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id && (t.status === 'done' || t.status === 'refused')
          ? { ...t, status: 'open', closedAt: undefined, reclaimedMin: undefined }
          : t,
      ),
    );
  }, []);

  const burn = useCallback(() => {
    const stamp = dayLabel();
    setTasks(prev =>
      prev.map(t =>
        t.status === 'open' ? { ...t, status: 'burned', closedAt: stamp } : t,
      ),
    );
  }, []);

  const reset = useCallback(() => {
    setTasks([]);
  }, []);

  const setEstimate = useCallback((id: string, minutes: number) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id && t.status === 'refused' ? { ...t, reclaimedMin: minutes } : t,
      ),
    );
  }, []);

  const dismissCarry = useCallback(() => {
    setCarry(null);
  }, []);

  const refuseCarry = useCallback(() => {
    const ids = carry?.ids ?? [];
    if (ids.length === 0) {
      setCarry(null);
      return;
    }
    const stamp = dayLabel();
    setTasks(prev =>
      prev.map(t =>
        ids.includes(t.id) && t.status === 'open'
          ? { ...t, status: 'refused', closedAt: stamp }
          : t,
      ),
    );
    setCarry(null);
  }, [carry]);

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

  const devReplaceAll = useCallback((next: Task[]) => {
    setTasks(next);
    setCarry(null);
  }, []);

  const devClearStorage = useCallback(async () => {
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
