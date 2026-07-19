# FlightCore Aptitude Module Contract

Generated: 2026-07-19
Updated: 2026-07-19

## Purpose

This contract keeps aptitude modules consistent with the existing FlightCore app. New modules should feel native to the current cockpit challenge game, preserve the zero-build PWA runtime, and avoid claims of pilot training, exam prep, or real-world aviation instruction.

## Implemented Module Set

Default selected modules:

- `checklist` - Memory
- `instruments` - Visual
- `atc` - Memory
- `fault` - Logical
- `balance` - Logical
- `wire` - Visual
- `clearance` - Memory
- `target` - Visual

Available prototype module:

- `intercept` - Advanced. It appears in the catalog and can be selected manually, but it is not part of the default rotation until browser performance and input feel are proven.

Planned metadata-only modules:

- `attitude` - Spatial
- `beacon` - Spatial
- `capacity` - Advanced

## Module Lifecycle

Every playable module follows the same app flow:

1. `selectNextModule()` chooses a module id from `selectedModules`.
2. The module generator creates deterministic round data in `core.js` where practical.
3. `setupStudyScreen(module)` renders the briefing or stimulus preview.
4. `commenceTest()` switches to the answer/input state and starts response timing.
5. The module-specific renderer collects `currentRndInput`.
6. `submitTelemetry()` scores the response, records the round, emits telemetry, and shows feedback.
7. `finishSession()` aggregates module and skill-family stats into the saved session record.

## Round Result Shape

New modules should record at least:

```js
{
  round,
  module,
  skillFamily,
  score,
  correct,
  accuracy,
  grade,
  responseMs,
  difficulty,
  mistakes,
  breakdown,
  blindspot
}
```

`skillFamily` must be one of:

- `logical`
- `spatial`
- `visual`
- `memory`
- `advanced`

## Generator Rules

- Keep solvability in `core.js`; renderers should never infer answers from DOM, SVG, or canvas geometry.
- Balance puzzles must expose enough rule information for every correct answer shape used in the question.
- Wire Trace answers must come from the generated `mappings` array, independent of visual path drawing.
- Clearance Recall must preserve string fields exactly, including leading-zero squawks.
- Target Scan must keep the expected count derived from generated cells.
- Advanced tracking prototypes must remain selectable experiments until manual performance QA passes.

## UI Shell

New modules should reuse the existing screen structure:

- Study screen: `study-type-title`, one briefing block, existing timer bar, `PROCEED TO RECALL`.
- Test screen: `test-type-label`, one test block, existing `SUBMIT RESPONSE`.
- Feedback screen: existing verdict card and `feedback-details-list`.
- Debrief screen: existing session table plus compact stat bars when useful.

Use existing classes where possible:

- `terminal-card`
- `terminal-card-header`
- `type-tag`
- `btn`, `btn-primary`, `btn-success`, `btn-block`
- `sortable-item`
- `module-stat-row`, `module-stat-track`, `module-stat-fill`, `module-stat-pct`

Shared aptitude wrappers now available:

- `aptitude-board`
- `answer-grid`
- `answer-tile`
- `wire-svg`
- `target-grid`
- `intercept-board`
- `clearance-grid`

## Visual Consistency Rules

- Use `var(--font-sans)` and the current text scale. Do not introduce a new font.
- Use existing theme tokens for all colors. Avoid hard-coded module palettes except for semantic gameplay marks, and keep those sparse.
- Keep cards at the existing radius and density. Do not put cards inside cards.
- Define stable board dimensions for SVG/canvas-style modules with responsive constraints.
- Keep controls touch-friendly and keyboard-accessible.
- Do not use decorative gradient blobs, unrelated illustrations, or marketing-style hero layouts inside the app.

## Verification Gate

Before a module is considered complete:

```powershell
node --check app.js
node --check core.js
node --check sw.js
node tests.js
```

Manual browser QA must cover:

- Home screen and grouped module selector.
- Practice and Mock Run toggles.
- Study, test, feedback, and debrief screens.
- Desktop, tablet, and mobile widths.
- Current theme variants.
- Keyboard, touch, and pointer input paths.
- Advanced prototype input feel before enabling it by default.