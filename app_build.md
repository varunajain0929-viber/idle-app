# Idle — App Build Log

A running diary of the mobile app, written in plain English. If you read this top to bottom in 5 minutes you'll understand the whole project.

---

## What Idle is

A deliberately constrained task manager. It holds **five tasks max**, every task must answer **"why"**, the app **locks at 7pm**, and **everything unfinished burns every Friday at 5pm**. The brand is brutal editorial minimalism — three colors, three fonts, periods at the end of everything.

The mobile app lives at `idle-app/` inside this project folder. Built with Expo + React Native.

---

## What's been built so far

### Phase 1 — Setup (the empty house)
- Fresh Expo project with TypeScript and Expo Router (file-based screens).
- Installed three Google Fonts: **Bricolage Grotesque** (display), **Manrope** (body), **JetBrains Mono** (labels).
- Installed `AsyncStorage` so tasks survive when you close the app.
- Installed `react-native-svg` for the checkmark and X icons.
- Stripped the default "Welcome to Expo" content.

### Phase 2 — Design system (the paint and furniture)
- One file holds every color, font, spacing value, and motion timing: `constants/tokens.ts`. Every screen reads from here, so changing the brand once changes it everywhere.
- Three colors only: **Ink** (`#1A1A1A`), **Cream** (`#F5F0E8`), **Pink** (`#FF3D6E`). Pink stays under 5% of any screen.
- Spacing follows a strict 4-pixel rhythm (4, 8, 12, 16, 24, 32, 48, 64, 96, 128).
- Motion is rationed to three speeds: 120ms (taps), 200ms (transitions), 400ms (the Friday Burn).

### Phase 3 — Screens (the rooms)
Six states, three tabs:

| Screen | What it does | File |
|---|---|---|
| **Today** | The main list. Five-task cap. Add / Done / Refuse. | `components/idle/screens/TodayScreen.tsx` |
| **Add task modal** | Two-field form. Submit disabled until both filled. | `app/add-task.tsx` |
| **The week** | Weekly history — Done, Refused, Burned sections. | `components/idle/screens/WeekScreen.tsx` |
| **The rules** | Manifesto-style settings. 7 rules, most "FIXED". | `components/idle/screens/RulesScreen.tsx` |
| **Lockout** | Full-screen ink takeover after 7pm. | `components/idle/screens/LockedScreen.tsx` |
| **Friday Burn** | Friday 5pm ceremony. Pink strikes everything. | `components/idle/screens/BurnScreen.tsx` |

### Phase 4 — Reusable pieces (the doorknobs)
Small components every screen reuses, all in `components/idle/`:

- **Wordmark** — the "Idle." mark with the pink strike crossing through it.
- **BrandBar** — the thin top strip showing the wordmark. New in this pass.
- **IdleText** — text with brand-typography presets (hero / h1 / h2 / body / mono).
- **MonoLabel** — the 6px pink dot + ALL-CAPS label combo. Used as a section marker.
- **TaskRow** — the signature row with circle checkbox, title, "why" line, status label, and Refuse button.
- **PrimaryButton / GhostButton** — buttons that obey the brand spec.
- **PinkRule** — the 6px pink horizontal bar used as a graphic anchor.
- **TabBar** — bottom navigation with an animated pink underline.

### Phase 5 — Branding pass
- Added the **wordmark to the top of every main screen** via the new BrandBar.
- Long-press the wordmark to cycle through Open → Locked → Burn for previewing.
- Wrote this build log.

### Phase 7 — Framework upgrade (this pass)
Applied the 5-pillar product framework + two Hooked additions (Variable Rewards, Investment). Detail in the changelog below. The framework itself is documented at `../PRODUCT_FRAMEWORK.md` (one level up from `idle-app/`).

---

## How the app is structured (folder map)

| Folder | What it holds |
|---|---|
| `app/` | The screens you can navigate to (Today + the Add modal). The shell that decides what to show. |
| `components/idle/` | All the reusable Lego pieces — wordmark, brand bar, task row, buttons, tab bar. |
| `components/idle/screens/` | The three tab screens plus Locked and Burn. |
| `store/` | The task data — adding, completing, refusing, persisting to disk. |
| `lib/` | The "is the app open right now?" logic, plus the hidden dev override. |
| `constants/` | The design tokens — every color, font, spacing value in one file. |
| `assets/` | App icon and splash images (still the Expo placeholders for now). |

