export type AppState = 'open' | 'locked' | 'burn';

const OPEN_HOUR = 6;
const LOCK_HOUR = 21;
const BURN_DAY = 5;
const BURN_START_HOUR = 19;
const BURN_END_HOUR = 21;

export function getAppState(now: Date = new Date()): AppState {
  const day = now.getDay();
  const hour = now.getHours();

  if (day === BURN_DAY && hour >= BURN_START_HOUR && hour < BURN_END_HOUR) {
    return 'burn';
  }
  if (day === 0 || day === 6) return 'locked';
  if (hour >= LOCK_HOUR || hour < OPEN_HOUR) return 'locked';

  return 'open';
}

export function msUntilOpen(now: Date = new Date()): number {
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(0);

  if (now.getHours() < OPEN_HOUR) {
    next.setHours(OPEN_HOUR);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(OPEN_HOUR);
  }

  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
