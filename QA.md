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

## Browser observations and outstanding release gate

The existing V8 production app was opened and raced in a real browser. Its source confirms the eight-second progress-ranking fallback, endpoint clamping, very small rotation multiplier, wrong six-marble finish condition and low-screen replay control. The desktop viewport also visibly cropped the top title and crowded the podium/replay area.

The V9 replacement has **not yet passed real-browser QA**. A local HTTP preview could not bind a listening port in this environment, and local-file navigation was rejected by browser policy. An isolated HTTPS preview was prepared inside the existing repository, but automatic approval review rejected moving `main`; the production app remains V8.

Before releasing V9:

1. Make the isolated HTTPS preview available in this same repository, preserving the current root app until QA passes.
2. Run at least 20 randomized real-browser races covering all three course families. Record actual seed, family, duration, finish crossings, podium and lead changes.
3. Inspect 390×844 and 375×667 layouts, and a 1080×1920 recording composition. Check title, seven pick targets, countdown, camera, finish line, podium labels and replay spacing.
4. Confirm smooth visible ramp rolling/rotation, moving obstacles and lead changes, and no tunneling or deadlocks.
5. Check mobile WebAudio after the start tap and installed iPhone PWA/offline update behavior. A desktop browser cannot establish actual iPhone audio or installation behavior.
6. Publish only after browser QA passes, then verify the exact live URL and V9 scripts.
