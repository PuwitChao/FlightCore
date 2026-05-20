# Flight Core Memory Trainer - Implementation Plan (Encouraging Graded Criteria)

This plan outlines the design and implementation for a more encouraging, multi-tiered grading system in **Flight Core**. To prevent users from feeling discouraged by single-character minor mismatches (which previously reset their streaks and awarded 0 points), we will transition from a binary PASS/FAIL system to an accuracy-graded three-tier system: **Perfect**, **Partial**, and **Fail**.

---

## User Review Required

> [!NOTE]
> We will introduce a **Partial Success** state between 50% and 99% accuracy. This state will keep the user's current streak intact (streak persists without resetting to 0) and award partial points proportional to their accuracy percentage.
>
> We will also introduce an amber/warning theme variant to style this encouraging feedback state.

---

## Graded Criteria Mechanics

| Performance Tier | Accuracy Threshold | Streak Action | Points Awarded | UI Glow State | Verdict Card Text |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Perfect Success** | **100%** | Increment (`streak++`) | Full Base + Speed Bonus | Green (`screen-glow-success`) | `PERFECT SUCCESS (STREAK INCREMENTED)` |
| **Partial Success** | **50% - 99%** | Persists (`streak` remains) | Proportional to Accuracy | Amber (`screen-glow-warning`) | `PARTIAL SUCCESS (STREAK SAVED)` |
| **Failed** | **< 50%** | Reset (`streak = 0`) | Zero (`+0 PTS`) | Red (`screen-glow-error`) | `FAILED (STREAK RESET)` |

---

## Proposed Changes

### 1. Style Design System (`styles.css`)

We will add dedicated styles for warning glows, warning verdict cards, and warning table rows:

- **Define new warning variables for theme styling**:
  - Default: `--warning-bg: rgba(255, 149, 0, 0.08); --warning-border: rgba(255, 149, 0, 0.2);`
  - Light: `--warning-bg: rgba(255, 149, 0, 0.06); --warning-border: rgba(255, 149, 0, 0.15);`
  - Mono: `--warning-bg: rgba(255, 255, 255, 0.03); --warning-border: rgba(255, 255, 255, 0.1);`
  - Sage: `--warning-bg: rgba(255, 149, 0, 0.08); --warning-border: rgba(255, 149, 0, 0.18);`
  - Warm: `--warning-bg: rgba(217, 119, 6, 0.05); --warning-border: rgba(217, 119, 6, 0.15);`
- **Add warning styles**:
  - Add `.screen-glow-warning` class for the amber edge-glow pulse.
  - Add `.debrief-rating.warning` styled as `color: var(--accent-amber);` for consistent labeling.
  - Add `.debrief-table tr.warning-row` for styling partial success rounds in the final session results.

### 2. Application Logic Refactoring (`app.js`)

We will adjust how responses are evaluated, how scores and streaks are updated, and how feedback screens are populated:

- **Accuracy Calculations**:
  - **Checklist**: `accuracy = (correctSteps / expectedSteps) * 100`
  - **Instruments**: `accuracy = (correctDials / expectedDials) * 100`
  - **ATC**: `accuracy = (correctFields / 4) * 100`
  - **Fault**: `accuracy = (correctMatches / 2) * 100`
- **Grading & Scoring**:
  - Transition from `isCorrect` boolean to a three-tier system (`grade = "perfect" | "partial" | "fail"`).
  - Calculate `addedPoints` using `accuracy / 100` multiplier for partial rounds: `Math.round((basePoints + speedBonus) * (accuracy / 100))`.
  - Add support for `"warning"` type in `triggerHaptic()` utilizing a double pulse `[60, 40, 60]`.
- **Immediate Feedback UI**:
  - Adapt `setupFeedbackScreen()` to parse the round's `accuracy` and `grade`.
  - Show custom percentage badge (`e.g., 83% ACCURACY`) and custom status string (`PARTIAL SUCCESS (STREAK SAVED!)`).
- **Debrief Page**:
  - Calculate session completion percentage as the average accuracy across all 8 rounds:
    `const percentage = Math.round(roundByRoundHistory.reduce((sum, r) => sum + r.accuracy, 0) / 8);`
  - Update debrief table rows to paint warning-rows in amber, displaying status as `PARTIAL` alongside `PERFECT` and `FAIL`.

---

## Verification Plan

### Automated/Manual Verification
1. **Perfect Round Run**: Solve a round with 100% correct answers. Verify green glow, streak chevron increment, full points + speed bonus, and `PERFECT SUCCESS` verdict card.
2. **Partial Round Run**: Solve a round with 1-2 errors (e.g. 5 out of 6 correct in checklist). Verify amber glow, streak preservation, partial points, and `PARTIAL SUCCESS` verdict card.
3. **Failed Round Run**: Solve a round with < 50% correct answers. Verify red glow, streak reset, 0 points, and `FAILED` verdict card.
4. **Debrief Review**: Verify the final screen correctly reflects average accuracy across all rounds, displays `PERFECT`/`PARTIAL`/`FAIL` badges, and colors the rows accordingly.
