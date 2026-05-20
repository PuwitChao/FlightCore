# Flight Core Memory Trainer - Modern Minimalist UI Redesign

The user has requested a shift in the aesthetic of **Flight Core** from the current retro-terminal "tron-like" CRT style to a **clean, modern, minimalist sans-serif mobile-first UI** (similar to Apple Weather, Linear, or premium mobile dashboard applications). This plan outlines the details to completely transform the visual system while preserving the fully functional game loop, Web Audio synthesizer, and state mechanics.

---

## User Review Required

> [!NOTE]
> All changes are client-side only (zero compile/build steps) to maintain compatibility with direct, zero-config hosting on **Cloudflare Pages** from the root folder `./`. We will preserve 100% of the game logic, difficulty scaling, audio synth, and RNG pools.

### Proposed Aesthetic Philosophy:
1. **Palette**: Deep True Black OLED (`#000000`) background combined with glassmorphic cards (`rgba(22, 26, 35, 0.65)`), thin premium borders (`rgba(255, 255, 255, 0.08)`), and vibrant, modern accent states (Vibrant iOS Blue `#007AFF`, soft success emerald `#10B981`, clean rose-red `#EF4444`).
2. **Typography**: Universal Inter sans-serif font family. **Absolutely no monospace fonts, neon glows, or retro-terminal scanlines.** Text hierarchy will be established through font weight (Medium, Semi-Bold, Bold) and size, rather than neon colors.
3. **Responsive Details**: Premium micro-interactions (soft scale taps under 100ms, smooth page slides, card border transitions) optimized specifically for mobile touch devices.
4. **Wording Shift**: Scrubbing retro jargon (like "COLD START", "TELEMETRY", "WORKCYCLE") and replacing them with modern, high-end pilot training terms.

---

## Proposed Changes

### 1. Style System Redesign (`styles.css`)

We will completely rewrite `styles.css` to build an elegant glassmorphic dark mode:
- **Clean Color Variables**:
  - `--bg-dark`: `#000000` (deep true black, perfect for high-end OLED mobile screens).
  - `--bg-card`: `rgba(22, 26, 35, 0.6)` (sleek slate translucent cards).
  - `--bg-input`: `rgba(32, 38, 48, 0.5)` (minimal text-field backgrounds).
  - `--border-subtle`: `rgba(255, 255, 255, 0.06)`.
  - `--border-active`: `rgba(0, 122, 255, 0.4)` (sapphire glow).
  - `--accent-blue`: `#007AFF` (Apple-style vibrant blue).
  - `--success-emerald`: `#10B981` (clean, highly readable green).
  - `--error-rose`: `#EF4444` (sleek coral-red).
- **Typography & Font**:
  - Universal sans-serif (`Inter`, system-ui, sans-serif).
  - Remove all monospace styles.
  - Modern UI letter-spacing and varying text-weights.
- **Card Aesthetics**:
  - Remove all CRT filters, phosphor glows, scanlines, and high-contrast retro styling.
  - High corner radiuses (`20px` for panels, `14px` for buttons and dials).
  - Glassmorphic backdrop blurring (`backdrop-filter: blur(20px)`).
- **Control Revamp**:
  - **Pill-shaped or slightly rounded buttons** with clean typography, eliminating aggressive block structures.
  - **Interactive Keypads**: Clean, beautifully styled grids representing iOS-style tactile keys (`#1C1F26` backgrounds, no aggressive neon borders).
  - **SVG Gauges**: Clean, sleek lines with sharp text indicators inside, discarding terminal dials.

### 2. Markup Refactoring (`index.html`)

We will refactor `index.html` to simplify structural wrappers and wording:
- **Clean Header Dashboard**:
  - Wording: `FLIGHT CORE // OPERATIONAL CONSOLE` $\rightarrow$ `FLIGHT CORE`
  - Score, Streak, Round, and Level indicators grouped in a clean horizontal flex bar.
- **Card Layouts**:
  - Remove all inline style overrides that force `font-family: var(--font-mono)`.
  - Simplify card header text (e.g. remove trailing tags or terminal prefixes).
- **Sleek Input Fields & Interactive Keys**:
  - Refactor active keyboard previews to show elegant iOS-style header bubbles instead of terminal command-line styles.
  - Replace icons and retro tags with clean, modern text.

### 3. Jargon & Dynamic Dynamic Styling Scrub (`app.js`)

We will clean up `app.js` outputs to align with modern clean flight training:
- **Terminology Updates**:
  - `"SYSTEM ENGAGE (COLD START)"` $\rightarrow$ `"Start Session"`
  - `"TECHNICAL BRIEFING: MASTER DATA"` $\rightarrow$ `"Briefing"`
  - `"RECONSTRUCT TELEMETRY DATA"` $\rightarrow$ `"Recall"`
  - `"NOMINAL // STATUS OK"` $\rightarrow$ `"Correct"`
  - `"TELEMETRY ERROR DETECTED"` $\rightarrow$ `"Incorrect"`
  - `"RESUME WORKCYCLE"` $\rightarrow$ `"Continue"`
  - `"WORKCYCLE COMPLETE"` $\rightarrow$ `"Session Completed"`
  - `"RE-ENGAGE SYSTEM"` $\rightarrow$ `"Restart Session"`
  - `"COGNITIVE BLINDSPOTS FLAGGED"` $\rightarrow$ `"Areas for Review"`
- **SVG Sparkline Refactoring**:
  - The chart will render a clean, modern gradient stroke (from Sapphire blue to soft cyan) on a deep background, utilizing Inter sans-serif text labels. No glowing CRT filters.
- **Web Audio Tones**:
  - Maintain the clean Web Audio double-chime for success and short buzz for error, keeping audio cues modern and crisp.

---

## Verification Plan

### Automated & Manual Verification
1. **Responsive Mobile Check**: Render with a modern mobile viewport (e.g., iPhone 15 size: 393px width) to verify all touch targets and input screens adapt flawlessly without overflow.
2. **Contrast & Legibility Check**: Ensure that all white text on dark card surfaces complies with WCAG AA standard (contrast $\ge 4.5:1$).
3. **Regression Testing**: Validate that:
   - Module rotation logic works ("No 3x Repeat").
   - Score & streak scale correctly with difficulty.
   - Dynamic SVG gauges and sparkline charts load correctly.
   - Local storage updates successfully.
