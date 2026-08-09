# FlightCore Answer-Key Audit And Fix Plan

This plan audits and fixes user-reported wrong or incorrect answer keys across FlightCore gameplay modules. Scope is restricted to `D:\Documents\Personal_Project\Google_AG\FlightCore`.

## Product Flow Under Audit

- Surface: FlightCore active game session.
- Flow: start a session, study a module prompt, answer the recall/test screen, submit, and review feedback rows.
- Reported issue: some games mark the visible correct answer as wrong or use an answer key that does not match the visible task.
- Follow-up scope: Shape/Balance Bender and the box-counting Target Scan game.

## Decomposition

| Step | Objective | Dependencies | Verification | Scope |
|---|---|---|---|---|
| 1 | Map all module generators, renderers, and scorers. | None | Code inspection plus randomized core audit. | Medium |
| 2 | Identify modules where visible task semantics differ from scoring keys. | Step 1 | Targeted seeded audit scripts and source/render review. | Medium |
| 3 | Fix generator/scorer/render mismatch without changing unrelated UI. | Step 2 | New regression tests fail before fix and pass after fix. | Medium |
| 4 | Add durable answer-key regression coverage. | Step 3 | `node tests.js`. | Medium |
| 5 | Run full verification gate. | Step 4 | `node tests.js`, `node --check app.js`, `node --check core.js`, `node --check tests.js`, `node tests_app_error_handling.js`, `git diff --check`. | Small |

## Findings

- Randomized core audit found no missing/duplicate answer key for `balance`, `wire`, `target`, `attitude`, `intercept`, `beacon`, or `horizon` in generated samples, but the first pass only checked stored keys against generated data.
- Fuel Balancer had a user-facing answer-key bug: scoring compared the hidden original `expectedPumps` state instead of the visible tank outcome. In sampled seeds, tanks could already be visibly in the requested 40-60 GAL range while the hidden key still marked no pumps wrong.
- Target Scan had a display/key mismatch introduced by the app-family style pass: `.mark-circle` and `.mark-square` were included in a square-geometry override, so circles were rendered as square/box marks. That made player-visible counts differ from the prompt shape and made the key appear incorrect.
- Target Scan scoring is now hardened to derive the answer from the full visible challenge object via `countTargetMatches`, rather than trusting a separate stored count when the full challenge is available.
- Balance Bender shape logic now has explicit regression coverage proving the visible shape equation has exactly one matching answer key across sampled seeds.

## Implemented Fix

- Added `countTargetMatches(challenge)` in `core.js` and updated `targetAccuracy` to score full Target Scan challenges from visible cells.
- Updated `app.js` Target Scan submission feedback to use the same visible count used for grading.
- Fixed `styles.css` so Bauhaus square-control overrides no longer flatten gameplay target glyphs; circle, square, diamond, and triangle marks remain distinct.
- Added regression tests for Balance Bender visible-equation correctness, Target Scan full-challenge scoring, randomized target key invariants, and Fuel Balancer visible-state scoring.

## Product Design Audit Limits

- The requested Product Design audit workflow normally requires screenshots of the flow.
- Browser screenshot automation is not currently available in this environment; Playwright is unavailable locally and no Product Design saved context exists.
- This pass audits the product flow through source and deterministic generated-game evidence, then reports the screenshot limitation explicitly.
