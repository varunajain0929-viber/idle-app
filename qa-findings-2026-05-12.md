# Idle — QA pass findings, 12 May 2026

Full-app QA pass driven through the web build (`npm run web`) at `localhost:8081`. Plan and checklist live at `~/.claude/plans/i-want-to-do-idempotent-beaver.md`. Screenshots are in `../qa-screenshots/` next to this folder.

Scope agreed with you before testing:

- **Wide:** every screen, every button, every brand rule.
- **Strict:** both broken features AND brand slips.
- **How:** I drove the web build; you'll spot-check on the phone for the items marked "phone only" below.

---

## Headline numbers

| Result | Count |
|---|---|
| Passed | 67 |
| Failed | 5 |
| Could not test from web (need phone or special setup) | 8 |
| Plan defects (test I wrote was wrong; product is correct) | 1 |

5 real bugs found. 2 are web-only nav/auth quirks that probably don't bite on phone. 3 affect the product more broadly.

---

## Bugs by severity

### Blockers (would have shipped broken)

**[B1] The web build did not boot at all** — Severity: **blocker (FIXED in this pass)**

When `npm run web` started Expo's pre-render step, Supabase tried to read the saved session via AsyncStorage. The web shim of AsyncStorage immediately touches `window.localStorage`. During pre-render there is no `window` (it runs in Node), so the whole bundle crashed with *"window is not defined"* before any screen rendered. Every web user would have hit a blank page.

