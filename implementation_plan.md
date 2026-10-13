# Implementation Plan - Issue #10: Validate, Migrate and Safely Render Persisted FlightCore Sessions

## Problem Statement & Observed Risk
In `app.js`:
- `getSafeStorageHistory()` only verifies that the parsed JSON is an Array (`Array.isArray(parsed)`).
- `globalHistory` at boot line 241 uses `FlightCore.safeParse(..., [])` without per-record validation.
- Throughout `loadHomeStats()`, `renderLogbook()`, `exportLogbookCSV()`, `updatePilotRankHUD()`, and debrief calculations, records are dereferenced directly:
  - `h.score.toLocaleString()` (throws `TypeError: Cannot read properties of undefined/null (reading 'toLocaleString')` if `h.score` is null/undefined or `h` is null/primitive).
  - `h.percentage` (NaN if missing or non-numeric, breaking average grade calculations).
  - `h.date` (invalid date if malformed).
- When `safeStorageSet()` fails due to quota or storage restrictions, sessions are saved in memory without user notification or fallback.

## Proposed Architecture & Solution
1. **Schema Validation & Migration in `core.js`**:
   - Introduce `FlightCore.validateHistoryRecord(rawRecord)`:
     - Sanitizes/migrates any record into a bounded, well-formed object:
       - `date`: Valid ISO string (fallback to valid ISO string for today).
       - `score`: Safe bounded integer >= 0 (default 0).
       - `percentage`: Safe bounded integer 0..100 (default 0).
       - `tier`: Safe string (default computed via `FlightCore.sessionTier(percentage).label`).
       - `maxLevel`: Safe integer >= 1 (default 1).
       - `maxStreak`: Safe integer >= 0 (default 0).
       - `xp`: Safe integer >= 0 (default computed from score/percentage).
       - `competencies`: Object with valid numeric values or empty object.
       - `moduleAccuracy`: Object with valid numeric values or empty object.
       - `skillFamilyAccuracy`: Object with valid numeric values or empty object.
       - `isDaily`: Boolean.
       - `version`: Schema version (default 1).
     - Returns `null` for completely irrecoverable objects (e.g. non-object primitives or corrupted garbage that has neither score nor date), allowing quarantine.
   - Introduce `FlightCore.sanitizeHistory(historyArray)`:
     - Filters and sanitizes array entries using `validateHistoryRecord`.
     - Preserves all valid and partially-valid recoverable records.
     - Never throws.
2. **Hardened App-Layer Integration in `app.js`**:
   - `getSafeStorageHistory()` uses `FlightCore.sanitizeHistory()` to guarantee clean records.
   - Boot-time `globalHistory` is sanitized on startup: `globalHistory = FlightCore.sanitizeHistory(getSafeStorageHistory())`.
   - Update `renderLogbook()` to defensively format:
     - `(Number(h.score) || 0).toLocaleString()`
     - Date parse safeguard with fallback string.
   - Update `loadHomeStats()`:
     - Guarantees finite numbers for `maxScore`, `averageGrade`, `maxStreakAchieved` even with empty or irregular history.
   - Add quota / storage write failure toast/notification if `safeStorageSet("flightcore_history", ...)` fails on session save.
3. **Automated Verification & Testing**:
   - Unit tests in `tests.js` for `validateHistoryRecord` and `sanitizeHistory` with evil fixtures (nulls, missing fields, strings as scores, huge numbers, nested junk, empty array, non-array).
   - Node VM tests in `tests_app_error_handling.js` simulating corrupt localStorage history and verifying `renderLogbook()` and `loadHomeStats()` never throw.
   - Storage quota failure test verifying graceful fallback.
