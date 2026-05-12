import type { Task } from '@/store/tasks';

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const DAY = 1000 * 60 * 60 * 24;

export function buildSampleWeek(): Task[] {
  const now = Date.now();
  return [
    {
      id: makeId(),
      text: 'Write the founder letter',
      why: 'A reader is waiting on this.',
      status: 'open',
      createdAt: now - DAY * 1,
      addedAt: 'MON',
    },
    {
      id: makeId(),
      text: 'Walk for forty minutes',
      why: 'Because I sat all morning.',
      status: 'open',
      createdAt: now - DAY * 0.5,
      addedAt: 'WED',
    },
    {
      id: makeId(),
      text: 'Reply to the Atlantic pitch',
      why: 'They have been waiting two weeks.',
      status: 'done',
      createdAt: now - DAY * 3,
      addedAt: 'MON',
      closedAt: 'TUE',
    },
    {
      id: makeId(),
      text: 'Pay the printer invoice',
      why: 'Cash flow.',
      status: 'done',
      createdAt: now - DAY * 2,
      addedAt: 'TUE',
      closedAt: 'WED',
    },
    {
      id: makeId(),
      text: 'Reorganise the file folders',
      why: 'Procrastination dressed up as work.',
      status: 'refused',
      createdAt: now - DAY * 3,
      addedAt: 'TUE',
      closedAt: 'TUE',
      reclaimedMin: 30,
    },
    {
      id: makeId(),
      text: 'Open Twitter to check on the launch',
      why: 'Anxiety, not strategy.',
      status: 'refused',
      createdAt: now - DAY * 2,
      addedAt: 'WED',
      closedAt: 'THU',
      reclaimedMin: 15,
    },
    {
      id: makeId(),
      text: 'Plan the offsite agenda',
      why: 'Not urgent. Not now.',
      status: 'burned',
      createdAt: now - DAY * 4,
      addedAt: 'MON',
      closedAt: 'FRI',
    },
    {
      id: makeId(),
      text: 'Refactor the onboarding copy',
      why: 'Cosmetic, not load-bearing.',
      status: 'burned',
      createdAt: now - DAY * 3,
      addedAt: 'TUE',
      closedAt: 'FRI',
    },
  ];
}

const DAYS_TODAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function buildOpenFillers(count: number): Task[] {
  const todayLabel = DAYS_TODAY[new Date().getDay()];
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: makeId(),
    text: `Test task ${i + 1}`,
    why: 'Seeded for testing.',
    status: 'open' as const,
    createdAt: now - (count - i) * 1000,
    addedAt: todayLabel,
  }));
}
