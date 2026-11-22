# V10 verification record

## Reference review

All seven supplied screenshots (IMG_4034.PNG through IMG_4040.PNG) were visually reviewed. The three-second ScreenRecording_11-22-2026 23-20-12_1.mov was opened in QuickTime and reviewed for the large countdown above the queued characters, the sloping start shelf and the stopper release. The reference geometry informed the new peg fields, free-ended rolling ramps and swinging bars. TRUNKZ's original seven marble SVGs and monochrome track style are preserved.

## Completed automated verification

- JavaScript syntax checks passed for the game, physics engine and worker.
- 750 seeded physics races passed: 250 per course family. Every race delivered all seven real finishers before the test-only 40-second failure threshold, and all marbles remained on or above the catching rail during a further two seconds of physical settling. The app itself has no ranking cutoff.
- Every recorded finisher crossed from above to at/below the checkered plane, in timestamp order, inside the course boundaries. No duplicate finisher IDs were added.
- Every body remained finite and within the side boundaries. Every marble contacted the course, and all races included marble-to-marble contact.
- All seven colors won in each course family. First-three ranking stayed unchanged throughout the catch phase.
- 30 complete application lifecycle tests passed using a DOM/Canvas stub. Covered: selection, fixed queue during the hold/countdown, gate present before GO and absent during racing, catching phase, all seven finishers retained, persistent podium and replay to a new course family. These are not real browser tests.
- Offline/cache tests passed for the versioned scripts, seven original sprites, navigation fallback and isolation from other apps' caches.

| Family | Races | Third-place median | Third-place range | 14–20 seconds | Mean lead changes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Switchback Springs | 250 | 15.436 s | 12.545–18.607 s | 211 | 2.65 |
| Pinball Parade | 250 | 17.188 s | 14.288–19.751 s | 250 | 2.07 |
| Rolling Rivals | 250 | 19.921 s | 17.740–23.582 s | 132 | 3.79 |

The collection/settling phase follows the third-place finish and adds time to the overall recording. Longer trailing arrivals are allowed to finish naturally.

During implementation, a starter shelf too close to the side wall and pegboard edge gaps too narrow for a marble were found in simulation and corrected. Sliding release gates were added to gather the field and create more lead changes without scripted outcomes.

## Outstanding release checks

V10 has not yet passed real-browser QA. An isolated preview commit was prepared, but automatic approval review blocked updating main because fresh authorization was required for this V10 deployment. The live app remains V9.

Before releasing V10:

1. Publish the isolated HTTPS preview within this repository while keeping V9 at the root.
2. Run at least 20 randomized browser races across all families. Verify the sloping queue, pick banner and hit targets, full countdown, stopper removal, ramp/peg/spring interactions, camera, real crossings and the catching rail holding all seven.
3. Inspect 375×667, 390×844 and 1080×1920 layouts; ensure the countdown leaves the queue visible and the podium/replay control do not overlap.
4. Verify the root production URL and V10 scripts after publishing, then run a live smoke test.

Physical iPhone Home Screen installation, speaker output and offline relaunch remain device-specific checks.
