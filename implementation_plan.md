# FlightCore Professional Layout, UI De-Vibing & Bug Fix Plan

This plan addresses layout responsiveness, text truncation, UI aesthetic de-vibing (removing neon glows in favor of a clean, plain, professional UI), resolving the start button runtime exception, removing the `radar` module, and auditing every game component layout (including `balance`).

---

## User Review Required

> [!IMPORTANT]
> **Fluid Full-Screen & Plain Professional Aesthetics**:
> 1. `.terminal-frame` will expand fluidly to fill 100% of the viewport width and height without rigid pixel caps.
> 2. All text truncation (`text-overflow: ellipsis`) on module selection cards will be removed; cards will wrap text cleanly and maintain equal symmetrical sizing.
> 3. All neon glows (`box-shadow: 0 0 12px var(--accent-blue-glow)`) and glowing dots will be replaced with clean, plain, solid status borders and subtle muted indicators.
> 4. The `radar` module will be completely purged from `core.js`, `app.js`, `index.html`, `styles.css`, and `tests.js`.
> 5. The start button exception (`TypeError: Cannot read properties of null (reading 'pitch')`) will be fixed with robust generator wiring and fallback guards in `app.js`.
> 6. All game module boards (`balance`, `checklist`, `instruments`, `atc`, `fault`, `wire`, `clearance`, `target`, `attitude`, `horizon`, `fuel`, `intercept`) will be audited for symmetrical, clean visual alignment.

---

## Proposed Changes

### Pure Engine & Metadata (`core.js`)

#### [MODIFY] [core.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/core.js)
* **Remove Radar Module**: Purge `"radar"` from `CHALLENGE_MODULE_KEYS` and `MODULE_METADATA`. Remove `generateRadar` and `radarAccuracy`.
* **Safe State Guard**: Ensure `generateAttitude` and `generateHorizon` always return non-null, fully formed state objects even under edge-case level inputs.

---

### Controller & Module Handlers (`app.js`)

#### [MODIFY] [app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)
* **Fix Start Exception Bug**:
  * In `startRound()`, ensure EVERY module key (`checklist`, `instruments`, `atc`, `fault`, `balance`, `wire`, `clearance`, `target`, `attitude`, `intercept`, `fuel`, `beacon`, `horizon`) has an explicit generator branch so `currentRndExpected` is NEVER null.
  * In `setupStudyScreen()`, add a defensive fallback check: if `currentRndExpected` is ever invalid, regenerate module data before invoking renderers (`renderAttitudeBoard`, `renderHorizonBoard`, etc.).
* **Remove Radar Handlers**:
  * Remove `renderRadarBoard`, `renderRadarTestLayout`, and `radar` evaluation branches in `submitTelemetry()`.
* **Audit & Refine Game Layout Renderers**:
  * `renderBalanceBoard`: Clean up scale alignment, equal spacing between rule panel and question panel, centered equality signs (`=`), and crisp shape token stacks.
  * Audit all remaining renderers (`renderChecklistTestLayout`, `renderInstrumentsTestLayout`, `renderATCTestLayout`, `renderFaultTestLayout`, `renderWireBoard`, `renderClearanceChoices`, `renderTargetBoard`, `renderAttitudeBoard`, `renderHorizonBoard`, `renderFuelBoard`, `renderInterceptBoard`).

---

### UI Styling & Layout (`styles.css`)

#### [MODIFY] [styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)
* **Fluid Full-Screen Layout**:
  * Modify `.terminal-frame` to use `width: 100%; height: 100vh; max-width: 100%;` with smooth internal flex/grid layout so the app fills the browser window naturally.
* **Text Truncation & Equal Card Sizing**:
  * Update `.module-select-card`, `.module-family-list`, `.module-select-text` so text is never truncated (`white-space: normal; text-overflow: clip;`).
  * Ensure module cards have equal min-height, symmetrical padding, and consistent column gaps.
* **De-Vibe Aesthetic Polish**:
  * Remove all heavy neon glow shadows (`box-shadow: 0 0 12px var(--accent-blue-glow)`).
  * Replace glowing active dots with crisp 1px solid active borders and clean subtle status indicators.
  * Clean up `.balance-board`, `.balance-panel`, `.balance-scale`, `.unknown-token` styling for clean, professional mathematical alignment.

---

### Markup Structure (`index.html`)

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
* Remove `#select-radar`, `#briefing-radar`, and `#test-radar` elements.
* Adjust grid containers to support fluid full-screen responsive rendering.

---

### Automated Tests (`tests.js`)

#### [MODIFY] [tests.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/tests.js)
* Remove `generateRadar` unit tests.
* Update `sessionCompetencies` test expectation to match 13 module keys.
* Add unit test verifying `startRound` module data generation for `attitude` and `horizon`.

---

## Verification Plan

### Automated Tests
* Execute unit test suite:
  ```powershell
  node tests.js
  ```
* Execute syntax validation:
  ```powershell
  node --check core.js
  node --check app.js
  node --check sw.js
  ```

### Manual & UI Verification
* Launch the app in a browser window to verify fluid full-screen responsiveness.
* Inspect home screen module cards across widescreen desktop, tablet, and mobile viewports to confirm zero text truncation and equal card sizing.
* Start a session selecting `Horizon Scan`, `Attitude`, `Balance Bender`, and all other modules to verify no JavaScript errors occur.
* Verify `radar` module is completely removed.
* Verify plain, professional, clean UI aesthetics without neon glow artifacts across all 7 color themes.
