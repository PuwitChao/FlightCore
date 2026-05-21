# Flight Core - UI & User Experience Enhancements Plan

We will perform a full UI and User Experience (UX) audit and implement production-ready best practices to elevate **Flight Core** into a highly polished, professional cognitive trainer suitable for the general public.

---

## Proposed Changes

### Component 1: Structural UI Framework (`index.html`)

We will add new glassmorphic modal overlays, controls, and helpers to support modern UX paradigms.

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
- **Header Enhancements**:
  - Add a help toggle button `<button class="theme-toggle-btn" id="btn-help-toggle" title="Keyboard & Gesture Help">?</button>` in the top-right header next to the sound toggle.
- **Study Briefing Panel**:
  - Insert a glassmorphic pause button next to the study progress bar.
  - Insert a `<div class="briefing-paused-overlay" id="paused-overlay" style="display: none;">` to cover the briefing cards when the timer is paused, showing a subtle scanline blur and a glowing `BRIEFING PAUSED` indicator.
- **Upgrade Abort Overlay**:
  - Replace the binary two-button confirmation in `#abort-confirm-overlay` with three clear, structured, glassmorphic option blocks:
    - `[RESET & RESTART SESSION]` (Primary accent, starts current session over at Round 1)
    - `[ABORT & EXIT TO HOME]` (Danger accent, returns to main home screen)
    - `[RESUME TRAINING]` (Neutral secondary, closes the overlay)
- **Theme and Settings Overlay**:
  - Add a secondary option block inside the theme overlay card: `<button class="theme-opt-btn btn-danger-text" id="btn-clear-history">Purge Telemetry Stats & History</button>` to allow users to reset their local training history.
- **Onboarding Modal**:
  - Insert a `<div class="theme-selector-overlay" id="help-modal-overlay" style="display: none;">` that displays a clean, responsive terminal keymap cheatsheet explaining PC keyboard shortcuts and touch controls.

---

### Component 2: Sleek Animations & Accessiblity (`styles.css`)

We will expand our styling system to support modern glass overlays, accessibility contrasts, and celebratory particle animations.

#### [MODIFY] [styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)
- **Glassmorphic Pause State**:
  - Define `.briefing-paused-overlay` using a heavy `-webkit-backdrop-filter: blur(12px) saturate(140%)` and a frosted slate or stone background, coupled with a pulsing amber keyframe glow.
- **Theme purger styling**:
  - Add `.btn-danger-text` containing AAA contrast amber or red text layers that transition gracefully.
- **Celebratory Confetti Particles**:
  - Add pure CSS confetti particle systems (`.confetti-container` and `.confetti-piece`).
  - Create a CSS animation keyframe `@keyframes confetti-fall` that uses dynamic horizontal swaying (using sine-wave translations) and rotating down-screen descents to wow the user on high scores.
- **Help Modal Layout**:
  - Define grid arrangements for keyboard shortcut representations (`.help-key-row` and `.kbd-key`).

---

### Component 3: Game States, Timers & Telemetry (`app.js`)

We will update the game loop controllers to support timer pausing, session restarts, local database purges, and victory visual queues.

#### [MODIFY] [app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)
- **Help Modal Controls**:
  - Bind click listeners for `#btn-help-toggle` to open and close the keyboard onboarding sheet.
- **Briefing Timer Pause States**:
  - Bind the `Space` bar and briefing pause clicks to toggle `isTimerPaused`.
  - Pause the study countdown interval, blur the content behind `#paused-overlay`, and show a pulsing state.
- **Expanded Abort Commands**:
  - Hook `#btn-abort-restart` to immediately execute `initSession()` (resetting rounds to 1, score to 0, and streaks to 0) without returning to home.
- **Purge Telemetry History**:
  - Bind `#btn-clear-history` to prompt a confirmation dialogue. If approved, empty `globalHistory`, wipe `flightcore_history` from `localStorage`, immediately update home screen/sidebar sparkline metrics, and play a down-pitch warning sound.
- **Victory Confetti Launcher**:
  - Create a dynamic `launchConfetti()` generator in JS that injects 50+ CSS-animated confetti pieces of varying hues, dimensions, and delay profiles inside a transient container over the debriefing screen when scoring a `PROFICIENT` status.

---

## Verification Plan

### Automated & Manual Verification
1. **Pause Test**: Engage a training session and press `Space` or the pause button during the briefing screen. Verify that the study card blurs, the timer pauses, and no text can be read.
2. **Help/Shortcut Test**: Trigger the `[?]` help menu from both the home screen and during gameplay. Verify keyboard bindings (`1` to `9`, `Backspace`, `Enter`, `Escape`) are clearly shown.
3. **Session Reset Test**: Press `Escape` or the abort button, click `RESET & RESTART SESSION`, and verify the session restarts on Round 1 instantly.
4. **Stats Purge Test**: Select the theme menu, click `Purge Telemetry`, confirm, and verify stats cards reset to `0000`, the chart shows `NO RECENT SESSION DATA`, and `localStorage` is cleared.
5. **Confetti & Victory Test**: Achieve a score $\ge 90\%$ accuracy and verify a gorgeous pure CSS confetti animation cascades down. Check contrast across Nordic Sage, Apple Light, OLED Dark, Monochrome, and Warm Sand themes.
