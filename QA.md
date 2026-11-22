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

## Completed real-browser verification

20 randomized V10 browser races passed before production deployment, across all three families. The preview used the same physics and game code as production, with relative asset paths adjusted for the isolated directory. The `qa` URL flag exposed read-only race diagnostics in a Canvas data attribute; it did not change simulation or outcomes.

Checked in the browser:

- Fixed sloping queue while the selection hold and countdown ran, and a visible stopper until GO.
- Large animated numbers above the queue and removal of the stopper on GO; real rolling from the shelf afterward.
- Physical ramp, peg, spring, moving-gate and pendulum interaction; leader camera and finish approach.
- Seven actual finish crossings in each race. The first three remained locked throughout collection, and every marble was retained above the catcher at results.
- Repeated selection, countdown, replay and complete race lifecycles.
- 375×667, 390×844 and 1080×1920 layouts. Visual checks included the queued start, countdown, GO, race sections, the catcher with seven marbles, and podium/replay separation. A full-page 1080×1920 result was inspected.
- No warnings or errors were reported by either preview test page after the 20-race run.

All seven colors won. Third-place crossing times ranged from 12.756 to 22.339 seconds. The last marble crossed no later than 29.942 seconds in this browser sample. The collection hold then allowed the final arrival to settle before the podium. Races had 0–10 lead changes (mean 1.75). Faster and slower natural finishes are allowed.

Exact seeds, families, third-place times, last arrival times, podiums, lead changes and spring hits are retained in [tests/browser-v10.json](tests/browser-v10.json).

| Run | Seed | Family | Third place | All seven | Podium | Lead changes |
| --- | ---: | --- | ---: | ---: | --- | ---: |
| 1 | 1391183000 | Rolling Rivals | 19.073 s | 23.742 s | BLUE, MINT, SUNNY | 3 |
| 2 | 1699693908 | Switchback Springs | 16.690 s | 19.858 s | PINK, SUNNY, RED | 0 |
| 3 | 10007692 | Pinball Parade | 17.919 s | 22.650 s | SUNNY, LILAC, MINT | 2 |
| 4 | 215946805 | Switchback Springs | 14.971 s | 20.233 s | LILAC, RED, ORANGE | 0 |
| 5 | 3613936989 | Rolling Rivals | 21.676 s | 29.942 s | MINT, LILAC, SUNNY | 4 |
| 6 | 2821723630 | Switchback Springs | 12.756 s | 20.567 s | RED, ORANGE, MINT | 0 |
| 7 | 4171129729 | Rolling Rivals | 18.989 s | 21.192 s | ORANGE, PINK, RED | 3 |
| 8 | 2764828032 | Switchback Springs | 15.651 s | 18.475 s | LILAC, BLUE, PINK | 10 |
| 9 | 1273826845 | Rolling Rivals | 22.339 s | 25.679 s | BLUE, SUNNY, MINT | 7 |
| 10 | 654735100 | Switchback Springs | 15.004 s | 21.942 s | PINK, RED, LILAC | 1 |
| 11 | 205362266 | Pinball Parade | 17.428 s | 23.746 s | LILAC, ORANGE, SUNNY | 0 |
| 12 | 1590788012 | Pinball Parade | 16.949 s | 21.429 s | PINK, BLUE, LILAC | 0 |
| 13 | 2981908354 | Rolling Rivals | 18.734 s | 22.587 s | MINT, BLUE, PINK | 1 |
| 14 | 2624880131 | Switchback Springs | 12.843 s | 15.675 s | LILAC, ORANGE, PINK | 1 |
| 15 | 3651650323 | Pinball Parade | 17.617 s | 22.871 s | SUNNY, LILAC, BLUE | 2 |
| 16 | 3862167852 | Pinball Parade | 16.745 s | 21.358 s | ORANGE, SUNNY, MINT | 0 |
| 17 | 885325740 | Rolling Rivals | 19.914 s | 23.275 s | MINT, RED, SUNNY | 1 |
| 18 | 3469064614 | Switchback Springs | 16.337 s | 22.825 s | BLUE, ORANGE, MINT | 0 |
| 19 | 3238186952 | Rolling Rivals | 19.488 s | 27.012 s | BLUE, LILAC, RED | 0 |
| 20 | 3903225450 | Switchback Springs | 16.164 s | 17.667 s | ORANGE, LILAC, RED | 0 |

## Physical-device limits

These were real browser runs using mobile and recording viewport sizes. Physical iPhone Home Screen installation, speaker output and offline relaunch remain device-specific checks; worker/cache behavior and audio activation were reviewed and covered by the applicable automated checks above.
