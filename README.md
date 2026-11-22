# TRUNKZ Marbles · V9 overhaul

A lightweight, dependency-free 9:16 marble-race recording tool for iPhone PWA and Instagram Reels. Only `pinkerverse/trunkzmarbles` is in scope.

## Experience

- Seven **unchanged V8 SVG marble designs**: Sunny, Pink, Blue, Lilac, Red, Orange and Mint. The complete illustration rotates through rolling contact.
- Opens on the actual starting platform. Tap an accessible marble button, then Start Race.
- Immediate queued feedback, a three-second selection hold, then full one-second 3–2–1 beats and audible GO. Audio unlocks from the start tap.
- Three course families: Switchback, Split Decision and Funnel Club. Consecutive recordings change family; each course uses bounded geometry variations, shuffled grid positions and rotating gates.
- White paper, rounded black obstacles and grayscale controls. A fixed 9:16 composition scales without cropping on taller iPhone screens; essential text, podium and action button stay away from Reel edges.
- Smooth leader camera and a visible physical checkered finish line.
- Results appear only after three marbles really cross that line. There is no time cutoff, progress-based ranking, teleport recovery or preselected winner. Crossing times are interpolated and sorted to avoid ID/iteration bias.
- Results persist until Race Again, which returns to a fresh selection screen.

## Implementation

`physics.js` is shared by the production Canvas app and regression tests: fixed 240 Hz integration, iterative circle/segment and circle/circle constraints, conservative restitution, constant gravity, moving-bar surface velocities and rolling friction/spin. No dependencies or network services are required by the game.

`sw.js` precaches both scripts and all seven original sprites. Offline requests with version query strings match those precached assets; navigation falls back to the app shell. Cache cleanup is limited to this app's prefix. Worker updates reload at an idle screen instead of during a race.

Deploy the repository root using the existing GitHub Pages setup. Install on iPhone through Safari → Share → Add to Home Screen. Use the iPhone's screen recording feature.

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

See [QA.md](QA.md) for measured simulation/browser results and the remaining physical-device verification limits.
