# FlightCore — Product & Game Expansion Research Report

**Document Version:** 1.0.0  
**Date:** August 2, 2026  
**Author:** AI Research Analyst  
**Target Repository:** `FlightCore` (`D:\Documents\Personal_Project\Google_AG\FlightCore`)

---

## 1. Executive Summary

FlightCore is a zero-build, offline-first Progressive Web App (PWA) delivering cockpit-inspired cognitive challenges. Designed with a dark glass UI, tactile controls, and zero external dependencies, FlightCore operates on pure vanilla JavaScript (`core.js` and `app.js`) with deterministic testing (`tests.js`).

While FlightCore currently possesses a strong foundation of 10 playable modules across 5 cognitive skill families (**Logical**, **Spatial**, **Visual**, **Memory**, **Advanced**), there is significant opportunity to heighten engagement, increase replayability, and expand cognitive challenge mechanics. 

This research report evaluates industry-standard pilot aptitude batteries (**NASA MATB-II**, **COMPASS**, **PILAPT**, **Cut-E / Aon**, **FEAST**) and cognitive training platforms (**Human Benchmark**, **Lumosity**) to synthesize:
1. **6 High-Impact New Game Modules** tailored for browser/touch/desktop.
2. **5 Core UX & Game Engine Enhancements** (Web Audio synthesis, Daily Seeded Flight Ops, Radar Spider Charts, Shareable Results).
3. **Prioritized MoSCoW Feature Matrix & Technical Execution Plan**.

---

## 2. Competitive Landscape & Cognitive Benchmark

Below is a comparative breakdown of public pilot aptitude frameworks, cognitive research platforms, and FlightCore's current vs. proposed module coverage:

| Assessment Platform | Key Modules / Mechanics | Target Cognitive Attributes | FlightCore Strategic Adaptation |
|---|---|---|---|
| **NASA MATB-II** | **RESMAN** (fuel balance), **SYSMON** (gauge monitoring), **COMM** (ATC audio), **TRACK** (reticle center) | Multi-Attribute Multitasking, Resource Management, Divided Attention | Adapt **RESMAN** into `Fuel Flow Balancer` and combine **SYSMON** into `Cockpit Capacity`. |
| **COMPASS / PILAPT** | Slalom tracking, Memory Chunking, Spatial Orientation, Mental Arithmetic | Psychomotor control, working memory, spatial orientation | Enhance `Attitude Vector` and introduce `Beacon Bearing` (RBI / Gyro). |
| **Cut-E (Aon)** | Relative Bearing Indicator (RBI), Moving Dots Count, Shape Deduction, Complex Pathing | Spatial reasoning, visual scanning discipline, deductive logic | Currently addressed by `Balance Bender` & `Wire Trace`. Extend to `Radar Separation`. |
| **Human Benchmark / Lumosity** | Chimp Test (spatial memory), Dual N-Back, Reaction Gate, Speed Match | Short-term spatial recall, working memory, impulse control | Introduce `Hydraulic Reaction Gate` and `Echo ATC Memory` (N-back audio/visual). |

---

## 3. Proposed New Game Modules

### Module 1: Fuel Flow & Pump Balancer (`fuel`) — *Logical / Advanced*
* **Inspiration:** NASA MATB-II RESMAN (Resource Management).
* **Mechanic:** 
  * Displays 4 fuel tanks (2 Main Tanks, 2 Auxiliary Tanks) connected by flow pipes with toggleable transfer pumps.
  * Fuel depletes from Main Tanks at a steady rate. Player must activate/deactivate pumps and balance transfer rates (e.g. +10 gal/sec from Aux A to Main A) to keep Main Tank fuel levels inside a highlighted green safety window.
* **Input Mode:** Direct tap/click on pump toggle switches (`PUMP 1`, `PUMP 2`, `CROSSFEED`).
* **Cognitive Value:** Dynamic fluid system balancing, mathematical rate estimation, spatial rule enforcement under time pressure.
* **Engine Feasibility:** Pure state calculation in `core.js` (array of tank levels and pump rates step per tick). 100% deterministic test coverage.

