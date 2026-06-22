---
name: entity-lifecycle-operations
description: "WORKFLOW SKILL - Enforce complete entity lifecycle operations for admin/business systems. Use when: CRUD design, user/content management, admin tools, moderation systems, or any feature with destructive actions. Trigger phrases: lifecycle operations, complete CRUD, soft delete hard delete, deactivate block, archive restore, entity state machine."
argument-hint: "Describe the entity type, roles, required operations, recovery window, and audit/compliance requirements."
---

# Entity Lifecycle Operations

Use this skill whenever a feature touches entities that can be created, updated, restricted, archived, or deleted.

## Why This Exists

Many implementations stop at happy-path CRUD and miss high-risk lifecycle actions:
- deactivate/reactivate
- block/unblock
- archive/restore
- soft delete/hard delete
- recovery/appeal/rollback paths

This skill makes lifecycle completeness mandatory by default.

## Seniority Ladder

| Level | Required competency |
|---|---|
| Junior | Correct create/read/update/list/search with basic validation and role-aware visibility. |
| Mid | Full lifecycle actions with confirmation UX, backend role re-check, audit logging, and bulk-action safety. |
| Senior | State-machine transitions, recovery windows, cascade/orphan handling, rollback plans, and compatibility safeguards. |
| Staff | Org-wide lifecycle governance, retention/compliance policy, escalation paths, and policy metrics. |

## Lifecycle Action Matrix (Required)

For each entity, define all applicable actions:

| Action | Role gate | Confirmation | Reversible | Audit required |
|---|---|---|---|---|
| Create | Yes | Optional | N/A | Yes |
| Read/list/search/export | Yes | No | N/A | Export only |
| Update | Yes | Sensitive-field only | Yes | Yes |
| Deactivate/reactivate | Yes | Deactivate required | Yes | Yes |
| Block/unblock | Yes | Block required | Yes | Yes |
| Archive/restore | Yes | Optional | Yes | Yes |
| Soft delete/undelete | Yes | Required | Yes, within window | Yes |
| Hard delete/purge | Yes (strictest) | Required, typed confirm | No | Yes |
| Revoke/cancel (domain-specific) | Yes | Required | Usually partial | Yes |

If an action is intentionally unsupported, document why.

## Default Rules

1. Never ship CRUD-only for admin/business entities unless explicitly approved.
2. Prefer soft delete first, then hard delete after a defined window.
3. Hard delete must require typed confirmation and stricter permissions.
4. UI checks are not enough; re-check permission server-side.
5. Every destructive/restrictive transition must be audit-logged.
6. Bulk actions must show impact preview and require explicit confirmation.
7. Define cascade/orphan policy before deletion is implemented.

## Confirmation UX Baseline

Use a dedicated confirmation flow for destructive actions:
- clear action summary
- irreversibility or recovery-window message
- typed confirmation for hard delete
- optional reason code when policy requires it
- blocked state while request is in flight

## Implementation Procedure

1. Enumerate entity states and transitions.
2. Build role x action matrix.
3. Define action contracts (RPC/API) with server-side role checks.
4. Implement confirmations for risky actions.
5. Add audit logs for transitions and destructive actions.
6. Add tests for role enforcement, transitions, and recovery logic.

## Verification Gates

- [ ] Every required lifecycle action is implemented or intentionally documented as unsupported.
- [ ] Destructive actions require confirmation and clear user messaging.
- [ ] Server-side authorization protects every lifecycle mutation.
- [ ] Soft-delete recovery window and hard-delete policy are explicit.
- [ ] Cascade/orphan behavior is defined and tested.
- [ ] Audit logs capture actor, action, target, and timestamp.
- [ ] Permission and state-transition tests cover unhappy paths.

## Output Contract

When invoked, provide:
1. Entity state machine.
2. Role x action matrix.
3. API/RPC action contract list.
4. Confirmation and recovery policy.
5. Verification checklist with unresolved risks.
