# FlightCore Typography Standardization, Contrast Legibility & UI De-Vibing Plan

This plan addresses font consistency, illegible tiny text, contrast ratios, and "vibe-coded" aesthetics across the entire Flight Core application UI and landing pages.

---

## User Review Required

> [!IMPORTANT]
> **Key Aesthetic & Ergonomic Improvements**:
> 1. **Dual Typography System**:
>    - **UI & Controls (`--font-sans`)**: Integrated Google Font `Inter` for clean headings, body text, buttons, modals, and landing pages.
>    - **Cockpit Telemetry & Data (`--font-mono`)**: Integrated Google Font `JetBrains Mono` for numeric readouts, digital gauges, altitude/airspeed figures, ATC callsigns, keypad displays, timer countdowns, and mathematical tokens.
> 2. **Font Size Scale Overhaul (Legibility)**:
>    - Micro font sizes (9px - 10px / `0.55rem` - `0.62rem`) used for labels, badges, instructions, and timestamps will be elevated to a minimum legible threshold of **`0.72rem` - `0.78rem` (~11.5px - 12.5px)** with proper font-weights and letter-spacing.
>    - Body text, buttons, cards, and input terminals will be standardized to **`0.88rem` - `0.95rem` (~14px - 15px)**.
> 3. **Contrast Ratio Audit (WCAG AAA Legibility)**:
>    - Contrast values across all 7 color themes (OLED Dark, Light, Mono, Sage, Warm, Amber, Stealth) will be upgraded.
>    - Muted text colors (`--text-muted`) will be brightened on dark themes (`#94A3B8` Slate-400 instead of dim `#64748B`) and darkened on light/warm themes (`#475569` Slate-600 / `#57534E` Stone-600).
> 4. **De-Vibing Visual Polish**:
>    - Remove aggressive arcade/neon glows, pulse shadows, and clashing gradients in favor of clean, solid, high-precision aerospace instrument borders and subtle status affordances.

---

## Proposed Changes

### Core UI & Styles (`styles.css`)

#### [MODIFY] [styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)
* **Font Token Setup**: Add `--font-mono: 'JetBrains Mono', 'SF Mono', 'Roboto Mono', monospace;`.
* **Theme Contrast Enhancements**: Update `--text-primary`, `--text-secondary`, `--text-muted` across default dark, light, mono, sage, warm, amber, and stealth themes to guarantee 7:1+ contrast on all card backgrounds.
* **Typography Scale Adjustment**:
  - Boost `.telemetry-label`, `.home-stat-label`, `.board-label`, `.module-family-heading`, `.module-select-text small`, `.onboarding-code-badge`, `.shortcut-badge`, `.gauge-shortcut-badge`, `.log-entry-date`, `.log-entry-badge`, `.type-tag`, `.cei-badge`, `.env-badge`, `.fault-step-title`, `.keypad-header-label`, `.module-instruction`, `.board-prompt`, `.module-stat-label`, `.module-stat-pct`, `.feedback-field`, `.atc-input-label`, `.pool-title`, `.wire-label` to `0.72rem` - `0.78rem`.
  - Apply `--font-mono` to `.telemetry-value`, `.gauge-value-display`, `.keypad-header-value`, `.keypad-btn`, `.balance-scale`, `.input-terminal`, `.onboarding-code-badge`, `.home-stat-num`, and SVG wire labels.
* **Remove Arcade/Vibe Glows**: Clean up drop-shadows, pulse glows, and neon borders on badges, dots, reticles, and cards for a sleek, authentic cockpit instrument look.

---

### Markup Structure (`index.html`)

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
* **Google Fonts Import**: Update `<link>` in `<head>` to import both `Inter:wght@400;500;600;700` and `JetBrains+Mono:wght@500;600;700`.

---

### Landing Page (`landing/index.html` & `landing/styles.css`)

#### [MODIFY] [landing/index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/landing/index.html)
#### [MODIFY] [landing/styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/landing/styles.css)
* Ensure font stacks, contrast, and element sizing match the main application design system.

---

## Verification Plan

### Automated Tests
* Run the existing engine test suite:
  ```powershell
  node tests.js
  ```
* Run syntax checking on JavaScript files:
  ```powershell
  node --check app.js
  node --check core.js
  ```

### Manual Verification
* Inspect text legibility across all 7 color themes (OLED Dark, Light, Mono, Sage, Warm, Amber, Stealth).
* Verify typography consistency (`Inter` for UI, `JetBrains Mono` for telemetry & numbers).
* Verify zero microscopic/unreadable font sizes on small/mobile screens.
* Check contrast ratios with browser accessibility tools.
