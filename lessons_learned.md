# Lessons Learned & Technical Retrospective

## Sprint 11: Professional UI De-Vibing, Fluid Layout, Bug Fixes & Module Audit

### What Worked Well
1. **Defensive Module State Guards**:
   - Adding explicit generator branches in `startRound()` for `attitude` and `intercept` plus defensive state fallback checks in `setupStudyScreen()` completely eliminated `TypeError: Cannot read properties of null` crash loops.
2. **Text Wrapping over Rigid Ellipses**:
   - Replacing `white-space: nowrap` and `text-overflow: ellipsis` with `white-space: normal` and responsive grid `repeat(auto-fill, minmax(130px, 1fr))` ensured all module card labels ("Horizon Scan", "Clearance Recall", etc.) render in full without text truncation.
3. **Plain Professional Styling**:
   - Stripping out neon glows (`box-shadow: 0 0 12px var(--accent-blue-glow)`) and glowing indicators in favor of crisp 1px solid active borders and clean muted indicators resulted in a clean, plain, professional aesthetic across dark and light modes.
4. **Fluid Full-Screen Responsiveness**:
   - Updating `.terminal-frame` to `width: 100%; max-width: 100%; height: 100vh;` allowed the web app to fill viewport space naturally without artificial pixel clamping.

### Best Practices to Persist
- Always ensure every registered module key in `CHALLENGE_MODULE_KEYS` has matching generator branches in `startRound()` and rendering cases in `setupStudyScreen()`.
- Avoid arbitrary rigid pixel width caps or aggressive glowing box-shadows to maintain a clean, professional software UI.
- Maintain no-emoji policy in UI and documentation for clean software presentation.

### 2026-10-13: Public Beta Monetization Readiness & Insecure License Deprecation
- **What Failed / Risk Observed**: The codebase previously included a hardcoded `PRO-FLIGHT-PASS` key check in client JavaScript with a visible Pro modal, giving a false appearance of secure commercial gating while offering no real backend fulfillment or security.
- **What Worked**:
  - Deprecated the client-side license evaluation and replaced it with a truthful `getAccessStatus()` reporting `public_beta` mode.
  - Removed all mock paywall overlays and unlock buttons from the DOM, making themes and CSV export natively accessible.
  - Added startup migration in `app.js` using `safeStorageRemove("flightcore_pro_key")` to safely scrub legacy keys without touching user session histories.
  - Automated regression testing verifying that no Pro key or modal selectors remain in the app source code and that legacy storage keys are purged on boot.

### 2026-10-13: PR #18 Remediation & Single Source of Truth for Themes
- **What Failed / Risk Observed**: `core.js` reported 7 unlocked themes in `getAccessStatus()`, but `app.js` hardcoded an older 5-theme array and `index.html` lacked buttons for Amber and Stealth, creating a contract mismatch between the access API and UI.
- **What Worked**:
  - Centralized theme identifiers in `FlightCore.VALID_THEMES` inside `core.js` as the single source of truth.
  - Exposed both Vintage Amber Vector and Stealth AMOLED buttons in `index.html`.
  - Added regression tests in `tests_app_error_handling.js` asserting that `setTheme()` persists each theme and updates DOM attributes, and that `index.html` markup exposes buttons for all 7 themes.

### 2026-10-13: Issue #10 History Schema Sanitization & Defensiveness
- **What Failed / Risk Observed**: Previously, `app.js` assumed any parsed JSON array in `flightcore_history` contained valid records with `.score.toLocaleString()` and finite numbers. Malformed legacy records or missing fields could throw unhandled `TypeErrors` during logbook or home screen rendering.
- **What Worked**:
  - Centralized per-record schema validation in `FlightCore.validateHistoryRecord()` and array sanitization in `FlightCore.sanitizeHistory()`.
  - Upgraded `getSafeStorageHistory()` and startup hydration to guarantee that `globalHistory` always contains bounded, valid records.
  - Hardened view rendering with `(Number(h.score) || 0).toLocaleString()` and date fallbacks.
  - Added unit test fixtures in `tests.js` (134/134 green) and VM error handling tests in `tests_app_error_handling.js` (12/12 green).
