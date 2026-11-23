# V12 verification record

## Requested behavior

- Retain PICK A MARBLE / Which one will win? and seven original selectable marble designs.
- Remove the visible TRUNKZ MARBLES heading and the two extra introductory captions.
- Thicken the side boundaries from 3 to 7 logical units and account for their width in collisions.
- Restore 3–2–1 beneath the title and above the marbles; release the stopper at GO, without another hold.
- Render every peg/bumper as a solid black dot with a strong pinball rebound.
- Lower gravity from 650 to 500 units/s² and downward speed from 920 to 480 units/s; enforce that cap after obstacle collisions too. Restore dot rebound up to 250 units/s.
- Stop physics on the third actual crossing and show the podium immediately. Do not wait for all seven or continue the collection phase.

## Automated checks completed

- JavaScript syntax checks passed.
- 30 complete app lifecycle checks passed: minimal intro text, seven selectable choices, stationary queued marbles through digits 3, 2, 1, countdown clearance, stopper removal at GO, no extra hold/collection mode, finish on the third crossing, frozen result positions/time and replay to a new family.
- An isolated free-fall test verified the lower falling-speed limit. A controlled bumper collision verified a strong upward rebound; all round bumpers were marked bouncy.
- 750 seeded physics races passed: 250 per family. All ended with at least three actual crossings, ordered timestamps, unique finishers, finite body state, track/pair interaction and bodies inside the thicker wall bounds. No race reached the test-only 40-second failure threshold. The game itself has no time-based ranking cutoff.
- Every color won in each family. All 2,250 top-three finishers contacted a pegboard pin.
- Funnel halves are level with one another and their mouths measure 98–100 units.
- Every stop occurred within one 1/240-second simulation step of the interpolated third crossing, and another default engine step left the finished race unchanged.
- Offline/version-query asset checks and cache isolation passed, including removal of V8, V10 and V11 caches while retaining unrelated applications' caches.

| Family | Races | Third-place median | Range | Mean lead changes |
| --- | ---: | ---: | ---: | ---: |
| Switchback Springs | 250 | 24.084 s | 20.438–27.890 s | 5.92 |
| Pinball Parade | 250 | 22.978 s | 19.581–27.774 s | 3.93 |
| Rolling Rivals | 250 | 23.857 s | 22.273–25.645 s | 3.82 |

The countdown adds three seconds before the recorded race times above. The finish still stops on the third crossing.

## Real-browser checks

20 randomized preview races passed across all three families, with no console warnings or errors. Every podium marble hit the pegboard. The maximum measured third-crossing stop delay was 4.047 ms. Results remained frozen.

Browser verification and measured seeds are recorded in [tests/browser-v12.json](tests/browser-v12.json). The countdown is visually separated from the starting grid, with its conservative maximum digit bounds ending at logical y=270.12 and the nearest marble beginning below y=278. All top-three finishers must contact the pegboard. Results must freeze within one simulation step of the third crossing.

## Physical-device limits

These were real browser tests using phone/recording viewport sizes. Physical iPhone installation, speaker output and offline relaunch remain device-specific checks. The game cannot stop the phone's native screen recorder; the podium is the cue to end recording.
