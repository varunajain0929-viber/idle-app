# Idle.

A list that fights you back.

Five tasks. No more. Every task needs a reason. The app shuts off at 9pm and burns everything unfinished on Friday at 7pm. No notification spam. No streaks. No scores.

Productivity for people who hate productivity.

---

## The rules

- **Five is the cap.** The list refuses a sixth task.
- **Every task needs a 'why'.** No reason, no add.
- **9pm lockout.** Idle refuses to open after 9pm on weekdays and all day on weekends.
- **Friday burns.** Every Friday at 7pm local time, every unfinished task is permanently deleted. No carry-over. No archive. Monday starts empty.
- **Refusal counts.** A refused task is celebrated equally. The list shrinks either way.
- **No notifications by default.** One optional morning bell ("Today is fresh.") that stays off until you turn it on.
- **No streaks. No scores.** Nothing to gamify. You will not be ranked.

The full manifesto lives inside the app at [app/about.tsx](app/about.tsx).

---

## Tech

- Expo SDK 54 + React Native 0.81 + TypeScript
- `expo-router` (file-based routing), but with a single state-driven gate at `app/index.tsx`
- AsyncStorage for persistence (everything stays on-device — no backend, no tracking, no ads)
- Bricolage Grotesque + Manrope + JetBrains Mono — three fonts, no more
- Three colors: ink `#1A1A1A`, cream `#F5F0E8`, pink `#FF3D6E`

---

## Run locally

```bash
npm install
npm start              # interactive QR — scan with Expo Go on your phone
npm run web            # web build at http://localhost:8081
npm run ios            # iOS simulator (Xcode required)
npm run android        # Android emulator (Android Studio required)
npx tsc --noEmit       # type check
```

---

## Testing

There's a hidden **DEV** panel visible only in development builds — small pink pill top-right of the BrandBar. Tap it to seed sample data across multiple days, force the locked/burn screens, trigger the Friday Burn on demand, or reset everything back to first-launch.

Full guide: [app-testing.md](app-testing.md).

---

## Status

Pre-launch. Work in progress.

---

## License

All rights reserved. © Varuna Jain.
