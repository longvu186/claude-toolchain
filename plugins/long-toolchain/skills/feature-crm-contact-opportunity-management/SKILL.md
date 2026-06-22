---
name: feature-crm-contact-opportunity-management
description: "FEATURE SKILL - Build CRM contact and opportunity operations with complete lifecycle actions, ownership controls, and operational safeguards. Use for contact management, deal pipelines, account ownership, and CRM admin tooling. Trigger phrases: build CRM, contact management, deal pipeline, opportunity management, sales admin."
argument-hint: "Describe entities (contacts/accounts/opportunities), role model, pipeline stages, and deletion/archive policy."
---

# Feature Skill: CRM Contact And Opportunity Management

Reusable CRM feature playbook focused on lifecycle completeness and operational safety.

## Seniority Ladder

| Level | Required competency |
|---|---|
| Junior | Contact and opportunity CRUD with list/search/filter. |
| Mid | Owner/assignee controls, stage transitions, archive/delete safeguards, and audit logs. |
| Senior | Pipeline state machine integrity, cascade rules, dedupe/merge policy, and recovery paths. |
| Staff | Cross-team governance, policy metrics, and compliance controls. |

## Entity Baseline

At minimum define:
- Contact
- Account
- Opportunity
- Activity/Timeline event

## Required Lifecycle Operations

For contact and opportunity entities:
- create/read/update
- deactivate/reactivate (if used)
- archive/restore
- soft delete/restore
- hard delete policy (if enabled)

Also define ownership reassignment and stage transition rules.

## Preferred Build Pattern

1. Define stage model and allowed transitions.
2. Define ownership and reassignment permissions.
3. Implement lifecycle actions with role checks and confirmations.
4. Log stage changes and destructive actions to audit timeline.
5. Test cascade behavior between contacts, accounts, opportunities.

## Verification Gates

- [ ] Stage transitions are validated server-side.
- [ ] Ownership changes are permission-gated.
- [ ] Archive/delete actions require clear confirmations.
- [ ] Restore paths are implemented and tested.
- [ ] Activity timeline includes key lifecycle transitions.
- [ ] Cascade/orphan behavior is defined for delete operations.

## Works With

- `entity-lifecycle-operations`
- `role-based-access-control`
- `audit-logging-patterns`

## Output Contract

When invoked, provide:
1. CRM entity and stage map.
2. Role-action matrix for ownership and lifecycle actions.
3. Transition and cascade policy.
4. Validation checklist with high-risk gaps.
