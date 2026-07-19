# FlightCore Aptitude Suite Sprint Plan

# Execution Status - 2026-07-19

Sprints 0-7 have been implemented through the code and documentation pass. Automated verification passes with `node --check app.js`, `node --check core.js`, `node --check sw.js`, and `node tests.js` at 84/84. Browser visual QA remains a documented manual follow-up because the available automation path failed in this environment with a Windows sandbox ACL error before Playwright could load.

Important implementation decisions:

- Aero Intercept is shipped as a selectable Advanced prototype but excluded from default module rotation.
- Balance Bender currently uses only the displayed orange/green rule set so every generated answer is explainable from the visible puzzle.
- New module answers are generated and scored in `core.js`; DOM/SVG renderers do not own answer truth.
- Shared aptitude board and answer-tile styles reuse existing theme tokens, fonts, radius, and control density.

Generated: 2026-07-19

## Scope

Plan the next FlightCore expansion from four cockpit-inspired modules into a broader aptitude-style game suite based on `APTITUDE_MODULE_RESEARCH.md`.

The plan keeps work scoped to `D:\Documents\Personal_Project\Google_AG\FlightCore` and preserves the current product boundary: FlightCore is a cockpit-inspired challenge game for entertainment, not pilot training, test prep, or real-world aviation instruction.

## Non-Negotiable Quality Bar

Every sprint must keep the app working end to end:

- Existing Checklist, Instruments, ATC, and Fault modules continue to run.
- Static PWA operation remains intact: no build step, no required backend, no required npm install.
- Local history remains backward-compatible with existing `localStorage` records.
- `node --check app.js`, `node --check core.js`, `node --check sw.js`, and `node tests.js` pass before a sprint is considered complete.
- Manual browser QA is required for desktop, tablet, and mobile layouts because prior automated browser control was blocked by the local Windows sandbox ACL issue.

Every sprint must keep UI consistency intact:

- New screens and modules reuse existing theme tokens, cockpit glass styling, typography, spacing rhythm, controls, HUD language, and card density.
- No one-off color palette, font stack, oversized landing-page styling, or mismatched button/card treatment should enter the app.
- New module UIs must fit the current terminal/cockpit visual language and must not introduce nested cards, decorative orbs, or inconsistent rounded shapes.
- SVG/canvas modules must define stable responsive dimensions so gameplay does not jump or overlap across viewports.
- Accessibility affordances from the foundation pass remain intact: keyboard focus, reduced motion, live regions where appropriate, and clear button labels.

## Suggested Sub-Agent Tracks

These are planning roles for later delegation. They can run as sub-agents once the user approves execution.

| Track | Ownership | Best assigned work |
|---|---|---|
| Core Engine Agent | Pure game logic in `core.js` and tests in `tests.js` | Generators, scorers, seeded randomness, history migration, backward compatibility. |
| UI Consistency Agent | `index.html`, `styles.css`, shared module shells | Theme tokens, layout system, module catalog, responsive QA checklist. |
| Gameplay Module Agent A | First logical module | `Balance Bender` generation, renderer, interaction, scoring. |
| Gameplay Module Agent B | First visual module | `Wire Trace` generation, SVG renderer, answer interaction, scoring. |
| Memory/Attention Agent | Existing ATC extension and visual attention | `Clearance Recall 2.0`, `Target Scan`, response-time scoring. |
| QA/Verification Agent | Regression and manual QA support | Syntax checks, engine tests, local app smoke pass, responsive screenshot checklist. |
| Docs/Handoff Agent | Durable project context | README/roadmap sync, `HANDOFF.md`, module documentation, open issues. |

## Execution Order

### Sprint 0: Baseline, UI Contract, and Architecture Map

Objective: Establish a stable baseline before adding modules, so parallel agents share the same contracts.

Tasks:

- Capture current app flow and module lifecycle: selection, generation, rendering, answer submission, scoring, debrief, local history.
- Define a UI module shell contract for new aptitude modules: header, prompt area, board/canvas/SVG area, answer controls, feedback state, and mobile behavior.
- Define a theme consistency checklist: colors, font usage, spacing, button styles, terminal cards, HUD elements, focus states, reduced motion.
- Define skill family metadata: `logical`, `spatial`, `visual`, `memory`, `advanced`.

Dependencies: none.

Verification:

```powershell
node --check app.js
node --check core.js
node --check sw.js
node tests.js
```

Manual QA:

