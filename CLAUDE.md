# IslandOTC — working notes

Two separate static sites live here, both plain HTML/CSS/JS with no build step.

- `index.html` + `assets/` — the Island IO enterprise browser dashboard.
- `train-set/index.html` — Island Rail, a 3D train-set game (three.js from cdnjs).

## Versioning Island Rail

The game carries a version number, starting at **1.00** and rising by **0.01** on every
update. Keep to that step: 1.00, 1.01, 1.02, and so on.

- The source of truth is the `VERSION` constant near the top of the script in
  `train-set/index.html`. It is stamped into the heads-up display and the help overlay at
  load time, so change it there and nowhere else.
- Bump it in the same commit as the change it describes, and add a matching section to
  `CHANGELOG.md`.

## Testing the game

There is no test runner. Verify changes by driving the page in headless Chromium
(Playwright is available; Chromium lives at `/opt/pw-browsers/`). Two things make this
practical:

- `window.IslandRail` exposes the game's internals (map, trains, camera, and the
  `updateTrains` / `updateRoads` steppers) for scripted checks.
- The software renderer here runs far slower than real time, and the frame loop clamps
  `dt`, so waiting on wall-clock time is unreliable. Step the simulation directly instead,
  calling `updateTrains(0.05)` in a loop.
