---
description: "Chained multi-perspective review of a plan or feature (strategy + design + engineering), auto-deciding obvious choices and surfacing only taste/challenge decisions at the final gate."
---

# Auto-Review Pipeline

Run a chained multi-perspective review of a plan file or feature implementation. Three sequential phases, each building on the last. Auto-decides intermediate questions using 6 principles — only surfaces taste decisions and user challenges at the final gate.

## When to use
- You have a plan, spec, or multi-file feature and want a thorough review before shipping
- You want strategy + design + engineering perspectives without running each manually
- You want auto-decisions on obvious choices, with only ambiguous ones surfaced

## The 6 Decision Principles

These rules auto-answer every intermediate question:

1. **Choose completeness** — Pick the approach that covers more edge cases
2. **Blast radius** — Fix everything in the blast radius (modified files + direct importers). Auto-approve expansions that are in blast radius AND < 5 files
3. **Pragmatic** — If two options fix the same thing, pick the cleaner one. 5 seconds choosing, not 5 minutes
4. **DRY** — Duplicates existing functionality? Reject. Reuse what exists
5. **Explicit over clever** — 10-line obvious fix > 200-line abstraction
6. **Bias toward action** — Flag concerns but don't block progress

## Decision Classification

- **Mechanical** — one clearly right answer. Auto-decide silently.
- **Taste** — reasonable people could disagree. Auto-decide with recommendation, surface at final gate.
- **User Challenge** — both perspectives agree the user's stated direction should change. NEVER auto-decided. Always surfaced.

## Sequential Execution

Phases MUST execute in strict order: Strategy → Design → Engineering.
Each phase completes fully before the next begins.

---

## Phase 1: Strategy Review

Delegate to **Code Reviewer** with this focus:

> Review as a CEO/strategist. Evaluate:
> 1. Are the premises valid or assumed? Is this the right problem to solve?
> 2. What alternatives were dismissed too quickly?
> 3. What's the 6-month regret scenario — what will look foolish?
> 4. Scope calibration — too much, too little, or right-sized?
> 5. What's NOT in scope that should be?

Collect findings. Auto-decide mechanical issues. Mark taste decisions.

**Required outputs:** Premise evaluation, scope assessment, "NOT in scope" list, alternatives considered.

---

## Phase 2: Design Review (conditional — skip if no UI scope)

Detect UI scope: grep the plan/files for view/rendering terms (component, screen, form, button, modal, layout, dashboard, sidebar, nav, dialog). Require 2+ matches.

Delegate to **Code Reviewer** with this focus:

> Review as a senior product designer. Evaluate:
> 1. Information hierarchy — what does the user see first? Is it right?
> 2. Missing states — loading, empty, error, success, partial
> 3. User journey — where does the emotional arc break?
> 4. Specificity — does the plan describe SPECIFIC UI or generic patterns?
> 5. Accessibility — keyboard nav, contrast, touch targets

Collect findings. Feed Phase 1 context in. Auto-decide structural issues. Mark aesthetic taste decisions.

**Required outputs:** State completeness audit, accessibility gaps, specificity score.

---

## Phase 3: Engineering Review

Delegate to **Code Reviewer** with this focus:

> Review as a senior engineer. Evaluate:
> 1. Architecture — component structure, coupling, scaling
> 2. Edge cases — what breaks under 10x load? Nil/empty/error paths?
> 3. Test coverage — what's missing? What breaks at 2am Friday?
> 4. Security — new attack surface? Auth boundaries? Input validation?
> 5. Hidden complexity — what looks simple but isn't?

Feed Phase 1 + Phase 2 context in. Auto-decide using principles. Mark taste decisions.

**Required outputs:** Architecture assessment, test gap analysis, security findings, complexity flags.

---

## Decision Audit Trail

After each auto-decision, record:

| # | Phase | Decision | Classification | Principle | Rationale |
|---|---|---|---|---|---|

---

## Final Approval Gate

Present to the user:

```
## Auto-Review Complete

### Summary
[1-3 sentences]

### Decisions Made: [N] total ([M] auto-decided, [K] taste, [J] user challenges)

### User Challenges (if any)
**Challenge [N]: [title]** (from [phase])
You said: [original direction]
Both perspectives recommend: [the change]
Why: [reasoning]
Your call — your original direction stands unless you explicitly change it.

### Taste Decisions (if any)
**Choice [N]: [title]** (from [phase])
I recommend [X] — [principle]. But [Y] is also viable.

### Review Scores
- Strategy: [summary]
- Design: [summary or "skipped, no UI scope"]
- Engineering: [summary]

### Deferred Items
[Items auto-deferred with reasons]
```

Options:
- A) Approve as-is
- B) Approve with overrides (specify which taste decisions to change)
- C) Interrogate (ask about specific decisions)
- D) Revise (plan needs changes)
