import { supabase, type DbTaskRow } from '@/lib/supabase';
import type { Task } from '@/store/tasks';

// Local tasks carry these extra fields the server doesn't know about.
// `dirty` means "has changes that haven't reached the cloud yet."
// `updatedAt` is our local Lamport-ish clock, in ms.
export type LocalTask = Task & { dirty?: boolean; updatedAt?: number };

export function rowToTask(row: DbTaskRow): LocalTask {
  return {
    id: row.id,
    text: row.text,
    why: row.why,
    status: row.status,
    createdAt: row.created_at,
    addedAt: row.added_at,
    closedAt: row.closed_at ?? undefined,
    reclaimedMin: row.reclaimed_min ?? undefined,
    updatedAt: new Date(row.updated_at).getTime(),
    dirty: false,
  };
}

export function taskToRow(task: LocalTask, userId: string): Omit<DbTaskRow, 'updated_at'> {
  return {
    id: task.id,
    user_id: userId,
    text: task.text,
    why: task.why,
    status: task.status,
    created_at: task.createdAt,
    added_at: task.addedAt,
    closed_at: task.closedAt ?? null,
    reclaimed_min: task.reclaimedMin ?? null,
  };
}

// Push every locally-dirty task to the server. Returns the IDs that were
// successfully pushed so the caller can clear their dirty flag.
export async function pushDirty(tasks: LocalTask[], userId: string): Promise<Set<string>> {
  const dirty = tasks.filter(t => t.dirty);
  if (dirty.length === 0) return new Set();

  const rows = dirty.map(t => taskToRow(t, userId));
  const { error } = await supabase.from('tasks').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.warn('[sync] push failed', error.message);
    return new Set();
  }
  return new Set(dirty.map(t => t.id));
}

// Fetch every task that belongs to the signed-in user.
export async function pullAll(userId: string): Promise<LocalTask[] | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('[sync] pull failed', error.message);
    return null;
  }
  return (data ?? []).map(rowToTask);
}

// Merge server state into the local list. Local-dirty rows take precedence
// (the user has a newer change we haven't pushed yet). For non-dirty rows,
// server wins.
export function mergeFromServer(local: LocalTask[], server: LocalTask[]): LocalTask[] {
  const byId = new Map<string, LocalTask>();

  for (const s of server) byId.set(s.id, s);

  for (const l of local) {
    const s = byId.get(l.id);
    if (!s) {
      // Local-only — keep it. It will be pushed on next sync.
      byId.set(l.id, l);
      continue;
    }
    if (l.dirty) {
      // We have a newer local change waiting to push — keep local.
      byId.set(l.id, l);
      continue;
    }
    // Server wins, but preserve insertion order from server.
    byId.set(l.id, s);
  }

  // Preserve the original chronological order: server order first, then any
  // local-only rows appended.
  const serverIds = new Set(server.map(s => s.id));
  const ordered: LocalTask[] = [];
  for (const s of server) {
    const merged = byId.get(s.id);
    if (merged) ordered.push(merged);
  }
  for (const l of local) {
    if (!serverIds.has(l.id)) ordered.push(byId.get(l.id) ?? l);
  }
  return ordered;
}

export async function deleteRemote(ids: string[], userId: string): Promise<boolean> {
  if (ids.length === 0) return true;
  const { error } = await supabase.from('tasks').delete().eq('user_id', userId).in('id', ids);
  if (error) {
    console.warn('[sync] delete failed', error.message);
    return false;
  }
  return true;
}
