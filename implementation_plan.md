# Flight Core Memory Trainer - Audit & Enhancement Plan

Following a comprehensive audit of the entire Flight Core memory training codebase, we have identified several outstanding opportunities to elevate the user experience, fix minor logic mismatches, and make the application look and feel exceptionally premium and state-of-the-art.

This document details the planned changes, layout updates, and verification processes.

---

## User Review Required

> [!IMPORTANT]
> All changes will remain 100% offline-first, dependency-free, and written in native vanilla HTML5, CSS3, and ES6 Javascript. They will be written directly inside the `D:\Documents\Personal_Project\Google_AG\FlightCore` project directory.
> No bundlers, compilers, or heavy libraries are introduced, maintaining immediate deployability to GitHub Pages and Cloudflare Pages.

### Highlighted Enhancements:
1. **Real SVG Trend Sparklines**: Instead of a plain text list under the "Session History Trend" card, we will generate a high-fidelity SVG sparkline area chart.
   - **Empty State**: Renders a beautiful dashed mockup grid and bar structure with a centered glassmorphic banner: `NO RECORDED RUNS - Complete a session to plot telemetry trends`.
   - **Populated State**: Draws a fluid neon gradient area chart charting accuracy percentages over the last 6 sessions, complete with pinpoint dots and readable indicators.
2. **True Max Streak Tracking**: The home dashboard card labeled "Max Streak" currently shows the max level achieved (e.g. `LVL 03`). We will track the actual maximum recall streak achieved *during* a session (between 0 and 8 consecutive correct submissions), store it in `localStorage` records, and display the true highest streak achieved on the home screen.
3. **Pro-Terminal Keyboard Navigation**: Enable full keyboard playability for PC/Desktop training.
   - Prepend subtle numeric shortcuts (e.g. `[1]`, `[2]`, `[3]`) to all option panels, checklists, and blanked gauges on the test screen.
   - Enable key listeners (`1`-`9`, `Backspace`, `Enter`, `Escape`) to seamlessly select items, enter values, and advance/reset choices in sub-20ms.
4. **Organic Audio Synthesis & Mute Toggle**: Add a speaker sound toggle button to the top header. Implement low-latency Web Audio API synthesizers for organic key clicks, rewarding chimes, and warning alerts, fully stored in browser preferences.

---

## Proposed Changes

### Component 1: Structural Additions (`index.html`)

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
- Add the sound toggle button in the header right next to the theme selector:
  ```html
  <button class="theme-toggle-btn" id="btn-sound-toggle" title="Toggle Sound">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" id="sound-icon">
      <!-- Injected via JS -->
    </svg>
  </button>
  ```
- Review and refine the grid structures to support desktop and mobile layouts seamlessly.

---

### Component 2: CSS Stylesheets (`styles.css`)

#### [MODIFY] [styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)
- Implement class styles for shortcuts, sparklines, and theme contrast fixes:
  - `.shortcut-badge`: Subtle inline keypad-like indicators for keyboard hotkeys.
  - `.gauge-shortcut-badge`: Positioned in the upper corner of instruments cards.
  - Sparkline paths and gradient settings for SVG elements.
- Fine-tune color variable contrasts on Apple Light, OLED Dark, Monochrome, Nordic Sage, and Warm Sand themes. Ensure AAA contrast targets on header metadata and sidebar telemetry blocks.

---

### Component 3: Game Core & Keyboard Engine (`app.js`)

#### [MODIFY] [app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)
- **Max Streak Tracking**:
  - Add `let sessionMaxStreak = 0;` to `initSession()`.
  - Update `sessionMaxStreak = Math.max(sessionMaxStreak, streak);` inside `submitTelemetry()`.
  - Write `maxStreak` to `sessionRecord` and save to `localStorage`.
  - Update `loadHomeStats()` to extract `maxStreak` from records and display it on `stat-max-streak` card.
- **Audio Synthesizer Engine**:
  - Connect a lightweight Web Audio API synthesizer that fires for keypress, perfect response, and wrong responses.
  - Manage mute state using a global preference toggle synced with `localStorage`.
- **SVG Sparkline Chart Generator**:
  - Rewrite `renderHistoryChart()`:
    - If `globalHistory.length === 0`: render a beautiful glassmorphic mockup bar chart with an overlay banner.
    - If `globalHistory` is populated: render a dynamic SVG chart charting progress metrics for the last 6 sessions.
- **Keyboard Shortcut Processor**:
  - Add index badges to options during render loops: Checklist pool items, Instrument dials, ATC fields and text option buttons, Fault pool items.
  - Bind global keyboard event listeners:
    - If a number key `1` to `9` is pressed on the test screen, trigger click on the corresponding option button.
    - Focus and type values into gauges via numeric keypads.
    - support `Backspace` to undo choices in Checklists and Fault modules.

---

## Verification Plan

### Automated & Manual Verification
We will manually verify the application under standard modern web specifications:
1. **Keyboard-Only Challenge Run**: Conduct a full 8-round training session exclusively using the physical keyboard to check navigation flow, focus targets, and validation correctness.
2. **Chart Layout Rendering Checks**:
   - Reset local storage to inspect the high-fidelity dummy chart layout placeholder.
   - Complete 3 sessions to inspect the dynamic SVG line path rendering and coordinate scaling.
3. **Sound Toggle Auditing**: Verify that sound defaults to muted, toggles on to play low-latency organic tones, and successfully persists across page reloads.
4. **Theme Contrast Auditing**: Ensure legibility and AA/AAA compliance across all five themes.
