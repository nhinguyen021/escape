# Quiet Forest — visual foundation

Added within the existing static HTML/CSS/JavaScript project. No framework,
dependency, new repository, or server route was introduced.

## Files changed
- index.html: loads quiet-forest.css and adds #forest-scene.
- assets/js/main.js: registers Forest with existing scene/focus/audio management,
  handles the quiet destination and its back button, pauses obscured canvas rain.
- assets/css/quiet-forest.css: new scoped desktop/mobile visual layout.
- assets/art/quiet-forest.svg: new local woodland illustration.
- FOREST-FOUNDATION.md: this note.

The shared header and audio panel are retained. Quiet uses the existing quiet
track. The page presents the requested copy, a woodland clearing and an empty
foreground garden. No Plant/Water/Sunlight logic or storage was added.

No woodland photo existed in the project: the backdrop is original lightweight
SVG artwork, not photography. Static light, depth and grain avoid an extra
animation/rendering loop. The scene transition respects reduced motion.

Sea and Rain section markup and their implementation files were compared with
the pre-change files and are unchanged. Existing music compositions, shared
styles, drawing/piano logic and assets are unchanged.

## Preview
Open index.html directly, or use the existing command from this project folder:

```powershell
python -m http.server 8000
```

Visit http://localhost:8000, choose ESCAPE, then Somewhere Quiet.
There is no /forest URL: #forest-scene is managed by the existing in-page
coordinator, not URL/hash routing. No build or package installation is needed.

## Checks
JavaScript syntax, local asset paths/IDs, preserved Sea/Rain files and simulated
navigation through every destination were checked. The existing three Node
regression tests were rerun. The standalone SVG was rendered for inspection.
Real browser layout/touch/audio checks were not run: local-page browser access
was blocked in this environment earlier in the task. No CPU benchmark is claimed.