---

## How the app decides which screen to show

There is **one route**: `app/index.tsx`. When the app opens, it looks at the time:

- If it's **between 6am and 7pm on a weekday** → show the tabbed shell (Today / Week / Rules).
- If it's **after 7pm on a weekday or any time on a weekend** → show the Lockout screen.
- If it's **Friday between 5pm and 7pm** → show the Friday Burn screen instead.

The Lockout and Burn screens take over the whole phone — no tabs, no nav. That's intentional.

---

## Hidden gesture

**Long-press the "Idle." wordmark at the top of the app.**

Each long-press cycles through: Auto → Open → Locked → Burn → Auto. Lets you preview the special screens without waiting for 7pm or Friday. Only meant for development / demos — would be hidden or removed for real users.

---

## Dependencies (what each one is for)

| Package | What it's for |
|---|---|
| `expo` + `expo-router` | The phone-app framework and the screen routing. |
| `react-native-reanimated` | Smooth animations (tab underline, burn pulse). |
| `react-native-gesture-handler` | Long-press detection. |
| `react-native-svg` | The checkmark and X icons in the task circle. |
| `react-native-safe-area-context` | Keeps content out from behind the status bar and home indicator. |
| `@react-native-async-storage/async-storage` | Saves tasks to disk so they survive app restarts. |
| `expo-haptics` | The little phone-buzz when you tap. |
| `@expo-google-fonts/bricolage-grotesque` | Display font. |
| `@expo-google-fonts/manrope` | Body font. |
| `@expo-google-fonts/jetbrains-mono` | Mono label font. |

---

## How to run

In your terminal:

```
cd "/Users/vj/Claude OS/Claude Design/Idle/idle-app"
npm start
```

A QR code appears. Scan it with your iPhone camera or with the Expo Go app on Android. The app opens.

Whenever you want to see your latest changes on your phone: shake the phone and tap "Reload" in the Expo Go menu.

---

## What's not done yet (the next-session shopping list)

All eight branding items from the previous shopping list are now done. New ideas can go here as they come up:

