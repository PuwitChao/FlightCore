# Flight Core - Pre-Release, Security, & Error Boundary Alignment Checklist

## Phase 1: Planning & Setup
- `[x]` Confirm implementation plan with user and get approval
- `[x]` Define global error boundary modal templates in `index.html`

## Phase 2: Copywriting & Lexicon Compliance
- `[x]` Update `manifest.json` description to remove training terms
- `[x]` Update user-facing text in `index.html` (Select Challenge Modules, Start/Continue/Resume Session, etc.)
- `[x]` Rewrite onboarding welcome modal copy in `index.html` to avoid "training" and "professional" references

## Phase 3: Legal Disclaimers & Disclosures
- `[x]` Add homepage hero disclaimer box under the main deck card in `index.html`
- `[x]` Add onboarding welcome modal disclaimer line
- `[x]` Add debrief/results screen footer disclaimer in `index.html`
- `[x]` Insert permanent Disclaimer text in the help/about drawer in `index.html`

## Phase 4: Security Hardening & XSS Protection
- `[x]` Implement `escapeHTML(str)` utility function in `app.js`
- `[x]` Escape expected/input fields dynamically rendered in `setupFeedbackScreen()`
- `[x]` Escape user logs dynamically rendered in `renderPilotLogbook()`
- `[x]` Validate theme values in `initThemeSystem()` and `setTheme()` against approved themes list

## Phase 5: Error Boundaries & Guardrails
- `[x]` Create `getSafeStorageInt()`, `getSafeStorageFloat()`, and `getSafeStorageHistory()` loading helpers in `app.js`
- `[x]` Update state initialization to load `localStorage` parameters safely
- `[x]` Add global `window.addEventListener("error")` and `unhandledrejection` bindings in `app.js`
- `[x]` Create `handleGlobalError()` to log details and display the `#error-boundary-overlay` modal
- `[x]` Bind reload and reset storage event listeners in the DOMContentLoaded bootstrap block

## Phase 6: Verification & Walkthrough
- `[x]` Verify application boots cleanly without any errors
- `[x]` Test data corruption tolerance by writing invalid text/JSON to localStorage
- `[x]` Trigger a simulated error to verify the System Fault overlay rendering, reloading, and resetting
- `[x]` Test XSS escaping by mocking data containing script tags
- `[x]` Update `walkthrough.md` with accomplishments
