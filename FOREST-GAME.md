# Quiet Forest — finished garden

The existing woodland clearing contains a deterministic garden: empty soil →
Plant (Seed, stage 0) → Water (Seedling, 1) → Sunlight (Grown plant, 2) → Water
(Bloom, 3). Only the next valid action is enabled. Each stage has its own quote.
Start a new garden appears after blooming and requires confirmation before reset.

Progress is restored on page load and saved after each valid transition under
`escape_quiet_forest_garden_v1`, matching the site's underscore storage naming.
Only `{ "stage": null }` (empty) or an integer stage from 0 through 3 is stored.
Missing, malformed, extra-field or unsupported values safely start empty.
Storage access and write failures keep the game usable for the current visit.
When saving fails, reload may recover an older saved state; persistence cannot
be guaranteed when the browser denies storage. No personal data is stored.

Quiet's procedural music now uses a brighter G-major mallet/kalimba arrangement
at 72 BPM. Other destinations' compositions and shared audio controls are unchanged.

## Preview

In this folder, run:

```powershell
python -m http.server 8000
```

Open http://localhost:8000, then ESCAPE → Somewhere Quiet. This is an in-page
scene, not a separate /forest route. Use the same browser and origin/port when
checking saved progress. This plain HTML/CSS/JS project has no SSR, package
manager, build or lint scripts, and needs no new dependencies.

## Verification

See FOREST-FINAL-QA.md for actual checks and remaining manual verification.
