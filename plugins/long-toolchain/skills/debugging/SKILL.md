---
name: debugging
description: "Systematic debugging and root-cause investigation through structured hypothesis testing. Use when a bug's cause is unknown, fixes keep regressing, or multiple symptoms may share a root cause. This skill LEADS root-cause diagnosis of a failing or flaky/intermittent test (quality-manager authors and runs tests but does not diagnose them). For a KNOWN recurring trap, check tech-pitfalls first. Trigger phrases: investigate bug, debug this, find root cause, why is this failing, trace this issue, flaky test root cause."
---

# Systematic Debugging & Root Cause Investigation

**WORKFLOW SKILL** — Investigate bugs, crashes, and unexpected behavior through structured hypothesis testing. Use when a bug's cause is unknown, when fixes keep regressing, or when multiple symptoms may share a root cause. Trigger phrases: investigate bug, debug this, find root cause, why is this failing, trace this issue.

## The Iron Law

**Never apply a fix without identifying the root cause.** Patching symptoms creates regression whack-a-mole. If you cannot explain WHY the bug happens, you cannot verify the fix is correct.

## Investigation Protocol

### Phase 1 — Scope Lock

Before investigating:

1. **Define the symptom precisely**: what happens, what should happen, when it started.
2. **Lock the investigation scope**: do NOT fix other issues discovered along the way. Log them to a `deferred-issues.md` file instead.
3. **Set a hypothesis budget**: max 5 hypotheses before escalating to the user.

### Phase 2 — Evidence Collection

Gather facts before forming hypotheses:

1. **Reproduce**: Confirm the bug is reproducible. Document exact steps.
2. **Isolate**: Find the smallest input/state that triggers the bug.
3. **Read canonical references**: Before searching code for recurring facts, read relevant `memories/repo/` files (`third-party-apis.md`, `api-routes.md`, `data-model.md`, `query-catalog.md`, `edge-functions.md`, `env-vars.md`, `functions-and-symbols.md`, `project-map.md`).
4. **Trace**: Follow the data path from input to failure point.
   - Use GitNexus `context` and `impact` to understand call graphs.
   - Use grep/search to find all callers of the failing function only after the docs baseline is known or when docs are missing/stale.
   - Read error logs, stack traces, and browser console output.
5. **Timeline**: When did this last work? What changed since then?
   - Use `git log`, `git bisect`, or GitNexus `detect_changes` to identify suspect commits.

### Phase 3 — Hypothesis Testing (3-Strike Rule)

For each hypothesis:

| Step        | Action                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------ |
| **State**   | Write the hypothesis as a testable prediction: "If X is the cause, then Y should be true." |
| **Test**    | Design a minimal test that would confirm or refute the hypothesis.                         |
| **Verdict** | CONFIRMED / REFUTED / INCONCLUSIVE                                                         |

**3-Strike Rule**: If a hypothesis produces 3 inconclusive results, abandon it and move to the next. Do not keep testing a dead end.

Track all hypotheses in a table:

```markdown
| #   | Hypothesis | Prediction           | Test         | Verdict           |
| --- | ---------- | -------------------- | ------------ | ----------------- |
| 1   | {cause}    | {if true, expect...} | {what I did} | CONFIRMED/REFUTED |
```

### Phase 4 — Variant Analysis

Once root cause is confirmed:

1. **Search for variants**: Are there other places in the codebase with the same pattern?
2. Use `grep_search` or GitNexus `query` to find similar code patterns.
3. Classify each variant: VULNERABLE / SAFE / NEEDS-REVIEW.
4. If the search reveals reusable API/query/data/field/function/env/project facts, update or request an update to the relevant `memories/repo/` canonical reference.
5. Include variant count in the debug report.

### Phase 5 — Fix Verification

After applying the fix:

1. Confirm the original reproduction steps no longer trigger the bug.
2. Confirm the fix doesn't break adjacent functionality (run related tests).
3. Confirm the fix addresses all identified variants, not just the reported instance.
4. Write a regression test that would catch this bug if it were reintroduced.

## Debug Report Format

```markdown
## Debug Report: {title}

**Symptom**: {what the user observed}
**Root Cause**: {why it happened — the actual mechanism}
**Confidence**: {HIGH|MEDIUM|LOW}

### Investigation Trail

| #   | Hypothesis   | Verdict   | Evidence                   |
| --- | ------------ | --------- | -------------------------- |
| 1   | {hypothesis} | {verdict} | {what proved/disproved it} |

### Variants Found

- {count} instances of the same pattern
- {locations}

### Fix Applied

- {description of fix}
- {files changed}

### Regression Test

- {test name and what it verifies}

### Lessons Learned

- {what made this hard to find}
- {how to prevent similar bugs}
```

## Anti-Patterns

- **Shotgun debugging**: Changing multiple things at once to "see what works." Each change must be tested independently.
- **Fix-and-pray**: Applying a fix without understanding the root cause. If you can't explain why it works, it probably doesn't.
- **Scope creep**: Fixing unrelated issues discovered during investigation. Log them and stay focused.
- **Confirmation bias**: Only looking for evidence that supports your first hypothesis. Actively try to disprove it.