### Module 2: Beacon Bearing / RBI Orientation (`beacon`) — *Spatial*
* **Inspiration:** Cut-E / Aon Relative Bearing Indicator & Gyro Heading test.
* **Mechanic:** 
  * Shows an aircraft gyro compass card (e.g., Heading 090°) and a Relative Bearing Indicator (RBI) needle pointing relative to nose (e.g., 045° to the right).
  * Asks player to identify the true magnetic bearing to the beacon (090° + 045° = 135°) OR select the correct top-down map position relative to the VOR station from 4 graphical choices.
* **Input Mode:** 4 SVG map tiles or numeric keypad heading selector.
* **Cognitive Value:** Spatial perspective transformation, mental rotation, 2D vector addition.

### Module 3: Hydraulic Reaction Gate (`reaction`) — *Visual / Decision-Making*
* **Inspiration:** Reaction speed matching / V-speed flap deployment gates.
* **Mechanic:** 
  * Airspeed indicator sweeps rapidly across a dial.
  * Flight alerts flash target operating windows (e.g. "Deploy Flaps: 140–160 kts", "Gear Down: 180–200 kts").
  * Player must hit the tactile `ACTUATE` button *only* when the needle enters the green safe window, avoiding early hits or overshoots.
* **Input Mode:** Single large responsive touch pad / Spacebar.
* **Cognitive Value:** Impulse control, reaction speed, precise timing window matching.

### Module 4: Echo ATC Memory (`echo`) — *Memory / Dual N-Back*
* **Inspiration:** Auditory memory & Dual N-Back tests.
* **Mechanic:** 
  * Displays a sequential stream of clearance callouts (e.g. "Speed 240", "Heading 180", "Altitude 4000", "Speed 220").
  * Asks 1-back or 2-back queries: *"What was the altitude assigned 2 steps ago?"* or *"Did the current heading match the heading given 2 calls ago?"*
* **Input Mode:** Direct option cards or numeric input keypad.
* **Cognitive Value:** Auditory/visual working memory updating, interference control, N-back capacity.

### Module 5: 2D Radar Separation (`radar`) — *Advanced / Spatial*
* **Inspiration:** Air traffic control radar conflict detection (FEAST).
* **Mechanic:** 
  * Render a 2D radar screen with 3 aircraft blips moving along vector lines.
  * Each blip displays altitude and speed tags.
  * Player must identify which pair of aircraft will breach minimum separation (under 3 miles / 1,000 ft altitude) within 10 seconds, and issue a 15-degree turn vector to clear the conflict.
* **Input Mode:** SVG blip selection + turn vector button.
* **Cognitive Value:** Predictive trajectory projection, speed-distance-time estimation, conflict detection.

### Module 6: Horizon Pitch & Roll Scan (`horizon`) — *Spatial / Visual*
* **Inspiration:** FAA Spatial Disorientation & Gyro Attitude Trainer.
* **Mechanic:** 
  * Displays a stylized Attitude Indicator (Horizon Ball) with a specific pitch angle (e.g. +15° nose up) and roll bank (e.g. 30° left bank).
  * Player must select the matching 3D aircraft posture thumbnail from 4 outer choices.
* **Input Mode:** 4 card selection layout.
* **Cognitive Value:** Spatial orientation, instrument-to-visual conversion.

---

## 4. Product & UX Enhancements ("Making the Game Better")

### 1. Tactile Web Audio Synthesizer (Zero External Dependencies)
* **Current State:** Silent app relying solely on visual feedback.
* **Enhancement:** Implement a lightweight, pure Web Audio API synthesizer (`sound.js`) producing:
  * **Tactile Switch Click:** High-frequency 5ms sine pop on keypad taps.
  * **Altitude Warning Chime:** Dual-tone sine chime (800Hz + 1000Hz) on warnings.
  * **Success/Pass Sound:** Upward arpeggio chord (C5-E5-G5).
  * **Mistake Buzz:** Low sawtooth buzz (120Hz).
* **User Value:** Massive increase in tactile immersion, cockpit realism, and multi-sensory feedback without adding external audio files or asset bloat.

### 2. Daily Flight Ops (Global Seeded Challenge)
* **Current State:** Random session generation only.
* **Enhancement:** Generate a daily seeded flight plan using a deterministic PRNG based on UTC date (`YYYY-MM-DD`).
* **Features:**
  * Every player around the world receives the exact same sequence of 5 modules on a given day.
  * **Shareable Daily Score Card (Wordle-style):**
    ```text
    FlightCore Daily Ops #42 ⚡
    Score: 94% | Level 12 | Ace
    🧠 Logical:   🟩🟩🟩
    👀 Visual:    🟩🟩🟨
    🧭 Spatial:   🟩🟩🟩
    ⚡ Advanced:  🟩🟨🟩
    https://flightcore.app
    ```
