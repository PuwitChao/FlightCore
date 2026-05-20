# Implementation Plan - Interactive Session Abort & Theme Contrast Audit

This implementation plan outlines the structural, styling, and logical changes to introduce interactive "Abort Session" controls, general User Flow / User Experience (UX) polishes, and a thorough **Theme & Contrast Accessibility Audit** during FlightCore training modules.

## Goals
1. **Header Navigation Abort**: Add a clean, Apple-style "Abort" button in the dashboard header that replaces the system title during active training phases (`screen-study`, `screen-test`, `screen-feedback`).
2. **Glassmorphic Abort Modal**: Introduce a confirmation modal dialog before aborting a session, preventing accidental progression loss and matching Apple UI aesthetics.
3. **Smart Timer Pausing**: Automatically pause the active study/briefing countdown timer while the Abort confirmation dialog is visible, and resume it seamlessly if the user chooses to continue.
4. **Escape Key Integration**: Bind the `Escape` key to summon or dismiss the abort confirmation modal for swift keyboard-only navigation.
5. **Debrief "Home" Redirection**: Refactor the final `screen-debrief` layout to offer stacked/side-by-side "HOME" and "RESTART" buttons, allowing users to return to the home dashboard to toggle games or inspect history graphs.
6. **Theme & Contrast Audit**: Adjust color tokens for all 5 themes. Increase the legibility of secondary and muted fonts in light/warm modes to satisfy WCAG AAA standards. Introduce solid, drop-shadowed tactile keypad button variables that pop elegantly against the keyboard tray.

---

## User Review Required

> [!NOTE]
> All changes are designed to be fully offline-ready and written in vanilla HTML/CSS/JS, with absolutely zero external npm or library dependencies.

---

## Proposed Changes

### 1. Structure (`index.html`)
- **[MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)**:
  - Add the **Abort Button** in the header `.dashboard-row` right before `#system-status`.
  - Add the **Abort Confirmation Modal** `#abort-confirm-overlay` above the closing body tag.
  - Refactor the debrief screen (`#screen-debrief`) footer button layout to display a flex-row containing both **HOME** and **RESTART** buttons.

### 2. Styles (`styles.css`)
- **[MODIFY] [styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)**:
  - **Theme Ramps Audit**: Redefine theme variables in each theme block. Boost `--text-secondary` and `--text-muted` in Apple Light and Warm Sand to deep, accessible values.
  - Define custom button variables: `--btn-neutral-bg`, `--btn-neutral-border`, `--keypad-btn-bg`, `--keypad-btn-active-bg`, and `--keypad-btn-action-bg`.
  - Apply these theme-specific button and keypad variable controls natively inside `.btn`, `.keypad-btn`, and active states, eliminating washed-out button backgrounds.
  - Style the `.abort-btn` with clean `--error-rose` red colors, absolute borderless backgrounds, and scaling micro-animations on active press (`scale(0.95)`).
  - Polish confirmation modal overlays to share the standard glassmorphic translucent blur and standard styling variables.

### 3. Application Logic (`app.js`)
- **[MODIFY] [app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)**:
  - Add active state `isTimerPaused = false` to handle pause gates.
  - Inject pause-gate checks into `setupStudyScreen`'s `studyTimer` interval sweep.
  - Implement `showAbortConfirm()`, `hideAbortConfirm()`, and `abortSession()`.
  - Update `showScreen(screenId)` to trigger `updateHeaderControls(screenId)` which switches title/abort visibilities dynamically.
  - Bind all new UI click events and the global physical `Escape` keyboard listener.

---

## Detailed Code Adjustments

### Component 1: `styles.css` Contrast Audit Variables

#### OLED Dark (Default body) variables:
```css
body {
  /* Existing parameters... */
  
  --btn-neutral-bg: rgba(255, 255, 255, 0.05);
  --btn-neutral-border: rgba(255, 255, 255, 0.08);
  --keypad-btn-bg: rgba(255, 255, 255, 0.05);
  --keypad-btn-active-bg: rgba(255, 255, 255, 0.12);
  --keypad-btn-action-bg: rgba(255, 255, 255, 0.02);
}
```

