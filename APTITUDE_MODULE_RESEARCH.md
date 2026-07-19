# FlightCore Aptitude Module Research

Generated: 2026-07-19

## Executive Summary

FlightCore already has a strong base for cockpit-flavored memory and scanning play: Checklist, Instruments, ATC, and Fault modules, local history, module accuracy, streaks, and static-PWA delivery. The biggest product improvement is to expand from four aviation-flavored recall tasks into a broader aptitude-game suite with five clear skill families:

- Logical: rule deduction, balance/weight reasoning, matrix completion, mechanical reasoning.
- Spatial: attitude/orientation, 3D rotation, perspective shifts, relative bearing.
- Visual: high-speed scan, monitoring, wire/path tracing, target detection.
- Memory: short-term recall, chunking, interrupted recall, visual object memory.
- Advanced: mental arithmetic, tracking, divided attention, psychomotor multitask.

The safest positioning is still "cockpit-inspired cognitive challenge game", not "pilot test prep" or "training". The game can borrow task mechanics from public aptitude-test categories while keeping content original, stylized, and non-authoritative.

## Source-Driven Findings

Public descriptions of COMPASS emphasize a broad battery rather than a single puzzle type: coordination/control, tracking/slalom, a task manager that combines screen scanning with concurrent tasks, short-term memory/chunking, applied mathematics, orientation using instruments and spatial reasoning, technical comprehension, aviation English, and verbal reasoning. Source: https://epst.nl/en/cadet-selection-compass/

Public PILAPT descriptions overlap strongly with the sample screenshots: mental arithmetic; deviation indicator/crosshair tracking plus secondary auditory memory; concentration over changing colored letters or symbols; hands/spatial transformation; hidden pattern detection in complex line drawings; generated-box pursuit tracking; and capacity tests combining tracking with two secondary tasks. Source: https://pilotaptitudetest.com/pilapt-pilot-assessment-guide-2026/

Public Aon/CUT-E style practice descriptions add useful browser-friendly mechanics: shape matrices for deductive logic, relative bearing indicator questions, moving-dot monitoring, reaction-speed matching, memory-picture recognition, matrix comparison, and multitask games that combine control, equations, and duplicate-letter/auditory detection. Sources: https://www.pilotest.com/en/tests/shapes, https://www.pilotest.com/en/tests/rbi, https://www.pilotest.com/en/tests/movingdots, https://www.pilotest.com/en/tests/multitasking

For aviation relevance without overclaiming, spatial orientation is a credible anchor because FAA safety material describes spatial disorientation as a mismatch between body senses and aircraft position/motion, and emphasizes reliance on instruments. Source: https://www.faa.gov/pilots/training/airman_education/topics_of_interest/spatial_disorientation

Research summaries also support working memory as relevant to pilot-candidate outcomes, especially spatial working memory and visual perspective taking. This supports adding memory and spatial tasks, but not claiming FlightCore predicts real pilot success. Source: https://trid.trb.org/View/1579169

## Competitive Pattern Map

| Skill family | Representative public aptitude mechanics | FlightCore opportunity |
|---|---|---|
| Logical | Matrix completion, rule deduction, balance puzzles, mechanical/physics questions | Add `Balance Bender`, `Systems Matrix`, and `Mechanical Snap` modules. |
| Spatial | RBI/gyro orientation, attitude interpretation, 3D object rotation, perspective-taking | Add `Attitude Vector`, `Beacon Bearing`, and later a lightweight 3D `Intercept` mode. |
| Visual | Moving-dot count, symbol matching, wire tracing, hidden shape detection, reaction match | Add `Wire Trace`, `Target Scan`, `Pattern Ghost`, and `Reaction Gate`. |
| Memory | Numeric/object recall, ATC-like chunking, delayed recall after interruption | Extend ATC into `Clearance Recall`; add `Visual Manifest` and interrupted memory rounds. |
| Advanced | Tracking plus math/audio/symbol tasks, speed-distance-time arithmetic, capacity tests | Add `Aero Intercept`, `FMS Tuner`, and `Cockpit Capacity` as capstone modes. |

## Sample Screenshot Interpretation

Image 1 resembles a compensatory tracking / target capture task: keep or move a controlled cursor relative to changing colored targets while timing the capture. FlightCore can implement a 2D version with pointer, keyboard, and touch before attempting full 3D.

Image 2 is a balance/rule-deduction puzzle. The left scale defines an equivalence rule; the right scale asks which option balances the unknown side. This is the clearest first Logical module because it is deterministic, easy to test in `core.js`, and fits static HTML/SVG.

