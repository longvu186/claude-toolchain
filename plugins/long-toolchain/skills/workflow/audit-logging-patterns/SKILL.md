---
name: audit-logging-patterns
description: "WORKFLOW SKILL - Implement consistent audit logging for security-sensitive and lifecycle-critical operations. Use when: admin actions, moderation flows, role changes, destructive operations, and compliance reporting. Trigger phrases: audit logging, change history, admin audit trail, who changed what, compliance logs."
argument-hint: "Describe tracked entities, sensitive actions, retention requirements, and redaction constraints."
---

# Audit Logging Patterns

Use this skill to standardize evidence trails for operational and compliance-critical actions.

## Seniority Ladder

| Level | Required competency |
|---|---|
| Junior | Log key mutations with actor, action, target, and timestamp. |
| Mid | Structured audit schema, reason codes, and queryable trails per entity/action. |
| Senior | Immutable patterns, diff-aware change logs, redaction policy, and retention controls. |
| Staff | Org-wide taxonomy, compliance reporting, and policy-level audit governance. |

## Minimum Audit Event Schema

Track at least:
- actor_id
- actor_role
- action
- entity_type
- entity_id
- timestamp
- reason_code (if applicable)
- metadata (request_id, source, context)

## Events That Must Be Logged

1. Role or permission changes.
2. Deactivate/reactivate and block/unblock operations.
3. Archive/restore and soft/hard delete actions.
4. Revoke/cancel actions (billing or access).
5. Bulk operations and admin overrides.

## Logging Rules

1. Audit logs are append-only from application pathways.
2. Avoid logging secrets, tokens, or unnecessary PII.
3. Use stable event naming conventions.
4. Include reason codes for destructive and moderation actions.
5. Ensure logs can be queried by actor, entity, and action.

## Retention and Privacy

- Define retention windows by domain risk.
- Define redaction policy for sensitive fields.
- Define access policy for who can view audit trails.

## Verification Gates

- [ ] High-risk lifecycle operations emit audit events.
- [ ] Events include actor, action, target, and timestamp.
- [ ] Sensitive data is redacted per policy.
- [ ] Audit trails are queryable for incident investigation.
- [ ] Permission/role changes are always logged.
- [ ] Bulk operations include affected count and scope.

## Output Contract

When invoked, provide:
1. Audit event taxonomy.
2. Required schema fields and redaction rules.
3. Mapped lifecycle actions to audit events.
4. Validation checklist and known gaps.
