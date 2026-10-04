# Documentation Templates

## context.md Template

```markdown
<!-- last-verified: YYYY-MM-DD -->
# Project Context

## Stack
- Framework: {framework and version}
- Styling: {styling approach}
- Database: {database}
- Auth: {auth provider}
- Deployment: {deployment target}

## Directory Map
- `src/` — {description}

## Key Entrypoints
- `src/app/layout.tsx` — {description}

## Architectural Invariants
- {rule 1}
- {rule 2}

## Dependency Graph
- `module-a` → `module-b` (reason)
```

## code-index.json Entry Template

```json
{
  "path": "src/module/file.ts",
  "exports": ["functionA", "ClassB", "TypeC"],
  "dependencies": ["src/lib/util.ts"],
  "purpose": "One-line description of this file's role",
  "lines": 0
}
```

## Experience Log Entry Template

```markdown
### [YYYY-MM-DD] Short Title

- **Issue**: What went wrong
- **Trigger**: What caused it
- **Impact**: How severe, what was affected
- **Fix/Workaround**: What resolved it
- **Prevention**: How to avoid in future
- **Related files**: file paths
```

## Run Log Template

```markdown
<!-- last-verified: YYYY-MM-DD -->
# Session Run Log: {title}

## Summary
- Goal: {what the session aimed to accomplish}
- Outcome: {success / partial / blocked}
- Agent(s) used: {which agents were invoked}

## Actions Taken
1. {action}

## Files Created or Updated
- `path/to/file`: {what changed}

## Commands and Validation
- Command: `{command}`
  - Result: {output summary}

## Issues Encountered
- Issue: {description}
  - Resolution: {how resolved}

## Follow-Up
- {open items}
```

## Slice Brief Template

```markdown
# Slice Brief: {Title}

> Symphony brief bundle entry. Keep every section in this template. If information is missing,
> leave the field in place as `TBD - <what to fill in>` and update the completion percentage as
> details become concrete.

## Metadata
- Status: draft | approved | in-progress | blocked | shipped | archived
- Completion: 0%
- Owner: TBD - name the directly responsible person or team.
- Last updated: TBD - replace with YYYY-MM-DD.

## Why This Exists
- Problem: TBD - describe the user or business problem this slice solves.
- Why now: TBD - explain why this work matters in the current phase.
- Outcome if solved: TBD - state the expected user or business outcome.

## Users
- Primary: TBD - identify the main user or operator.
- Secondary: TBD - list supporting or indirectly affected users.

## Scope

### In Scope
- TBD - list the confirmed work included in this slice.

### Out of Scope
- TBD - list exclusions to keep the slice bounded.

## Constraints
- TBD - note technical, legal, staffing, or timing constraints.

## Risks
- TBD - capture the main delivery or product risks.

## Open Questions
- TBD - record unanswered questions and who should resolve them.
```

## Slice Spec Template

