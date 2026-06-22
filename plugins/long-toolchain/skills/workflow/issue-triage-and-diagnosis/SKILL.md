---
name: issue-triage-and-diagnosis
description: "WORKFLOW SKILL - Run structured issue triage and diagnosis with reproducibility, lifecycle impact checks, and regression prevention gates. Use when: bug triage, issue diagnosis, root-cause analysis, and fix planning. Trigger phrases: triage bug, diagnose issue, root cause, issue workflow, reproducible fix plan."
argument-hint: "Describe reported behavior, impact scope, affected entities, and current evidence (logs/tests/screenshots)."
---

# Issue Triage And Diagnosis

Use this skill for disciplined issue handling before implementing fixes.

## Seniority Ladder

| Level | Required competency |
|---|---|
| Junior | Reproduce the issue and isolate affected path. |
| Mid | Root-cause hypothesis, lifecycle-impact assessment, and concrete fix plan. |
| Senior | Variant search, cascade-impact analysis, rollback strategy, and regression test strategy. |
| Staff | Incident taxonomy, escalation policy, and prevention-pattern extraction. |

## Triage Procedure

1. Capture symptom, scope, and severity.
2. Reproduce with deterministic steps.
3. Identify affected entity lifecycle actions and states.
4. Trace likely root causes and impacted surfaces.
5. Define fix plan with rollback and regression tests.

## Lifecycle Impact Check (Required)

For entity-affecting bugs, assess whether these are impacted:
- deactivate/reactivate
- block/unblock
- archive/restore
- soft/hard delete
- revoke/cancel

If impacted, fix plan must include explicit tests for those flows.

## Verification Gates

- [ ] Reproduction steps are deterministic.
- [ ] Root-cause hypothesis is evidence-backed.
- [ ] Lifecycle-impact surface is explicitly documented.
- [ ] Fix plan includes rollback path.
- [ ] Regression tests cover lifecycle and permission edge cases.
- [ ] Durable lessons are logged for future prevention.

## Output Contract

When invoked, provide:
1. Triage summary.
2. Root-cause hypotheses with confidence.
3. Lifecycle-impact matrix.
4. Fix and regression plan.
