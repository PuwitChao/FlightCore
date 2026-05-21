# Flight Core Full Audit & Micro-Interaction Enhancements Plan

We have performed a full, comprehensive codebase, layout, security, and usability audit of the **Flight Core Memory Trainer**. 

Based on this audit, we have identified several high-impact, professional enhancements that align with modern **Cupertino UI guidelines**, harden security against edge threats, optimize rendering performance, and establish premium micro-interactions.

---

## Proposed Changes

### Component 1: Production Security & Performance Hardening

We will decouple font loading to optimize parallel resource discovery and harden the browser's sandbox against cross-site scripting (XSS) threats.

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
- Move font retrieval from CSS `@import` blocking to parallelized header `<link>` preconnects in the `<head>` of `index.html`.
- This ensures the browser begins fetching the premium **Inter** font family simultaneously with `styles.css`, preventing Flash of Unstyled Text (FOUT).
- Add a new visual step-tracker container `<div class="round-step-tracker" id="hud-round-dots"></div>` directly inside or below the dashboard header to visually track the 8-round session in real time.

#### [MODIFY] [styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)
- Remove the blocking `@import url(...)` at line 1.
- Style the new progress step-tracker `.round-step-tracker` as a flex layout containing 8 sleek horizontal micro-capsule pill indicators (`.round-dot`).
- Implement AAA contrast transitions and specialized styles for:
  - `.round-dot.completed-success` (emerald-green backing)
  - `.round-dot.completed-warning` (amber-orange backing)
  - `.round-dot.completed-error` (ruby-red backing)
  - `.round-dot.active` (pulsing sapphire-blue state with keyframe animation)
  - `.round-dot.upcoming` (semi-transparent border capsule)

#### [MODIFY] [_headers](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/_headers)
- Remove `'unsafe-inline'` from the `script-src` directive in the Content-Security-Policy (CSP) header.
- Since all logic and event handlers are loaded programmatically in `app.js` with zero inline scripting inside `index.html`, this completes a major security hardening step to immunize the application against cross-site scripting (XSS).

---

### Component 2: Cupertino-Style Intelligent UX Auto-Advance

To minimize user taps and make gameplay feel extremely fluid on both mobile touch devices and physical keyboards, we will implement smart auto-advance chains.

#### [MODIFY] [app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)
- **ATC Field Auto-Advance**:
  - When the user selects an ATC **Callsign** quick-select button, automatically advance active focus to **Facility** (if vacant).
  - When the user selects a **Facility** option, automatically advance focus to **Frequency** (which instantly slides the numeric keypad into view).
  - When confirming **Frequency** via the keypad `CONFIRM` or physical `Enter`, automatically advance focus to **Squawk** (if vacant).
  - If all ATC inputs are filled, cleanly close the keypad overlay.
- **Instruments Gauge Auto-Advance**:
  - In the Instruments module, when a user enters a value for a blanked gauge and taps `CONFIRM` on the keypad (or hits physical `Enter`), automatically scan for the next vacant blanked gauge in sequence.
  - If found, immediately trigger active focus and select it, keeping the keypad open with the active preview buffer.
  - If all blanked gauges are filled, close the keypad interface automatically.
- **Visual Step Tracker Logic**:
  - Update `updateLevelAndHUD()` and `finishSession()` to dynamically render the 8 horizontal progress capsule dots.
  - Compute states using completed elements inside `roundByRoundHistory` in real time, updating dot colors dynamically between rounds.

---

## Verification Plan

### Automated & Manual Verification
1. **CSP Hardness Audit**:
   - Deploy/run the app and verify the console remains clean of CSP violation reports.
   - Confirm that inline `<script>` injections are blocked completely.
2. **Parallel Font Loading**:
   - Check network waterfall charts via Chrome Developer Tools to ensure `Inter` font assets download in parallel with `styles.css`, speeding up layout stabilization.
3. **ATC Auto-Advance Flow**:
   - Start an ATC round. Click Callsign option $\rightarrow$ verify focus shifts to Facility automatically.
   - Click Facility option $\rightarrow$ verify focus shifts to Frequency and the numeric keypad pops open instantly.
   - Enter Frequency and click `CONFIRM` $\rightarrow$ verify focus shifts to Squawk automatically.
4. **Instruments Auto-Advance Flow**:
   - Start an Instruments round. Click the first blanked gauge card $\rightarrow$ enter a number $\rightarrow$ click `CONFIRM` (or hit physical `Enter`).
   - Verify that focus automatically shifts to the second blanked gauge, highlighting it and updating the keypad indicator.
   - Enter the last value and click `CONFIRM` $\rightarrow$ verify the keypad closes smoothly.
5. **Horizontal Progress Step Tracker**:
   - Verify that 8 horizontal pill capsules render below the dashboard header.
   - Confirm the active round dot pulses sapphire-blue.
   - Complete rounds with different accuracies (Perfect/Great, Partial, Failed) and verify dots turn emerald-green, amber-orange, and ruby-red in real time.
