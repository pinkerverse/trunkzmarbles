# TRUNKZ Marbles · V11 recording flow

A dependency-free, 9:16 marble-race recording tool for iPhone PWA and Instagram Reels. Only `pinkerverse/trunkzmarbles` is in scope. The seven original marble SVG designs remain unchanged.

## Recording flow

1. The game opens on seven marbles queued on the actual sloping starting shelf. The only introductory copy is **PICK A MARBLE** and **Which one will win?** Small color labels identify the seven choices.
2. Tap a marble if desired, begin your phone's screen recording, then tap **START RACE**. The stopper disappears and racing starts immediately with **GO!** There is no queued hold, 3–2–1 countdown or extra introductory caption.
3. Watch the race. The side boundaries are thicker; every round peg/bumper is a solid black dot with a modest rebound. Falling motion uses lower gravity and a lower downward speed limit.
4. The game ends on the third physical finish crossing and displays the top-three podium immediately. It does not wait for the other four marbles or run an extra collection phase. Stop the phone recording when the podium appears.
5. **RACE AGAIN** returns to a new course and fresh selection screen.

The on-screen TRUNKZ MARBLES heading, 7 MARBLES / 1 WINNER caption and Tap a marble to back it caption have been removed. App metadata and icons retain their identity for installation.

## Simulation and layout

The three varied course families retain their ramps, funnels, peg fields and moving obstacles. Physics uses a fixed 240 Hz timestep, real collisions, rolling spin and interpolated crossing times. Results are never awarded by a timer or by unfinished positions.

V11 tuning: gravity 500 world units/s², downward cap 480 units/s (also applied after collisions), bumper rebound capped at 145 units/s, side boundary stroke 7 units. The visible border thickness is reflected in the collision bounds.

The composition remains 9:16 and scales without cropping on tall phone screens. Audio unlocks on the Start tap. The existing PWA and offline behavior are preserved with V11 script URLs and a new worker cache version. Worker updates reload only at an idle screen.

## Verification

Run with Node 18 or newer:

```sh
node --check game.js
node --check physics.js
node --check sw.js
node tests/physics.cjs
node tests/flow.cjs
node tests/offline.cjs
```

See [QA.md](QA.md) and [the recorded browser runs](tests/browser-v11.json) for verification evidence and device-specific limits.
