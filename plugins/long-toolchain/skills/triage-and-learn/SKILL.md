---
name: triage-and-learn
description: "Triage a bug or issue to root cause, fix it, then turn the lesson into a durable improvement proposal so the same class of bug teaches the system once. Use when the user pastes a bug/error/stack trace/failing behavior and wants it fixed AND captured. Trigger phrases: triage this bug, fix this issue, here's an error, debug and remember, learn from this bug, this keeps happening."
---

# Triage And Learn

Single entry point that joins debugging to the learning loop: resolve the issue, then capture the lesson
so it compounds. Pairs the `debugging` skill (root cause) with the governance proposal flow.

## Flow

1. **Triage with the `debugging` skill** — reproduce, isolate, find the _root cause_ (not the symptom).
   Use `tech-pitfalls` to check if it's a known trap, and GitNexus (`gitnexus_query`/`impact`) for
   blast radius before editing.
2. **Fix** — apply the minimal correct fix; verify it (run the relevant check/test — evidence before
   claiming fixed).
3. **Classify the lesson:**
   - Cross-project code trap → propose a `tech-pitfalls` entry.
   - This-project fact/gotcha → note for `/consolidate-project` (project-profile gotchas).
   - Agent/toolchain behavior gap (the agent _should have_ caught/avoided it) → proposal via the
     `~/.claude/learning/` flow targeting the relevant skill/guidance.
   - User preference revealed → it's already captured as a correction signal; reinforce in profile.
4. **Write the proposal/entry** with provenance (the issue + the fix commit/files) and a rollback note.
   Add an eval scenario if it's a recurring or toolchain-behavior class.

## Guardrails

- Verify the fix actually works before capturing the lesson — don't enshrine an unproven fix.
- Durable promotions (CLAUDE.md/skills) go through ratify; project-profile/tech-pitfalls updates are
  lower-risk but still provenance-tagged.
- One bug → one lesson at the right scope. Don't over-generalize a single incident into a hard rule
  (wait for recurrence, per `/learn-from-failures` salience escalation).

## Output

The fix (what changed + verification evidence) and the captured lesson (where it landed + why that scope).