Image 3 is a wire/path tracing visual-search task. It rewards scanning discipline, not memory. It can be generated as orthogonal SVG polylines with crossings, labeled starts/ends, and one-click answer selection.

Image 4 is a 3D intercept/multitask cockpit. It combines tracking, altitude-band keeping, target engagement, timer pressure, and secondary questions. This should be a later Advanced module because it needs canvas/game-loop work, responsive input tuning, and performance QA.

## Recommended Product Architecture

Keep the current static-first architecture. Add modules as data-driven engines in `core.js` first, then renderers in `app.js`:

- `core.js`: pure generators, answer validators, scoring, difficulty curves, seeded daily challenge support.
- `app.js`: DOM/SVG/canvas rendering, pointer/keyboard/touch input, timers, localStorage persistence.
- `tests.js`: deterministic tests for each generator and scorer.
- `styles.css`: shared module layout primitives, answer tiles, SVG board sizing, cockpit HUD components.

Do not add a framework for the next two or three modules. Balance, wire tracing, matrix, and memory tasks are straightforward with vanilla JS and SVG. Reconsider a library only for true 3D/canvas physics.

## Priority Backlog

### P0: Skill Taxonomy and Stats Upgrade

Add a stable skill taxonomy separate from module ids:

- `logical`
- `spatial`
- `visual`
- `memory`
- `advanced`

Each round should record `{ module, skillFamily, accuracy, responseMs, difficulty, mistakes }`. This unlocks better debriefs and lets modules rotate by cognitive domain, not just by individual module name.

Acceptance criteria:

- Existing four modules still work.
- Session debrief shows family-level strengths/weaknesses.
- Local history remains backward-compatible.
- Tests cover aggregation when old records lack `skillFamily`.

### P1: Balance Bender

Build the logical balance puzzle from Image 2.

Mechanic:

- Generate 2-3 colored shape types with hidden integer weights.
- Show a rule scale establishing equivalence, such as 2 orange squares = 1 green block.
- Show a question scale with known left side and unknown right side.
- Present 4-5 answer choices, exactly one correct.

Why first:

- High player clarity.
- No real aviation procedure risk.
- Pure generation and scoring are easy to test.
- Uses the current answer-card UI pattern.

Difficulty:

- Level 1-2: one equivalence rule, one-step arithmetic.
- Level 3-5: two rules, mixed shapes.
- Level 6+: distractors with near-miss quantities and shape swaps.

### P1: Wire Trace

Build the visual scanning puzzle from Image 3.

Mechanic:

- Generate start labels A-L and end labels 1-12.
- Draw orthogonal SVG paths with deliberate crossings but no actual branches.
- Ask the player to identify the endpoint for a highlighted start, or the start for a highlighted endpoint.

Why second:

- Strong visual differentiation from current modules.
- Very browser-friendly with SVG.
- Pairs well with timed mock-exam sessions.

Implementation caution:

- Generate paths on a grid and store the logical mapping separately from the visual path. Do not infer answers from SVG geometry.
- Keep crossings visually clear; use small bridge gaps or over/under styling at intersections.

### P2: Target Scan

Build a visual attention module from moving-dot / symbol-monitoring patterns.

Mechanic:

- Present a grid or radar field with changing symbols.
- Prompt for count, color/shape match, or "press when target condition appears".
- Score both accuracy and reaction time.

Why third:

- Complements Wire Trace with speed rather than tracing.
- Can reuse the timer, HUD, and module accuracy systems.

### P2: Clearance Recall 2.0

Extend current ATC into a stronger memory module.

Mechanic:

- Brief exposure: callsign, altitude, heading, speed, frequency, squawk.
- Insert a short distractor task.
- Recall the clearance fields.

Why:

- Public aptitude descriptions repeatedly emphasize short-term memory and chunking.
- FlightCore already has ATC pools and input UI, so this is a low-risk upgrade.

### P3: Attitude Vector / Beacon Bearing

Build a spatial module around attitude, heading, and relative bearing.

Mechanic:

- Show simplified attitude indicator, heading, and beacon bearing.
- Ask the player to select aircraft orientation or beacon sector.

Why later:

- Higher risk of feeling like direct exam prep.
- Needs careful copy: "orientation puzzle", not real instrument instruction.

### P4: Aero Intercept / Cockpit Capacity

Build the advanced capstone inspired by Image 4.

Mechanic:

- Primary continuous control: maintain altitude band or center reticle.
- Secondary tasks: simple arithmetic, target color callouts, memory recall, or warning acknowledgements.
- Session lasts 90-180 seconds with adaptive event density.

Why later:

- Highest UX and technical complexity.
- Needs canvas performance checks, touch controls, keyboard controls, and responsive QA.
- Adds the most differentiation once foundation modules prove engagement.

## Scoring Improvements

Current FlightCore scoring mostly treats a round as correct/partial/failed. New aptitude modules should capture:

- Accuracy percentage.
- Response time in milliseconds.
- Error type, such as wrong item, over-selection, missed target, false alarm, timeout.
- Pressure profile, such as timer duration, distractor count, concurrent task count.
- Control stability for tracking tasks, such as mean distance from target and time in band.

Recommended score formula:

```text
roundScore = baseAccuracyScore * difficultyMultiplier + speedBonus - errorPenalty
```

For tracking tasks:

```text
trackingAccuracy = 100 - clamp(meanDistanceFromTarget / maxAllowedDistance * 100, 0, 100)
```

Keep these as pure helpers so the test suite can validate edge cases without DOM or canvas.

## UX Improvements

- Add a module catalog grouped by skill family instead of a flat four-card selector.
- Add "Practice" and "Mock Run" modes. Practice allows slower timers and explanations; Mock Run hides explanations and uses stricter timing.
- Add post-round explanation only after answer submission. This improves learnability without interrupting the game loop.
- Add a "weakest skill" recommendation on the home screen using family-level history.
- Add daily challenge seeds so all users see the same generated run each day.
- Keep Thai/English category labels available as display copy, but keep internal ids English and stable.

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Product drifts into real pilot-test-prep claims | Legal and trust risk | Keep visible disclaimers and game copy; avoid airline/test-name claims in user-facing UI. |
| Too many modules make the app feel scattered | Retention risk | Introduce skill families and curate default sessions. |
| Advanced 3D mode performs poorly on mobile | UX risk | Ship 2D/SVG modules first; use canvas only after profiling. |
| Random generators create impossible or ambiguous puzzles | Gameplay risk | Put all answers in generated data, test uniqueness, and run deterministic seeded tests. |
| Touch controls feel worse than desktop | UX risk | Design every module with touch-first target sizes and no hover dependency. |

## Recommended Next Steps

1. Implement P0 skill taxonomy and history schema upgrade.
2. Implement `Balance Bender` as the first new Logical module.
3. Implement `Wire Trace` as the first Visual module.
4. Add family-level debrief and weakest-skill recommendation.
5. Only after those are stable, prototype `Aero Intercept` as a separate canvas experiment.

## Source Links

- EPST COMPASS overview: https://epst.nl/en/cadet-selection-compass/
- PILAPT assessment guide: https://pilotaptitudetest.com/pilapt-pilot-assessment-guide-2026/
- Pilotest Aon/CUT-E shape logic: https://www.pilotest.com/en/tests/shapes
- Pilotest relative bearing: https://www.pilotest.com/en/tests/rbi
- Pilotest moving dots: https://www.pilotest.com/en/tests/movingdots
- Pilotest global multitasking: https://www.pilotest.com/en/tests/multitasking
- FAA spatial disorientation overview: https://www.faa.gov/pilots/training/airman_education/topics_of_interest/spatial_disorientation
- TRID working memory study summary: https://trid.trb.org/View/1579169

## Implementation Status - 2026-07-19

Implemented in the current sprint:

- Skill-family taxonomy and history aggregation for Logical, Spatial, Visual, Memory, and Advanced.
- Grouped module catalog with Practice and Mock Run shell controls.
- Balance Bender as the first Logical module, with deterministic generation and a single correct answer.
- Wire Trace as the first path-tracing Visual module, with generated mappings separated from SVG rendering.
- Clearance Recall as an expanded memory task covering callsign, altitude, heading, speed, frequency, squawk, and route.
- Target Scan as a visual attention/counting module.
- Aero Intercept as an Advanced 2D prototype that is selectable but not in the default module rotation.
- Shared aptitude UI primitives in the existing theme system.
- Engine tests for new generators and scorers.

Still deferred:

- Manual browser QA across theme variants and desktop/tablet/mobile viewports.
- Real continuous control telemetry for Aero Intercept, including time-in-band, mean distance, false alarms, and missed prompts.
- Spatial modules such as Attitude Vector and Beacon Bearing.
- Daily challenge seeding and richer post-round explanations.