#### Apple Light Theme variables:
```css
body[data-theme="light"] {
  /* Existing parameters... */
  
  /* Contrast Audit: Much deeper shades to prevent washout on translucent card backs */
  --text-secondary: #48484A; /* iOS label dark gray (Improved from #8E8E93) */
  --text-muted: #68686E; /* iOS secondary dark label gray (Improved from #AEAEB2) */
  
  /* Solid tactile buttons matching iOS keypad/calculator interfaces */
  --btn-neutral-bg: #E5E5EA; /* Solid iOS system gray */
  --btn-neutral-border: rgba(0, 0, 0, 0.04);
  --keypad-btn-bg: #FFFFFF; /* Brilliant solid white key tray */
  --keypad-btn-active-bg: #E5E5EA;
  --keypad-btn-action-bg: #D1D1D6;
}
```

#### Nordic Sage variables:
```css
body[data-theme="sage"] {
  /* Existing parameters... */
  
  /* Contrast Audit: Brighten sage tones for dark slate backdrops */
  --text-secondary: #B0C4B8; /* Improved from #94A89C */
  --text-muted: #7E9386; /* Improved from #687970 */
  
  --btn-neutral-bg: rgba(24, 32, 28, 0.6);
  --btn-neutral-border: rgba(255, 255, 255, 0.05);
  --keypad-btn-bg: rgba(24, 32, 28, 0.6);
  --keypad-btn-active-bg: rgba(255, 255, 255, 0.1);
  --keypad-btn-action-bg: rgba(24, 32, 28, 0.3);
}
```

#### Warm Sand variables:
```css
body[data-theme="warm"] {
  /* Existing parameters... */
  
  /* Contrast Audit: Rich Stone Cocoa elements */
  --text-secondary: #44403C; /* Dark Stone (Improved from #78716C) */
  --text-muted: #6B6661; /* Medium Stone (Improved from #A8A29E) */
  
  --btn-neutral-bg: #EFE9DE; /* Solid Sand button */
  --btn-neutral-border: rgba(140, 115, 95, 0.15);
  --keypad-btn-bg: #FFFFFF; /* Crisp solid white key */
  --keypad-btn-active-bg: #EFE9DE;
  --keypad-btn-action-bg: #E5DEC9;
}
```

#### Applied Styles (Neutral buttons & keypads):
```css
.btn {
  font-family: var(--font-sans);
  background: var(--btn-neutral-bg); /* Bound to theme */
  color: var(--text-primary);
  border: 1px solid var(--btn-neutral-border); /* Bound to theme */
  /* Other attributes... */
}

.keypad-btn {
  background-color: var(--keypad-btn-bg); /* Bound to theme */
  border: 1px solid transparent;
  color: var(--text-primary);
  /* Other attributes... */
}

.keypad-btn:active {
  background-color: var(--keypad-btn-active-bg); /* Bound to theme */
}

.keypad-btn.action {
  background-color: var(--keypad-btn-action-bg); /* Bound to theme */
  border: 1px solid var(--border-subtle);
}
```

---

### Component 2: `index.html` Markup Changes

#### Dashboard Header (around line 15):
```html
    <header class="dashboard-header">
      <div class="dashboard-row">
        <!-- New Abort button replacing FLIGHT CORE title during session -->
        <button class="abort-btn" id="btn-session-abort" style="display: none;">&larr; ABORT</button>
        <div class="system-title" id="system-status">FLIGHT CORE</div>
```

#### Debrief Screen Footer (around line 316):
```html
        <div style="display: flex; gap: 10px; margin-top: auto; width: 100%;">
          <button class="btn btn-block" id="btn-debrief-home" style="background: var(--border-subtle); color: var(--text-primary); font-size: 0.75rem; margin-top: 0; padding: 12px 0;">HOME</button>
          <button class="btn btn-primary btn-block" id="btn-restart" style="font-size: 0.75rem; margin-top: 0; padding: 12px 0; flex-grow: 2;">RESTART</button>
        </div>
```

