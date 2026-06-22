---
name: feature-saas-foundations
description: "FEATURE SKILL - Build SaaS tenant, organization, workspace, and membership foundations with explicit RBAC, invite lifecycle, seat ownership, and tenant isolation. Use for org setup, team membership, invites, workspace access, role assignment, ownership transfer, and admin membership tooling. Trigger phrases: tenant membership, org roles, team invite, SaaS foundation, workspace access, multi-tenant RBAC."
argument-hint: "Describe tenant model, membership roles, invite flow, seat policy, ownership rules, and admin/staff capabilities."
---

# Feature Skill: SaaS Foundations

Reusable feature playbook for the baseline product operations that most SaaS apps need before higher-order features are safe.

## Feature Scope

- Tenant, organization, workspace, or account container model.
- Membership lifecycle: invite, resend, accept, expire, revoke, remove, reinstate.
- Role model: owner, admin, staff/member, optional billing or support roles.
- Tenant isolation across reads, writes, search, exports, and background jobs.
- Ownership transfer, seat assignment, and offboarding.
- Admin/staff visibility and mutation controls for memberships.

## Source Backbone

Use `requirements-pack-enforcement` before implementation and classify source strength explicitly.

### Normative

- `OWASP ASVS` access-control and authorization requirements.
- `OWASP WSTG` access-control, privilege-escalation, and session test scenarios.

### Executable

- `Schemathesis` for invite/member/admin API contracts and stateful workflow coverage.
- `Big List of Naughty Strings` for org names, invite payloads, search/filter inputs, and audit reasons.
- `JSON Schema Test Suite` when request/response schema behavior is contract-critical.

### Reference

- Serious SaaS starters with real tenant, membership, and RBAC behavior.

## Required Operational Coverage

### Tenant or organization

- create/read/update/list
- suspend/reactivate
- archive/restore
- delete policy and purge rules

### Membership

- invite
- resend invite
- accept invite
- expire invite
- revoke invite
- remove member
- reinstate member

### Role governance

- assign role
- downgrade role
- transfer ownership
- prevent last-owner lockout

### Seat governance

- assign seat
- unassign seat
- block over-capacity additions
- reconcile seat count after removals and downgrades

If any action is unsupported, document the reason before coding.

## Preferred Build Pattern

1. Define tenancy boundary and isolation unit first.
2. Define role x action matrix before routes or UI.
3. Define invite and membership state machine.
4. Define ownership-transfer and last-owner protection rules.
5. Implement backend authorization and tenant scoping before admin UI.
6. Add audit events for membership, role, and ownership mutations.
7. Add tests for both destructive paths and recovery paths.

## Common Pitfalls

- Role checks in UI only, without scoped backend enforcement.
- Invites without expiry, revoke, resend, or acceptance idempotency.
- Removing or downgrading the last owner and orphaning the tenant.
- Search/export endpoints leaking cross-tenant data.
- Seat counts updated on purchase but not on removal, downgrade, or reinstatement.
- Membership status modeled as a boolean instead of explicit lifecycle states.

## Validation Checklist

- Tenant reads and writes are scoped server-side.
- Membership lifecycle includes invite, revoke, expire, accept, remove, and reinstate behavior.
- Unauthorized cross-tenant access is denied and tested.
- Ownership transfer has explicit safeguards and last-owner protection.
- Seat policy is enforced on both mutation APIs and admin UI.
- Membership and role changes are audit-logged.
- Repeated invite acceptance, resend, revoke, and remove actions are idempotent or deterministically rejected.

## Works With Technical Skills

- `requirements-pack-enforcement`
- `entity-lifecycle-operations`
- `role-based-access-control`
- `audit-logging-patterns`
- `feature-admin-dashboard`
- `feature-auth-system`
- `feature-saas-usage-and-quota-management`

## Output Contract

When invoked, provide:

1. Tenant boundary and ownership model.
2. Membership lifecycle matrix.
3. Role x action matrix.
4. Isolation and audit checklist.
5. Validation plan with destructive and recovery cases.