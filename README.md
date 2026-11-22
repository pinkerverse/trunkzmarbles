# TRUNKZ Marbles · V10

A dependency-free 9:16 marble-race recording tool for iPhone PWA and Instagram Reels. Only `pinkerverse/trunkzmarbles` is in scope. The seven original V8 SVG illustrations remain unchanged.

## Race experience

- All seven marbles line up on a sloping starting shelf behind a visible vertical stopper. The pick-a-marble banner appears above the waiting queue. The chosen marble is selectable through accessible hit targets placed over its actual starting position.
- Start Race responds immediately, holds the selection for three seconds, then plays large animated 3–2–1 numbers above the queue. The stopper disappears on GO while the shelf stays in place and the marbles genuinely roll off its end.
- Three longer course families use free-ended ramps, funnels, pegboards, swinging pendulums, seesaws, rotating bars, sliding release gates and bounded spring bumpers. All track elements are black and white. Spring bumpers use concentric markings and a brief monochrome impact ring.
- Typical third-place finish times are approximately 15–20 seconds; races end naturally outside that range. There is no timer-based ranking, teleport recovery or predetermined winner.
- A smooth camera follows the leader to a real checkered crossing plane. Finish timestamps are interpolated and ordered by physical crossings.
- The first three places lock on their crossings. Physics then continues for every marble: all seven cross and collect on the visible physical catching rail below the finish. After they arrive and settle, the podium displays the original top three. Catcher contact cannot change the recorded finish order.
- Results remain until Race Again returns to a fresh course and starting queue.

## Technical details

`physics.js` uses fixed 240 Hz integration, iterative circle/segment and circle/circle constraints, conservative restitution, moving-obstacle surface velocities, constant gravity and rolling spin. The complete original marble illustration rotates during the race.

The responsive composition stays 9:16 without cropping on tall iPhone screens. Essential text, selection, countdown, podium and controls stay within the recording composition. Audio is unlocked by the Start tap.

`sw.js` precaches the app and all seven sprites, handles version-query requests offline and limits cache deletion to this app. V10 uses new script URLs and a new cache version. Worker-driven reloads wait for an idle screen.

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

[QA.md](QA.md) records completed automated checks, reference review and outstanding browser release checks.

Deploy the repository root with the existing GitHub Pages configuration after browser verification. On iPhone, use Safari → Share → Add to Home Screen and the built-in screen recorder.
