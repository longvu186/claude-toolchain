---
name: role-based-access-control
description: "WORKFLOW SKILL - Define and enforce role-based access control matrices for product and admin systems. Use when: permission design, role-gated features, moderation controls, admin operations, and multi-role workflows. Trigger phrases: RBAC, role matrix, permission system, who can do what, role-gated actions."
argument-hint: "Describe roles, resources, sensitive actions, tenancy boundaries, and escalation requirements."
---

# Role-Based Access Control

Use this skill to avoid scattered permission checks and missing high-risk restrictions.

## Seniority Ladder

| Level | Required competency |
|---|---|
| Junior | Basic role checks in UI and API handlers for core actions. |
| Mid | Central role-action matrix, backend enforcement, and explicit deny paths. |
| Senior | Resource-scoped permissions, transition guards, and conflict handling across modules. |
| Staff | Organization-wide policy model, governance controls, and cross-team consistency. |

## RBAC Matrix Template

| Role | Create | Read own | Read all | Update own | Update all | Moderate | Delete soft | Delete hard |
|---|---|---|---|---|---|---|---|---|
| User | TBD | TBD | No | TBD | No | No | No | No |
| Staff | TBD | TBD | TBD | TBD | TBD | TBD | TBD | No |
| Admin | TBD | TBD | Yes | TBD | Yes | Yes | Yes | TBD |
| Super admin | TBD | TBD | Yes | TBD | Yes | Yes | Yes | Yes |

Fill this matrix before implementing role-gated features.

## Required Controls

1. Permission checks must run on backend mutation paths.
2. UI visibility should mirror backend permissions but not replace them.
3. Denied actions return deterministic errors (not silent failures).
4. Sensitive role changes require elevated confirmation.
5. Permission changes and role transitions are audit-logged.

## Automation Baseline

Permission coverage is incomplete until the role matrix maps to concrete test actors.

- Seed one non-production account per critical role.
- Seed restricted-state accounts when states such as `suspended`, `blocked`, or `deactivated` change access.
- Keep at least one signed-out path in the permission test matrix.
- Prefer real seeded accounts over UI-only impersonation for backend authorization coverage.
- For auth-protected apps, pair the matrix with a first-party bootstrap lane such as API login, session bootstrap, or `storageState`.

## Lifecycle Compatibility

RBAC must explicitly cover lifecycle actions:
- deactivate/reactivate
- block/unblock
- archive/restore
- soft/hard delete
- revoke/cancel

If lifecycle actions exist without RBAC coverage, the implementation is incomplete.

## Verification Gates

- [ ] Matrix exists and is reviewed before coding.
- [ ] API/RPC handlers enforce role checks for all mutations.
- [ ] Deny-path behavior is tested for each high-risk action.
- [ ] Role-transition actions are separately protected.
- [ ] Permission behavior is consistent across UI and backend.
- [ ] Audit logs record role and permission changes.
- [ ] Seeded accounts or equivalent real test actors exist for critical roles and restricted states.

## Output Contract

When invoked, provide:
1. Final role-action matrix.
2. Sensitive-action guard policy.
3. API/RPC enforcement points.
4. Permission test matrix, seeded actor plan, and gaps.
