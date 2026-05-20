# Flight Core - Responsive Layout & Multi-Theme System

We propose to scale **Flight Core** into a fully responsive, device-adaptive training application that feels premium and natively scaled on **Mobile, Tablet, and PC viewports**, while introducing a highly polished **Multi-Theme System** (Dark, Light, Monochrome, Sage Forest, and Warm Sand).

---

## User Review Required

> [!NOTE]
> All adjustments will be written using pure HTML5, CSS3 Custom Properties, and ES6 JavaScript. We will maintain zero dependencies and keep static deployability to **GitHub Pages** and **Cloudflare Pages** fully functional.

### 1. Adaptive Device Layouts (Mobile, Tablet, PC)
* **Media Query Architecture**: We will replace the rigid `.terminal-frame` max-width constraint with a fluid modern CSS Grid / Flexbox system.
  * **Mobile (< 680px)**: The current optimized single-column layout remains, with keypads docking smoothly at the bottom.
  * **Tablet/PC (≥ 680px)**: Splits the application into a dual-column cockpit layout:
    * **Left Column (Main Viewport)**: Dedicated to the active session screen (Briefing, Recall Test, Feedback, or final debrief).
    * **Right Column (Telemetry & Stats)**: Displays the permanent high scores, session history sparkline chart, and the interactive keypad inline (so it does not overlay or cover inputs).
* **Physical Keyboard Binding**: PC and Laptop users can use their physical keyboards:
  * Numbers `0-9` and `.` type directly into the focused gauge or ATC frequency/squawk field.
  * `Backspace` deletes, `Enter` confirms/submits, and `Escape` clears.

### 2. Multi-Theme Architecture (`data-theme`)
We will create a theme matrix in `styles.css` using CSS custom properties mapped to a `[data-theme]` attribute on the `<body>` element:

| Theme Name | Style Style | Background | Card Surfaces | Active Accent | Text Color |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🌌 **OLED Dark** | Sleek true dark | `#000000` | `rgba(22, 26, 35, 0.65)` | Apple Blue `#007AFF` | White `#F8FAFC` |
| ☀️ **Apple Light** | Crisp neutral white | `#FCFCFC` | `rgba(240, 242, 245, 0.7)` | Royal Blue `#0056D2` | Dark Slate `#0F172A` |
| 🔲 **Monochrome** | High contrast gray | `#121212` (or light) | `rgba(30, 30, 30, 0.8)` | Bright White `#FFFFFF` | Light Gray `#E5E7EB` |
| 🌲 **Nordic Sage** | Soft organic forest | `#1A221E` | `rgba(32, 42, 37, 0.7)` | Sage Emerald `#10B981` | Off-White `#ECFDF5` |
| 🥪 **Warm Sand** | Cozy warm minimal | `#FAF6F0` (light) | `rgba(242, 237, 228, 0.8)`| Terracotta `#D97706` | Deep Cocoa `#292524` |

* **Theme Switcher Interface**: We will add a discreet, modern icon button in the header dashboard. Tapping it opens a clean slide-up selector showing colored circles for each theme.
* **Persistence**: Active choice is written to `localStorage` and automatically loaded on startup to prevent flash-of-unstyled-theme.

---

## Proposed Changes

### 1. Stylesheet Upgrades (`styles.css`)
- **Theme Variables Map**: Redefine root colors to support `[data-theme="light"]`, `[data-theme="mono"]`, `[data-theme="sage"]`, and `[data-theme="warm"]`.
- **Responsive Cockpit Grid**:
  - Implement `@media (min-width: 680px)` styles.
  - Re-align `.terminal-frame` to grow up to a max-width of `960px` on PC with an elegant double-column grid layout (`grid-template-columns: 1.2fr 0.8fr`).
  - Keep components responsive and fluid.

### 2. Markup Refactoring (`index.html`)
- **Add Theme Selector Trigger**: Elegant floating icon in the top header.
- **Add Selector Overlay Modal**: A beautiful, translucent slider at the bottom of the viewport containing selectable theme capsules.
- **Slight Re-structuring**: Wrap content columns so they transition cleanly from standard stacked columns to side-by-side structures.

### 3. Logic & Event Bindings (`app.js`)
- **Theme Switcher Logic**: Add functions to set, store, and toggle active themes.
- **Physical Keyboard Listeners**: Add standard keydown event bindings when in the recall test stage, routing inputs directly into `updateFocusedInputWithValue()`.
- **Responsive Chart Scaling**: Update SVG sparkline calculations to adapt width dynamically based on the responsive wrapper size.

---

## Verification Plan

### Automated & Manual Verification
1. **Multi-device Testing**: Simulate viewport scales across standard profiles:
   * iPhone 15 (393px width - single column).
   * iPad Air (820px width - side-by-side tablet grid).
   * Desktop Monitor (1440px width - dual column spacing).
2. **Keyboard Mapping Audit**: Ensure that pressing keys on a physical PC keyboard correctly updates the active field, matches backspace deletions, and confirms inputs on enter.
3. **Contrast Validation**: Check light, dark, sage, sand, and monochrome combinations against WCAG AA requirements.