- **Burn Book promo.** A small card at the bottom of The Week tab that mentions the paper journal companion (£25 standalone / included with annual). Quiet, tasteful, one-line link.
- **Pricing screen.** A "Plans" page showing Free / Annual / Lifetime tiers. Likely reachable from The Rules tab.
- **Web build.** Expo supports web; the same code can become `idle.work` on the desktop. The codebase is web-ready but unverified.
- **iOS / Android store metadata.** When you decide to ship: app store screenshots, descriptions, keywords, privacy disclosure (it's all-local so this is short).
- **End-of-week notification (still none).** The brand refuses notifications, so this stays as a deliberate non-feature. Worth restating.

---

## Where to find the source files for the design

If you (or a designer) want to check the design intent against what we built:

- **Mockup with all six screens (HTML):** `Mobile App Mockup/idle-mobile-app.html`
- **React UI kit with Today / Week / Rules:** `design_handoff_idle/ui_kits/idle/`
- **Brand guidelines (colors, type, voice):** `Idle-brand-guidelines/` and `Idle Design System/`
- **Product brainstorm and pitch:** `Claude Brainstorm/` and `Decks/`
- **Landing page (full marketing story):** `Landing Page/idle-landing.html`
- **20-second video teaser:** `Video Teaser/idle-launch-teaser-index.html`

---

## Changelog

A running log. Every time something is added, removed, or changed, it gets a line here.

### 12 May 2026 — Lockout-time pivot rolled across the whole project
After flipping the app from a 7pm to a 9pm lockout (and burn from 5pm to 7pm), swept the rest of the project so the story matches the code everywhere a future reader (or Claude) might look.

- **Updated public-facing files:** the main landing page (HTML + the live countdown script), the mobile app mockup HTML.
- **Updated brand & manifesto sources:** the brand guidelines, the brand concept spec, and every duplicate copy of those that lives across the design system / handoff folders.
- **Updated internal docs:** the project's `CLAUDE.md` (so I read the new times next time), `PRODUCT_FRAMEWORK.md`, the pitch-deck outline, both `idle-app/README.md` and `app-testing.md`, and every UI-kit README that referenced "BURN / 7PM" dev buttons.
- **Updated design-system previews:** the cards, status pills, and form-states preview HTMLs that displayed `FRIDAY · 5PM`, `LOCKED · 7PM`, etc.
- **Not touched (intentional):** the two bundled landing pages — `Idle Landing Page _standalone_.html` and `Idle Landing Page - Antagonistic.bundled.html`. They are compiled artifacts with everything inlined as base64; they should be regenerated from the source landing page rather than hand-edited.
- **Files touched:** ~21 files across the project. Full list in the changelog below.

### 12 May 2026 — Lockout moved from 7pm to 9pm
The 7pm lock was too aggressive. Most people who'd want this app finish work between 6 and 8pm — locking them out at 7 made the app feel hostile on day one. Pushed the boundary back two hours so the rule still bites without making people quit.

- **Changed:** App locks at **9pm** on weekdays (was 7pm). Weekends still locked all day.
- **Changed:** The Friday Burn ceremony now runs **7pm–9pm** (still the last 2 hours before lock, just shifted).
- **Updated:** Every place those times appeared — the Rules screen, the Locked screen, the manifesto onboarding cards, the Friday line's AI prompt, and the dev panel description.
- **Files touched:** `lib/timeGate.ts`, `components/idle/screens/RulesScreen.tsx`, `components/idle/screens/LockedScreen.tsx`, `app/onboarding.tsx`, `app/dev.tsx`, `supabase/functions/idle-ai/prompts.ts`.
- **Re-deployed:** the Edge Function, so the Friday line knows about the new time.

### 12 May 2026 — Fix: Week chart was hiding most of the week
Spotted while testing with the seeded sample week: the chart on the "The week." screen only showed marks for today (Tuesday). Mon, Wed, Thu, Fri all sat empty even though the seed had tasks closed on those days.

- **Cause:** The chart filtered tasks by *when they were first written down*, not *when activity happened*. A task added last Saturday and finished this Wednesday was getting thrown out before the chart could draw it.
- **Fixed:** The chart now uses *when the task last changed* (the `updatedAt` stamp) as the "this week or not" test. That matches what "this week" actually means — activity that happened in this Monday–Friday window.
- **Files touched:** `components/idle/screens/WeekScreen.tsx`.

### 12 May 2026 — Fix: multi-line strike-through
Spotted while testing: when a task title wrapped to two lines, the "done" or "refuse" strike line appeared in the empty gap between the two lines instead of crossing the actual text. Same bug on the Friday Burn screen.

- **Fixed:** Tasks now measure each line of text and draw a strike per line. A two-line task gets two strike bars; a three-line task gets three. Single-line tasks look exactly the same as before.
- **Files touched:** `components/idle/AnimatedStrike.tsx` (new, shared little helper), `components/idle/TaskRow.tsx`, `components/idle/screens/BurnScreen.tsx`.

### 12 May 2026 — Phase 11: Three quiet AI features (Sharpen, Friday line, Week card)
Idle finally has AI — but on Idle's terms. None of these features ask you to come back, none send a notification, none keep score. They each do one small thing and get out of the way.

- **Added — Sharpen.** When you add a task, after you type the "why," a small `• SHARPEN.` chip appears under the field. Tap it once and Idle suggests one tighter, sharper rewrite of your reason — same Idle voice, periods and all. Take it (`✓ use this`) or keep yours (`✕ keep mine`). One try per task, then it goes away. If your why is already tight, the chip just says `ALREADY TIGHT.` and disappears.
- **Added — Friday line.** On the Friday Burn screen, just above the list of tasks about to burn, a single honest sentence appears about the week. Not a score. Not motivation. A friend noticing a pattern, like *"You closed three. The 'call dad' one came back twice — maybe make a real plan, or let it go."* It's cached per week, so reopening the screen never re-bills the AI.
- **Added — Week card.** Below the Friday line is a small `SHARE.` link. Tap it and a tall cream-and-pink card slides up: the week's date, the AI sentence, three of your closed tasks (✓ done / × burned), and the Idle wordmark. One pink button — `Save & share.` — captures it as a PNG and opens your phone's share sheet. Built so it actually feels worth showing a friend.
- **Added — the private door.** All three features go through one Supabase Edge Function (`supabase/functions/idle-ai/`) so the Anthropic API key stays on Idle's server, not in the phone. Uses Claude Haiku 4.5 (cheap, fast). Voice rules are baked into the system prompts so the model can't drift into productivity-bro language.
- **Files touched:** `lib/ai.ts` (new), `app/add-task.tsx`, `components/idle/screens/BurnScreen.tsx`, `app/week-card.tsx` (new), `components/idle/WeekCard` rendering inlined into the route, `app/_layout.tsx` (registered the modal), `supabase/functions/idle-ai/index.ts` + `prompts.ts` (new), `.env.example` (note added).
- **Share approach (post-test fix):** Removed `react-native-view-shot` and `expo-sharing` — they need a custom build and won't run inside Expo Go. The Week card now shows a small `• SCREENSHOT TO SHARE.` instruction with the iPhone shortcut hint instead. Same outcome (a beautiful image you can share), one extra finger gesture. When we move to a real production build later, we can swap back to one-tap capture.
- **Heads-up — one-time setup before this works:** Idle needs an Anthropic API key, and the Edge Function needs to be deployed once. Plain English steps:
  1. Get an Anthropic key at [console.anthropic.com](https://console.anthropic.com) (a few dollars of credit is enough for many months of personal use).
  2. In a terminal: `npm install -g supabase`, then `supabase login`, then from the `idle-app/` folder: `supabase link --project-ref gewchpasfwihyauzbvot`.
  3. `supabase secrets set ANTHROPIC_API_KEY=sk-ant-…` (paste your real key).
  4. `supabase functions deploy idle-ai` (only signed-in Idle accounts can call it — Supabase checks the user's session automatically, so the API key can't be drained by a stranger).
  5. Reload the app on your phone. Sharpen, Friday line, and Week card all light up.

### 12 May 2026 — Phase 10c: Auth polish (post-test fixes)
First real walk-through on the phone surfaced three small bugs in the accounts work. Fixed.

- **Fixed:** Tapping **Sign in.** signed you in successfully but left you stuck on the sign-in screen. The screen now sends you to the home gate on success.
- **Fixed:** Same thing on **Create account.** when email confirmation is off — Supabase auto-signs the new user in, but the sign-up screen used to keep them on the "Check your inbox." page anyway. Now we check whether a session was created and route accordingly.
- **Fixed:** Brand-new accounts on a phone where another account had already onboarded were marked as onboarded too. The legacy-flag migration was over-eager — now it migrates to the first account only and then deletes the legacy flag, so subsequent accounts see the manifesto cards fresh.
- **Files touched:** `app/sign-in.tsx`, `app/sign-up.tsx`, `store/auth.tsx`, `app/index.tsx`.

### 12 May 2026 — Phase 10b: Email links open the app, onboarding per account
Two follow-ups to the accounts phase. First, the confirm-email link in Supabase's signup email used to open Safari and fail (there's no website to land on). Now it opens **the app**. Second, the manifesto onboarding cards were tied to the device, not the account — so a second user on the same phone would skip them. Now they're tied to the account.

- **Added:** Deep-link handling in `store/auth.tsx`. When iOS hands the app a URL with a `code=...` parameter, we exchange it for a real session and the app signs the user in. Same plumbing handles password-reset links.
- **Changed:** `signUp` and `resetPassword` now pass `emailRedirectTo` / `redirectTo` set to `idle://` (built via `Linking.createURL('/')`). Supabase uses this as the "return to" URL when someone taps the email link.
- **Changed:** The onboarded flag in AsyncStorage. Used to be one global key (`idle.onboarded.v3`); now it's `idle.onboarded.v3.<userId>` so each account sees the cards exactly once. The old global flag is migrated to the current user on first launch so the existing tester doesn't see the cards again.
- **Files touched:** `store/auth.tsx`, `app/onboarding.tsx`, `app/index.tsx`.
- **Heads-up:** Two settings in the Supabase dashboard still need to be flipped by hand — **Confirm email** turned back on, and `idle://` added to the **Redirect URLs** allow-list. Instructions are in the chat with Claude.

### 12 May 2026 — Phase 10: Accounts and the cloud
Tasks used to live only on the phone. If you lost the phone, the list went with it. Now tasks live in **your account** in the cloud (Supabase), with a copy kept on the phone for speed and offline use.

- **Added:** Email + password sign-in, sign-up, and a "forgot password" flow. Three new screens (`app/sign-in.tsx`, `app/sign-up.tsx`, `app/forgot-password.tsx`) styled to match Idle — cream background, pink rule, two fields, one button. Sentence case, periods, mono labels with the pink dot.
- **Added:** An auth gate. If you're signed out, the app sends you to **Sign in.** first. Onboarding cards come *after* you have an account.
- **Added:** A real **ACCOUNT** block on the Rules screen — shows your email and a **Sign out.** action (with a confirmation alert). Replaced the old placeholder ("you@idle.app").
- **Added:** A small cloud sync worker. Every change to a task is saved on the phone instantly *and* marked "not yet sent." A debounced background push uploads dirty rows to Supabase. The same worker also pulls the latest state on app launch, on reconnect, and after every change.
- **Added:** Offline support. You can add and finish tasks with no signal — they queue locally and sync the next time you're online.
- **Changed:** The local cache key. Tasks used to live at `idle.tasks.v2`; now they live at `idle.tasks.v3.<userId>` so different accounts on the same phone can't see each other. The old v2 cache is migrated automatically on first sign-in (every row marked dirty so it uploads).
- **Changed:** The dev-panel **Reset** action also signs you out, so a reset wipes the slate properly.
- **Added:** `supabase/schema.sql` — a one-time recipe you run in Supabase's SQL editor. Creates the `tasks` table, turns on Row-Level Security (so users can only ever see their own rows), and adds an `updated_at` trigger for last-write-wins merging.
- **Added:** `.env.example` showing the two values to fill in — `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Copy it to `.env.local` (gitignored) and paste your project's keys.
- **Files touched:** `package.json`, `app/_layout.tsx`, `app/index.tsx`, `app/dev.tsx`, `store/tasks.tsx`, `components/idle/screens/RulesScreen.tsx`. New files: `lib/supabase.ts`, `lib/sync.ts`, `store/auth.tsx`, `components/idle/AuthShell.tsx`, `app/sign-in.tsx`, `app/sign-up.tsx`, `app/forgot-password.tsx`, `supabase/schema.sql`, `.env.example`.

### 12 May 2026 — Phase 9b: Empty reset option
You noticed Reset always lands on the welcome demo (three example tasks). That's what a real first-time user sees, so it's correct — but for testing the empty state and the cap, a clean-slate option is more useful.

- **Added:** Second reset button in the dev panel: **"Reset (empty list)."** Wipes all storage and pre-sets the seed-gate flag so the example tasks are skipped. After onboarding you land on a totally empty list. Same two-tap confirm as the full reset.
- **Renamed:** The original button is now **"Reset (full first-launch)."** so the two are clearly distinguishable. The body copy explains exactly what each one does.
- **Files touched:** `app/dev.tsx`.

### 12 May 2026 — Phase 9a: Dev exit on full-screen takeovers
Testing surfaced a trap: once you forced the Locked screen via the dev panel, there was no obvious way back. The only escape was a long-press gesture on the top row, which is unreliable in browsers. The "Reset everything" button would have worked, but only if you remembered.

- **Added:** Small pink `DEV · EXIT` pill on both the Locked screen and the Burn screen, visible only when `__DEV__` is true. One tap returns the dev override to `auto` and the gate releases you back to normal.
- **Files touched:** `components/idle/screens/LockedScreen.tsx`, `components/idle/screens/BurnScreen.tsx`.

### 12 May 2026 — Phase 9: Dev tools panel (only in development)
Testing the app properly meant waiting real days for the Week screen to fill up or for Friday to arrive. This is the testing shortcut — a small panel only visible while developing.

- **Added:** Small pink `DEV` pill in the top-right of the BrandBar. It replaces the "LESS. DONE." line, but **only in development builds** — production users will still see "LESS. DONE." (the `__DEV__` flag flips it).
- **Added:** New modal screen at `app/dev.tsx`. Tap the DEV pill → modal slides up with seven actions, grouped into Sample data, State preview, and Destructive.
  - *Seed sample week* — drops in eight realistic tasks across Mon–Fri so the Week screen actually shows variety (done, refused, burned, open).
  - *Fill the cap* — tops up to 5 open tasks for testing the burn animation or "at cap" behavior.
  - *Show locked screen / Show burn screen / Back to normal* — clickable shortcuts for the long-press-wordmark gesture. Easier on web where long-press is awkward.
  - *Burn now* — actually fires the `burn()` function on the real task list. Lets you check what the Week screen looks like *after* a burn.
  - *Reset everything* — wipes every `idle.*` AsyncStorage key, cancels any scheduled morning bell, and reloads the JS bundle back to the very first onboarding card. Gated by a two-tap confirm (first tap arms, second tap within 3 seconds fires) so it can't be triggered by accident.
- **Added:** New file `lib/devSeed.ts` — pure helper that builds the sample task array. No React, no storage. Easy to tweak in one place.
- **Added:** Two dev-only methods on the tasks store: `devReplaceAll(tasks)` and `devClearStorage()`. Clearly prefixed `dev` so they aren't mistaken for production code paths. The first bypasses the 5-cap on purpose. The second clears every `idle.*` AsyncStorage key.
- **Changed:** `app/_layout.tsx` registers `dev` as a modal route, alongside `add-task` and `about`.
- **Brand boundary:** The pink DEV pill is the one place the design system bends — that's intentional. It's a clear "this is not a feature" signal. It never ships.
- **Files touched:** `store/tasks.tsx`, `components/idle/BrandBar.tsx`, `app/_layout.tsx`, `CLAUDE.md`. New files: `lib/devSeed.ts`, `app/dev.tsx`.
- **Dependencies added:** Zero — uses what's already installed.

### 12 May 2026 — Phase 8a: Onboarding works on web
Quick fix surfaced during browser testing. The onboarding swipe cards wouldn't advance past the first one in Chrome.

- **Fixed:** The onboarding's "Next." button now updates the card index immediately on press. Previously it waited for the scroll-end event to fire — which doesn't reliably fire on web — so subsequent presses tried to scroll to the same place and looked stuck.
- **Files touched:** `app/onboarding.tsx`.

### 12 May 2026 — Phase 8: One quiet bell (the only notification)
A small but careful rethink. You worried Idle would die in people's phones without push reminders. The money model in the deck doesn't actually need daily-active-users (the £24/yr Burn Book and £199 Lifetime are bought once, not opened daily), but a *gentle* morning ritual is worth offering — as long as the person asks for it first.

- **Added:** A single optional morning bell. One ping a day at 6am: "Today is fresh." No task count. No streak. No shame. **Off by default** — the person has to walk into the Rules screen and turn it on.
- **Added:** New section at the top of the Rules screen labelled `YOUR CHOICE`, with a toggle row for the bell. Pink track when on, faint ink track when off. Matches the design system.
- **Added:** Permission handling. When you flip the toggle on, iOS asks for notification permission. If you say no, the toggle slides back off and a small warning haptic fires. If you say yes, the bell is scheduled.
- **Added:** Re-scheduling on app boot — if the bell was on, we re-confirm the schedule when the app opens (in case the OS dropped it).
- **Added:** Android notification channel set up so the bell behaves correctly on Android (default importance, no vibration, no badge).
- **Changed:** The rule "No notifications. Ever." now reads "No notifications by default." with body explaining the optional bell. Still a locked rule — the promise is now *"we never push you something you didn't ask for"*, which is the actual brand line and stronger than pretending notifications don't exist.
- **Changed:** Landing page intro line — "No notifications" → "No notification spam." Same in the "What it refuses" tile grid.
- **Changed:** Voice & manifesto doc and the brand guidelines' Principle 5 example line, so future copy doesn't quote the old promise.
- **Files touched:** `app/_layout.tsx` (added `SettingsProvider`), `components/idle/screens/RulesScreen.tsx`. New files: `lib/morningBell.ts`, `store/settings.tsx`. Plus copy: `Landing Page/idle-landing.html`, `Claude Brainstorm/idle-voice-and-manifesto.md`, `Idle-brand-guidelines/Idle-brand-guidelines.md`, `Idle Design System/README.md`.
- **Dependencies added:** `expo-notifications` (SDK 54 compatible).
- **New storage key:** `idle.morningBell.v1` — stores "1" or "0", lives separately from the task store.
- **What was deliberately NOT added:** streaks, scores, badges, a second daily notification, "you've been gone X days" re-engagement nudges, weekly digest emails. Those would turn Idle into the thing it makes fun of, and the Burn Book buyers would notice first.

### May 2026 — Phase 7: Framework upgrade (Core Loop + Hooked additions)
A pass that puts the product framework into the app. No new screens. No new dependencies. Six screens total — still on budget.

- **Added:** Animated task completion. When you tap "done," the circle smoothly fills, the check fades in, and the strikethrough line **draws across** the task name left-to-right (200ms). Same for "refused" in pink. The static instant-snap is gone.
- **Added:** Variable status labels. The label that appears when you complete a task is *usually* "DONE" but occasionally "KEPT", "SHIPPED", or "CLOSED" — picked deterministically from the task's id. Same task always shows the same word. Refused has its own set: "REFUSED" / "RECLAIMED" / "FREED". Not random, just variety.
- **Added:** Variable haptics. Six different "feels" for the done tap, picked the same deterministic way. Mostly soft, occasionally light or rigid.
- **Added:** Milestone captions. On the 1st / 10th / 50th / 100th / 250th task closed (done or refused), a small pink mono line appears on the Today screen for ~6 seconds — *"YOUR 10TH TASK."* — then never appears again. The app notices, but does not gamify.
- **Added:** The Carry banner. When you open Idle and you left open tasks the day before, the top of Today shows: *"Yesterday you left 2 things."* with two ghost links — KEEP THEM. / REFUSE THEM. Refuse bulk-refuses all carried tasks. This is the retention hook — pull, not push.
- **Added:** Refuse-with-estimate. When you tap REFUSE, a thin row of chips slides in: **15m / 30m / 1h / SKIP**. Tap a chip → that estimate is saved to the task. Tap SKIP or wait 5 seconds → refusal commits with no estimate. The default is zero-friction.
- **Added:** Reclaimed Minutes total on the Week screen. A small line under the weekly stats: *"RECLAIMED  47m"* — sums every refused-task estimate. Hidden if the total is zero. The investment loop: time you said no to, compounding forever.
- **Added:** Per-task reclaimed time in the Week screen's "Refused" list — a small `RECLAIMED · 30m` mono caption under each refused row that has one.
- **Added:** Week-view dot grid chart. Five rows (Mon–Fri). Each row shows what happened that day with the current week's tasks: filled ink dots (done), pink × (refused), hollow rings (burned). No percentages. No "you're trending up." Just truth.
- **Added:** 3-day onboarding challenge. After completing onboarding, the top of Today shows one quiet line: *"DAY 1 — ADD ONE THING."* Add a task → *"DAY 2 — KEEP IT OR REFUSE IT."* Close one → *"DAY 3 — A WHOLE DAY."* After three calendar days, one final line appears: *"YOU FOUND THE RHYTHM."* — fades out forever. The reward is the scaffolding disappearing.
- **Added:** Reduced-motion respect. If the user has iOS Settings → Accessibility → Reduce Motion ON, the line-draw and fade animations are skipped — state changes happen instantly.
- **Added:** New file `lib/variants.ts` — pure helper for the deterministic word + haptic picker (no state).
- **Added:** New keys in AsyncStorage under `idle.meta.v1` — challenge state, onboarded-at timestamp, last-seen date, milestones already shown.
- **Bumped:** Onboarding flag from `idle.onboarded.v2` → `idle.onboarded.v3`. This is a one-time forced re-onboard so existing dev installs see the new 3-day challenge flow. Tasks already in storage are preserved.
- **Files touched:** `store/tasks.tsx`, `components/idle/TaskRow.tsx`, `components/idle/screens/TodayScreen.tsx`, `components/idle/screens/WeekScreen.tsx`, `app/onboarding.tsx`. New file: `lib/variants.ts`.
- **Dependencies added:** Zero. Everything runs on existing `react-native-reanimated`, `react-native-svg`, `expo-haptics`, and `@react-native-async-storage/async-storage`.
- **Where the framework lives:** `../PRODUCT_FRAMEWORK.md` (top level of the Idle folder, one above `idle-app/`).

### May 2026 — Phase 5: Branding pass (initial)
- **Added:** BrandBar component at the top of the app — small wordmark + new "LESS. DONE." mono strap line on the right. Persistent across all three tabs.
- **Added:** This `app_build.md` log file.
- **Changed:** The hidden dev-override gesture now lives on the wordmark in the BrandBar (long-press it to cycle preview screens). Removed the duplicate gesture from the Today screen's mono label.
- **Changed:** Tab screens (Today / Week / Rules) no longer claim the top safe-area inset — BrandBar handles it. Avoids double padding.

### May 2026 — Phase 6a: Brand voice polish
- **Changed:** Done circle haptic is now a **soft** tick (was Light). Refused button fires a **double-heavy** tap (two heavy impacts 70ms apart). Two different "feels" — soft for completing, sharper for refusing. Same weight, different texture.
- **Changed:** Period audit. Button copy now ends in periods: "Add a task." / "Five is the maximum." / "Add it." / "Need a why." / "No reason, no task." / "Cancel." — the period is part of the brand and now shows up consistently.

### May 2026 — Phase 6e: App icon and splash
- **Added:** Real app icon. Generated 1024×1024 PNGs from the brand strike+dot SVG. The home-screen icon is now ink-on-cream with a pink strike and a cream dot — the same mark used on the wordmark, just unrolled. Wired into `app.json` for iOS + Android (foreground / background / monochrome variants for Android adaptive icons).
- **Added:** Branded splash screen. The pink strike+dot mark on cream on light mode, on ink on dark mode. Replaces the generic Expo flash before the app opens.
- **Added:** A pink-bar branded "still-loading" screen that shows for the half-second while fonts load (between the native splash and the live UI). No spinner. Just a pink rule. Brand staying on-brand even at boot.
- **Added:** `scripts/generate-icons.js` — a one-shot Node script using `sharp` that re-renders all the icon PNGs from inline SVG strings. If we ever tweak the brand, we re-run this and every variant updates at once. `sharp` is a devDependency only.

### May 2026 — Phase 6d: First-launch manifesto onboarding
- **Added:** New screen at `app/onboarding.tsx`. Five full-screen swipe cards: "Less. Done." / "Five." / "Every task. A reason." / "Everything burns." / "The app closes." Each card has a mono label, a big heavy display title, a pink rule, and a body line.
- **Added:** A pink progress strip at the bottom shows which card you're on. A black "Next." button advances; on the last card it becomes "Begin." and finishes onboarding.
- **Added:** SKIP in the top right of every card. Both SKIP and Begin set the flag so onboarding only runs once.
- **Added:** The main shell (`app/index.tsx`) now checks the `idle.onboarded.v2` flag on launch and redirects to `/onboarding` if not set. Existing users with seeded example tasks are unaffected — that flag is separate.

### May 2026 — Phase 6c: About / manifesto screen
- **Added:** New screen at `app/about.tsx`. Full 230-word manifesto from the brand voice doc, rendered with editorial typography (Bricolage 17/27, generous line-height, periods doing the work).
- **Added:** "Read the manifesto." link at the bottom of The Rules screen — sits as a ghost-style button with the brand's 2px underline.
- **Added:** Registered as a modal route in the root stack so it slides up from the bottom. CLOSE label in the top right to dismiss.

### May 2026 — Phase 6b: Burn ceremony animation
- **Added:** On the Friday Burn screen, each undone task's pink strike now **draws across the text one by one**, staggered 220ms apart. Each strike takes 220ms to complete. The brand guide called this "the only ceremonial motion in the product" — it makes Friday feel like Friday.
- **Added:** A small fade on the task text as its strike completes (opacity drops from 0.9 to 0.5).
- **Added:** When you tap "Monday is fresh." to clear the burned tasks, the phone fires a Warning haptic — the only Warning haptic in the whole app. Brand voice says exclamation marks mean "the building is on fire"; this is the equivalent.
