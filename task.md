# Flight Core - Silent Immersive Training & Pilot Logbook Sprint Checklist

## Phase 1: Planning & Setup
- `[x]` Propose sprint plan to user and get approval
- `[x]` Establish tasks in `task.md`
- `[x]` Handle audio removal constraint (entirely purge sound engines and toggles)

## Phase 2: Visual Linear Gauge Indicators
- `[ ]` Add linear range tracking progress bar under the gauges in `styles.css`
- `[ ]` Calculate percentage value of gauge inside `createGaugeHTML()` and position the glowing sapphire indicator dynamically
- `[ ]` Add warning states (amber/rose) and hide indicators for blanked gauges

## Phase 3: Pilot Logbook & Competency Analytics Tab
- `[ ]` Add Cupertino segment control switch in `index.html` to toggle Deck/Logbook
- `[ ]` Style the segment controls, competency meters, and log table rows in `styles.css`
- `[ ]` Implement matrix stats and cognitive blindspot advice calculations in `app.js`
- `[ ]` Test log entries recording and backwards-compatibility

## Phase 4: Audio Purge & Silence Implementation
- `[ ]` Remove `#btn-sound-toggle` button from header in `index.html`
- `[ ]` Delete sound-related oscillators, engine hums, Speech Synthesis, and local sound preferences in `app.js`
- `[ ]` Replace `playSound()` with a robust no-op `function playSound() {}` in `app.js` to prevent any runtime exceptions
- `[ ]` Verify application is completely silent and clean

## Phase 5: Verification & Git Integration
- `[ ]` Commit changes on D drive and pull to C workspace
- `[ ]` Run manual verification checks for visual gauges and logbook analytics
- `[ ]` Update `walkthrough.md` with achievements and details
