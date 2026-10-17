# Place Oracle Cards — Checkpoint 05

## Targeted fixes

- Opening a card now focuses its back without scrolling and resets the reveal's own scroll position. The underlying scene is not scrolled or reset.
- Ignore a queued native `close` event if the dialog has already been reopened.
- Correct the standalone preview's outdated statement that integration is not available.
- Extend the Oracle tests for approved titles/messages, distinct motifs, lift/flip/reveal phase order, scroll reset, and delayed close events.

Changed files in this checkpoint: `assets/js/place-oracle.js`, `oracle-preview.html`, `tests/place-oracle.cjs`, and this report.

## Executed checks

From the project directory, PowerShell:

```powershell
Get-ChildItem assets/js/*.js | ForEach-Object { node --check $_.FullName; if ($LASTEXITCODE -ne 0) { throw "Syntax failed: $($_.Name)" } }
Get-ChildItem tests/*.cjs | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw "Test failed: $($_.Name)" } }
```

- All 12 JavaScript source files passed syntax checks.
- All 15 test files passed. These use Node models, simulated DOM, mock audio and mock storage.
- Oracle tests cover five identities, opening/closing, duplicate interactions, Escape, focus return, keyboard propagation, reduced-motion branch, persistence, invalid schemas, denied storage access, and isolated storage writes.
- Existing suites cover Sea drawing/shell placement; Rain piano/quotes/audio limits; Forest growth/persistence; City movement/shops/persistence; Impossible portals/discoveries/persistence.
- No package.json or configured build/lint commands exist. No npm build or lint result is claimed.
- `python -m http.server 8765 --bind 127.0.0.1` failed because Python was unavailable. A temporary Node HTTP server bound to 127.0.0.1:8765 successfully served the existing static project instead. No packages were installed.

## Real browser checks

Tested with the Codex in-app browser over localhost, using actual clicks and keyboard actions:

- Opened each of the five scene-specific Oracle objects, flipped each card, checked the visible English/Vietnamese copy, and closed it.
- Sea: made a drawing dot and placed a shell using the keyboard; both remained after Oracle was closed with Escape.
- Rain: started the guided melody, clicked a piano note and changed the quote. Scene text was identical after opening/closing Oracle; pressing 1 inside Oracle did not advance the melody.
- Forest: planted and watered a seed; the seedling survived Oracle. Sunlight and watering still progressed to bloom afterward.
- City: D moved to the sugarcane stall; the on-screen left control returned to the alley. Added bread to the shop tray, opened Oracle, pressed D in Oracle, and closed it. The shop text/ingredients were unchanged and the location remained the alley.
- Impossible: entered Moonflower Garden, awakened a flower, returned to the main garden, opened/closed Oracle. The discovery badge remained, including after a real reload.
- A real reload restored all five Oracle discovery labels. Revisited Impossible and reopened its card using Enter/Space; Escape closed it during reveal.
- Tested all five standalone cards at 320×740, 390×844 and 1366×900: 15 combinations, no horizontal text or card overflow. Close controls measured 45 CSS pixels tall. Long cards use vertical scrolling when necessary.
- Inspected desktop and mobile screenshots. The card artwork, circular portal and particles were visible; controls remained readable. No console errors or warnings were captured during these browser checks.

## Diff protection

SHA-256 comparison against Checkpoint 04 confirmed only the three existing files listed above changed (plus this new report). Compared with the pre-Oracle project archive, the only changed pre-existing site file is index.html, whose Oracle changes are two stylesheet links and two script references. Existing place implementations, shared navigation, styling and storage modules are unchanged.

## Limits

- No physical touchscreen testing; mobile viewport testing used browser click/keyboard input.
- Reduced-motion behavior was tested with mocked matchMedia and CSS inspection, not by changing the device preference.
- No frame-rate/CPU profiling or cross-browser Safari/Firefox testing.
- Audio output was not listened to; audio regression checks use mocks and the browser session kept sound off.
- Denied/malformed storage cases were simulated, not injected into the real browser.
- This is targeted Oracle regression QA, not an exhaustive manual playthrough of every existing mini-game.

Preview the integrated feature through index.html and the existing place selection; oracle-preview.html remains an isolated, non-persistent preview.
