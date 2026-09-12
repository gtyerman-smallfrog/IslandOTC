# Changelog — Island Rail

Versioning for the 3D train-set game in [`train-set/`](train-set/).

**Convention:** the version starts at **1.00** and goes up by **0.01** on every update.
The single source of truth is the `VERSION` constant near the top of the script in
`train-set/index.html`; it is stamped into the heads-up display and the help overlay at
load time, so it only ever needs changing in one place. Bump it in the same commit as the
change it describes, and add a section here.

---

## v1.04

- **Car park.** The airport now has one on the landside of the terminal: marked bays in two
  rows off a central aisle, kerbs, lamp columns, an access lane, and a zebra crossing to
  the terminal doors. Cars and vans fill about seventy percent of the bays; buses and
  lorries stay out of it.
- **The airport can be dragged.** A new Move Airport tool (key 5) picks up the whole
  complex, runway, taxiways, apron, terminal, tower, car park, parked aircraft and the rail
  stop included, and sets it down anywhere it fits. Moving is free and undoable.
- The outline follows the cursor and turns red where it will not go, naming the reason:
  water, sloping ground, a road, an existing building, track in the way, another
  destination, or a train standing in it.
- The rail stop travels with the airport. Track a player laid up to the old stop stays put,
  so a line may need extending to the new one.
- Rearranged the terminal properly while doing this: the apron and parked aircraft are now
  airside, north of the building, with the car park landside to the south.
- Internally the airport was rebuilt in local coordinates inside one group, which is what
  makes moving it a single position change rather than a rewrite of every coordinate.

## v1.03

- **Undo.** The ↩ button beside the tools, or Ctrl+Z, takes back the last thing you built,
  erased or rotated. It is genuinely free: each change is recorded together with the
  balance from before it, and undoing restores that exact balance rather than paying a
  refund, so nothing is lost to an accidental drag.
- It goes back through the last 60 changes, not just one, and covers laying track, erasing,
  rotating a piece, and placing or removing a signal. Throwing a switch or changing a
  signal is not stacked, since both are free and undone by clicking again.
- Trees cleared to make way for track come back when the track is undone.
- Undo refuses, without charging anything, if a train is standing on the track it would
  remove. Loading a saved layout clears the history, since the whole map is replaced.
- The button is greyed out when there is nothing to undo, and its tooltip names what will
  go next.

## v1.02

- **The island now has a coast.** An eight-tile band of open water runs right around the
  map, so the land reads as an island rather than a green sheet, with a sand rim along
  every shoreline and the inland lake sharing the same sea surface.
- **The harbour moved to the east coast.** It was on the inland lake, which is no place for
  a port. It now sits on the shore at tile 152,94 with a proper quay: a concrete apron,
  quay wall, bollards, two transit sheds and three gantry cranes reaching out over the
  water.
- **Ships dock.** Two cargo ships steam up the coast, come alongside their berth, lie there
  working cargo, then put back out to sea. They ride the swell, sit at a realistic draught,
  and turn rather than sliding when they come about.
- Streets now stop at the shore instead of running into the sea, and cars wrap inside the
  paved span rather than six units past the end of it.
- The south-eastern range was reshaped to sit between the city and the new port, so the run
  out there is a genuine choice between tunnelling through and going the long way round.
- Starting money raised to 15,000, since the port is now a long haul.
- Saved layouts from before this version are refused, as the map changed underneath them.

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
