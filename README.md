# Flight Core - Cockpit Challenge Game

Flight Core is a zero-build, offline-first browser game built around cockpit-inspired memory, visual scanning, logic, and multitask challenges. It is designed for quick sessions on mobile or desktop, with a dark glass UI, tactile controls, local history, skill-family debriefs, and a grouped aptitude module catalog.

Flight Core is for entertainment only. It is not real aviation instruction, not regulatory study material, and not for real-world aviation use.

## Current App

- Static PWA: no build step, no npm install, no backend required.
- Grouped module catalog across 5 skill families: Logical, Spatial, Visual, Memory, and Advanced.
- Playable challenge modules: Checklist, Instruments, ATC, Fault, Balance Bender, Wire Trace, Clearance Recall, Target Scan, Attitude Vector, and Aero Intercept.
- Pilot Ranks & Achievements: Progression system from Student Pilot to Test Pilot, with 6 unlockable achievement badges.
- Pro Flight Pass: Optional static supporter key (`PRO-FLIGHT-PASS`) unlocking Vintage Amber Vector and Stealth AMOLED themes, plus CSV logbook export.
- Practice and Mock Run shell: Practice gives longer study timing; Mock Run keeps standard pressure.
- Dynamic difficulty: level increases with correct streaks.
- Module rotation: avoids playing the same module three times in a row when possible.
- Local history: scores, accuracy, streaks, module trends, skill-family trends, and recent run history stay in localStorage.
- Responsive layout: mobile, tablet, and widescreen desktop cockpit layouts.

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static file server.

```powershell
node tests.js
node --check app.js
```

The test suite exercises the pure engine in `core.js` and currently runs without external dependencies.

## Project Files

- `index.html` - App markup, screens, modals, sidebars, and keypad panels.
- `styles.css` - Theme tokens, responsive layout, animation, accessibility affordances, and aptitude board primitives.
- `core.js` - Pure game engine helpers: generation, scoring, streaks, summaries, skill-family metadata, and safe parsing.
- `app.js` - DOM controller, session flow, localStorage persistence, telemetry stub, module renderers, and UI events.
- `sw.js` - Offline cache for local static assets with future API/config bypasses.
- `tests.js` and `tests.html` - Zero-dependency engine tests.
- `config.example.js` - Runtime config template. Copy to ignored `config.js` for real env values.
- `APTITUDE_MODULE_RESEARCH.md` - Research-backed product direction and backlog.
- `docs/aptitude_module_contract.md` - Module lifecycle, data contract, UI rules, and verification gate.
- `landing/` - Static Phase 0 landing/waitlist scaffold.

## Roadmap Posture

The repo is intentionally static-first. Future accounts, sync, analytics, payments, and heavier canvas/3D gameplay should be additive and environment-scoped only when retention justifies them. Real secrets belong in host/CI configuration, never in this repository.

## Verification

Before wrapping up changes, run:

```powershell
node --check app.js
node --check core.js
node --check sw.js
node tests.js
```

For copy compliance, scan against the avoid-list maintained in `ROADMAP.md` and keep public copy positioned as a cockpit-inspired game, not pilot training or exam preparation.