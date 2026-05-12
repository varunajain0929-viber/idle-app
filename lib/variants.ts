import * as Haptics from 'expo-haptics';

const DONE_WORDS = ['DONE', 'DONE', 'DONE', 'DONE', 'KEPT', 'SHIPPED', 'CLOSED'] as const;
const REFUSE_WORDS = ['REFUSED', 'REFUSED', 'REFUSED', 'RECLAIMED', 'FREED'] as const;

type Style = Haptics.ImpactFeedbackStyle;
const DONE_HAPTICS: Style[] = [
  Haptics.ImpactFeedbackStyle.Soft,
  Haptics.ImpactFeedbackStyle.Soft,
  Haptics.ImpactFeedbackStyle.Soft,
  Haptics.ImpactFeedbackStyle.Soft,
  Haptics.ImpactFeedbackStyle.Light,
  Haptics.ImpactFeedbackStyle.Rigid,
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function doneWord(id: string): string {
  return DONE_WORDS[hash(id + ':done') % DONE_WORDS.length];
}

export function refuseWord(id: string): string {
  return REFUSE_WORDS[hash(id + ':refuse') % REFUSE_WORDS.length];
}

export function doneHaptic(id: string): Style {
  return DONE_HAPTICS[hash(id + ':haptic') % DONE_HAPTICS.length];
}

export const MILESTONES = [1, 10, 50, 100, 250] as const;

export function milestoneLine(n: number): string {
  if (n === 1) return 'YOUR FIRST CLOSE.';
  return `YOUR ${n}TH TASK.`;
}
