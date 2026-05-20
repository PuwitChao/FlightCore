# Flight Core Responsive & Multi-Theme Checklist (Apple UI Focus)

- `[x]` 1. Define the 5 CSS Apple-style themes in `styles.css` using custom properties (OLED Dark, Apple Light, Monochrome, Nordic Sage, Warm Sand) adhering strictly to Apple's design system principles.
- `[x]` 2. Implement the adaptive Tablet/PC dual-column grid layout in `styles.css` using `@media (min-width: 680px)` for side-by-side cockpit displays and inline keypads.
- `[x]` 3. Refactor `index.html` to add the theme toggle button in the dashboard, the sleek slide-up theme selection overlay, and appropriate layout wrappers.
- `[x]` 4. Bind physical keyboard event listeners in `app.js` to enable seamless typing, backspacing, and confirmations for gauge/frequency inputs on PC.
- `[x]` 5. Write the theme toggle, persistence (`localStorage`), and layout-adaptation scripts in `app.js`.
- `[ ]` 6. Verify across responsive views, commit all changes, and push to GitHub origin.
