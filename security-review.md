# Security review — Idle mobile app

A record of the pre-launch security audit done on 12 May 2026, plus a reusable prompt at the bottom for the next time you want to run this kind of review.

---

## What was checked

A high-end security engineer pass over an AI-generated ("vibe-coded") app, looking for the gaps that AI assistants routinely miss. Eight categories:

| # | Category | What we look for |
|---|---|---|
| 1 | Hallucinated packages | Fake or typo-squatted package names in `package.json` that an AI invented. These can be hijacked. |
| 2 | Hard-coded secrets | API keys, tokens, passwords baked into source code or committed to git history. |
| 3 | Default-open database | Row-level security disabled, `select *` policies, missing per-user filters. |
| 4 | Missing server-side validation | Trusting client-side limits only. Edge functions / database accepting any input length, any value. |
| 5 | Inconsistent auth middleware | Endpoints that skip the auth check, edge functions that don't verify the caller, deep links that overwrite sessions. |
| 6 | Client-side input validation | Email/password format, length caps, sanitisation before sending to server. |
| 7 | Production-readiness of dev tools | Dev panels, escape hatches, console logs, and `__DEV__` checks. |
| 8 | Git history | Secrets ever committed and not removed. `.gitignore` covering env files. |

---

## Findings — Idle, 12 May 2026

### ✅ Clean

- **Packages.** Every dependency in `package.json` is a real, well-known Expo / React Native / Supabase package. No typos. No squatters.
- **Secrets in code.** No hard-coded API keys. The Anthropic key lives as a Supabase Edge Function secret, never in the app.
- **Git history.** `.env.local` was never committed. `.gitignore` correctly covers `.env*.local`, `.kotlin/`, signing files (`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`).
- **RLS on tasks table.** Row-level security is on. Every policy (`select`, `insert`, `update`, `delete`) is gated by `auth.uid() = user_id`. No anonymous access.
- **Deep link handling.** Supabase PKCE flow with `idle://` scheme. Codes are single-use and time-bound. No magic-link tokens in the URL.
- **Session persistence.** AsyncStorage with auto-refresh. No tokens in plaintext logs.

### 🔧 Fixed

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | Edge Function `idle-ai` had no auth check. The public anon key was enough to call it — anyone could burn through the Anthropic API budget. | **Critical** | Function now decodes the JWT, requires `role: authenticated` and a real `sub` claim. Rejects the anon key. |
| 2 | No rate limiting on the Edge Function. A signed-in user could hammer it in a loop. | **Critical** | Per-user in-memory bucket: 20 calls per 60-second window. Returns 429 over that. |
| 3 | `reflect` mode took an unbounded `closed` array with no per-item size limit. | **High** | Each item's text and why is truncated to 200 chars server-side, max 12 items, max 8KB total request body. |
| 4 | CORS was wide open (`Access-Control-Allow-Origin: *`). | **High** | Locked down to the Expo dev origin (`localhost:8081` / `127.0.0.1:8081`). Native fetch is unaffected. |
| 5 | Tasks table had no length constraints. A tampered client could store giant rows. | **High** | Added `CHECK` constraints: text/why ≤ 200 chars, id ≤ 64, added_at/closed_at ≤ 16, reclaimed_min in 0–1440, created_at anchored to year 2000–2100. |
| 6 | No per-user row cap. A tampered client could write millions of rows. | **High** | Trigger on insert: max 1,000 rows per user. |
| 7 | Edge Function logged raw Anthropic error bodies, which could echo user input. | **Medium** | Now logs only status code, not the response body. |
| 8 | `/dev` route was reachable via `idle://dev` deep link in production builds, exposing destructive helpers (wipe storage, sign out, force burn). | **High** | Early `if (!__DEV__) return null` plus `router.replace('/')`. Production builds bounce to home. |
| 9 | `devReplaceAll` and `devClearStorage` were callable in the production context. | **Medium** | Both wrapped in `if (!__DEV__) return` as defense-in-depth. |
| 10 | Sign-up accepted 6-char passwords with no character-type requirement. | **Medium** | Client now requires 8+ chars on sign-up. Email goes through an RFC-ish regex. Emails normalised to lowercase. Friendly rate-limit error message added. |
| 11 | Prompt-injection vector: user-supplied `text` and `why` were interpolated into the system prompt verbatim, including newlines. | **Medium** | `sanitiseLine()` strips `\r\n\t` before any string reaches Anthropic. |
| 12 | No request body size cap on the Edge Function. | **Medium** | 8KB hard cap, checked against both `Content-Length` and actual body length. |

### ⚠️ Not done (intentionally)

