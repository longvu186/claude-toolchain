---
name: feature-saas-usage-and-quota-management
description: "FEATURE SKILL - Build SaaS usage tracking and quota enforcement with lifecycle-complete tenant operations and safe admin controls. Use for plan limits, overage handling, tenant admin operations, and quota-based controls. Trigger phrases: SaaS usage tracking, quota enforcement, plan limits, tenant operations, overage handling."
argument-hint: "Describe tenancy model, usage meters, quota policies, plan tiers, and admin lifecycle actions."
---

# Feature Skill: SaaS Usage And Quota Management

Reusable playbook for tenant usage control and quota-safe operations.

## Seniority Ladder

| Level | Required competency |
|---|---|
| Junior | Meter collection and basic limit checks for a single tier. |
| Mid | Multi-tier quotas, overage handling, tenant lifecycle actions, and role-gated admin operations. |
| Senior | Forecasting, safety throttles, rollback/recovery for quota incidents, and lifecycle consistency across modules. |
| Staff | Governance policy, compliance boundaries, and organization-wide operational standards. |

## Required Operational Coverage

Define and implement:
- usage meters and limit checks
- soft/hard limit behavior
- overage policy
- tenant lifecycle actions (suspend/reactivate/archive/delete)
- audit logging for plan and limit changes

## Preferred Build Pattern

1. Define usage dimensions and plan-tier limit model.
2. Implement deterministic quota-check path in backend.
3. Define tenant status model and lifecycle transitions.
4. Add confirmation UX for high-risk admin actions.
5. Add alerts for approaching limits and policy violations.

## Verification Gates

- [ ] Quota enforcement is server-side and deterministic.
- [ ] Tenant lifecycle actions are role-gated and auditable.
- [ ] Plan/limit changes include confirmations and logs.
- [ ] Suspend/reactivate paths are tested.
- [ ] Restore and rollback paths exist for operational mistakes.
- [ ] Over-limit behavior is explicit and user-visible.

## Works With

- `entity-lifecycle-operations`
- `role-based-access-control`
- `audit-logging-patterns`

## Output Contract

When invoked, provide:
1. Usage and quota model.
2. Tenant lifecycle matrix.
3. Enforcement and alert policy.
4. Validation checklist and risks.