#### Abort Modal Overlay (above the closing body tag):
```html
    <!-- Abort Confirmation Modal Overlay -->
    <div class="theme-selector-overlay" id="abort-confirm-overlay" style="display: none; z-index: 1000;">
      <div class="theme-selector-card" style="max-width: 320px; text-align: center; padding: 20px;">
        <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Abort Training Session?</div>
        <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4;">
          Your current session score, streak, and round progress will be cleared. This action cannot be undone.
        </p>
        <div style="display: flex; gap: 10px; width: 100%;">
          <button class="btn btn-block" id="btn-abort-cancel" style="background: var(--border-subtle); color: var(--text-primary); font-size: 0.75rem; margin-top: 0; padding: 10px 0;">Keep Training</button>
          <button class="btn btn-danger btn-block" id="btn-abort-confirm" style="background: var(--error-rose); color: #ffffff; font-size: 0.75rem; margin-top: 0; padding: 10px 0;">Abort Session</button>
        </div>
      </div>
    </div>
```

---

### Component 3: `app.js` Logic Integrations
```javascript
// State Additions
let isTimerPaused = false;

// Header toggler based on active screen
function updateHeaderControls(screenId) {
  const abortBtn = document.getElementById("btn-session-abort");
  const titleEl = document.getElementById("system-status");
  
  if (screenId === "screen-study" || screenId === "screen-test" || screenId === "screen-feedback") {
    if (abortBtn) abortBtn.style.display = "flex";
    if (titleEl) titleEl.style.display = "none";
  } else {
    if (abortBtn) abortBtn.style.display = "none";
    if (titleEl) titleEl.style.display = "block";
  }
}

// Abort management functions
function showAbortConfirm() {
  playSound("click");
  isTimerPaused = true;
  document.getElementById("abort-confirm-overlay").style.display = "flex";
}

function hideAbortConfirm() {
  playSound("click");
  isTimerPaused = false;
  document.getElementById("abort-confirm-overlay").style.display = "none";
}

// Global escape key event
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const isOverlayOpen = document.getElementById("abort-confirm-overlay").style.display === "flex";
    const activeScreen = document.querySelector(".screen-container.active");
    
    // Only toggle if in an active round screen
    if (activeScreen && (activeScreen.id === "screen-study" || activeScreen.id === "screen-test" || activeScreen.id === "screen-feedback")) {
      if (isOverlayOpen) {
        hideAbortConfirm();
      } else {
        showAbortConfirm();
      }
    }
  }
});
```

---

## Verification Plan

### Automated & Manual Verification
1. **Contrast Legibility**: Toggle between Apple Light and Warm Sand. Confirm all HUD labels, gauge secondary abbreviations, and stats values have highly readable text contrasts.
2. **Keypad Visual Pop**: Verify the custom numeric keypads in light/warm themes render with solid, drop-shadowed white keys (`#FFFFFF`) that stand out sharply against the keyboard grey tray.
3. **Interactive Abort Button**: Start a session. Verify the `FLIGHT CORE` title automatically collapses and slides in the new red `← ABORT` button during `screen-study`, `screen-test`, and `screen-feedback`.
4. **Briefing Timer Pause**: Trigger the abort modal during `screen-study`. Verify that the progress bar halts completely and the study timer numeric counter stops decrementing. Click **Keep Training** and confirm the timer resumes counting down.
5. **Escape Key Shortcut**: Hit `Escape` during the session. Check that the Abort modal appears. Hit `Escape` again to verify it closes cleanly.
6. **Debrief Screen Redirections**: Complete all 8 rounds. Confirm the debrief screen displays a secondary **HOME** button next to **RESTART**. Click **HOME** and verify it returns to `screen-home` with updated trend graphs.