- **Supabase password policy in the dashboard.** The client now requires 8+ chars with letters and digits, which covers every real user. Server-side enforcement would catch a tampered client. Nice-to-have, not blocking. To enable: **Authentication → Sign In / Up → Password Requirements** in the Supabase dashboard.
- **MFA, captcha, IP allow-listing.** A task app with no payments and no admin features doesn't justify the friction.
- **Custom JWT signing keys.** Default Supabase keys are fine at this scale.

---

## Files changed

- `supabase/functions/idle-ai/index.ts` — auth check, rate limit, input bounds, CORS lockdown, prompt sanitisation, log scrub.
- `supabase/schema.sql` — `CHECK` constraints, row-cap trigger.
- `supabase/migrations/20260512114224_harden_tasks_constraints.sql` — migration applied to remote.
- `supabase/config.toml` — local password policy (`minimum_password_length = 8`, `password_requirements = "letters_digits"`). Local-only; production set via dashboard.
- `store/auth.tsx` — email + password validation, lowercase normalisation.
- `store/tasks.tsx` — `__DEV__` gate on dev escape hatches.
- `app/dev.tsx` — `__DEV__` gate at the top of the route.
- `app/sign-in.tsx`, `app/sign-up.tsx` — placeholder copy + 8-char gate.

---

## Deploy checklist

After running a security review like this, three things need to happen on the production Supabase project:

1. **Push the schema.** From `idle-app/`: `npx supabase db push`. (Creates the migration on remote.)
2. **Re-deploy the Edge Function.** From `idle-app/`: `npx supabase functions deploy idle-ai`.
3. **Update password policy in the dashboard** (manual, two clicks): Authentication → Sign In / Up → Password Requirements → minimum 8, "Letters and digits".

Then verify on a real phone: shake → Reload, sign in, add a task, confirm everything still works.

---

## Reusable prompt — run this for any future security review

Paste this into a fresh Claude Code session in the project root when you want another sweep. It assumes Idle's current shape (Expo + Supabase + Edge Functions); for other projects, swap "Supabase" for whichever backend.

```
I want to do a thorough security review of this app before shipping it to production, like a high-end security engineer would.

Treat this as a "vibe-coded" app — one that an AI assistant helped build. AI tools produce working code fast but routinely miss the gaps a human security engineer catches. Your job is to find every one of those gaps, fix what you find, and tell me what I need to do manually that you can't.

Check at minimum:

1. **Hallucinated packages.** Every dependency in package.json is a real, well-known package — no typos, no squatters.
2. **Hard-coded secrets.** No API keys, tokens, or passwords in source code, app.json, or anything that ships to the device. Verify with git history too — `git log --all -p` for env files.
3. **Default-open database policies.** Every table has RLS on. Every policy checks `auth.uid() = user_id` or equivalent. No `select *` policies for anonymous.
4. **Server-side validation.** The database CHECKs string lengths, value ranges, status enums. The client cannot insert a 50KB string. Per-user row caps exist where a tampered client could otherwise abuse them.
5. **Auth on every endpoint.** Every Edge Function / API route verifies the caller's JWT, checks role is `authenticated` (not just `anon`), and rate-limits per user. The public anon key is NOT enough to call sensitive functions.
6. **CORS lockdown.** Allowed origins are an explicit allow-list, not `*`. Native fetch doesn't need CORS, but web abuse does.
7. **Prompt injection.** If any user input flows into an LLM call, newlines / control chars are stripped and lengths are capped before the prompt is built.
8. **Dev tools off in production.** Every dev route, dev escape hatch, and debug helper is gated behind `__DEV__` (React Native) or `NODE_ENV !== 'production'`. Deep links into dev routes should redirect to home.
9. **Client-side validation.** Email format, password strength (min 8, letters + digits), length caps on every input field.
10. **Deep link handling.** Auth code exchange handles malformed URLs gracefully. Session can't be hijacked via a crafted link.
11. **Logs.** Server logs do NOT echo raw error bodies that might contain user input.
12. **Git hygiene.** `.gitignore` covers .env.local, signing keys, mobile provisioning files. No secrets ever committed.

For each finding, classify as Critical / High / Medium / Low and fix the Critical and High ones in code. For items that need a dashboard click or human action, list them at the end with exact navigation steps.

After fixing, run `npx tsc --noEmit` to verify nothing broke.

Update `idle-app/app_build.md` with a dated changelog entry summarising what changed and why, in plain English.

Finally, update `idle-app/security-review.md` with the new findings and the date of the review.

When you're done, tell me — in plain English, short sentences — what was clean, what you fixed, and what's left for me to do manually.
```

---

## How often to run this

Before every App Store / Play Store submission, and any time you add a new endpoint, table, or third-party integration. The whole pass takes about 30–60 minutes of model time.
