# Implementation Plan - Panel Sizing, Silent Cockpit Visuals & Module Selector

This plan addresses the user requests regarding:
1. **Panel Sizing**: Resolving card scrollbar clipping issues in Screen 4 (Recall Analysis) and optimizing height.
2. **Sound Removal & High-Fidelity Visual Feedback**: Completely disabling Web Audio synthesis and extending cockpit warning glows for clear, aesthetic visual feedback.
3. **Game Selection Menu**: Implementing an interactive, Cupertino-style checklist on the home screen allowing users to toggle Checklist, Instruments, ATC, and Fault games with tactile visual alerts.
4. **SVG Instrument & Graph Removal**: Replacing circular SVG gauges and dynamic SVG sparkline charts with extremely robust, premium text and number layouts.

---

## Proposed Changes

### 1. Panel Sizing & Layout (`index.html` & `styles.css`)
- **[index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)**:
  - Remove the inline `max-height: 220px;` constraint and `overflow-y: auto;` from the Screen 4 recall details container (around line 243). This lets the `.viewport-content`'s native scrollbar handle long lists cleanly, removing double-scrollbars and vertical clipping.
- **[styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)**:
  - Add a snappy Apple-style `@keyframes shake` and `.shake` class to handle invalid configuration feedback (e.g. attempting to play with zero modules selected).

### 2. Audio Removal & Visual Glow Extensions (`app.js`)
- **[app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)**:
  - Remove the global `AudioContext` instantiation to eliminate console warning messages from browsers block policies.
  - Silence `playSound(type)` entirely so that key clicks and success/error sounds are muted.
  - Extend the cockpit edge glow visual feedback timeout from `350ms` to `1200ms` in `submitTelemetry()`, allowing the visual feedback to smoothly fade out using the existing `styles.css` transitions.

### 3. Home Screen Game Selection Menu (`index.html` & `app.js`)
- **[index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)**:
  - Insert an interactive terminal card for selecting games in `#screen-home` right above the `START TRAINING SESSION` button (around line 105).
  - Use the pre-styled Apple-standard `.module-select-card` structure for Checklist, Instruments, ATC, and Fault options.
- **[app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)**:
  - Track user-selected game modes via an array state `selectedModules`.
  - Add interactive toggle click listeners to the selection cards.
  - Implement a Cupertino shake animation if a user tries to deselect the last remaining active module.
  - Filter randomizations inside `selectNextModule()` to pull only from `selectedModules` while keeping the "No 3x Repeat" constraint robust.

### 4. Text-Based Instruments & History Lists (`app.js`)
- **[app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)**:
  - **Refactor `createGaugeHTML`**: Completely remove SVG elements (scales, dials, lines/needles) and return a beautiful, pure CSS flex grid element showing the Gauge Abbreviation (with category color), Unit, Digital Value (or `???` if blanked), and complete technical description in uppercase sans-serif text.
  - **Refactor `renderHistoryChart`**: Remove dynamic SVG drawing. Instead, generate a sleek, premium HTML block listing the last 3 sessions with localized date cards, exact numeric scores, and green/gray accuracy metrics.

---

## Step-by-Step Code Diffs

### Component 1: `styles.css` Animations
```css
/* Animations */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

.shake {
  animation: shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
```

### Component 2: `index.html` Home Screen Layout
```html
        <!-- Game Selection Card -->
        <div class="terminal-card" style="margin-bottom: 16px;">
          <div class="terminal-card-header">
            <span>Choose Training Modules</span>
            <span class="type-tag" id="modules-selected-count">4 Active</span>
          </div>
          <div class="module-selection-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div class="module-select-card active" data-module="checklist" id="select-checklist">
              <span class="select-indicator"></span>
              <span style="font-size: 0.78rem; font-weight: 600;">Checklist</span>
            </div>
            <div class="module-select-card active" data-module="instruments" id="select-instruments">
              <span class="select-indicator"></span>
              <span style="font-size: 0.78rem; font-weight: 600;">Instruments</span>
            </div>
            <div class="module-select-card active" data-module="atc" id="select-atc">
              <span class="select-indicator"></span>
              <span style="font-size: 0.78rem; font-weight: 600;">ATC</span>
            </div>
            <div class="module-select-card active" data-module="fault" id="select-fault">
              <span class="select-indicator"></span>
              <span style="font-size: 0.78rem; font-weight: 600;">Fault</span>
            </div>
          </div>
        </div>
```

