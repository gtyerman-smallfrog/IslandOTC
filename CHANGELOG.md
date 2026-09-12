# Changelog — Island Rail

Versioning for the 3D train-set game in [`train-set/`](train-set/).

**Convention:** the version starts at **1.00** and goes up by **0.01** on every update.
The single source of truth is the `VERSION` constant near the top of the script in
`train-set/index.html`; it is stamped into the heads-up display and the help overlay at
load time, so it only ever needs changing in one place. Bump it in the same commit as the
change it describes, and add a section here.

---

## v1.01

- **Airport moved 8 tiles north.** It sat directly against the east-west street at z=74, so
  the apron and the road ran into one another. There is now a nine-tile gap, and no road
  tile lies under any airport pavement or building.
- **Aircraft scaled to 55%.** They were drawn at roughly 24 units long against 4.6-unit
  cars, which read as far too large beside the terminal.
- **Take-offs no longer fly sideways.** The fuselage lies along the model's X axis, but the
  flight code set a heading of plus or minus 90 degrees while the aircraft travelled along
  X, so the nose pointed across the direction of travel for the whole cycle. Headings are
  now 0 travelling east and 180 travelling west, and the climb attitude, which was pitching
  the nose down, is the right way up.
- **Fixed the taxi loop.** The aircraft teleported 80 units backwards at the end of each
  circuit. It now taxis to a stand, waits, and goes round again continuously.
- **Fixed the landing.** The glide path was flown on a fixed descent rate and floated the
  whole runway, touching down past the western end and braking across the grass. It is now
  derived from the runway geometry and touches down on the paving.
- Added a rapid-exit taxiway where the aircraft leaves the runway, and stopped the holding
  point link drawing over the runway edge.
- On the ground the nose follows the actual direction of travel, so turning onto and off
  the runway reads as a turn rather than a sideways slide.
- No trees on pavement: tree placement now also avoids buildings and paved tiles.

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