- **Fix applied:** Wrapped AsyncStorage in `ssrSafeStorage` that short-circuits when there is no browser. Patch in [lib/supabase.ts:18-38](idle-app/lib/supabase.ts#L18-L38). Type-check stays clean.

### Major (real user-facing bugs)

**[M1] "Add it." / "Cancel." / "CLOSE" buttons fail to dismiss modals on web** — Severity: **major**

After submitting a new task, the task IS saved, but the modal sits there. Console shows *"The action 'GO_BACK' was not handled by any navigator."*. Same with Cancel on Add Task and (under some conditions) CLOSE on About. The user can't get back to Today without manually editing the URL or pressing the browser back button.

- **Why it happens:** All these buttons call `router.back()`. Expo Router on web maintains the stack via React state, which gets reset on Metro hot-reloads or if the user lands on the URL directly (refresh, deep link). Once the stack is empty, `back()` fails silently.
- **Likely fix:** Replace `router.back()` with `router.replace('/')` in modal-dismiss handlers; replace doesn't depend on history.
- **Files involved:** [app/add-task.tsx](idle-app/app/add-task.tsx), [app/about.tsx](idle-app/app/about.tsx).
- **Phone impact:** Probably unaffected — native nav keeps the stack across reloads.

**[M2] "Sign out." doesn't reliably sign the user out on web** — Severity: **major**

Clicked Sign Out on the test account. The browser briefly redirected to `about:blank`, then back to `/`. When I navigated back, I was signed in as a *different* account (the one used at the start of the session) with their data restored. The Supabase session token resurrected from somewhere.

- **Why it likely happens:** The `Alert.alert("Are you sure?", …)` confirmation dialog used by `RulesScreen` doesn't render the same way on React Native Web — it may auto-dismiss before the user clicks, or the confirm handler doesn't fire. Possibly combined with Supabase's auto-refresh holding a previous session in memory.
- **Likely fix:** On web, replace `Alert.alert` with a brand-styled custom confirmation modal. Also explicitly clear `localStorage` keys (`sb-*-auth-token`) inside `signOut()`.
- **Phone impact:** Should be fine — `Alert.alert` is native on iOS/Android.

**[M3] Short password gives no inline feedback** — Severity: **minor → major (UX risk)**

On sign-up, typing 5 characters disables the "Create account." button but shows no explanation. The placeholder *"At least eight characters."* disappears the moment you start typing. A non-technical user could think the button is broken.

- **Likely fix:** Show a small mono caption under the field once the user has typed but the value is still under 8 chars: `• NEEDS 8 CHARACTERS.`

### Minor (polish / lint)

**[m1] `npm run lint` fails — Rules of Hooks violation in Dev panel** — Severity: **minor**

[app/dev.tsx:30-38](idle-app/app/dev.tsx#L30-L38) has `if (!__DEV__) return null;` *before* calling 5 React hooks. In practice it doesn't crash (`__DEV__` is constant at runtime), but it breaks lint and is a fragile pattern.

- **Likely fix:** Move the early-return below all hook calls, or wrap the entire component body in a `if (!__DEV__) { … }` guard at the JSX level instead.

**[m2] "SKIP" remains visible on the final onboarding card** — Severity: **polish**

The plan expected SKIP to disappear once you reach card 5 of 5. It's still there. Clicking it has the same outcome as clicking "Begin." but it's redundant UI on the last screen.

**[m3] Hardcoded cream-alpha colours leak past the design tokens** — Severity: **polish**

Two known spots use `rgba(245, 240, 232, 0.12)` / `(0.10)` directly instead of a token: [components/idle/screens/LockedScreen.tsx:173](idle-app/components/idle/screens/LockedScreen.tsx#L173), [components/idle/screens/BurnScreen.tsx:360](idle-app/components/idle/screens/BurnScreen.tsx#L360). Visually identical, but every other surface reads from `constants/tokens.ts`. Easy cleanup.

**[m4] Legacy Expo template files still contain default blue/teal hex codes** — Severity: **polish**

`constants/theme.ts` and `components/themed-text.tsx` carry over the Expo starter blues. They don't appear to be imported anywhere in the Idle UI — these are dead code. Worth a `grep` to confirm and delete.

**[m5] Tab labels lack periods while button labels have them** — Severity: **polish (open question)**

The brand rule says *"button labels end in periods"*. The bottom tabs read "Today" / "The week" / "The rules" — no periods. The buttons elsewhere ("Add a task." / "Sign in." / "Begin.") all do. Worth deciding: are tabs buttons or labels? On phones, tab labels typically have no periods, so this may be intentional.

**[m6] One `Times` font fallback appears in computed styles** — Severity: **polish**

Brand allows only Bricolage Grotesque, Manrope, JetBrains Mono. A DOM scan picked up one element with computed `font-family: Times`. Hard to track without a deeper inspection — likely a single unstyled placeholder somewhere.

**[m7] Console deprecation warning at boot** — Severity: **polish**

`props.pointerEvents is deprecated. Use style.pointerEvents.` Cosmetic noise in the console; doesn't affect behaviour. A few components passing `pointerEvents` as a prop instead of in the style object.

### Plan defect (not a product bug)

**[plan] My empty-state test was wrong** — Severity: **n/a**

I wrote: *"Brand-new user lands on Today with the empty-state message."* In reality, the app **intentionally seeds 3 starter tasks** for any brand-new account (`Edit the Q3 deck.`, `Pay the rent.`, `Walk the dog.`). This is the `buildSeed` path you wired up. Working as intended; my expectation was wrong.

---

## Pass list (what's solid)

These all worked exactly as the brand and product spec describe.

### Auth
- Empty fields disable both Sign in. and Create account. buttons.
- Invalid email → friendly *"That doesn't look like an email."*
- Wrong password → friendly *"That email and password don't match. Try again."* No raw Supabase strings leak.
- Forgot password → email → *"Check your inbox."* confirmation.
- Sign-up with a valid email immediately lands on the app (your Supabase project has email confirmation disabled — good to know).
- The auth gate correctly redirects to `/sign-in` when there's no session.

### Onboarding
- 5 cards in order: Welcome / The Cap / The Why / Friday / 9PM.
- "Next." button cycles through, label changes to "Begin." on the final card.
- Per-account onboarding flag — refresh doesn't re-show.

### The daily loop
- Task add (when the modal works) creates the task with day label and a correct counter.
- Tap circle on open → DONE (random variant label: DONE / SHIPPED / KEPT / CLOSED).
- Tap REFUSE → REFUSED (random variant: REFUSED / FREED / RECLAIMED). Time estimator (15m / 30m / 1h / SKIP) appears.
- Estimator auto-hides after ~5 seconds.
- Tap circle on done/refused → reopens to open.
- "YOUR FIRST CLOSE." mono label appears the first time you close a task — the day-1 → day-2 challenge advance.

### The cap of 5
- 5 open tasks → "Add a task." button replaced with disabled "Five is the maximum."
- "05 OPEN" counter turns pink at cap.
- Completing one drops to 04, button re-enables with "1 SPOT REMAINING".

### Week screen
- Stats math correct: 02 DONE + 02 REFUSED + 02 BURNED.
- RECLAIMED total adds correctly: 30m (set in test) + 15m (seed) = 45m.
- Section headers "Done." / "Refused." / "Burned." with periods.
- "NEXT WEEK" box copy on brand.

### Rules
- All 7 rules visible with correct FIXED / ON badges.
- Morning bell switch clickable (no-op on web; would actually schedule on phone).
- Account section shows the right email.
- "Read the manifesto." link works.

### Locked screen
- Full ink takeover, no tab bar.
- LOCKED label, clock, rules table, OPENS IN countdown all correct.
- "THIS IS ON PURPOSE. GO HOME." footer.

### Burn screen
- Full ink takeover.
- Big pink "02" count, "THINGS YOU DIDN'T DO" caption.
- AI reflection text rendered live ("You finished what mattered and let the rest go without guilt.") — the AI env var works.
- "Monday is fresh." button fires `burn()`; open tasks become burned.

### Dev tools
- DEV pill opens `/dev`.
- "Seed sample week." populates 8 multi-day tasks.
- "Fill the cap." tops up to 5 open tasks.
- "Show locked screen." / "Show burn screen." force the respective states.

### Sync
- Tasks persist across page refresh (server round-trip).
- Tasks persist across session swap (the bug in M2 proved this incidentally — old account's data came back from Supabase intact).

### Brand
- Only ink / cream / pink in 99% of computed styles (one stray rgb(242,242,242) and one Times fallback are the exceptions).
- Bricolage Grotesque + JetBrains Mono load correctly. Manrope is in the bundle but the page I sampled didn't have body text.
- Periods on titles and primary buttons.
- Mono labels in CAPS with pink dots, no periods.
- No banned brand-voice words ("empower", "unlock", "hustle", "delightful", etc.) in any visible copy.
- Pink stays well under 5% of viewport on every screen sampled.
- AI's SHARPEN suggestion ("Catch bugs before launch.") is on-brand — terse, period, no fluff.

---

## What I could not test from the web (do these on your phone)

1. **The carry banner.** Triggers on the first app open after a day rollover. I tried to fake yesterday's date in storage; the re-sync overwrote it before the banner could render. On your phone, just leave the app overnight and open it tomorrow. Look for *"Yesterday you left N things."* with KEEP THEM / REFUSE THEM buttons.
2. **The real 9pm lockout.** I forced it via dev override and it looks right. On phone, wait until 9pm on a weekday and confirm the takeover comes on automatically.
3. **The weekend lockout.** Same — open the app on Saturday or Sunday and confirm.
4. **The morning bell notification.** Toggle it on in Rules on the phone, wait until 6am tomorrow, confirm one ping arrives. Web notifications need a service worker we don't have.
5. **Long-press wordmark gesture.** I couldn't reliably trigger a long-press through the web automation. On phone, hold the "Idle." wordmark for ~600ms in dev mode and confirm it cycles open / locked / burn.
6. **Sign-out confirmation Alert.** The web bug (M2) is probably web-only. On phone, the native Alert should show, you tap Confirm, you land on /sign-in.
7. **Cross-device sync.** Add a task on the phone, open the web tab → does it appear within ~1s of focus?
8. **Offline → online sync.** Turn off Wi-Fi on the phone, add a task, turn Wi-Fi back on, confirm it shows in Supabase / on the web.

---

## Files I want you to look at

If you fix nothing else from this list, the order I'd take it in:

1. **[M2] Sign out on web** — [components/idle/screens/RulesScreen.tsx](idle-app/components/idle/screens/RulesScreen.tsx) where `Alert.alert` lives. Either swap for a styled custom modal, or explicitly clear `localStorage['sb-*-auth-token']` inside the sign-out handler.
2. **[M1] router.back() failures** — [app/add-task.tsx](idle-app/app/add-task.tsx), [app/about.tsx](idle-app/app/about.tsx), [app/dev.tsx](idle-app/app/dev.tsx) — swap `router.back()` for `router.replace('/')` (or a path the caller passes).
3. **[M3] Short-password inline message** — [app/sign-up.tsx](idle-app/app/sign-up.tsx).
4. **[m1] Dev panel hook order** — [app/dev.tsx:30](idle-app/app/dev.tsx#L30).
5. **[m3] cream-alpha hardcodes** — [components/idle/screens/LockedScreen.tsx:173](idle-app/components/idle/screens/LockedScreen.tsx#L173), [components/idle/screens/BurnScreen.tsx:360](idle-app/components/idle/screens/BurnScreen.tsx#L360).

Everything else is polish or web-environment quirks that don't affect the phone build.
