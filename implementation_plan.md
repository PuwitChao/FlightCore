# Widescreen Multi-Device UI Support & Desktop Dashboard Enhancement

This plan proposes an elegant solution to improve playability and visual balance on PC/desktop screens. We will transition the game from a cramped mobile emulator style to a premium, multi-device dashboard that adapts dynamically based on screen width and active gameplay states.

---

## User Review Required

> [!IMPORTANT]
> - **Three-Column Gameplay Layout**: On widescreen PC/desktop layouts (width >= 1024px), the telemetry sidebar containing live score, streak, round, and level stats will remain visible at all times during active gameplay. Instead of the keypad covering these stats, the layout will dynamically slide open a middle column for the keypad/input panels, mimicking an authentic multi-panel aviation cockpit.
> - **Redundancy Cleanup**: To avoid visual clutter, redundant stats summaries and historical charts in the left viewport column will be hidden on PC/desktop, since the sidebar already displays them. The sidebar will be expanded to display all 5 player statistics (High Score, Avg Grade, Sessions, Max Streak, and Day Streak).

---

## Open Questions

None. The proposed styling changes are fully backward-compatible with the mobile viewport and preserve existing game rules and event-handling mechanisms.

---

## Proposed Changes

### Component 1: HTML Structure Adjustments

We will adjust `index.html` to group the home setup cards, expand the sidebar stats, and set up grid placement tokens.

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
- Wrap the four challenge configuration cards (Select Challenge Modules, Session Length, Difficulty Preset, and Study Timer) inside a container `<div class="home-config-grid">` so they can be styled as a 2x2 grid on PC screens.
- Expand the sidebar `Telemetry Stats` card (`#sidebar-static-panel`) to display all 5 metrics in a clean grid, adding `#side-stat-sessions`, `#side-stat-max-streak`, and `#side-stat-daily-streak`.
- Assign clear grid areas for layout mapping:
  - Add `id="custom-keypad"` and `id="custom-text-keypad"` with responsive grid placements.

---

### Component 2: Responsive Stylesheet Overhaul

We will update the desktop media query in `styles.css` to introduce the 3-column cockpit layout and clean up home screen scrollbars.

#### [MODIFY] [styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)
- **Viewport Config Grid**: Style `.home-config-grid` to stack on mobile/tablet but display as `display: grid; grid-template-columns: 1fr 1fr; gap: 16px;` on screens >= 1024px.
- **De-duplication**: On screens >= 1024px, apply `display: none` to the duplicate `.home-stats-summary` and `History` card inside `#screen-home` to prevent visual redundancy.
- **Sidebar Grid Stats**: Style `.home-stats-summary` within the sidebar as a 2-column grid to look cohesive.
- **Dynamic 3-Column Layout**:
  - Update `@media (min-width: 1024px)` to expand the terminal frame size to `max-width: 1100px` and taller height.
  - Use the CSS `:has()` parent selector: if either virtual keypad is visible (`display: block`), expand `.terminal-frame` max-width to `1280px` and change columns to `1.3fr 320px 0.8fr` with areas `"viewport keypad sidebar"`.
  - This keeps the sidebar visible on the right while displaying the active keypad in the middle.

---

### Component 3: Telemetry Synchronization

We will update `app.js` to ensure the new sidebar stats are synchronized with the user's historical profile data.

#### [MODIFY] [app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)
- Update `updateHomeStats()` to set `textContent` for the new sidebar indicators:
  - `#side-stat-sessions`
  - `#side-stat-max-streak`
  - `#side-stat-daily-streak`
- Make sure they are reset to `0` in the `else` block if profile history is purged.

---

## Verification Plan

### Automated Tests
- Run `node tests.js` to ensure the core game engine assertions (69/69) remain 100% green.
- Validate JavaScript syntax health:
  ```powershell
  node --check app.js
  ```

### Manual Verification
- **Mobile Check**: Shrink the browser window below 680px and verify the mobile layout is unchanged (thin column, keypad is at the bottom, stats are in the scrollable view).
- **Tablet Check**: Resize between 680px and 1023px, verifying the 2-column layout is preserved and keypad overlays the sidebar.
- **PC Widescreen Check**: Resize to >= 1024px.
  - On the Home Screen: Verify stats are only in the sidebar, and setup cards form a neat 2x2 grid with no scrollbars.
  - During Active Session: Start a session, advance to the test screen, click an input, and verify the keypad slides open in a middle column while the right sidebar remains fully visible showing live score/streak stats.
