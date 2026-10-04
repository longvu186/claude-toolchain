---
name: requirements-pack-enforcement
description: "**WORKFLOW SKILL** - Enforce source-backed requirement packs and definition-of-done gates before implementing non-trivial features. Use when: feature completeness, definition of done, SaaS basics, auth edge cases, baseline coverage, requirement pack selection, missing basics, implementation checklist, validation matrix, or auth test access for protected apps."
argument-hint: "Describe the feature slice, entities involved, user roles, external contracts, and what keeps getting missed."
---

# Requirements Pack Enforcement

Use this skill whenever an implementation is large enough that the agent could skip baseline requirements, lifecycle actions, or validation coverage.

## Purpose

Shift feature work from prompt-driven guessing to source-backed execution.

This skill forces three things before code starts:

1. Select the relevant requirement packs.
2. Classify the sources behind those packs.
3. Produce a minimum definition of done and validation matrix.
4. Identify the journeys and contracts that must survive future releases.

## Source Hierarchy

Rank sources in this order:

1. **Normative** — standards and specifications that define required behavior.
2. **Executable** — machine-readable or runnable corpora that define testable behavior.
3. **Reference** — serious implementations that show practical defaults.
4. **Discovery** — curated lists and directories used only to find candidates.

Never let a discovery source define required behavior when a normative or executable source exists.

## Current High-Value Sources

### Normative

- `OWASP ASVS` — authentication, session, access control, verification requirements.
- `OWASP WSTG` — concrete security testing scenarios.
- `GraphQL over HTTP` — transport and interoperability rules for GraphQL APIs.

### Executable

- `Big List of Naughty Strings` — hostile input corpus for forms, APIs, search, and import flows.
- `JSON Schema Test Suite` — machine-readable schema validation behavior.
- `Schemathesis` — OpenAPI and GraphQL contract fuzzing plus stateful API workflows.

### Reference

- `SuperTokens session docs` — practical session rotation, revocation, CSRF, cookie/header tradeoffs.
- Selected open-source SaaS starters and boilerplates with real tenant, auth, billing, and admin behavior.

### Discovery only

- `awesome-auth`
- `awesome-saas-boilerplates`
- `awesome-opensource-boilerplates`

Use these only to discover strong candidates for mining.

## Mandatory Companion Packs

Load these workflow cores whenever the feature manages real entities or user permissions:

- `entity-lifecycle-operations`
- `role-based-access-control`
- `audit-logging-patterns`

For common product surfaces with mature implementation standards, also load:

- `common-feature-research`

## Pack Selection Rules

### Always load this skill first for non-trivial feature work.

Then load the relevant domain packs:

| Situation                                                               | Required pack(s)                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------- |
| Authentication, sessions, login, invite, MFA, protected routes          | `feature-auth-system`                                   |
| Tenant, organization, team membership, staff/admin actions              | `feature-saas-foundations`, `feature-admin-dashboard`   |
| Plan limits, quotas, seat counts, usage meters                          | `feature-saas-usage-and-quota-management`               |
| Billing, subscriptions, webhooks, payment reconciliation                | `feature-subscription-billing`                          |
| Public or internal API contracts, input fuzzing, lifecycle API coverage | `api-contract-and-edge-case-testing`, `quality-manager` |

If the feature is a common product pattern with widely expected behavior, load `common-feature-research` before implementation even when a domain pack already exists.

If a needed area has no suitable pack, record a **skill gap** before implementation continues.

## Pre-Code Gate

Before implementation, produce a compact pack-selection record.

```markdown
## Pack Selection Record

- Feature slice: {what is being built}
- Entities: {core entities}
- Roles: {actors and privileged roles}
- Journey inventory: {primary / alternate / destructive / recovery journeys}
- Contract surfaces: {routes / RPCs / webhooks / jobs / third-party APIs}
- Packs selected: {pack list}
- Source class used for each pack: normative | executable | reference | discovery
- Release regression tier: {pre-merge smoke / blocking release / nightly-exploratory}
- Explicit exclusions: {what is not in scope}
- Skill gaps: {missing packs or none}
```

If `common-feature-research` is selected, add:

```markdown
- External references checked: {docs/repos/none}
- Library decision: {reuse existing / add library / stay custom}
```

If the slice has protected routes, privileged actions, or third-party auth, also add:

```markdown
- Auth test access: {seeded accounts / bootstrap lane / signed-out reset / quick-login publish gate}
```

Do not start coding until this record is clear enough that another reviewer could challenge it.

