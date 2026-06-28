# Flight Core Project-Scoped Rules

## Workspace & Development Directory Restriction
- ALL development, code changes, file creations, command executions, and git operations must be done strictly within the primary project directory on the D: drive: `D:\Documents\Personal_Project\Google_AG\FlightCore`.
- Do NOT perform any file edits or command executions in the temporary C: drive workspace folder (`C:\Users\khune\Documents\antigravity\delightful-bose`). Treat the C: drive workspace as read-only.
- All implementation plans (`implementation_plan.md`), task lists (`task.md`), and walkthroughs (`walkthrough.md`) must also be maintained strictly within the D: drive project root.

## Architecture Co-Development & Modular Separation
- **Logic Isolation**: All pure, side-effect-free game mechanics (RNG pool draws, difficulty calculations, per-module scoring, calendar grids, telemetry data formatting) must reside inside `core.js` (`window.FlightCore`). 
- **DOM Glue**: Keep all UI state, DOM event listeners, drawers, modals, sound synthesizers, and keypads inside `app.js`. `app.js` must delegate game logic to the `FlightCore` global namespace.

## Verification & Automated Testing
- **Run Engine Tests**: Before committing any changes, you MUST run the automated test suite locally by executing:
  ```powershell
  node tests.js
  ```
  Ensure all assertions (currently 69/69) are 100% green. If any tests fail, run `debug_expert` to resolve them.
- **Syntax validation**: Run syntax lint checks on core JavaScript files before committing:
  ```powershell
  node --check app.js
  ```
