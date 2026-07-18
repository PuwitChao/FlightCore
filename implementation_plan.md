# FlightCore Roadmap Execution Plan

## Scope

Execute the five agreed roadmap steps inside `D:\Documents\Personal_Project\Google_AG\FlightCore` only:

1. Positioning and copy cleanup.
2. Phase 0 launch-readiness scaffolding.
3. Core/app maintainability split.
4. PWA and security hardening preparation.
5. Accessibility and manual UI quality pass foundations.

No backend, payments, production credentials, external services, or destructive workspace actions are in scope for this pass.

## Execution Order

### 1. Positioning and Copy Cleanup
- **Objective**: Align public and in-app copy with `ROADMAP.md`: FlightCore is a cockpit-inspired challenge game, not a training, proficiency, certification, or real-procedure product.
- **Inputs**: `ROADMAP.md`, `README.md`, `index.html`, `app.js`, `manifest.json`.
- **Verification**: `rg -n -i "trainer|pilot training|certification|exam|checkride|proficiency|pilot logbook|training loop|flight procedure|education" README.md index.html app.js manifest.json`.
- **Scope**: Medium.

### 2. Phase 0 Launch Readiness
- **Objective**: Add static launch scaffolding without backend dependencies: landing/waitlist page, telemetry wrapper stub, and visible policy/disclaimer surfaces.
- **Inputs**: `ROADMAP.md`, existing static app files.
- **Verification**: `rg -n "Telemetry|landing|waitlist|privacy|terms|disclaimer" index.html app.js README.md landing`.
- **Scope**: Medium.

### 3. Core/App Maintainability Split
- **Objective**: Move pure session-summary and streak/tier calculations into `core.js`, keep DOM glue in `app.js`, and test the extracted logic.
- **Inputs**: `core.js`, `app.js`, `tests.js`, `.agents/AGENTS.md`.
- **Verification**: `node tests.js` and `node --check app.js`.
- **Scope**: Medium.

### 4. PWA and Security Hardening Preparation
- **Objective**: Prepare environment/config boundaries, service worker network bypasses for future APIs, and local secret safety without adding real credentials.
- **Inputs**: `.gitignore`, `_headers`, `sw.js`, `index.html`.
- **Verification**: `rg -n "config.js|APP_ENV|api/|supabase|stripe|plausible|posthog|security.txt|Content-Security-Policy" .gitignore config.example.js sw.js _headers README.md`.
- **Scope**: Small.

### 5. Accessibility and UI Quality Foundations
- **Objective**: Improve semantic labels, live status, keyboard/modal affordances, and reduced-motion behavior where the current app already has hooks.
- **Inputs**: `index.html`, `styles.css`, `app.js`.
- **Verification**: `rg -n "aria-|role=|prefers-reduced-motion|focus-visible|sr-only" index.html styles.css app.js`.
- **Scope**: Medium.

## Dependencies

- Step 1 should run before Step 2 so new launch copy follows the corrected vocabulary.
- Step 3 can run after Step 1 because renamed tiers/session language affect debrief state.
- Step 4 can run after Step 2 so launch and telemetry surfaces are represented in config/security scaffolding.
- Step 5 can run alongside Steps 1-4 but should be verified after final markup changes.

## Open Questions

- Real waitlist provider, analytics vendor, Supabase project, Stripe account, and production domains remain intentionally unresolved.
- Legal Terms and Privacy Policy remain placeholders pending actual legal review before monetization.
- Manual browser verification is recommended after this pass because current automated tests cover the pure engine, not rendered layout.
