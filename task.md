# FlightCore Professional UI, Layout & Bug Fix Tasklist

## Sprint 11: Fluid Full-Screen Layout, Plain Professional UI, Bug Fixes & Radar Removal

### Phase 1: Pure Engine Cleanup & Bug Prevention (`core.js` & `tests.js`)
- [x] `[Subtask 11.1]` Purge `radar` from `CHALLENGE_MODULE_KEYS` and `MODULE_METADATA`, and remove `generateRadar` and `radarAccuracy` in `core.js`.
- [x] `[Subtask 11.2]` Update `tests.js` engine test suite (remove radar tests, update module key expectations, add attitude/horizon state validation).

### Phase 2: Markup Cleanup & Container Adjustment (`index.html`)
- [x] `[Subtask 11.3]` Remove `#select-radar`, `#briefing-radar`, and `#test-radar` elements from `index.html`.

### Phase 3: Fluid Layout & Plain Professional UI Styling (`styles.css`)
- [x] `[Subtask 11.4]` Update `.terminal-frame` and container classes in `styles.css` for fluid 100% full-screen layout.
- [x] `[Subtask 11.5]` Remove text truncation (`text-overflow: ellipsis`) and enforce equal card sizing on `.module-select-card`, `.module-family-list`, `.module-select-text`.
- [x] `[Subtask 11.6]` Strip out all neon glow shadows (`box-shadow: 0 0 12px var(--accent-blue-glow)`) and replace glowing dots with clean, plain, solid active borders.
- [x] `[Subtask 11.7]` Audit and refine CSS styling for `balance` (`.balance-board`, `.balance-scale`, `.balance-panel`, `.unknown-token`) for symmetrical mathematical alignment.

### Phase 4: Controller Glue, Exception Fix & Module Audit (`app.js`)
- [x] `[Subtask 11.8]` Fix start button exception in `app.js` by adding explicit generator branches for `attitude` and `intercept` in `startRound()`, with null-check fallback guards in `setupStudyScreen()`.
- [x] `[Subtask 11.9]` Remove `radar` rendering and evaluation handlers from `app.js`.
- [x] `[Subtask 11.10]` Audit all game component renderers (`balance`, `checklist`, `instruments`, `atc`, `fault`, `wire`, `clearance`, `target`, `attitude`, `horizon`, `fuel`, `intercept`) to ensure clean rendering and zero visual defects.

### Phase 5: Verification & Documentation
- [x] `[Subtask 11.11]` Execute automated test suite (`node tests.js`) and syntax checks (`node --check app.js`, `node --check core.js`, `node --check sw.js`).
- [x] `[Subtask 11.12]` Update project documentation files (`README.md`, `HANDOFF.md`, `lessons_learned.md`, `walkthrough.md`).