### Component 3: `app.js` Instrumental & Trend Text Layouts
```javascript
// Clean text and numbers only for Instruments
function createGaugeHTML(g, isBlanked = false) {
  const container = document.createElement("div");
  container.className = "gauge-card" + (isBlanked ? " blanked" : "");
  if (isBlanked) {
    container.setAttribute("data-label", g.label);
  }
  
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.65rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">
      <span style="color: ${g.color || 'var(--accent-blue)'};">${g.label}</span>
      <span>${g.unit}</span>
    </div>
    <div class="gauge-value-display" style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 6px 0; letter-spacing: -0.5px;">
      ${isBlanked ? "???" : g.val}
    </div>
    <div class="gauge-name" style="font-size: 0.58rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px; text-align: center;">
      ${g.name}
    </div>
  `;
  
  return container;
}

// Pure text & numeric list for recent session history
function renderHistoryChart() {
  const chartWrapper = document.getElementById("history-chart");
  const sideWrapper = document.getElementById("sidebar-chart");
  chartWrapper.innerHTML = "";
  if (sideWrapper) sideWrapper.innerHTML = "";
  
  if (globalHistory.length === 0) {
    const emptyHTML = `<div style="font-size: 0.65rem; color: var(--text-muted); text-align: center;">NO SESSION HISTORY RECORDED</div>`;
    chartWrapper.innerHTML = emptyHTML;
    if (sideWrapper) sideWrapper.innerHTML = emptyHTML;
    return;
  }
  
  const createHistoryListHTML = (historyData) => {
    let html = `<div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">`;
    const recent = [...historyData].reverse().slice(0, 3);
    recent.forEach((h) => {
      const dateStr = new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; padding: 8px 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <span style="font-weight: 700; color: var(--accent-blue);">${dateStr}</span>
          <span style="color: var(--text-primary); font-weight: 600;">${h.score.toLocaleString()} PTS</span>
          <span style="font-weight: 700; font-size: 0.65rem; color: ${h.percentage >= 90 ? 'var(--success-emerald)' : 'var(--text-secondary)'};">${h.percentage}% ACC</span>
        </div>
      `;
    });
    html += `</div>`;
    return html;
  };
  
  chartWrapper.innerHTML = createHistoryListHTML(globalHistory);
  if (sideWrapper) {
    sideWrapper.innerHTML = createHistoryListHTML(globalHistory);
  }
}
```

---

## Verification Plan

### Automated & Manual Verification
1. **Module Selector Interaction**: Toggle game checkmarks on screen 1. Verify card scales smoothly, indicators glow, and deactivated tiles dim.
2. **Invalid Config Shake**: Turn off all checkmarks but one. Click to deselect the last checkmark and verify the capsule plays a snappy Apple shake animation and stays active.
3. **Telemetry & Sizing**: Play a round of a selected game, submit answers, and verify the Screen 4 recall card resizes perfectly, utilizing flex-grow with zero scrollbar clipping.
4. **Visual Cockpit Glow**: Confirm that submitting incorrect or correct responses creates an immersive, silent red/green warning glow that fades slowly over 1.2 seconds, with absolute silence in audio output.
5. **No SVGs Verification**: Ensure that the Instruments game works with absolutely pure text/numbers and contains zero SVG tag errors. Ensure the Home Page session history displays recent scores beautifully in text capsules.
