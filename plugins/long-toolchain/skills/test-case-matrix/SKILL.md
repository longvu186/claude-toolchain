---
name: test-case-matrix
description: "Use before writing any test or implementation code for CRUD or data-mutation feature work (create/update/delete endpoints, RPCs, forms, migrations that change write behavior) — produce an explicit case matrix (happy path / negative / boundary / permission / concurrency) as the first artifact, before any test code exists. Runs one step before superpowers:test-driven-development's red-green loop, which starts at 'write a failing test'. Trigger phrases: CRUD feature, data mutation, new API route, new RPC, form submission handling, entity create/update/delete, case matrix, edge cases before coding, permission matrix, concurrency cases."
---

# Test Case Matrix — enumerate before you test

For any CRUD or data-mutation feature, the **first artifact** is a written case matrix — before any
test code, before any implementation code.

## The gate

```
CRUD / data-mutation scope detected
        |
Write the case matrix (below)              <- this skill, first
        |
superpowers:test-driven-development         <- starts one step later, at "write a failing test"
        (red-green-refactor loop)
```

This composes with TDD, it doesn't duplicate it. TDD's Iron Law starts at "no code without a failing
test." This skill's Iron Law starts one step earlier: **no failing test without an enumerated case
matrix.**

## The matrix

One row per case, covering all five categories for each mutation under design:

| Category | Covers |
|---|---|
| Happy path | valid input, authorized actor, expected state transition |
| Negative | invalid input, missing required fields, malformed types, rejected business rules |
| Boundary | empty/zero/max-length/off-by-one, first/last item, null vs. empty string vs. undefined |
| Permission | each role x allowed/denied, unauthenticated, cross-tenant/cross-owner access |
| Concurrency | double-submit, race on the same row, stale read-then-write, partial failure/rollback |

Table shape:

| # | Category | Case | Expected outcome |
|---|---|---|---|
| 1 | Happy | ... | ... |

## Rules

- In scope: anything that creates/updates/deletes/archives/restores rows, files, or external state.
  Out of scope: read-only/query features, pure styling, non-mutating refactors.
- A category with zero applicable cases still gets a row: `N/A: <reason>`. An omitted row reads as
  forgotten; a stated N/A reads as considered.
- This is a planning artifact, not documentation for its own sake — every row should map to a test
  written during the TDD loop that follows. A matrix with no corresponding tests is not real coverage.
- For entity lifecycle work (deactivate/archive/restore/delete), pair this with `quality-manager`'s
  Lifecycle Regression Minimum Set: this matrix is the pre-code planning step, that set is the
  release-time regression floor.
