import { supabase } from './supabase';

export type ClosedTaskInput = {
  text: string;
  why: string;
  status: 'done' | 'refused' | 'burned';
};

const TIMEOUT_MS = 8000;

async function callIdleAI<T>(body: Record<string, unknown>): Promise<T | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const { data, error } = await supabase.functions.invoke('idle-ai', {
      body,
    });
    clearTimeout(timer);
    if (error) {
      if (__DEV__) console.warn('[ai] idle-ai error', error);
      return null;
    }
    return (data as T) ?? null;
  } catch (e) {
    clearTimeout(timer);
    if (__DEV__) console.warn('[ai] idle-ai threw', e);
    return null;
  }
}

export async function sharpenWhy(
  text: string,
  why: string,
): Promise<string | null> {
  const res = await callIdleAI<{ sharpened?: string }>({
    mode: 'sharpen',
    text,
    why,
  });
  const out = res?.sharpened?.trim();
  if (!out || out === why.trim()) return null;
  return out.slice(0, 80);
}

export async function weekReflection(
  closed: ClosedTaskInput[],
): Promise<string | null> {
  if (closed.length === 0) return null;
  const res = await callIdleAI<{ line?: string }>({
    mode: 'reflect',
    closed,
  });
  const out = res?.line?.trim();
  if (!out) return null;
  return out;
}
