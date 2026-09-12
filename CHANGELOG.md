# Changelog — Island Rail

Versioning for the 3D train-set game in [`train-set/`](train-set/).

**Convention:** the version starts at **1.00** and goes up by **0.01** on every update.
The single source of truth is the `VERSION` constant near the top of the script in
`train-set/index.html`; it is stamped into the heads-up display and the help overlay at
load time, so it only ever needs changing in one place. Bump it in the same commit as the
change it describes, and add a section here.

---

## v1.00

First numbered release. Everything built before versioning existed is folded into this
baseline.

**The island**

- 168x168 tile map, six times the width of the original, with the city spread over only
  twice the area so there is open ground on every side to expand into.
- Central Station with a through platform, a three-road holding yard, and four
  destinations: the Harbour, the Quarry, Hilltown and the Airport.
- Hills, a lake, four streets and scattered woodland.

**Building**

- Drag to lay track. Runs form straights and curves, branching off a line makes a switch,
  and crossing one at right angles makes a diamond.
- Track over a road becomes a level crossing with boom gates; track through a hill becomes
  a tunnel with stone portals. Both cost extra.
- Signals, switch throwing, an eraser with a half refund, and save/load to the browser.

**Operations**

- Trains obey the track controls: red signals, switch settings, trains ahead, dead ends and
  curve speed limits. Two trains on one tile is a crash, followed by recovery to the yard.
- Route planning by breadth-first search, with optional automatic switch setting.
- Deliveries between places pay by distance.

**The world in motion**

- Four signalled road intersections, each running its own green and amber cycle.
- Six vehicle types that queue at red lights and closed gates and light their brake lights.
- An airliner working a full cycle at the airport: taxi, take-off roll, climb out,
  approach, landing and vacating the runway.

**Controls**

- Mouse: left-drag orbits, right-drag pans, the wheel zooms.
- Touch: one finger orbits or lays track, two fingers pinch to zoom and drag to pan, with
  on-screen zoom buttons. The phone layout moves the tools to a bottom bar and the train
  list into a sheet.
