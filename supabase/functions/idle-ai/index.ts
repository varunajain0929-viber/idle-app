// @ts-nocheck — this file runs on Deno (Supabase Edge Runtime), not Node.
// Local TypeScript checks ignore it; the Supabase deploy pipeline type-checks
// it against Deno's standard library.

import { SHARPEN_SYSTEM, REFLECT_SYSTEM } from './prompts.ts';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';

// Per-field server-side limits. These mirror the client-side maxLength caps
// (70 for task text, 80 for why) with a small safety margin. Any field
// exceeding these is truncated *before* it hits Anthropic so a malicious
// client can't blow up our token spend.
const MAX_TASK_TEXT = 200;
const MAX_TASK_WHY = 200;
const MAX_REFLECT_ITEMS = 12;
const MAX_REQUEST_BYTES = 8 * 1024; // 8 KB is plenty for either mode

// Per-user rate limit. In-memory only — survives within one Edge worker but
// resets on cold starts. Good enough as a first-line defense against runaway
// loops; the real ceiling is Anthropic's own quota.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_CALLS = 20;
const rateBuckets = new Map<string, number[]>();

function rateLimit(userId: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const bucket = (rateBuckets.get(userId) ?? []).filter(ts => ts > cutoff);
  if (bucket.length >= RATE_MAX_CALLS) {
    rateBuckets.set(userId, bucket);
    return false;
  }
  bucket.push(now);
  rateBuckets.set(userId, bucket);
  return true;
}

// CORS: Idle ships as a native mobile app, so the only callers are React Native
// fetch (which doesn't send Origin) and the Expo web dev build during local
// development. We do NOT echo back arbitrary origins.
const ALLOWED_ORIGINS = new Set([
  'http://localhost:8081',
  'http://127.0.0.1:8081',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '3600',
  };
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(origin) },
  });
}

type ClosedTask = {
  text: string;
  why: string;
  status: 'done' | 'refused' | 'burned';
};

type RequestBody =
  | { mode: 'sharpen'; text: string; why: string }
  | { mode: 'reflect'; closed: ClosedTask[] };

// Strip line-breaks and trim to a max length. The system prompt assumes a
// single user "line" per field; smuggling newlines is the classic prompt-
// injection vector, so we kill them before anything reaches Anthropic.
function sanitiseLine(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

// Verify the caller is an authenticated end user, not someone replaying the
// public anon key. Supabase Edge Functions already require a valid JWT when
// deployed with `verify_jwt = true` (the default), but the *anon* role is a
// valid JWT too — and the anon key is shipped inside every app binary, so we
// can't rely on Supabase's check alone. We additionally enforce that the
// caller's role is `authenticated` and that the `sub` claim is a real user id.
function getUserIdFromJwt(req: Request): string | null {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    // Base64url decode the payload (middle segment).
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? padded : padded + '='.repeat(4 - (padded.length % 4));
    // @ts-ignore — atob is provided by the Deno runtime.
    const payload = JSON.parse(atob(pad));
    if (payload.role !== 'authenticated') return null;
    if (typeof payload.sub !== 'string' || payload.sub.length < 8) return null;
    // Reject expired tokens (belt-and-braces — Supabase already does this).
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

async function callAnthropic(args: {
  system: string;
  userMessage: string;
  maxTokens: number;
}): Promise<string | null> {
  // @ts-ignore — Deno global is provided by the Supabase Edge runtime.
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set in Edge Function secrets');
    return null;
  }
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: args.maxTokens,
      system: args.system,
      messages: [{ role: 'user', content: args.userMessage }],
    }),
  });
  if (!res.ok) {
    // Don't echo the raw error body — it can include the user's input.
    console.error('Anthropic call failed', res.status);
    return null;
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  return typeof text === 'string' ? text.trim() : null;
}

function cleanLine(s: string): string {
  // Trim quotes, trailing whitespace, leading bullets.
  return s
    .replace(/^["'`\-–—\*•\s]+/, '')
    .replace(/["'`\s]+$/, '')
    .trim();
}

// @ts-ignore — Deno.serve is the Supabase Edge entrypoint.
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, origin);
  }

  // Auth gate.
  const userId = getUserIdFromJwt(req);
  if (!userId) return json({ error: 'unauthorized' }, 401, origin);

  // Per-user rate limit.
  if (!rateLimit(userId)) return json({ error: 'rate_limited' }, 429, origin);

  // Cap raw request size before parsing — otherwise a 5 MB JSON body would
  // still get fully decoded.
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ error: 'payload_too_large' }, 413, origin);
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return json({ error: 'invalid_body' }, 400, origin);
  }
  if (raw.length > MAX_REQUEST_BYTES) {
    return json({ error: 'payload_too_large' }, 413, origin);
  }

  let body: RequestBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid_json' }, 400, origin);
  }

  if (body?.mode === 'sharpen') {
    const text = sanitiseLine((body as any).text, MAX_TASK_TEXT);
    const why = sanitiseLine((body as any).why, MAX_TASK_WHY);
    if (!text || !why) return json({ error: 'missing_fields' }, 400, origin);

    const userMessage = `Task: ${text}\nWhy: ${why}\n\nRewrite the why.`;
    const out = await callAnthropic({
      system: SHARPEN_SYSTEM,
      userMessage,
      maxTokens: 100,
    });
    if (!out) return json({ sharpened: null }, 200, origin);
    let sharpened = cleanLine(out).slice(0, 80);
    if (sharpened && !/[.!?]$/.test(sharpened)) sharpened += '.';
    return json({ sharpened }, 200, origin);
  }

  if (body?.mode === 'reflect') {
    const rawClosed = Array.isArray((body as any).closed)
      ? (body as any).closed.slice(0, MAX_REFLECT_ITEMS)
      : [];
    const closed: ClosedTask[] = [];
    for (const item of rawClosed) {
      if (!item || typeof item !== 'object') continue;
      const status = item.status;
      if (status !== 'done' && status !== 'refused' && status !== 'burned') continue;
      const text = sanitiseLine(item.text, MAX_TASK_TEXT);
      const why = sanitiseLine(item.why, MAX_TASK_WHY);
      if (!text || !why) continue;
      closed.push({ text, why, status });
    }
    if (closed.length === 0) return json({ line: null }, 200, origin);

    const summary = closed
      .map((t, i) => `${i + 1}. [${t.status}] ${t.text} — why: ${t.why}`)
      .join('\n');
    const userMessage = `This week's closed tasks:\n${summary}\n\nWrite one sentence.`;
    const out = await callAnthropic({
      system: REFLECT_SYSTEM,
      userMessage,
      maxTokens: 200,
    });
    if (!out) return json({ line: null }, 200, origin);
    let line = cleanLine(out).slice(0, 220);
    if (line && !/[.!?]$/.test(line)) line += '.';
    return json({ line }, 200, origin);
  }

  return json({ error: 'unknown_mode' }, 400, origin);
});
