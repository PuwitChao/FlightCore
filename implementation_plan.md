# Implementation Plan - Public Beta Monetization Readiness & Dormant Boundary

## Context & Objectives
FlightCore is preparing for an independent public beta as a cockpit-inspired entertainment/puzzle game.
Per GitHub Issues #17, #11, and Epic #8:
- The public beta must remain 100% free with all released exercises, themes, and history accessible without payment, accounts, or licenses.
- Remove all fake Pro key checks (`PRO-FLIGHT-PASS`), promotional paywalls, and modal triggers.
- Clean up any legacy saved `flightcore_pro_key` from localStorage safely on startup without touching user run history or settings.
- Enable full free access in public beta mode (all 7 themes, CSV logbook export, full gameplay).
- Provide a dormant, clean future entitlement boundary contract (`FlightCore.getAccessStatus()`) that truthfully reports active beta mode without any fake paid state or client-side license checks.
- Add regression tests verifying that `PRO-FLIGHT-PASS` grants no special paid privilege, that beta access provides full free capability, and that no paywall modal or fake license inputs are exposed in the DOM.

## Work Breakdown
1. **Core Logic (`core.js`)**:
   - Replace insecure `evaluateProAccess(licenseKey)` with a clean access status interface:
     - In beta mode, `mode: "public_beta"`, `isPaid: false`, `isBeta: true`, all features unlocked for beta testing (`unlockedThemes`, `csvExport`, etc.).
     - Remove `PRO-FLIGHT-PASS` and `FLIGHT-CORE-PRO` hardcoded keys.
   - Update export surface and pure unit tests.
2. **DOM & UI (`index.html`)**:
   - Remove `#pro-pass-overlay` modal and `#btn-pro-toggle` from the HUD header.
   - Add "Export CSV" button to the Run History section so users can cleanly use the logbook export feature.
3. **Application Lifecycle (`app.js`)**:
   - Remove `btnPro`, `overlayPro`, and `btnProUnlock` listeners.
   - On startup, safely scrub legacy `flightcore_pro_key` from localStorage (`safeStorageRemove("flightcore_pro_key")`) to prevent stale legacy license keys.
   - Wire up the Run History CSV export button directly to `exportLogbookCSV()`.
4. **Automated Verification**:
   - Update `tests.js` to test `FlightCore.getAccessStatus()`, verifying public beta mode, no legacy key bypass, and full theme access.
   - Add new tests in `tests_app_error_handling.js` or dedicated test file for DOM non-exposure of Pro modal and legacy key scrubbing.
   - Run `node tests.js` and `node tests_app_error_handling.js`.
   - Run `node --check app.js` and `node --check core.js`.
