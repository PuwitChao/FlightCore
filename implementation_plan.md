# FlightCore Technical Performance Analytics, Visual Charts & UI Polish Plan

## Executive Summary

The goal of this sprint is to add deep technical performance analytics, per-question response timing breakdown, cognitive question-style error analytics, and **lightweight, pure SVG visual data charts** (Spider Radar Chart, Timing Histogram, and Cognitive Style Comparison Bars) to FlightCore while performing a complete UI, theme, typography, color, and positioning polish across all 7 themes (`dark`, `light`, `mono`, `sage`, `warm`, `amber`, `stealth`).

---

## Strict UI Consistency & Aesthetics Guarantee

To ensure no element looks or feels out of place:

1. **Harmonious Multi-Theme Coloring**:
   - All chart elements, axis lines, radar polygons, histogram bars, and text badges will strictly consume CSS variable tokens (`var(--bg-card)`, `var(--border-subtle)`, `var(--border-active)`, `var(--accent-blue)`, `var(--accent-cyan)`, `var(--accent-amber)`, `var(--success-emerald)`, `var(--error-rose)`).
   - Automatic 100% theme inheritance across all 7 built-in themes.
2. **Typography & Font Hierarchy**:
   - Clean alignment with `--font-sans` (`Inter` typography system).
   - Symmetrical padding, generous letter-spacing for eyebrow copy (`letter-spacing: 0.5px; font-weight: 700; font-size: 0.65rem;`), and legible numerical readouts.
3. **Cockpit Geometry & UI Positioning**:
   - Card containers use uniform `--radius-md` (14px) and `--radius-sm` (10px) with identical padding.
   - Perfectly centered SVG viewports with responsive grid fallbacks for mobile (<380px), tablet, and desktop cockpit layouts.
4. **Anti-AI-Slop Tactile Polish**:
   - Subtle glowing borders (`box-shadow: 0 0 10px var(--accent-blue-glow)`), backdrop blurs (`backdrop-filter: blur(12px)`), and smooth micro-transitions (`transition: all var(--transition-fast)`).

---

## Technical Architecture & Visual Data Charts

### 1. Pure SVG 5-Axis Skill Radar Chart (`#debrief-radar-chart`)
- **Concept**: A 5-point polygonal spider chart comparing target benchmark (80%) against actual player accuracy across the 5 skill families: `Memory`, `Visual`, `Spatial`, `Logical`, `Advanced`.
- **Implementation**: Pure SVG element generated in `core.js` / `app.js` using polar coordinate calculations:
  \(x = cx + r \times \cos(\theta), \quad y = cy + r \times \sin(\theta)\)

### 2. Response Time Histogram & Timing Chart (`#debrief-timing-chart`)
- **Concept**: A bar chart displaying exact response time (seconds) for each round (R01 through R08), color-coded by accuracy grade:
  - Green/Emerald: 100% Perfect
  - Amber: Partial / Saved
  - Rose/Red: Missed / Failed
- **Mean Pace Line**: Overlay dashed line indicating average response time per prompt.

### 3. Cognitive Style Comparison Meters (`#debrief-style-meters`)
- **Concept**: Comparative progress meters showing accuracy % and average response speed (seconds) across 4 cognitive question styles:
  - `Sequential Memory` (Checklist, Clearance)
  - `Quantitative Scanning` (Instruments, Target Scan)
  - `Logical Deduction` (Fault, Balance Bender)
  - `Spatial Orientation` (Attitude Vector, Wire Trace)

---

## Proposed Changes

### Core Engine & Analytics (`core.js`)

#### [MODIFY] [core.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/core.js)
- Add `analyzeTechnicalPerformance(rounds)` pure helper function:
  - **Response Timing**: Computes average, fastest, and slowest response times per question/round (ms), and assigns a speed cadence grade (*Lightning Fast*, *Optimal Cadence*, *Deliberate Pace*, *Hesitant*).
  - **Question-Style Analytics**: Aggregates accuracy %, response speed, mistake count, and total prompts across cognitive question styles.
  - **SVG Chart Math Helpers**: Polar coordinate math helper `generateRadarPolygon(skillAverages)` and histogram SVG builder `generateTimingHistogram(rounds)`.
  - **Cognitive Efficiency Index (CEI)**: Formulates an overall score blending accuracy and speed.

---

### Automated Tests (`tests.js`)

#### [MODIFY] [tests.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/tests.js)
- Add unit tests for `analyzeTechnicalPerformance` and SVG geometry helpers:
  - Test response timing calculations (average, fastest, slowest).
  - Test cognitive question-style breakdown accuracy & response speeds.
  - Test SVG radar polygon point generation and histogram scaling.

---

### UI Styling & Aesthetics (`styles.css`)

#### [MODIFY] [styles.css](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css)
- Add professional cockpit telemetry UI card primitives and SVG chart styling:
  - `.telemetry-analytics-card` (Dark glass container with subtle glowing borders).
  - `.radar-chart-svg` & `.radar-polygon` (Polygonal web, axis grid lines, and filled performance polygon).
  - `.timing-histogram-svg` & `.histogram-bar` (Interactive bar chart with hover tooltips).
  - `.cei-badge` (Glow badge for Cognitive Efficiency Index).

---

### Markup & Component Containers (`index.html`)

#### [MODIFY] [index.html](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html)
- Add `#debrief-technical-analytics` section inside `#screen-debrief`:
  - Radar Chart Container
  - Timing Histogram Container
  - Cognitive Style Progress Meters Container

---

### Controller & Rendering Glue (`app.js`)

#### [MODIFY] [app.js](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js)
- Wire `analyzeTechnicalPerformance` into `showDebriefScreen()` and render the SVG radar chart, timing histogram, and cognitive style meters.
- Ensure 100% theme consistency across dark, light, mono, sage, warm, amber, and stealth themes.

---

## User Review Required

> [!NOTE]
> **Zero Dependencies & Full Theme Integration**: SVG graphs are rendered using native SVG markup generated by pure functions in `core.js`, maintaining offline PWA fast load times without any third-party JS packages, and dynamically styling via theme tokens.

---

## Verification Plan

### Automated Tests
- Execute `node tests.js` to verify analytics and SVG chart generation assertions.
- Execute `node --check app.js`, `node --check core.js`, `node --check sw.js` for syntax validation.

### Manual Verification
- Complete a Mock Run (8 rounds) and inspect the SVG Radar Chart, Response Time Histogram, and Cognitive Style Meters on the debrief screen.
- Test across theme toggles (Dark, Light, Amber, Stealth).
