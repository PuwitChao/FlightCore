# FlightCore Aptitude Suite Sprint Checklist

## Sprint 0: Baseline, UI Contract, and Architecture Map
- `[x]` Map current session/module lifecycle from selection through debrief.
- `[x]` Define shared module shell contract for new aptitude modules.
- `[x]` Define theme/UI consistency checklist for colors, fonts, spacing, cards, HUD, controls, and accessibility.
- `[x]` Define skill-family metadata ids: `logical`, `spatial`, `visual`, `memory`, `advanced`.
- `[x]` Verify baseline: `node --check app.js`, `node --check core.js`, `node --check sw.js`, `node tests.js`.
- `[!]` Manual browser baseline QA is still required; browser automation failed in this environment with a Windows sandbox ACL error.

## Sprint 1: Skill Taxonomy and Stats Foundation
- `[x]` Add module-to-skill-family metadata.
- `[x]` Extend round records with `skillFamily`, `responseMs`, `difficulty`, and mistake metadata.
- `[x]` Preserve backward compatibility for existing local history.
- `[x]` Add family-level aggregation helpers and tests.
- `[x]` Show family-level strengths/weaknesses in home/debrief without cluttering the UI.
- `[x]` Verify syntax and engine tests. Manual browser UI consistency remains in Sprint 7 follow-up.

## Sprint 2: Module Catalog and Practice/Mock Mode Shell
- `[x]` Evolve module selector into grouped skill-family catalog.
- `[x]` Add active/planned/locked-ready module card states without backend dependencies.
- `[x]` Add Practice and Mock Run shell controls.
- `[x]` Keep existing four modules selectable and playable.
- `[!]` Responsive card layout, text fit, theme consistency, and keyboard/touch behavior need manual browser confirmation.

## Sprint 3: Balance Bender
- `[x]` Add deterministic balance puzzle generator with exactly one correct answer.
- `[x]` Add scorer and tests for correct and malformed/incorrect cases.
- `[x]` Render rule scale, question scale, and answer choices in the existing cockpit style.
- `[x]` Add difficulty scaling with near-miss distractors.
- `[x]` Integrate scoring, module rotation, telemetry, history, and skill-family stats.
- `[x]` Verify automated checks. Manual responsive UI QA remains in Sprint 7 follow-up.

## Sprint 4: Wire Trace
- `[x]` Add deterministic wire mapping generator independent of rendered SVG geometry.
- `[x]` Render legible orthogonal SVG paths with clear labels and crossings.
- `[x]` Add endpoint/start answer interaction and scoring.
- `[x]` Add difficulty scaling for wire count and crossing density.
- `[x]` Integrate scoring, module rotation, telemetry, history, and skill-family stats.
- `[x]` Verify automated checks. Manual legibility/accessibility QA remains in Sprint 7 follow-up.

## Sprint 5: Memory and Attention Expansion
- `[x]` Extend ATC into delayed `Clearance Recall 2.0` as `clearance`.
- `[x]` Add response-time capture and scoring helpers where appropriate.
- `[x]` Add first `Target Scan` visual-attention module.
- `[x]` Reuse the shared module shell and theme system.
- `[x]` Verify timers/focus paths at code level and preserve existing module regressions in tests.

## Sprint 6: Advanced Prototype
- `[x]` Build isolated 2D `Aero Intercept` / `Cockpit Capacity` prototype surface.
- `[!]` Time-in-band, mean distance, false alarms, and missed prompts remain deferred until continuous-control telemetry is added.
- `[!]` Keyboard, pointer, and touch controls need browser QA before promoting the prototype.
- `[x]` Keep prototype out of normal module rotation until performance is proven.
- `[x]` Decide whether full 3D is worth the dependency and QA cost: defer 3D until the 2D prototype proves useful.

## Sprint 7: Release Hardening, Docs, and Handoff
- `[x]` Run full syntax and engine test suite.
- `[!]` Manual browser QA for all active modules and supported viewports remains required due environment browser automation failure.
- `[x]` Run positioning-copy scan for game/challenge language in implementation and docs.
- `[x]` Update README, research notes, handoff, and module docs.
- `[x]` Document deferred risks and next sprint recommendations.

## Verification Snapshot

Completed on 2026-07-19:

- `node --check core.js` passed.
- `node --check app.js` passed.
- `node --check sw.js` passed.
- `node tests.js` passed: 84/84.

Manual QA still required:

- Open `index.html` and complete one Practice run and one Mock Run.
- Check desktop, tablet, and mobile widths.
- Check current theme variants.
- Confirm Balance Bender, Wire Trace, Clearance Recall, Target Scan, and optional Aero Intercept render without overlap and accept keyboard/touch input.