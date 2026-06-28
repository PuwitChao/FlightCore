# Flight Core - Lessons Learned

## What Worked
* **Direct D: Drive Operations**: Performing code changes directly inside `D:\Documents\Personal_Project\Google_AG\FlightCore` ensures the main git repository remains authoritative and avoids discrepancies between C: and D: drive workspaces.
* **Cupertino-Styled System Fault Overlay**: Designing a recovery boundary that intercepts uncaught exceptions/rejections and renders a cockpit-themed `SYSTEM FAULT` warning allows users to easily reload or clear corrupted `localStorage` without freezing the screen.
* **Safe LocalStorage Wrappers**: Using `getSafeStorageInt()`, `getSafeStorageFloat()`, and `getSafeStorageHistory()` with fallbacks to defaults successfully guards variables from corrupt values or NaN propagation.
* **XSS Hardening**: Implementing `escapeHTML` and wrapping variables dynamically rendered in `innerHTML` blocks (feedback details and logbook rows) ensures the client-side remains secure against potential text injection payloads.
* **Lexicon & Disclaimer Compliance**: Removing "training/drill" text and styling visible disclaimers on the home, onboarding, and debrief screens successfully conforms to the game-only positioning guidelines of `ROADMAP.md`.
* **Visual De-noise / Cleaning AI Vibe-Coding**: Removing the `.system-title::before` pseudo-element deleted the glowing blue dot beside the "FLIGHT CORE" title, cleaning up the header layout and ensuring the interface feels professional and less "AI-inspired".
* **CSS Parent Selector `:has()` for Dynamic Widescreen Layout**: Utilizing `.terminal-frame:has(...)` allowed dynamic transitions from a 2-column to a 3-column widescreen cockpit console layout when the virtual keypad is active. This keeps live telemetry stats visible at all times during flight operations, which is highly immersive and authentic.
* **Redundancy Cleanup & Config Grid**: Hiding redundant Home stats in the viewport (since they are in the sidebar) and placing the remaining setup cards in a 2x2 grid eliminated scrollbars, fitting the home screen cleanly onto standard desktop viewports.

## What Failed
* **C: Drive Workspace Writing**: Writing implementation documents and code changes to the C: drive temporary workspace directory triggered user permission denials and warning prompts, as the D: drive repository is the source-of-truth workspace. We reverted those temporary changes and moved all development directly to the D: drive.
* **Automated Testing Absence**: The project does not contain standard node-test configs (e.g., Jest/Vitest). We worked around this by utilizing Node CLI compilers (`node --check`) to verify syntax health locally on the host.
* **Artifact Metadata Paths**: Invoking `write_to_file` with `ArtifactMetadata` on a custom path outside the system C: drive brain folder causes a validation error. Omitting the metadata successfully writes files directly to the D: drive project folders.
