# TRUNKZ Marbles · V14

A dependency-free, 9:16 marble-race recording tool for iPhone PWA and Instagram Reels. Only `pinkerverse/trunkzmarbles` is in scope. The seven original marble SVG designs remain unchanged.

## Recording flow

1. The game opens with seven marbles side by side at the same height. Small color labels identify the seven choices.
2. Tap a marble if desired, begin your phone's screen recording, then tap **START RACE**. The **3–2–1** countdown appears above the lineup. At **GO!**, the full-width gate drops all seven marbles together.
3. The first bumpers scatter the lineup. A shorter, two-row pinball section gives the pack another chance to reshuffle near the finish. During the race, the view is clear of ranking overlays.
4. The game ends on the third physical finish crossing and displays the top-three podium immediately. It does not wait for the other four marbles or run an extra collection phase. Stop the phone recording when the podium appears.
5. **RACE AGAIN** returns to a new course and fresh selection screen.

The on-screen TRUNKZ MARBLES heading, 7 MARBLES / 1 WINNER caption and Tap a marble to back it caption have been removed. App metadata and icons retain their identity for installation.

## Simulation and layout

The three course families use cleaner obstacle spacing, aligned 100-unit funnel mouths and extended ramps. Denser staggered peg fields and entry funnels keep marbles interacting with the pins. Redundant moving bars have been removed to reduce overlap. Physics uses a fixed 240 Hz timestep, real collisions, rolling spin and interpolated crossing times. Results are never awarded by a timer or by unfinished positions.

Gravity is 500 world units/s². The model caps downward speed at 480 units/s, including after collisions, and bumper rebound at 250 units/s. The collision bounds account for the 7-unit side boundary stroke.

The composition remains 9:16 and scales without cropping on tall phone screens. Audio unlocks on the Start tap. The PWA caches the V14 release for offline play. Worker updates reload only at an idle screen.

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

See [QA.md](QA.md) and [the recorded V12 browser runs](tests/browser-v12.json) for earlier verification and device-specific limits.
