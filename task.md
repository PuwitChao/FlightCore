# Task: Issue #10 - Validate, Migrate and Safely Render Persisted FlightCore Sessions

- [x] Phase 1: Planning and Research <!-- id: 0 -->
  - [x] Reproduce and document malformed record risks in `app.js` and `core.js` <!-- id: 1 -->
  - [x] Design bounded, versioned schema and sanitizer interface <!-- id: 2 -->
- [x] Phase 2: Execution via OpenCode Delegation <!-- id: 3 -->
  - [x] Implement `validateHistoryRecord` and `sanitizeHistory` in `core.js` <!-- id: 4 -->
  - [x] Wire sanitization into `app.js` (`getSafeStorageHistory`, `globalHistory`, `renderLogbook`, `loadHomeStats`) <!-- id: 5 -->
  - [x] Add storage quota / write failure notification on session save <!-- id: 6 -->
- [x] Phase 3: Verification & Quality Gates <!-- id: 7 -->
  - [x] Add unit test suite in `tests.js` for malformed/legacy history fixtures <!-- id: 8 -->
  - [x] Add app error handling VM tests in `tests_app_error_handling.js` for corrupt history and quota failures <!-- id: 9 -->
  - [x] Run full test suite (`node tests.js`, `node tests_app_error_handling.js`) <!-- id: 10 -->
  - [x] Verify JS syntax (`node --check core.js`, `node --check app.js`) <!-- id: 11 -->
- [x] Phase 4: Documentation, PR & Closeout <!-- id: 12 -->
  - [x] Update `walkthrough.md`, `lessons_learned.md`, and `HANDOFF.md` <!-- id: 13 -->
  - [x] Commit, push branch, open PR, and prepare Issue #10 closeout evidence <!-- id: 14 -->
