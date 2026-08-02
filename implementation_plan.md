# FlightCore Module Expansion & Anti-AI-Slop Premium UI Plan

This plan details the implementation of 4 new cockpit cognitive challenge modules (`fuel`, `beacon`, `radar`, `horizon`), an interactive 5-axis SVG Skill Radar Chart for session debriefs, and a dynamic flow-state pressure engine to scale timers and score multipliers based on player performance streaks.

---

## Anti-AI-Slop & Premium Cockpit UI Design Guarantee

To ensure all new game UIs feel like authentic, state-of-the-art cockpit instrumentation rather than generic "AI-slop":

1. **Tactile Interactive States**: All buttons, toggle switches, map cards, and blip selectors feature explicit hover, focus, and active pressed states using subtle glow box-shadows (`box-shadow: 0 0 12px var(--accent-blue-glow)`), active borders, and CSS micro-transitions (`transition: all var(--transition-fast)`).
2. **Typography & Metric Layouts**: Monospace telemetry readouts use crisp numerical spacing with subtle uppercase tracking for eyebrow copy (`letter-spacing: 0.5px; font-weight: 700; font-size: 0.65rem;`).
3. **Harmonious Multi-Theme Integration**: Every visual element (tanks, dials, radar sweep grid, attitude spheres, radar chart polygons) consumes standard CSS custom property tokens (`var(--bg-card)`, `var(--border-subtle)`, `var(--border-active)`, `var(--accent-blue)`, `var(--accent-cyan)`, `var(--accent-amber)`, `var(--success-emerald)`, `var(--error-rose)`) across all 7 built-in themes (`dark`, `light`, `mono`, `sage`, `warm`, `amber`, `stealth`).
4. **Cockpit Geometry & Precision Vector Graphics**:
   * **Fuel Balancer (`fuel`)**: Vector fluid tank gauges with dynamic volume bars, fill percentage indicators, animated green/amber pipe flow arrows, and tactile pump toggle switches.
   * **Beacon Bearing / RBI (`beacon`)**: Crisp 360-degree Gyro Compass dial with cardinal directions (N, E, S, W), needle vector, and 4 top-down VOR map quadrant cards.
   * **2D Radar Separation (`radar`)**: Phosphor-grid radar screen with concentric distance rings (3nm, 6nm, 9nm), animated rotating radar sweep line, blip altitude/speed data tags, and red/amber hazard vector lines.
   * **Attitude Horizon Scan (`horizon`)**: Authentic Horizon Ball SVG with sky blue / ground amber division, pitch ladder (+10°, +20°, -10°, -20°), roll bank pointer, and 4 vector aircraft 3D posture thumbnails.
   * **5-Axis SVG Radar Chart**: Polished SVG spider web grid with labeled domain vertices, benchmark polygon overlay, and player skill polygon with subtle glow fill.
5. **No Emoji Policy**: Zero emojis in UI copy, code comments, or documentation.

---

## Proposed Changes

### Pure Engine Logic & Module Generators (`core.js`)

#### [MODIFY] [core.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/core.js)
* **Module Metadata & Registry**: Register `fuel` (Logical/Advanced), `beacon` (Spatial), `radar` (Advanced/Spatial), and `horizon` (Spatial/Visual) in `MODULE_METADATA` and `CHALLENGE_MODULE_KEYS`.
* **Fuel Flow Balancer Engine (`generateFuelChallenge`, `fuelAccuracy`)**:
  * Generate 4 tank states (Main Tank A, Main Tank B, Aux Tank A, Aux Tank B).
  * Calculate pump flow rates, target fuel windows (40-60 gal), and pump toggle validation.
* **Beacon Bearing RBI Engine (`generateBeaconChallenge`, `beaconAccuracy`)**:
  * Generate Gyro Compass Heading (000°-359°) and Relative Bearing Indicator (RBI) angle (000°-359°).
  * Compute magnetic bearing to station and generate 4 top-down VOR map quadrant options (1 correct, 3 plausible distractors).
* **2D Radar Separation Engine (`generateRadarChallenge`, `radarAccuracy`)**:
  * Generate 3 radar aircraft blips with 2D positions, vector headings, speeds, and altitudes.
  * Deterministically set 1 conflict pair on an impending collision trajectory within 10 seconds.
* **Horizon Pitch & Roll Scan Engine (`generateHorizonChallenge`, `horizonAccuracy`)**:
  * Generate pitch (-30° to +30°) and bank/roll (-45° to +45°) parameters for an Attitude Indicator.
  * Generate 4 aircraft posture card options (1 matching target, 3 distinct attitude variations).
* **Dynamic Flow-State Engine (`computeFlowStateParams`)**:
  * Compute timer duration scaling `(1.0 - clamp(streak * 0.04, 0, 0.4))` and streak multiplier progression.
* **5-Axis SVG Skill Radar Chart Engine (`generateSkillRadarSVG`)**:
  * Compute polar coordinates for 5 skill family axes (`logical`, `spatial`, `visual`, `memory`, `advanced`) and return clean SVG markup.

---

### Automated Unit Tests (`tests.js`)

#### [MODIFY] [tests.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/tests.js)
* Add unit test suites for all 4 new generators and validators (`fuel`, `beacon`, `radar`, `horizon`).
* Test dynamic flow-state pressure math across streaks 0 to 20+.
* Test 5-axis SVG skill radar chart polar coordinate calculations.
* Ensure all 92+ assertions remain 100% green.

---

### UI Styling & Themes (`styles.css`)

#### [MODIFY] [styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)
* Add styles for Fuel Flow Balancer tank gauges, pipe connectors, and pump toggle switches with active LED states.
* Add styles for Beacon Bearing RBI dial, compass card, and VOR map quadrant cards.
* Add styles for 2D Radar screen canvas/SVG, blip markers, altitude tags, and conflict alert vectors.
* Add styles for Horizon Ball indicator gauge and 3D posture selection cards.
* Add styles for 5-axis SVG spider radar chart and legend badges.

---

### Markup Containers (`index.html`)

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
* Add game module container markup for `#module-fuel`, `#module-beacon`, `#module-radar`, `#module-horizon`.
* Add 5-axis SVG Skill Radar Chart container inside `#screen-debrief`.

---

### Controller Glue & Module Renderers (`app.js`)

#### [MODIFY] [app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)
* Add UI rendering logic and event handlers for the 4 new modules (`renderFuel`, `renderBeacon`, `renderRadar`, `renderHorizon`).
* Wire flow-state timer scaling into `startModuleRound()`.
* Wire `generateSkillRadarSVG` into `showDebriefScreen()`.

---

## Verification Plan

### Automated Tests
* Run unit test suite:
  ```powershell
  node tests.js
  ```
* Run JavaScript syntax checks:
  ```powershell
  node --check core.js
  node --check app.js
  node --check sw.js
  ```

### Manual Verification
* Test playing each of the 4 new modules (`fuel`, `beacon`, `radar`, `horizon`) in Practice mode and Mock Run.
* Complete a full session to verify the 5-axis SVG Skill Radar Chart on the debrief modal.
* Test responsiveness across mobile, tablet, and widescreen desktop.
* Verify clean rendering across all 7 color themes (`dark`, `light`, `mono`, `sage`, `warm`, `amber`, `stealth`).
