# V9 verification record

## Completed automated checks

- JavaScript syntax: game, physics and service worker.
- 750 seeded physics races: 250 per course family. All completed before the 25-second test failure threshold. That threshold exists only in testing; the game has no race cutoff.
- All seven colors won in each family.
- All finishers crossed from above to below the physical checkered line, within the side boundaries. Finish timestamps were ordered, unique racer IDs were preserved, and results required at least three real finishers.
- Every marble contacted the track; every race included marble-to-marble interaction. Coordinates, velocity and rotation stayed finite and marbles stayed within course boundaries.
- 30 complete app lifecycle runs using a headless DOM/Canvas stub: selection, immediate Start feedback, hold, full countdown, racing, real top three, persistent results, replay to a different course family. All three families and seven winning colors covered. This is **not a real browser test**.
- Offline/cache simulation: both versioned scripts and all seven sprites resolve on the first offline load; navigation falls back to the app shell; other applications' caches and requests are left alone.
- Seven V8 marble SVG bytes preserved without modification.

| Course family | Races | Median seconds | Range seconds | Within 8–10 seconds | Mean lead changes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Switchback | 250 | 9.412 | 7.996–10.975 | 209 | 2.58 |
| Split Decision | 250 | 8.921 | 7.558–10.283 | 241 | 3.61 |
| Funnel Club | 250 | 8.258 | 6.871–9.492 | 173 | 4.88 |

623 of 750 races (83.1%) met the target window. Races are allowed to finish naturally outside that window.

## Completed real-browser QA

The existing V8 production game was inspected and raced before editing. V9 was then tested at an isolated HTTPS path in this same repository before replacing the production root.

20 instrumented randomized races passed across all three course families. Every result required at least three physical finish crossings; the diagnostics verified each crossing had a position above the plane followed by a position at or below it. The runs included track and marble-to-marble contact, six winning colors, 1–10 lead changes per race (mean 3.4), and finish times from 7.925 to 9.821 seconds. 19 of 20 runs finished in the target 8–10 second window. The earlier 750 seeded simulation sample included all seven winning colors in every family.

| Run | Seed | Family | Seconds | Podium | Lead changes |
| --- | ---: | --- | ---: | --- | ---: |
| 1 | 1904456655 | Switchback | 8.671 | Lilac, Sunny, Blue | 3 |
| 2 | 1571901907 | Funnel Club | 8.492 | Blue, Lilac, Orange | 9 |
| 3 | 555970406 | Switchback | 9.317 | Pink, Mint, Red | 1 |
| 4 | 2021209838 | Split Decision | 8.483 | Red, Lilac, Blue | 2 |
| 5 | 3698928479 | Switchback | 9.100 | Orange, Pink, Sunny | 1 |
| 6 | 2475549924 | Split Decision | 8.754 | Pink, Orange, Mint | 4 |
| 7 | 2062229726 | Funnel Club | 8.487 | Red, Pink, Mint | 10 |
| 8 | 3651169006 | Switchback | 9.617 | Red, Pink, Blue | 4 |
| 9 | 3016568128 | Split Decision | 9.387 | Blue, Red, Sunny | 3 |
| 10 | 190327821 | Switchback | 9.821 | Orange, Pink, Mint | 3 |
| 11 | 2228418346 | Split Decision | 9.187 | Mint, Sunny, Blue | 2 |
| 12 | 3808792083 | Switchback | 9.442 | Lilac, Pink, Blue | 2 |
| 13 | 2300847696 | Split Decision | 8.383 | Pink, Sunny, Red | 1 |
| 14 | 3646785689 | Switchback | 9.675 | Blue, Red, Pink | 2 |
| 15 | 3972114445 | Funnel Club | 8.229 | Orange, Sunny, Red | 5 |
| 16 | 293370173 | Split Decision | 8.504 | Orange, Pink, Blue | 3 |
| 17 | 670283901 | Switchback | 9.746 | Lilac, Blue, Mint | 2 |
| 18 | 4190773318 | Split Decision | 9.079 | Lilac, Sunny, Pink | 1 |
| 19 | 4234731742 | Funnel Club | 7.925 | Orange, Blue, Lilac | 6 |
| 20 | 939381781 | Split Decision | 9.371 | Red, Orange, Sunny | 4 |

Visual inspection covered 375×667, 390×844 and 1080×1920 viewports, including the starting platform, selection, immediate queued feedback, countdown, whole-marble rotation, ramp/spinner contact, leader-camera views, visible checkerboard approach and podium/replay separation. The 1080×1920 composition was measured in the DOM; the action button occupies approximately y=1478–1600. No warnings or errors were reported by the preview console after the 20-race run. Replay repeatedly returned to a different family and a fresh starting screen.

An initial black loading flash was corrected by drawing the loading state before decoding the sprites. Preview-only DOM diagnostics did not alter physics and are excluded from the production game.

## Device-specific limits

These were real browser runs with mobile viewport sizes, not tests on physical iPhone hardware. Actual iOS Home Screen installation, speaker output and offline relaunch should still be checked on the target phone. WebAudio activation, PWA metadata, service worker behavior and offline cache routing were covered by source review and the automated checks described above.
