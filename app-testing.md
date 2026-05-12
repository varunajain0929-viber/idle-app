# Idle — testing guide

Everything we built for testing the app, in one place. Written so you can pick it up cold.

---

## Quick start

**On a desktop browser (fastest for clicking through screens):**

```
cd idle-app
npm run web
```

Opens a tab at `http://localhost:8081`. Edit a file → the tab reloads on its own.

**On your phone (the only way to test the real morning bell, real haptics, real long-press):**

```
cd idle-app
npm start
```

Scan the QR with the iPhone camera. Expo Go opens. To reload after a code change: shake the phone, tap **Reload**.

---

## The dev pill (the testing menu)

Look at the **top-right corner of the app**. While in development, the small "LESS. DONE." line is replaced by a tiny pink **DEV** pill with a thin pink border.

- It only shows while developing. It vanishes in a real App Store build.
- Tap it → a panel slides up with eight buttons. That's your testing menu.

---

## What each button in the dev panel does

### Sample data

| Button | What it does |
|---|---|
| **Seed sample week.** | Wipes the list and drops in eight realistic tasks spread Mon–Fri. A mix of open, done, refused, and burned. Best for testing the Week screen's dot-grid chart. |
| **Fill the cap.** | Tops you up to 5 open tasks (it shows how many you have now). Useful for testing the "at cap" behavior, the burn animation, and refusal flows. |

### State preview

These force a screen so you can look at it without changing the system clock. Same effect as the long-press gesture (below), but easier on web.

| Button | What it does |
|---|---|
| **Show locked screen.** | Force the 9pm takeover. Dark screen, "The app is closed." |
| **Show burn screen.** | Force the Friday ceremony. Reads your current open tasks and animates the pink strikes across them. |
| **Back to normal.** | Returns to "auto" — the real clock decides what to show. |

### Destructive

These actually change your data. Use carefully.

| Button | What it does |
|---|---|
| **Burn now.** | Fires the real `burn()` function. Every open task becomes burned. After this, switch to the Week tab to see them in the Burned section. |
| **Reset (full first-launch).** | Wipes everything and reloads. After onboarding, the three welcome example tasks appear ("Write the founder letter", "Walk for forty minutes", "Delete this example"). Matches what a brand-new App Store install sees. **Needs a double-tap to confirm.** |
| **Reset (empty list).** | Same wipe, but skips the welcome demo. After onboarding you land on a completely empty list. Best for testing the empty state and the 5-cap. **Needs a double-tap to confirm.** |

**The double-tap thing:** first tap turns the row pink and the text changes to "Tap again to confirm…". Second tap within 3 seconds fires it. Anything else cancels.

---

## The DEV · EXIT pill (escape hatch on full-screen takeovers)

When you force the **Locked screen** or **Burn screen** via the dev panel, a small pink **DEV · EXIT** pill appears in the top-right corner of that screen.

One tap on it → you pop back to the normal app.

Without this, the only way out of the Locked screen on web was a long-press gesture that often didn't register. Now it's a single click.

---

## The old hidden gesture (still works)

**Long-press the "Idle." wordmark** in the top-left of the BrandBar (~600ms). Each long-press cycles through:

`auto → open → locked → burn → auto`

This was the original dev tool. The new DEV pill does the same things and more, but the gesture is still there. On a phone it's quick. On a browser it's flaky — use the pill instead.

---

## Common testing recipes

### "Does the Week screen look right with realistic data?"
1. Tap **DEV** → **Seed sample week.**
2. Close the panel → tap the **Week** tab.
3. You should see: variety in the dot-grid chart, Done section with two items, Refused section with two items, Burned section with two items.

### "Does the Friday Burn ceremony work?"
1. Tap **DEV** → **Seed sample week.** (or **Fill the cap.**)
2. Tap **DEV** → **Show burn screen.**
3. Watch the pink strikes draw left-to-right, staggered.
4. Either tap **DEV · EXIT** to leave without burning, or tap **Monday is fresh.** to actually burn the open tasks and return.

### "What does the empty Today screen look like?"
1. Tap **DEV** → **Reset (empty list).** twice.
2. Page through onboarding (or tap SKIP).
3. You land on the Today screen with zero tasks.

### "Does the 5-cap actually block a 6th task?"
1. Tap **DEV** → **Fill the cap.**
2. Tap **Add a task.** at the bottom.
3. The form should refuse you with a "Five is the maximum." message.

### "Does the morning bell schedule properly?"
- Only testable on a real phone (web can't schedule local notifications).
- Open Expo Go on the phone → Rules tab → flip the **Morning bell** toggle on. iOS asks for permission. Allow it.
- To see the notification fire today without waiting until 6am, ask me to temporarily change the trigger to "in 60 seconds" — I'll change it, you reload, see the notification, then I'll change it back.

### "Does the 9pm Lockout transition smoothly?"
1. Tap **DEV** → **Show locked screen.** (the dev override route — fastest).
2. Or wait until 9pm local time on a weekday with no override active.
3. Tap **DEV · EXIT** in the corner to leave.

---

## Gotchas worth remembering

- **The DEV pill is invisible in production builds.** If you ever build for the App Store and don't see it, that's correct.
- **"Reset" reloads the whole app.** Any unsaved state is gone. That's the point.
- **Long-press doesn't work well in browsers.** Mouse events ≠ touch events. Use the DEV pill on web.
- **Haptics are silent on web.** A phone buzzes when you tap; a browser doesn't. Not a bug.
- **The "fill the cap" button is additive.** If you already have 3 open tasks it adds 2 more, not 5. If you're already at 5 it warns you and does nothing.

---

## Where the code lives (if anyone ever asks)

- `app/dev.tsx` — the modal panel itself.
- `lib/devSeed.ts` — the sample tasks for "Seed sample week" and "Fill the cap".
- `store/tasks.tsx` — has two dev-only methods (`devReplaceAll`, `devClearStorage`).
- `components/idle/BrandBar.tsx` — the DEV pill rendering.
- `components/idle/screens/LockedScreen.tsx` and `BurnScreen.tsx` — the DEV · EXIT pill.

All of it is wrapped in `__DEV__` checks, so it cannot ship to production.
