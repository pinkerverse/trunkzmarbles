# V13 draft: stronger pins and active late obstacles

Status: not deployed; final checks interrupted when the workspace became unavailable.

The pegboard now kicks upper-side contacts visibly upward, with a 330-unit rebound limit and explicit lift on glancing hits. Wall-mounted edge pins intercept side bypasses. Replace isolated late-course bumpers with two independently phased, counter-rotating 160-unit paddles. Slow rotation holds a marble long enough to allow a trailing marble to find another opening. Keep the clear 3–2–1 countdown, slower fall cap, thick walls and third-crossing finish.

Earlier candidates passed lifecycle/offline checks but failed either the race-duration guard or the late-overtake target. The final slower-paddle candidate has NOT completed validation: the 750-race run was interrupted by an unavailable workspace. Do not treat V12 QA records as V13 evidence. No V13 browser races have been completed.

Before release: run syntax checks and all three test files, examine lateLeadLost/lateContactRaces for each family, compare overtaking with V12, verify the new paddles and upward bounce in at least 20 browser races across all families, and check for excessive holds. Tune further if the overtaking threshold fails. Tests use a 55-second failure guard; it does not award game results on a timer. Publish only after passing verification and receiving release approval.