* **User Value:** Social shareability, viral growth loops, daily engagement hook.

### 3. Interactive Skill Radar Chart (Spider Chart SVG)
* **Current State:** Text percentage indicators for competencies.
* **Enhancement:** Render an interactive 5-axis SVG spider radar chart on the post-session debrief screen mapping accuracy across **Logical**, **Spatial**, **Visual**, **Memory**, and **Advanced**.
* **User Value:** Visualizes cognitive strengths/weaknesses at a glance, delivering a premium "flight evaluation" aesthetic.

### 4. Dynamic Pressure & Flow-State Engine
* **Current State:** Fixed timer lengths per module level.
* **Enhancement:** Implement dynamic pressure scaling:
  * Fast correct responses incrementally shorten the decision timer and increase score multipliers.
  * Errors add slight timer leniency while lowering multiplier.
* **User Value:** Keeps novice players from feeling overwhelmed while giving expert players a high-octane flow state challenge.

---

## 5. Requirement Matrix (MoSCoW Framework)

| Category | Requirement Description | Domain | Priority |
|---|---|---|---|
| **Audio System** | Zero-dependency Web Audio API sound synthesizer with mute toggle | UX / Immersion | **Must Have** |
| **New Module** | Implement `Fuel Flow & Pump Balancer` (`fuel`) engine & renderer | Gameplay / Logical | **Must Have** |
| **New Module** | Implement `Beacon Bearing / RBI` (`beacon`) spatial engine & renderer | Gameplay / Spatial | **Must Have** |
| **Daily Ops** | Deterministic Daily Seeded Challenge with shareable text card | Retention / Social | **Must Have** |
| **Debrief UX** | SVG 5-axis Skill Radar Chart on debrief modal | UX / Visual | **Should Have** |
| **New Module** | Implement `Hydraulic Reaction Gate` (`reaction`) speed timing module | Gameplay / Visual | **Should Have** |
| **New Module** | Implement `2D Radar Separation` (`radar`) spatial trajectory module | Gameplay / Advanced | **Could Have** |
| **New Module** | Implement `Echo ATC Memory` (`echo`) N-back audio/visual memory module | Gameplay / Memory | **Could Have** |

---

## 6. Risk Register & Mitigations

| Risk Factor | Severity | Risk Impact | Mitigation Strategy |
|---|---|---|---|
| **Regulatory / Professional Misrepresentation** | Medium | Users assuming FlightCore is an official FAA/EASA exam prep | Retain strict positioning disclaimers ("Cockpit-inspired cognitive game; for entertainment only"). Avoid real aircraft manual copy. |
| **Audio Auto-Play Restrictions** | Low | Browsers blocking audio context initialization | Initialize Web Audio Context on the first user interaction (e.g. "Start" click). Provide audio mute toggle in settings. |
| **Mobile Screen Real Estate Clutter** | Medium | Complex modules (Fuel Balancer / Radar) becoming cramped on mobile | Design custom responsive SVG layouts with touch targets ≥ 48px. |
| **Engine Test Regression** | High | Core logic edits breaking existing 69/69 test suite | Maintain 100% pure function isolation in `core.js` and execute `node tests.js` on every change. |

---

## 7. Recommended Actionable Next Steps

1. **Phase 1 (Immediate Sprint):**
   * Integrate Web Audio Synthesizer in `app.js` / `core.js` for tactile audio feedback.
   * Add Daily Flight Ops seeded generator to `core.js` with shareable clipboard output.
2. **Phase 2 (Module Expansion Sprint):**
   * Build `Fuel Flow & Pump Balancer` logic in `core.js` with pure unit tests in `tests.js`.
   * Build `Beacon Bearing / RBI` spatial orientation logic in `core.js` with tests.
   * Add DOM renderers for both modules in `app.js` and styling in `styles.css`.
3. **Phase 3 (Analytics & Debrief Polish):**
   * Implement SVG 5-axis Skill Radar chart on debrief screen.
   * Run verification (`node tests.js` and `node --check app.js`).

---
*Report compiled following research analyst methodologies, codebase investigation, and competitive benchmark synthesis.*
