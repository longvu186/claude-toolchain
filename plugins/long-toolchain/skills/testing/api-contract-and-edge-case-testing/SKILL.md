---
name: api-contract-and-edge-case-testing
description: "TESTING SKILL - Validate API, webhook, and schema behavior with contract checks, hostile input corpora, protocol edge cases, and stateful workflow tests. Use for REST, RPC, GraphQL, webhooks, schemas, request validation, and edge-case matrices. Trigger phrases: api contract, schema tests, webhook testing, edge-case testing, fuzzing, hostile input, GraphQL transport, OpenAPI validation."
argument-hint: "Describe the API surface, schema source, auth model, lifecycle actions, and whether OpenAPI, GraphQL, or webhook contracts exist."
---

# Testing Skill: API Contract And Edge-Case Testing

Use this skill when request/response behavior matters enough that happy-path endpoint tests are insufficient.

## Source Backbone

### Normative

- `GraphQL over HTTP` for GraphQL transport rules.
- `OWASP ASVS` and `OWASP WSTG` for auth, access control, and abuse-focused API expectations.

### Executable

- `Schemathesis` for OpenAPI and GraphQL contract fuzzing plus stateful API workflows.
- `JSON Schema Test Suite` for schema-validity behavior.
- `Big List of Naughty Strings` for hostile input corpora.

### Reference

- Provider docs and serious production implementations only when normative or executable sources do not define the behavior.

## Coverage Baseline

For each contract surface, cover:

1. Valid request -> expected status/body.
2. Missing auth -> deterministic rejection.
3. Invalid auth or wrong role -> deterministic rejection.
4. Missing required fields.
5. Unknown fields, invalid enums, boundary lengths, and wrong content types.
6. Hostile string inputs on every user-controlled text field.
7. Idempotency and repeat-call behavior.
8. Stateful lifecycle sequences for create/update/delete/restore or equivalent transitions.

## Webhook Baseline

For webhook endpoints, add:

- signature verification
- replay/idempotency handling
- out-of-order event handling
- unknown event-type behavior
- malformed body and missing-header behavior
- audit/log evidence for accepted and rejected events when policy requires it

## GraphQL Baseline

If the surface is GraphQL, validate:

- allowed methods and content types
- document parsing and variable handling
- `operationName` behavior
- transport error vs application error shape
- introspection policy if restricted

## Procedure

1. Start from canonical references or declared schema source, not guessed payloads.
2. Load `requirements-pack-enforcement` when the API belongs to a non-trivial feature slice.
3. Build a contract matrix for each endpoint, mutation, query, or webhook.
4. Add hostile input cases from `Big List of Naughty Strings` to exposed text fields.
5. Add schema validity cases from JSON Schema or declared request validators.
6. Add stateful workflow coverage with Schemathesis or equivalent targeted tests.
7. Map failures back to contract ownership so fixes land at the source of truth.

## Anti-Patterns

- Trusting handwritten payload examples over actual contract docs or schemas.
- Testing only 200/201 responses and ignoring deny paths.
- Skipping webhook replay or out-of-order event tests.
- Treating schema validation as sufficient when downstream business rules can still fail.
- Inventing GraphQL transport behavior from framework defaults without checking the protocol spec.

## Verification Gates

- Contract source is explicit and current.
- Unauthorized, invalid, and wrong-role paths are covered.
- Hostile input coverage exists for exposed string fields.
- Lifecycle or stateful workflow sequences are tested where applicable.
- Webhooks are signature-verified, idempotent, and resilient to unknown events.
- GraphQL transport behavior matches the protocol when applicable.

## Works With Technical Skills

- `requirements-pack-enforcement`
- `quality-manager`
- `feature-auth-system`
- `feature-subscription-billing`
- `feature-saas-foundations`

## Output Contract

When invoked, provide:

1. Contract matrix by endpoint or operation.
2. Hostile input plan.
3. Stateful workflow coverage plan.
4. Webhook or GraphQL protocol checklist when relevant.
5. Missing contract-source gaps that must be documented.