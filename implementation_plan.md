# FlightCore Bauhaus Neo-Brutalist UI Alignment Plan

This plan aligns Flight Core with the Bauhaus neo-brutalist design system from `D:\Documents\Personal_Project\Google_AG\Spartial_cube\BAUHAUS_NEO_BRUTALIST_DESIGN_SYSTEM.md`, while retaining accessibility and professional UI guidance such as readable hierarchy, predictable controls, clear focus states, and resilient responsive behavior.

---

## Design Direction

> [!IMPORTANT]
> **Key aesthetic and ergonomic requirements**:
> 1. Use the approved warm paper canvas, light card surface, ink-black borders/text, and yellow/red/green/blue accent blocks.
> 2. Replace translucent glass, rounded Apple cards, soft shadows, ambient gradients, and blur effects with sharp rectangular panels and hard offset elevation.
> 3. Use `Space Grotesk` for display/header language, `Inter` for body/UI copy, and `JetBrains Mono` for telemetry, badges, and data.
> 4. Preserve WCAG-friendly contrast, visible `:focus-visible` rings, minimum touch target sizing, reduced-motion behavior, and scan-friendly density.
> 5. Keep the existing game behavior and theme selector functional; this pass is visual/theming only.

---

## Proposed Changes

### Core App (`styles.css`, `index.html`)

#### [MODIFY] [styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)
* **Token Layer**: Add Bauhaus tokens for paper/card/ink/accent colors, hard borders, zero radius, and offset elevation.
* **Effective Theme Override**: Make all existing theme values resolve to Bauhaus-compatible tokens so saved user theme state cannot reintroduce glassy Apple styling.
* **Component Geometry**: Normalize cards, dialogs, tabs, buttons, gauges, module cards, keypads, and overlays to sharp borders and offset shadows.
* **Accessibility Layer**: Use high-contrast focus rings, sufficient minimum target sizes, readable muted text, and reduced-motion-safe transitions.

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
* **Fonts & Metadata**: Import `Space Grotesk` alongside `Inter` and `JetBrains Mono`; update theme color to the paper background.
* **Theme Labels**: Rename visual theme options to Bauhaus-friendly labels without changing the underlying stored theme keys.

### Landing Page (`landing/index.html`, `landing/styles.css`)

#### [MODIFY] [landing/index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/landing/index.html)
#### [MODIFY] [landing/styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/landing/styles.css)
* Align landing typography, color, buttons, form controls, proof cards, and preview panels with the same Bauhaus system.
* Remove the dark radial gradient, rounded glass panels, and soft shadows.

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

### UI Review
* Serve the static app locally and inspect the main app plus landing page.
* Verify the effective UI uses paper/card/ink tokens, sharp geometry, hard offset elevation, no blur/glassmorphism, and no generic gradient/glow decoration.
* Check focus states, target sizes, text legibility, and responsive layout at desktop and mobile widths.
