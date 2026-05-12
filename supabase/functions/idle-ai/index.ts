// @ts-nocheck — this file runs on Deno (Supabase Edge Runtime), not Node.
// Local TypeScript checks ignore it; the Supabase deploy pipeline type-checks
// it against Deno's standard library.

import { SHARPEN_SYSTEM, REFLECT_SYSTEM } from './prompts.ts';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
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
    console.error('Anthropic call failed', res.status, await res.text());
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  if (body.mode === 'sharpen') {
    const text = (body.text ?? '').slice(0, 200).trim();
    const why = (body.why ?? '').slice(0, 200).trim();
    if (!text || !why) return json({ error: 'missing_fields' }, 400);

    const userMessage = `Task: ${text}\nWhy: ${why}\n\nRewrite the why.`;
    const out = await callAnthropic({
      system: SHARPEN_SYSTEM,
      userMessage,
      maxTokens: 100,
    });
    if (!out) return json({ sharpened: null });
    let sharpened = cleanLine(out).slice(0, 80);
    if (sharpened && !/[.!?]$/.test(sharpened)) sharpened += '.';
    return json({ sharpened });
  }

  if (body.mode === 'reflect') {
    const closed = Array.isArray(body.closed) ? body.closed.slice(0, 12) : [];
    if (closed.length === 0) return json({ line: null });

    const summary = closed
      .map((t, i) => `${i + 1}. [${t.status}] ${t.text} — why: ${t.why}`)
      .join('\n');
    const userMessage = `This week's closed tasks:\n${summary}\n\nWrite one sentence.`;
    const out = await callAnthropic({
      system: REFLECT_SYSTEM,
      userMessage,
      maxTokens: 200,
    });
    if (!out) return json({ line: null });
    let line = cleanLine(out).slice(0, 220);
    if (line && !/[.!?]$/.test(line)) line += '.';
    return json({ line });
  }

  return json({ error: 'unknown_mode' }, 400);
});
