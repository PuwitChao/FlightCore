# Flight Core - Lessons Learned

## What Worked
* **Direct D: Drive Operations**: Performing code changes directly inside `D:\Documents\Personal_Project\Google_AG\FlightCore` ensures the main git repository remains authoritative and avoids discrepancies between C: and D: drive workspaces.
* **Cupertino-Styled System Fault Overlay**: Designing a recovery boundary that intercepts uncaught exceptions/rejections and renders a cockpit-themed `SYSTEM FAULT` warning allows users to easily reload or clear corrupted `localStorage` without freezing the screen.
* **Safe LocalStorage Wrappers**: Using `getSafeStorageInt()`, `getSafeStorageFloat()`, and `getSafeStorageHistory()` with fallbacks to defaults successfully guards variables from corrupt values or NaN propagation.
* **XSS Hardening**: Implementing `escapeHTML` and wrapping variables dynamically rendered in `innerHTML` blocks (feedback details and logbook rows) ensures the client-side remains secure against potential text injection payloads.
* **Lexicon & Disclaimer Compliance**: Removing "training/drill" text and styling visible disclaimers on the home, onboarding, and debrief screens successfully conforms to the game-only positioning guidelines of `ROADMAP.md`.

## What Failed
* **C: Drive Workspace Writing**: Writing implementation documents and code changes to the C: drive temporary workspace directory triggered user permission denials and warning prompts, as the D: drive repository is the source-of-truth workspace. We reverted those temporary changes and moved all development directly to the D: drive.
* **Automated Testing Absence**: The project does not contain standard node-test configs (e.g., Jest/Vitest). We worked around this by utilizing Node CLI compilers (`node --check`) to verify syntax health locally on the host.
