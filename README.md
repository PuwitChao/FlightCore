# Flight Core - Cockpit Challenge Game

Flight Core is a zero-build, offline-first browser game built around cockpit-inspired memory and pattern-recognition challenges. It is designed for quick sessions on mobile or desktop, with a dark glass UI, tactile controls, local history, and four aviation-flavored puzzle modules.

Flight Core is for entertainment only. It is not real aviation instruction, not regulatory study material, and not for real-world aviation use.

## Current App

- Static PWA: no build step, no npm install, no backend required.
- Four challenge modules: Checklist, Instruments, ATC, and Fault.
- Dynamic difficulty: level increases with correct streaks.
- Module rotation: avoids playing the same module three times in a row when possible.
- Local history: scores, accuracy, streaks, module trends, and recent run history stay in localStorage.
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
- `styles.css` - Theme tokens, responsive layout, animation, and accessibility affordances.
- `core.js` - Pure game engine helpers: generation, scoring, streaks, summaries, and safe parsing.
- `app.js` - DOM controller, session flow, localStorage persistence, telemetry stub, and UI events.
- `sw.js` - Offline cache for local static assets with future API/config bypasses.
- `tests.js` and `tests.html` - Zero-dependency engine tests.
- `config.example.js` - Runtime config template. Copy to ignored `config.js` for real env values.
- `landing/` - Static Phase 0 landing/waitlist scaffold.

## Roadmap Posture

The repo is intentionally static-first. Future accounts, sync, analytics, and payments should be additive and environment-scoped through runtime config, Supabase, and Stripe only when retention justifies them. Real secrets belong in host/CI configuration, never in this repository.

## Verification

Before wrapping up changes, run:

```powershell
node --check app.js
node --check core.js
node tests.js
```

For copy compliance, scan against the avoid-list maintained in `ROADMAP.md`.
