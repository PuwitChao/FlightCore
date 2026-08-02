# FlightCore Module Expansion & Flow-State Sprint Tasklist

## Sprint 10: 4 New Cognitive Modules, 5-Axis SVG Skill Radar & Dynamic Flow-State Engine

### Phase 1: Pure Engine Logic & Unit Tests (`core.js` & `tests.js`)
- [x] `[Subtask 10.1]` Register new module metadata (`fuel`, `beacon`, `radar`, `horizon`) and add dynamic flow-state pressure calculation `computeFlowStateParams` in `core.js`.
- [x] `[Subtask 10.2]` Implement pure logic generator and accuracy validator for `fuel` (Fuel Flow & Pump Balancer) in `core.js`.
- [x] `[Subtask 10.3]` Implement pure logic generator and accuracy validator for `beacon` (Beacon Bearing / RBI) in `core.js`.
- [x] `[Subtask 10.4]` Implement pure logic generator and accuracy validator for `radar` (2D Radar Separation) in `core.js`.
- [x] `[Subtask 10.5]` Implement pure logic generator and accuracy validator for `horizon` (Horizon Pitch & Roll Scan) in `core.js`.
- [x] `[Subtask 10.6]` Implement 5-axis SVG Skill Radar Chart generator `generateSkillRadarSVG` in `core.js`.
- [x] `[Subtask 10.7]` Add unit tests in `tests.js` for all 4 new module engines, flow-state pressure scaling, and skill radar chart math. Verify all assertions pass.

### Phase 2: UI Styling & Markup (`styles.css` & `index.html`)
- [x] `[Subtask 10.8]` Add CSS primitives and responsive theme styling for `fuel`, `beacon`, `radar`, `horizon`, and 5-axis SVG radar chart in `styles.css`.
- [x] `[Subtask 10.9]` Add HTML module container elements and debrief radar chart section in `index.html`.

### Phase 3: Controller Glue & Module Renderers (`app.js`)
- [x] `[Subtask 10.10]` Implement DOM renderers and touch/keyboard input handlers for `fuel`, `beacon`, `radar`, and `horizon` in `app.js`.
- [x] `[Subtask 10.11]` Wire dynamic flow-state timer scaling into `startModuleRound()` and 5-axis SVG Skill Radar Chart into `showDebriefScreen()` in `app.js`.

### Phase 4: Automated Verification & Documentation
- [x] `[Subtask 10.12]` Execute automated tests (`node tests.js`) and syntax checks (`node --check app.js`, `node --check core.js`, `node --check sw.js`).
- [x] `[Subtask 10.13]` Update project documentation files (`README.md`, `HANDOFF.md`, `lessons_learned.md`, `walkthrough.md`).