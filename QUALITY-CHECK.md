# Rain piano — quality report

## Finished behaviour
Eight labelled drops play C4 D4 E4 F4 G4 A4 B4 C5. Click/tap, use Tab and
Enter/Space, or press 1–8 while Rain is active. Each strike changes colour and
pulses. Reduced motion keeps the colour feedback without animation.

Enable the existing sound switch first. Page load and scene entry do not start
audio. Tapping while muted shows a prompt without overriding mute. Piano shares
the existing AudioContext and master switch and has its own volume slider.
Background music and rain keep their existing sliders.

The guide teaches the first 14 notes of Twinkle, Twinkle, Little Star, highlighting
the next note. It does not autoplay or penalize mistakes. Five supportive quotes
can be cycled with the quote button.

Six active voices maximum, a 35 ms input gate, finite note lifetimes and 25 ms
releases bound overlap. Notes stop on mute, scene exit, hidden tab and zero
piano volume. A pending audio resume cannot restart notes after cancellation.

The background canvas pauses behind Rain, when the tab is hidden or when reduced
motion is enabled. Rain uses light CSS/SVG motion. This prevents wasted work in
code; CPU usage has not been measured on a real device.

## Changed files from escape-rain
- index.html: keys, piano controls, guide and quote controls.
- assets/css/rain-room.css: responsive keys, focus/strike/reduced-motion styles.
- assets/js/rain-piano.js: new Rain instrument and UI controller.
- assets/js/main.js: scene/mute/motion/visibility hooks and audio failure handling.
- assets/js/rain.js: cancellable pause/resume for the existing canvas loop.
- assets/js/audio.js: catch rejected audio resume promises; compositions unchanged.
- tests/rain-piano.cjs, tests/rain-animation.cjs, tests/sea-regression.cjs: added
  dependency-free Node tests using simulated browser APIs.
- RAIN-DESIGN.md and QUALITY-CHECK.md: handoff documentation.

Sea HTML, sea.js and sea.css are byte-identical to the baseline. Shared visual
styles and room artwork are unchanged. The ZIP has one project root, without
nested older project copies.

## Checks actually run
No package.json, lockfile, lint/build config or existing project test command was
found. This is static HTML/CSS/JS. No npm lint/build success is claimed.

| Check | Actual result |
|---|---|
| node --check on all six assets/js files | PASS |
| node tests/rain-piano.cjs | PASS: autoplay guard, 100 rapid taps, six-voice limit, cleanup, mute/exit, zero volume, rejected/pending resume, feedback, complete guide, quote changes, keyboard |
| node tests/rain-animation.cjs | PASS: cancellation, repeated pause/resume, no duplicate loop |
| node tests/sea-regression.cjs | PASS: shell drag/tap/keyboard/cancel, drawing/undo, reset, clear drawing preserves shells, SVG export data |
| work/verify-piano-integration.cjs (workspace harness) | PASS: five scene selections and return paths, track/rain state, transition cancellation, mute toggles and STAY HERE exit |
| Static comparison and references | PASS: Sea unchanged, unique IDs, eight labelled keys, all local assets exist, no new dependencies |

These are tests of project scripts with DOM, Web Audio and timer mocks, not real
browser or audible-output tests. No failures occurred in the checks above.

## Remaining verification
The browser environment blocked local-page access earlier in this task; no
bypass was attempted. The final real-browser desktop/mobile layout, touch hit
testing, audible piano quality, CPU usage, browser console and PNG download
remain unverified. Passing mock tests does not establish those checks as passed.
The piano is synthesized rather than a recorded acoustic instrument. Existing
Google Fonts still need a network connection, with system-font fallbacks offline.

## Preview locally
Extract the whole ZIP to a new folder. Open index.html with assets beside it.
Choose ESCAPE, then Somewhere Rainy. Rain is an in-page scene, not a /rain URL.
The README's existing local-server command is:

```powershell
python -m http.server 8000
```

Run it from the project folder, then open http://localhost:8000. Live Server is
also supported. No installation/build step is required. Added tests can be rerun:

```powershell
node tests/rain-piano.cjs
node tests/rain-animation.cjs
node tests/sea-regression.cjs
```

Manual check: enter Rain muted; tap for colour-only feedback; enable sound; play
1 1 5 5 6 6 5 / 4 4 3 3 2 2 1; try the guide; mute during notes; change quote;
leave and return. At 390px and 1366px widths check all keys, scrolling and sound
controls. Enable reduced motion and check colour feedback remains. Finally enter
Sea, draw, place shells, undo and save PNG.
