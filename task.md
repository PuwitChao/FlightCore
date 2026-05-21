# Flight Core - Audit and Enhancements Checklist

## Phase 1: Planning & Setup
- `[x]` Perform full audit of code, layout, security, and usability
- `[x]` Write and obtain approval for the implementation plan
- `[x]` Establish tasks in `task.md`

## Phase 2: Production Security & Performance Hardening
- `[x]` Harden Content-Security-Policy (CSP) inside `_headers` (remove `'unsafe-inline'` from `script-src`)
- `[x]` Parallelize font loading in `index.html` (replace CSS `@import` with header `<link>` elements)

## Phase 3: Dashboard Real-Time Progress Tracker
- `[x]` Add `#hud-round-dots` container below fixed dashboard header in `index.html`
- `[x]` Style `.round-step-tracker` and `.round-dot` states (success, warning, error, active, upcoming) in `styles.css`
- `[x]` Implement real-time dot rendering logic in `app.js` (`updateLevelAndHUD` and `finishSession`)

## Phase 4: Cupertino-Style Intelligent UX Auto-Advance
- `[x]` Implement smart ATC field auto-advance chain (Callsign $\rightarrow$ Facility $\rightarrow$ Frequency $\rightarrow$ Squawk) in `app.js`
- `[x]` Implement smart Instruments dial card auto-advance chain in `app.js`

## Phase 5: Verification & Walkthrough
- `[ ]` Verify CSP status & console behavior
- `[ ]` Verify parallel network font loading in developer tools
- `[ ]` Verify ATC auto-advance flow on quick-select and numeric input
- `[ ]` Verify Instruments card auto-advance flow on numeric keypad confirmation
- `[ ]` Verify real-time progress dot updates and pulses across 8 rounds
- `[ ]` Document all accomplishments in `walkthrough.md`
