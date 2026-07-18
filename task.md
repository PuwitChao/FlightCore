# FlightCore Roadmap Execution Checklist

## Phase 1: Positioning and Copy
- `[x]` Replace training/proficiency/logbook language with challenge/game/session language
- `[x]` Update README and manifest positioning
- `[x]` Verify forbidden-copy scan

## Phase 2: Phase 0 Launch Readiness
- `[x]` Add static landing/waitlist scaffold
- `[x]` Add telemetry wrapper stub and opt-out-safe events for session start, module completion, streak extension, session finish, and settings changes
- `[x]` Add privacy/terms/disclaimer surfaces

## Phase 3: Core/App Maintainability
- `[x]` Extract pure tier, streak, and summary calculations into `core.js`
- `[x]` Update `app.js` to consume pure helpers
- `[x]` Add focused engine tests

## Phase 4: PWA and Security Hardening
- `[x]` Add config example and ignore real local config
- `[x]` Add service-worker bypasses for future API endpoints
- `[x]` Document CSP/env guardrails

## Phase 5: Accessibility and UI Quality
- `[x]` Add semantic labels/live regions where needed
- `[x]` Add reduced-motion and focus-visible support
- `[x]` Run final syntax, tests, and targeted scans

## Verification Completed
- `node --check app.js`
- `node --check core.js`
- `node --check sw.js`
- `node tests.js` -> 73/73 passed
- Word-boundary positioning scan -> no matches
- Telemetry hook scan -> expected Phase 0 events present
- Manual browser QA -> still required; browser-control setup was blocked by local Windows sandbox ACL failure