```markdown
# Slice Spec: {Title}

> Symphony spec bundle entry. Keep every section in this template. If information is missing,
> leave the field in place as `TBD - <what to fill in>` instead of deleting it, and update the
> completion percentage as the TBD markers are resolved.

## Metadata
- Status: draft | approved | in-progress | shipped | archived
- Completion: 0%
- Owner: TBD - name the directly responsible person or team.
- Last updated: TBD - replace with YYYY-MM-DD.
- Related brief: TBD - link the matching brief.md path.
- Related decisions: TBD - link decision notes or say `TBD - none yet`.

## Problem
- TBD - describe the problem with concrete user or business context.

## Goals
- TBD - list the outcomes this slice must achieve.

## Non-Goals
- TBD - list intentionally excluded outcomes.

## Users And Roles
| Role | Needs | Notes |
|------|-------|-------|
| TBD - role name | TBD - primary need | TBD - edge notes, risk, or dependency |

## Scope

### In Scope
- TBD - list confirmed scope items.

### Out of Scope
- TBD - list confirmed exclusions.

## User Journeys
### Primary Journey
1. TBD - describe the happy-path entry step.
2. TBD - describe the key system response.

### Alternate Journey
1. TBD - capture a valid variation or branch.
2. TBD - note the expected outcome.

### Destructive Journey
1. TBD - describe the risky or destructive action.
2. TBD - describe guardrails, confirmation, and audit behavior.

### Recovery Journey
1. TBD - describe how the user or operator recovers.
2. TBD - describe the restored end state.

### Journey Contract Touchpoints
- TBD - list touched routes, RPCs, webhooks, jobs, or third-party contracts per journey.

## Requirements

### Functional
- FR-1: TBD - state a concrete functional requirement.

### Non-Functional
- NFR-1: TBD - state a measurable non-functional requirement.

## Lifecycle And State
| Entity | States | Transitions | Notes |
|--------|--------|-------------|-------|
| TBD - entity | TBD - lifecycle states | TBD - allowed transitions | TBD - edge rules or audit notes |

## Permissions And Policy
| Action | Allowed roles | Guardrails | Audit |
|--------|---------------|------------|-------|
| TBD - action | TBD - allowed roles | TBD - approval, confirmation, or limits | TBD - logs or evidence required |

## Data And Interfaces
- Data model changes: TBD - describe tables, entities, or schema changes.
- API or event contracts: TBD - list routes, payloads, jobs, or webhooks.
- External dependencies: TBD - list services, vendors, or upstream systems.

## Edge Cases
- Empty state: TBD - describe what the user sees with no data.
- Failure state: TBD - describe the expected failure handling.
- Recovery path: TBD - describe retry, restore, or rollback behavior.
- Abuse or misuse: TBD - describe rate limits, policy blocks, or moderation response.
- Backwards compatibility: TBD - describe compatibility constraints or migrations.

## Rollout
- Migration or backfill: TBD - describe required data movement or setup.
- Feature flag plan: TBD - note flags, rollout gates, or launch sequencing.
- Operational checks: TBD - list dashboards, alerts, smoke tests, or approvals.
- Fallback plan: TBD - describe rollback or disablement steps.

## Validation Plan
- Tests: TBD - list unit, integration, E2E, or contract coverage targets.
- Manual checks: TBD - list manual verification or exploratory checks.
- Monitoring: TBD - list logs, metrics, alerts, or support signals.
- Exit criteria: TBD - define what must be true to call the slice done.

## Open Questions
- TBD - list unresolved questions, owners, and deadlines.
```

## Validation Note Template

```markdown
# Validation Note: {Title}

> Symphony validation bundle entry. Keep every section in this template. If evidence is not
> available yet, leave a `TBD - <what evidence to add>` marker and update the completion
> percentage as proof is collected.

## Metadata
- Completion: 0%
- Last updated: TBD - replace with YYYY-MM-DD.

## Scope Checked
- Spec: TBD - link the related spec.md.
- Reviewer: TBD - name the reviewer or team.
- Build or release: TBD - note the build, tag, or environment.

## Acceptance Checks
| Check | Evidence | Status | Notes |
|-------|----------|--------|-------|
| TBD - check name | TBD - link test, log, screenshot, or report | planned | TBD - note what is still missing |

## Implementation Evidence
- PR or commit: TBD - link the PR, commit, or branch.
- Test commands: TBD - list executed commands and outcomes.
- Manual verification: TBD - list manual checks and who ran them.
- Logs or screenshots: TBD - link saved evidence.

## Rollout Checks
- Migration complete: TBD - say yes/no and link the proof.
- Feature flag state: TBD - record current rollout or gate status.
- Observability in place: TBD - describe logs, alerts, and dashboards.
- Fallback verified: TBD - describe rollback proof or note what remains.

## Residual Risks
- TBD - list any remaining risk after validation.

## Follow-Up
- TBD - list follow-up work, owners, and timing.
```

## Environment Variable Entry

```markdown
| Variable | Purpose | Required | Default | Sensitive | Used in |
|----------|---------|----------|---------|-----------|---------|
| `VAR_NAME` | {purpose} | {Yes/No} | {default or —} | {Yes/No} | {file paths} |
```

## Decision Note Template

```markdown
# Decision: {Title}

## Metadata
- Status: proposed | accepted | superseded
- Date: {YYYY-MM-DD}
- Owner: {owner}
- Related specs: {paths}

## Context
- {context}

## Decision
- {decision}

## Consequences
- Positive: {impact}
- Negative: {impact}
- Follow-up: {next step}

## Alternatives Considered
- {alternative}
```
