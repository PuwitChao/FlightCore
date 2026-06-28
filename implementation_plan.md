# Pre-Release, Security, & Error Boundary Alignment Plan

We will align Flight Core with its public release requirements by executing the positioning guidelines defined in `ROADMAP.md`, implementing robust client-side error guardrails, and hardening the security boundaries against cross-site scripting (XSS) and data corruption. 

As requested, external privacy telemetry analytics have been postponed and will not be implemented in this sprint.

---

## User Review Required

Document anything that requires user review or feedback.

> [!IMPORTANT]
> - **Copywriting Alignment**: We are removing words like "training", "drill", "proficiency", and "professional" from all user-facing strings to align with the game-not-training positioning.
> - **Application Reset Option**: The new System Fault dialog features a "RESET APPLICATION STATE" button. Tapping this will clear the browser's `localStorage` for the site and reload the page. This is a load-bearing repair mechanism if the client data becomes unparseable.

---

## Open Questions

None. The telemetry/analytics questions have been deferred per user instructions.

---

## Proposed Changes

### Component 1: Lexicon Alignment & Positioning

We will perform a complete audit and rewrite of user-facing copy to frame the app as a "flight-themed cognitive puzzle game" rather than a professional training tool.

#### [MODIFY] [manifest.json](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/manifest.json)
- Update description: `"description": "Cockpit-inspired cognitive recall and scanning challenge for aviation enthusiasts."` (replaces "training for pilots and professionals").

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
- Rewrite user-facing labels:
  - `Choose Training Modules` $\rightarrow$ `Select Challenge Modules`
  - `START TRAINING SESSION` $\rightarrow$ `START SESSION`
  - `CONTINUE TRAINING` $\rightarrow$ `CONTINUE SESSION`
  - `RESUME TRAINING` $\rightarrow$ `RESUME SESSION`
- Update onboarding welcome modal copy:
  - Replace *"A cognitive memory trainer built for pilots and flight deck professionals..."* with *"A cockpit-inspired cognitive recall game built for aviation simulators, flight enthusiasts, and puzzle solvers. Challenge your memory and visual scanning across 4 flight deck modules."*
  - Re-label the button from `BEGIN TRAINING` to `BEGIN CHALLENGE`.

---

### Component 2: Legal Disclaimers & Disclosures

To prevent regulatory liability and guarantee transparent product positioning, we will inject the non-negotiable disclaimers:

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
- **Home Screen Hero**: Add a small, italicized, and high-legibility disclaimer box directly under the main card: *"Flight Core is a cognitive challenge game. It is NOT a pilot training tool or FAA-approved procedural simulator. Do not use for real-world aviation."*
- **Onboarding Modal**: Insert the warning line: *"Disclaimer: For entertainment purposes only. Not real flight procedure."*
- **Debrief / Results Screen**: Append a small footer at the bottom of the session summary: *"For recreational play only. Not real flight operations."*
- **About/Help Drawer**: Add a permanent Disclaimer section.

---

### Component 3: Security Hardening (XSS Prevention & Input Validation)

To ensure the application remains safe, we will scrutinize and harden the inputs and dynamic rendering code:

#### [MODIFY] [app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)
- **HTML Escaping Helper**: Implement a robust `escapeHTML(str)` utility function:
  ```javascript
  function escapeHTML(str) {
    if (typeof str !== "string") return str;
    return str.replace(/[&<>"']/g, (m) => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return map[m];
    });
  }
  ```
- **Escape Dynamic Content**: Wrap all variable injections inside `innerHTML` templates (such as expected/input values in `setupFeedbackScreen` and dynamic logbook rows) with `escapeHTML()` to neutralize potential XSS payloads.
- **Theme Validation**: Restrict loaded theme values to the approved set: `VALID_THEMES = ["dark", "light", "mono", "sage", "warm"]`. If `flightcore_theme` is modified to a non-existent value, default to `"dark"`.

---

### Component 4: Robust Error Boundaries & Guardrails

We will protect the application from client-side crashes, data corruption, and infinite loops:

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
- **System Fault Modal Overlay**: Add a custom-styled, cockpit-grade overlay `#error-boundary-overlay` that displays a `SYSTEM FAULT` warning panel with:
  - An interactive stack trace viewport `#error-boundary-log`.
  - A **RELOAD SYSTEM** button.
  - A **RESET APPLICATION STATE** button (clears localStorage and reloads).

#### [MODIFY] [app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)
- **Safe Storage Loaders**: Replace direct `localStorage` parsing with safe wrapper functions `getSafeStorageInt(key, defaultValue)`, `getSafeStorageFloat(key, defaultValue)`, and `getSafeStorageHistory()` that validate types, handle parse failures gracefully, and protect against NaN value propagation.
- **Global Error Interceptors**: Bind window-level error handlers `window.addEventListener("error")` and `window.addEventListener("unhandledrejection")` to capture unexpected scripting failures and render the `SYSTEM FAULT` boundary UI.

---

## Verification Plan

### Automated Tests
- Run browser console syntax validations on script modifications.

### Manual Verification
- **Copy & Lexicon Verification**: Confirm "training" is absent from user-facing strings.
- **XSS Payload Testing**: Temporarily mock an input containing HTML/Script tags (e.g. `"<script>alert(1)</script>"`) and verify it renders escaped as text in the feedback screen without executing.
- **LocalStorage Corruption Simulation**: Inject invalid JSON or non-numeric values into `localStorage` keys and verify the app defaults safely.
- **System Fault Verification**: Trigger a deliberate JS error in the console (e.g. `throw new Error("Simulated Flight Deck Error")`) and verify the System Fault overlay pops up with the correct details and functional reload/reset buttons.