- Open `index.html`.
- Start and complete a mixed session.
- Check home, active round, debrief, settings/help/theme states on desktop and mobile widths.

Estimated scope: medium.

Parallelization: Core Engine Agent can map state contracts while UI Consistency Agent creates the UI contract.

### Sprint 1: Skill Taxonomy and Stats Foundation

Objective: Add cognitive skill families without changing the visible game too much.

Tasks:

- Add module metadata mapping current modules to skill families.
- Extend round records with `skillFamily`, `responseMs`, `difficulty`, and mistake metadata where available.
- Preserve compatibility with old history records that only contain current fields.
- Add family-level aggregation helpers in `core.js`.
- Add focused tests for old and new history records.
- Add family-level strengths and weakest-skill signals to home/debrief without cluttering the UI.

Dependencies: Sprint 0 contracts.

Verification:

```powershell
node --check app.js
node --check core.js
node tests.js
```

Manual QA:

- Existing saved history still renders.
- A new session records family stats.
- Home/debrief UI remains visually aligned with existing cockpit cards and typography.

Estimated scope: medium.

Parallelization: Core Engine Agent handles data helpers/tests; UI Consistency Agent handles display surfaces after helper API is stable.

### Sprint 2: Module Catalog and Practice/Mock Mode Shell

Objective: Prepare the app to hold more than four modules without making the home screen messy.

Tasks:

- Replace or evolve the flat four-module selector into a grouped module catalog by skill family.
- Add module cards that support locked/planned/active states without changing the current free core loop.
- Add `Practice` and `Mock Run` mode selection as a light shell: Practice allows slower timers/explanations later; Mock Run keeps stricter timing.
- Keep all current modules selectable and playable.
- Add no new backend or account requirement.

Dependencies: Sprint 1 metadata.

Verification:

```powershell
node --check app.js
node --check core.js
node tests.js
```

Manual QA:

- Module catalog works with touch and keyboard.
- Text does not overflow cards/buttons on mobile.
- Theme toggle still applies cleanly.
- No new font, color, or spacing style conflicts with `styles.css`.

Estimated scope: medium-large.

Parallelization: UI Consistency Agent leads; Core Engine Agent only supports selector state if needed.

### Sprint 3: Balance Bender - First Logical Module

Objective: Ship the first new fully playable aptitude module with deterministic logic and visual consistency.

Tasks:

- Add pure generator for balance puzzles with hidden integer weights and exactly one correct answer.
- Add pure scorer and tests for correct, incorrect, malformed, and ambiguous generated cases.
- Render rule scale, question scale, and 4-5 answer choices using existing cockpit UI patterns.
- Add difficulty scaling: one-step equivalence at low levels, mixed shapes and near-miss distractors at higher levels.
- Integrate with module rotation, scoring, session history, telemetry, and family stats.
- Add post-round explanation in Practice mode only, or a minimal answer reveal if Practice mode is not fully implemented yet.

Dependencies: Sprint 1 metadata; Sprint 2 catalog can run before or alongside if integration surface is defined.

Verification:

```powershell
node --check app.js
node --check core.js
node tests.js
```

Manual QA:

- Balance board scales cleanly on mobile, tablet, and desktop.
- Shape colors come from an approved palette and remain distinguishable.
- Answer tiles match existing button/card treatments.
- Repeated plays do not generate impossible or duplicate-correct puzzles.

Estimated scope: large.

Parallelization: Core Engine Agent can build/test generator first; Gameplay Module Agent A can wire renderer after the generated data contract is stable; QA Agent verifies integration.

### Sprint 4: Wire Trace - First Visual Scanning Module

Objective: Ship a visual path-tracing module inspired by wire-trace aptitude tasks.

Tasks:

- Add pure generator that maps start labels to endpoints and stores the answer independent of SVG geometry.
- Generate clear orthogonal SVG paths with crossings, stable grid dimensions, and no ambiguous branch points.
- Render labels, highlighted query, answer buttons, and feedback in the existing cockpit style.
- Add difficulty scaling: fewer wires at low levels, more crossings and denser paths at higher levels.
- Integrate with module rotation, scoring, session history, telemetry, and family stats.

Dependencies: Sprint 1 metadata; ideally Sprint 2 catalog; can start after the SVG board contract from Sprint 0.

Verification:

```powershell
node --check app.js
node --check core.js
node tests.js
```

Manual QA:

