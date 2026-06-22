---
name: feature-user-moderation-and-appeals
description: "FEATURE SKILL - Build complete user moderation systems with suspension, blocking, ban appeals, and restoration workflows. Use for user management, moderation consoles, abuse handling, and account recovery paths. Trigger phrases: user moderation, suspend user, block unblock, ban appeals, restore account, moderation workflow."
argument-hint: "Describe roles, moderation actions, appeal policy, recovery window, and required audit/compliance constraints."
---

# Feature Skill: User Moderation And Appeals

Reusable playbook for lifecycle-complete user moderation.

## Seniority Ladder

| Level | Required competency |
|---|---|
| Junior | Basic user list/search and simple status updates. |
| Mid | Suspend/block/unsuspend/unblock actions with reason codes, confirmations, and audit logs. |
| Senior | Appeal workflow state machine, restoration windows, and cross-feature consistency checks. |
| Staff | Policy governance, escalation routes, abuse-pattern controls, and metrics. |

## Mandatory Moderation Actions

Implement and document:
- deactivate/reactivate
- suspend/unsuspend
- block/unblock
- soft delete/restore
- hard delete (if policy allows)

If any action is intentionally excluded, document reason and owner approval.

## Preferred Build Pattern

1. Define status model and transition rules first.
2. Define role x action matrix for moderation actions.
3. Implement backend-guarded mutation endpoints.
4. Add confirmation UX for risky actions.
5. Add appeal intake/review/resolution flow.
6. Add audit logging and moderation timeline view.

## Appeal Workflow Baseline

State flow example:
- active -> suspended or blocked
- suspended/blocked -> appeal_submitted
- appeal_submitted -> under_review
- under_review -> restored or upheld

Every transition records actor, reason, and timestamp.

## Verification Gates

- [ ] Moderation actions have backend permission checks.
- [ ] Each restrictive action captures reason code.
- [ ] Appeal workflow exists with explicit states and transitions.
- [ ] Restore paths are tested (not just restrict paths).
- [ ] Audit logs capture moderation and appeal decisions.
- [ ] UI prevents hidden side-effects on related modules.

## Works With

- `entity-lifecycle-operations`
- `role-based-access-control`
- `audit-logging-patterns`
- `feature-auth-system`

## Output Contract

When invoked, provide:
1. Moderation state machine.
2. Role-action matrix.
3. Appeal policy and transition map.
4. Audit and verification checklist.