## Definition Of Done Gate

For each selected pack, define the minimum required coverage across these dimensions:

1. **Lifecycle** — all non-CRUD transitions, not only happy-path create/update/read/list.
2. **Security** — authn, authz, session, abuse, destructive action safeguards.
3. **Validation** — malformed input, hostile input, protocol mismatch, boundary conditions.
4. **Recovery** — restore/reactivate/unblock/retry/rollback paths.
5. **Auditability** — logs, events, webhook traceability, or review history when relevant.
6. **Journey coverage** — primary, alternate, deny, destructive, and recovery journeys by role.
7. **Verification** — tests or executable evidence mapped to requirements.
8. **Release regression** — CI tier for each critical journey or contract surface.
9. **Auth test access** — for protected apps, seeded accounts, automation bootstrap, signed-out reset, and publish-gated quick-login behavior.

## Minimum Validation Matrix

Produce a validation matrix before or alongside implementation:

| Area                | Required evidence                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Happy path          | Narrow behavior test or demoable executable path                                                  |
| Journey coverage    | Primary + alternate + destructive/recovery journey evidence by role                               |
| Permission denial   | Unauthorized or wrong-role test                                                                   |
| Destructive path    | Confirmation + mutation test                                                                      |
| Recovery path       | Restore/reactivate/unblock/retry test                                                             |
| Contract edge cases | Invalid payload, missing fields, hostile strings, schema mismatches                               |
| Audit side effects  | Log/event/assertion when policy requires it                                                       |
| Release regression  | Explicit pre-merge, blocking release, or nightly/exploratory classification                       |
| Auth test access    | Seeded accounts, non-prod bootstrap lane, signed-out reset, and quick-login removal after publish |

## Anti-Skipping Rules

- Do not stop at CRUD if the entity can be suspended, blocked, archived, deleted, restored, revoked, or retried.
- Do not stop at login success if the system also has callback, verification, reset, logout, session refresh, or invite flows.
- Do not stop at OAuth login if automated coverage still depends on interactive third-party auth; require a non-prod bootstrap lane.
- Do not stop at route tests if the feature exposes API contracts or webhooks.
- Do not stop at schema validation if inputs can still break downstream systems.
- Do not treat a starter boilerplate as proof that a requirement is mandatory.

## External Prerequisite Verification Gate

A spec/plan sometimes names an external prerequisite ("ships first" / "depends on") that turns out
not to exist yet in the repo. Don't resolve this by guessing which of the two obvious extremes the
user wants — build the whole missing prerequisite, or silently skip the dependent feature/integration
that needed it. Both are guesses; the user may want a narrower, more surgical cut than either.

1. Verify the prerequisite genuinely doesn't exist — grep for its expected symbols/tables AND check
   git log across all branches (`git log --all --oneline | grep -i <topic>`), not just a directory
   listing (a spec can exist mid-branch, unmerged).
2. Identify the exact scope of the dependency — usually it's one field/column/response key the
   dependent feature reads, not the prerequisite's full feature surface.
3. Ask the user with a recommended default (`AskUserQuestion`), rather than silently picking one.
4. Implement exactly what the user authorizes once they've answered — the recommended default is a
   starting point for the question, not a fallback to implement if the user's actual answer differs
   from it.

## Plan-Prose Reconciliation Gate (Before Declaring Done)

Passing tests/typecheck confirms correctness of what was built, not completeness against what was
promised. A plan can contain specific self-committed action items written inline in narrative prose
(e.g. "ship with X: add index on col Y", "will wire up Z") that never get tracked as a checklist line —
these are the easiest commitments to silently drop, because nothing fails when they're skipped: a
missing index/config/side-effect that isn't exercised by any test at fixture-scale data passes every
test while being silently skipped. The absence of a test failure is not evidence the item was done.

Before declaring a multi-item plan "done":

1. Reread the plan document(s) literally, not from memory — extract every "will do X" / "ship with Y" /
   "add Z" sentence, even ones buried in prose rather than a tracked checklist.
2. For each one, confirm a concrete artifact exists (a file, a migration, a commit, a config entry) —
   not just that the overall feature works end-to-end.
3. Anything not found gets called out explicitly as deferred/skipped, not folded silently into "complete."

## Output Contract

When invoked, provide:

1. Pack Selection Record.
2. Definition of Done matrix.
3. Required validation matrix.
4. Explicit exclusions.
5. Skill gaps to create or upgrade after implementation.
