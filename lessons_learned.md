# Lessons Learned & Technical Retrospective

## Sprint 11: Professional UI De-Vibing, Fluid Layout, Bug Fixes & Module Audit

### What Worked Well
1. **Defensive Module State Guards**:
   - Adding explicit generator branches in `startRound()` for `attitude` and `intercept` plus defensive state fallback checks in `setupStudyScreen()` completely eliminated `TypeError: Cannot read properties of null` crash loops.
2. **Text Wrapping over Rigid Ellipses**:
   - Replacing `white-space: nowrap` and `text-overflow: ellipsis` with `white-space: normal` and responsive grid `repeat(auto-fill, minmax(130px, 1fr))` ensured all module card labels ("Horizon Scan", "Clearance Recall", etc.) render in full without text truncation.
3. **Plain Professional Styling**:
   - Stripping out neon glows (`box-shadow: 0 0 12px var(--accent-blue-glow)`) and glowing indicators in favor of crisp 1px solid active borders and clean muted indicators resulted in a clean, plain, professional aesthetic across dark and light modes.
4. **Fluid Full-Screen Responsiveness**:
   - Updating `.terminal-frame` to `width: 100%; max-width: 100%; height: 100vh;` allowed the web app to fill viewport space naturally without artificial pixel clamping.

### Best Practices to Persist
- Always ensure every registered module key in `CHALLENGE_MODULE_KEYS` has matching generator branches in `startRound()` and rendering cases in `setupStudyScreen()`.
- Avoid arbitrary rigid pixel width caps or aggressive glowing box-shadows to maintain a clean, professional software UI.
- Maintain no-emoji policy in UI and documentation for clean software presentation.
