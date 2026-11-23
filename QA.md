# V11 verification record

## Requested behavior

- Retain PICK A MARBLE / Which one will win? and seven original selectable marble designs.
- Remove the visible TRUNKZ MARBLES heading and the two extra introductory captions.
- Thicken the side boundaries from 3 to 7 logical units and account for their width in collisions.
- Start immediately with GO; remove both the three-second hold and 3–2–1 countdown.
- Render every peg/bumper as a solid black dot with a small rebound.
- Lower gravity from 650 to 500 units/s² and downward speed from 920 to 480 units/s; enforce that cap after obstacle collisions too. Limit dot rebound to 145 units/s.
- Stop physics on the third actual crossing and show the podium immediately. Do not wait for all seven or continue the collection phase.

## Automated checks completed

- JavaScript syntax checks passed.
- 30 complete app lifecycle checks passed: minimal intro text, seven selectable choices, immediate racing/GO, absent stopper after Start, no hold/countdown/collection mode, finish on the third crossing, frozen result positions/time and replay to a new family.
- An isolated free-fall test verified the lower falling-speed limit. A controlled bumper collision verified a small upward rebound; all round bumpers were marked bouncy.
- 750 seeded physics races passed: 250 per family. All ended with at least three actual crossings, ordered timestamps, unique finishers, finite body state, track/pair interaction and bodies inside the thicker wall bounds. No race reached the test-only 40-second failure threshold. The game itself has no time-based ranking cutoff.
- Every color won in each family.
- Every stop occurred within one 1/240-second simulation step of the interpolated third crossing, and another default engine step left the finished race unchanged.
- Offline/version-query asset checks and cache isolation passed, including removal of V10 caches while retaining unrelated applications' caches.

| Family | Races | Third-place median | Range | Mean lead changes |
| --- | ---: | ---: | ---: | ---: |
| Switchback Springs | 250 | 16.554 s | 14.304–19.419 s | 2.67 |
| Pinball Parade | 250 | 20.227 s | 18.129–22.907 s | 2.56 |
| Rolling Rivals | 250 | 23.028 s | 20.883–28.166 s | 3.74 |

Slower motion can extend racing time, while removing the old pre-race hold/countdown and all-seven collection wait reduces recording overhead.

## Real-browser checks completed

20 randomized preview races passed across all three course families. Each began racing immediately after Start, without a gate or countdown hold. Every run ended with exactly three recorded finishers; the longest delay between the third crossing and the physics stop was 4.127 ms, within one simulation step. Re-reading the result state confirmed physics time stayed frozen. Both test pages reported no console warnings or errors.

Visual inspection covered 375×667, 390×844 and 1080×1920 viewports. Checked the simplified intro, thicker walls, immediate GO overlay, solid black bouncy dots, actual race movement and the unbranded result screen. The full 1080×1920 podium/replay composition remained separate and unclipped.

Exact browser seeds, families, third-place times, stop deltas, podiums and lead changes are recorded in [tests/browser-v11.json](tests/browser-v11.json). Times in that file are rounded for reporting; stop deltas were calculated from the unrounded crossing timestamps.

## Physical-device limits

These were real browser tests using phone/recording viewport sizes. Physical iPhone installation, speaker output and offline relaunch remain device-specific checks. The game cannot stop the phone's native screen recorder; the podium is the cue to end recording.