- Paths remain legible and do not overlap labels at common viewport sizes.
- Touch target sizes are acceptable.
- Reduced-motion users do not lose information.
- Visual style matches existing cockpit linework and color contrast.

Estimated scope: large.

Parallelization: Core Engine Agent builds mapping/tests; Gameplay Module Agent B builds SVG renderer; QA Agent checks legibility.

### Sprint 5: Memory and Attention Expansion

Objective: Strengthen the existing memory category and introduce response-time attention mechanics without destabilizing the core loop.

Tasks:

- Extend ATC into `Clearance Recall 2.0`: more fields, brief exposure, distractor step, delayed recall.
- Add response-time capture and scoring support where appropriate.
- Add `Target Scan` as a simpler visual-attention module before any advanced 3D work.
- Ensure both modules use the same UI shell, typography, HUD, answer controls, and feedback language established earlier.
- Keep advanced multitask concepts behind a prototype flag or not yet visible in the public catalog.

Dependencies: Sprint 1 stats; Sprint 2 shell; preferably at least one new module shipped to validate patterns.

Verification:

```powershell
node --check app.js
node --check core.js
node tests.js
```

Manual QA:

- Timed states are understandable and not visually noisy.
- Input focus is reliable across keyboard, touch, and keypad interactions.
- New timers and feedback do not break existing study timers.

Estimated scope: large.

Parallelization: Memory/Attention Agent leads; UI Consistency Agent reviews common shell reuse; QA Agent runs regression.

### Sprint 6: Advanced Prototype - Aero Intercept / Cockpit Capacity

Objective: Prototype the advanced multitask concept separately before integrating it into regular sessions.

Tasks:

- Build a contained 2D canvas prototype for reticle/altitude-band control and secondary task prompts.
- Capture control stability metrics such as time in band, mean distance, false alarms, and missed prompts.
- Test keyboard, pointer, and touch controls.
- Keep the prototype visually aligned with the cockpit theme but clearly separate from the normal module rotation until performance is proven.
- Decide whether full 3D is worth the dependency and QA cost.

Dependencies: Response-time and pressure-profile scoring from Sprint 5.

Verification:

```powershell
node --check app.js
node --check core.js
node tests.js
```

Manual QA:

- Canvas is nonblank and responsive on desktop and mobile.
- Controls feel usable without layout overlap.
- Frame timing is acceptable on a typical mobile browser.

Estimated scope: large.

Parallelization: Advanced Gameplay Agent can prototype while QA Agent defines performance and viewport checks. Keep this isolated from release-critical work.

### Sprint 7: Release Hardening, Docs, and Handoff

Objective: Stabilize the aptitude-suite release and leave the repo ready for the next session.

Tasks:

- Run full syntax and engine test suite.
- Perform manual browser QA for all active modules and theme states.
- Update `README.md`, `APTITUDE_MODULE_RESEARCH.md` if decisions changed, `HANDOFF.md`, and any module documentation.
- Run positioning scan to keep copy within game/challenge language.
- Document remaining risks and deferred modules.

Dependencies: all implemented sprints.

Verification:

```powershell
node --check app.js
node --check core.js
node --check sw.js
node tests.js
rg -n -i "pilot training|certification|exam prep|checkride|proficiency|real-world aviation use" README.md index.html app.js manifest.json APTITUDE_MODULE_RESEARCH.md
```

Manual QA:

- Complete at least one mixed session with all active modules.
- Complete one focused run per new module.
- Check desktop, tablet, and mobile layouts.
- Check theme variants currently supported by the app.

Estimated scope: medium.

Parallelization: QA/Verification Agent and Docs/Handoff Agent can run after implementation agents finish.

## Dependency Graph

```text
Sprint 0
  -> Sprint 1
    -> Sprint 2
    -> Sprint 3
    -> Sprint 4
      -> Sprint 5
        -> Sprint 6
  -> Sprint 7 runs after implemented feature sprints
```

Sprint 3 and Sprint 4 can run in parallel after Sprint 1 if the module shell contract is stable. Sprint 6 should stay isolated until Sprints 3-5 prove the shared module and scoring patterns.

## Open Questions

- Whether the next execution pass should implement only Sprints 0-1 first, or include the first playable module (`Balance Bender`) in the same pass.
- Whether Thai labels should be first-class in-app category labels now, or tracked as a localization pass after the English UI stabilizes.
- Whether `Target Scan` should be a grid/symbol task or moving-dot task for its first version.
- Whether advanced canvas work should remain a prototype page until manual QA confirms mobile performance.
