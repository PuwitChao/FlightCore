# Task: Public Beta Monetization Readiness & Dormant Boundary

- [x] Phase 1: Planning and Research <!-- id: 0 -->
  - [x] Review GitHub Issues #17, #11, and Release Epic #8 <!-- id: 1 -->
  - [x] Inspect codebase for `PRO-FLIGHT-PASS`, Pro modal, and entitlements <!-- id: 2 -->
  - [x] Define public beta access contract & migration plan <!-- id: 3 -->
- [x] Phase 2: Execution via OpenCode Delegation <!-- id: 4 -->
  - [x] Update `core.js` with dormant future entitlement contract (`getAccessStatus`) <!-- id: 5 -->
  - [x] Clean up `index.html` removing Pro modal and adding Run History CSV export button <!-- id: 6 -->
  - [x] Update `app.js` removing Pro modal handlers and scrubbing legacy license key <!-- id: 7 -->
- [x] Phase 3: Verification & Quality Gates <!-- id: 8 -->
  - [x] Update engine tests in `tests.js` <!-- id: 9 -->
  - [x] Add app tests in `tests_app_error_handling.js` for key scrubbing and DOM non-exposure <!-- id: 10 -->
  - [x] Run full test suite and syntax checks <!-- id: 11 -->
- [x] Phase 4: Documentation & Walkthrough <!-- id: 12 -->
  - [x] Write `walkthrough.md` and update `lessons_learned.md` <!-- id: 13 -->
  - [x] Provide implementation evidence and closure recommendations for issues #17 & #11 <!-- id: 14 -->
