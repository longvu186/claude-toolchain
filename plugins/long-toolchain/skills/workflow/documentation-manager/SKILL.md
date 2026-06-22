---
name: documentation-manager
description: "**WORKFLOW SKILL** — Create and maintain project documentation after coding sessions. Use when: updating AI context files, maintaining experience logs, creating run logs, managing readable spec bundles, writing architecture docs, updating env var references, generating code indexes, or refreshing documentation scaffolds. Trigger phrases: update docs, document session, AI context, experience log, run log, feature spec, architecture doc, env vars, code index, symbol map, documentation refresh."
argument-hint: "Describe what docs to update: AI context, experience log, run log, spec system, architecture, or all."
---

# Documentation Manager

Comprehensive workflow for creating and maintaining project documentation assets that serve both AI agents and human developers. Covers AI context files, experience logs, session run logs, readable spec bundles, and architecture documentation.

## When to Use

- After a coding session to update documentation with changes made
- Creating or refreshing AI context files and canonical references (`copilot-instructions.md`, `memories/repo/*.md`, `code-index.json`, `symbol-map.md`)
- Logging discoveries and lessons learned to the experience log
- Creating per-session run logs
- Managing readable spec bundles for product and feature slices
- Writing or updating architecture documentation
- Generating environment variable references
- Refreshing stale documentation (files older than 30 days)

## Procedure

### Journey Coverage Rule

When docs need to support future automation, make user journeys explicit instead of leaving tests to infer them:

- record primary, alternate, destructive, and recovery journeys by role
- record the routes, RPCs, webhooks, jobs, or third-party APIs each critical journey touches
- classify coverage as pre-merge, blocking release, nightly, exploratory, or manual with rationale for any non-automated gap

If a feature is important enough to receive E2E coverage, the spec and validation docs should make that coverage plan discoverable.

### Phase 1: Assessment

#### Step 1.1 — Check Existing Documentation

Look for the standard documentation layout:

```
docs/
├── ai/
│   ├── context.md              # AI-optimized project context
│   ├── code-index.json         # Machine-readable module index
│   ├── symbol-map.md           # Symbol → file lookup table
│   ├── experience-log.md       # Append-only durable discoveries
│   └── run-logs/               # One detailed log per session
├── specs/
│   ├── README.md               # Spec system overview and folder rules
│   ├── active/                 # One folder per active slice
│   ├── archive/                # Completed or dropped slices
│   ├── decisions/              # Cross-cutting decision notes
│   └── templates/              # Brief/spec/validation/decision templates
├── architecture/
│   ├── codebase-guide.md       # Architecture & design overview
│   ├── env-vars.md             # Environment variable reference
│   ├── edge-functions.md       # Serverless function catalog
│   └── modules.md              # Directory-level ownership guide
└── ui/
    ├── spec.md                 # Master UI requirements
    ├── component-inventory.md  # Component catalog
    ├── design-tokens.md        # Extracted UI tokens
    ├── breakpoints.md          # Responsive behavior
    └── pages/                  # Page-specific UI maps
```

#### Step 1.2 — Determine Update Scope

| Trigger | What to Update |
|---------|---------------|
| Code changes | `context.md`, `code-index.json`, `symbol-map.md`, `modules.md` |
| Refactor / issue-fix session | Run log + `experience-log.md` root-cause/fix/prevention entry |
| New feature | Slice brief/spec/validation docs under `docs/specs/active/`, including journey and regression coverage |
| Bug fix / discovery | `experience-log.md` |
| Session complete | Run log in `run-logs/` |
| Lifecycle action changes (`archive/delete/restore/deactivate/block`) | Relevant feature docs + canonical refs + run log validation evidence |
| Test automation or regression work | Slice validation docs, journey inventory, and CI tier evidence |
| Architecture change | `codebase-guide.md`, `modules.md` |
| New env vars | `env-vars.md` |
| New API/edge function | `edge-functions.md` |
| Third-party API change | `memories/repo/third-party-apis.md`, then human docs if needed |
| Data model or reusable query change | `memories/repo/data-model.md`, `memories/repo/query-catalog.md` |
| Public function/variable search | `memories/repo/functions-and-symbols.md` |
| Project IDs/service names | `memories/repo/project-map.md` |
| UI changes | `docs/ui/` files, `styling.instructions.md` |
| Full refresh | All of the above |

#### Step 1.3 — Check Staleness

Every doc file should have a `<!-- last-verified: YYYY-MM-DD -->` comment. Flag any file older than 30 days for review.

### Phase 2: AI Context System

#### Step 2.0 — Canonical References First

Create or update `memories/repo/` reference files for recurring facts before narrative docs:

| File | Contents |
|---|---|
| `third-party-apis.md` | Provider, base URL, auth, headers, endpoints, schemas, webhooks/events, errors, rate limits, env vars, upstream docs, last verified |
| `api-routes.md` | Route, method, handler, auth, request/response schema, status/error shape, consumers |
| `data-model.md` | Entities/tables/collections, fields, relationships, constraints, generated types, migrations/source of truth |
| `query-catalog.md` | Common SQL/RPC/ORM queries, params, return fields, indexes/constraints, callers |
| `functions-and-symbols.md` | Important exports, signatures, ownership, callers/consumers |
| `edge-functions.md` | Function name, runtime, route, auth, env vars, request/response contract, deployment notes |
| `env-vars.md` | Variable, purpose, required/default, sensitivity, used by, source of truth |
| `project-map.md` | Project IDs, deployment targets, service names, ownership boundaries, important directories |

If any agent searched code for one of these facts, treat that as documentation debt and update the matching file before session closure.

#### Step 2.1 — Update context.md

Structure for maximum AI token efficiency:

```markdown
<!-- last-verified: YYYY-MM-DD -->
# Project Context

## Stack
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS 3.4
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Deployment: Vercel

## Directory Map
- `src/app/` — Next.js App Router pages and layouts
- `src/components/` — React components (Tailwind-styled)
- `src/lib/` — Shared utilities and service clients
- `src/types/` — TypeScript type definitions
- `supabase/` — Database migrations and edge functions

## Key Entrypoints
- `src/app/layout.tsx` — Root layout with providers
- `src/app/page.tsx` — Homepage
- `src/lib/supabase.ts` — Supabase client singleton

## Architectural Invariants
- All components use Tailwind utility classes, no CSS modules
- Server components by default, 'use client' only when needed
- All database access through Supabase client, never raw SQL
```

**Principles:**
- Facts only, no prose
- Structured with headings and bullet lists
- Include dependency graph edges (what depends on what)
- Update whenever the stack, directory structure, or key entrypoints change

#### Step 2.4 — Lifecycle Completeness Notes

When implementation introduces or modifies entity operations, record lifecycle coverage in docs:

- Which actions are supported (not CRUD only)
- Which actions are intentionally unsupported and why
- Role gate per action
- Confirmation/audit requirements for destructive actions

Reference shared workflow skills when applicable: `entity-lifecycle-operations`, `role-based-access-control`, `audit-logging-patterns`.

#### Step 2.2 — Update code-index.json

```json
[
  {
    "path": "src/services/auth.ts",
    "exports": ["signIn", "signOut", "refreshToken"],
    "dependencies": ["src/lib/supabase.ts", "src/config/env.ts"],
    "purpose": "Authentication service wrapping Supabase auth",
    "lines": 142
  },
  {
    "path": "src/components/Header.tsx",
    "exports": ["Header"],
    "dependencies": ["src/lib/auth.ts", "src/components/NavMenu.tsx"],
    "purpose": "Site header with navigation and auth status",
    "lines": 87
  }
]
```

Generate via AST extraction (`ts-morph`, `@babel/parser`) when possible, or via static `grep`/`search` analysis.

#### Step 2.3 — Update symbol-map.md

```markdown
<!-- last-verified: YYYY-MM-DD -->
# Symbol Map

| Symbol | File | Line | Kind |
|--------|------|------|------|
| `signIn` | src/services/auth.ts | 15 | fn |
| `signOut` | src/services/auth.ts | 42 | fn |
| `Header` | src/components/Header.tsx | 8 | component |
| `UserContext` | src/contexts/user.tsx | 12 | context |
| `Order` | src/types/order.ts | 3 | type |
```

Include the top ~100 most important public symbols. Update when exports change.

### Phase 3: Experience Log

Append entries to `docs/ai/experience-log.md`:

```markdown
### [YYYY-MM-DD] Short descriptive title

- **Issue**: What went wrong or was discovered
- **Trigger**: What action/code caused it
- **Impact**: Severity and blast radius
- **Fix/Workaround**: What resolved it
- **Prevention**: How to avoid it in the future
- **Related files**: Links to affected source files
```

**Principles:**
- Append-only — never delete entries
- Group by category: build, runtime, data, infra, DX
- Periodically extract recurring patterns into a `## Known Pitfalls` summary at the top
- Only log durable lessons — not routine changes

### Phase 4: Run Logs

Create one log per session in `docs/ai/run-logs/`:

**Preferred filename**: `YYYY-MM-DD-HHMM-session-title-rNN.md`

If the run-event logger hook is active, preserve the hook-generated per-prompt markdown logs, `.raw/<session-id>.jsonl`, and `_memory-curation-queue.jsonl`. Add a manual closure log only when session- or milestone-level context still needs a human summary.

```markdown
<!-- last-verified: YYYY-MM-DD -->
# Session Run Log: {title}

## Summary
- Goal: What the session aimed to accomplish
- Outcome: What was achieved (success/partial/blocked)
- Agent(s) used: Which agents were invoked

## Actions Taken
1. Action description
2. Action description

## Files Created or Updated
- `path/to/file.ext`: what changed

## Commands and Validation
- Command: `npm run build`
  - Result: Success / failure details

- Validation evidence should include destructive/recovery path checks when relevant (`archive/restore`, `deactivate/reactivate`, `soft_delete/undelete`, `hard_delete/purge`).

## Issues Encountered
- Issue: description
  - Resolution: how it was resolved

## Follow-Up
- Open items for next session
```

**Always preserve run evidence after every completed session**, even if little changed. Hook-generated run logs count for prompt-scoped execution detail; add a manual closure log when a session-level summary is still needed.

Also create a run log after each planned chunk milestone and after refactor/issue-fix sessions, not only feature delivery.

### Phase 5: Spec System

#### Step 5.1 — Spec Folder Standard

Use `docs/specs/` for human-readable product and feature specs.

```text
docs/specs/
  active/
    <slice-slug>/
      brief.md
      spec.md
      validation.md
  archive/
  decisions/
  templates/
```

Rules:

- Do not create a dashboard by default.
- Do not create a traceability matrix by default.
- Use GitNexus for implementation traceability and impact analysis.
- The active slice standard is the Symphony spec bundle: `brief.md`, `spec.md`, and `validation.md` kept as full templates with completion tracking, directed TBD markers, journey taxonomy, contract touchpoints, rollout, and validation evidence.
- Keep the full brief/spec/validation template for every active slice; do not delete sections because data is missing.
- When details are unknown, use `TBD - <what to fill in>` instead of `N/A` or omission.
- Add an explicit `Completion: <n>%` field to `brief.md`, `spec.md`, and `validation.md`.
- If an active slice is missing one of the bundle files, create the missing file from the template instead of skipping it.
- If a workspace still uses a retired active-spec structure such as `docs/requirements/`, a requirements dashboard, a traceability matrix, or single-file `REQ-*.md` slices, migrate the content into `docs/specs/` and do not keep the retired structure active in parallel.
- Keep each slice self-contained and readable.

#### Step 5.2 — Brief Template

```markdown
<!-- last-verified: YYYY-MM-DD -->
# Slice Brief: {title}

> Symphony brief bundle entry. Keep every section. If information is missing, leave the field in place as
> `TBD - <what to fill in>` and update the completion percentage as details become concrete.

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

### Out Of Scope
- TBD - list exclusions to keep the slice bounded.

## Constraints
- TBD - note technical, legal, staffing, or timing constraints.

## Risks
- TBD - capture the main delivery or product risks.

## Open Questions
- TBD - record unanswered questions and who should resolve them.
```

#### Step 5.3 — Detailed Spec Template

```markdown
<!-- last-verified: YYYY-MM-DD -->
# Slice Spec: {title}

> Symphony spec bundle entry. Keep every section. If information is missing, leave the field in place as
> `TBD - <what to fill in>` instead of deleting it, and update the completion percentage as TBD markers
> are resolved.

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

### Out Of Scope
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

## Rollout

## Validation Plan

## Open Questions
```

#### Step 5.4 — Validation Note Template

```markdown
<!-- last-verified: YYYY-MM-DD -->
# Validation Note: {title}

## Metadata
- Completion: 0%
- Last updated: TBD - replace with YYYY-MM-DD.

## Scope Checked
- Spec: TBD - link the related spec.md.
- Reviewer: TBD - name the reviewer or team.

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

### Phase 6: Architecture Documentation

#### Step 6.1 — Codebase Guide

Include:
- System diagram (Mermaid syntax)
- Component boundaries and responsibilities
- Request/data flow for key user journeys
- Service communication patterns
- Key design decisions and rationale

#### Step 6.2 — Environment Variables

```markdown
<!-- last-verified: YYYY-MM-DD -->
# Environment Variables

| Variable | Purpose | Required | Default | Sensitive | Used in |
|----------|---------|----------|---------|-----------|---------|
| `DATABASE_URL` | PostgreSQL connection | Yes | — | Yes | src/lib/db.ts |
| `NEXT_PUBLIC_API_URL` | Public API base URL | Yes | — | No | src/lib/api.ts |
| `JWT_SECRET` | Token signing key | Yes | — | Yes | src/auth/ |

## Where to Store
- Local dev: `.env.local` (gitignored)
- Production: Vercel dashboard / CI secrets
- Shared team: `.env.example` (no real values)
```

#### Step 6.3 — Modules Guide

```markdown
<!-- last-verified: YYYY-MM-DD -->
# Module Ownership

| Directory | Purpose | Key Files | Dependencies |
|-----------|---------|-----------|-------------|
| `src/app/` | Next.js pages and layouts | `layout.tsx`, `page.tsx` | components, lib |
| `src/components/` | Reusable React components | `Header.tsx`, `Footer.tsx` | lib, types |
| `src/lib/` | Shared utilities | `supabase.ts`, `utils.ts` | — |
| `src/types/` | TypeScript definitions | `order.ts`, `user.ts` | — |
```

## Constraints

- DO NOT change runtime application behavior — focus on docs and indexing
- DO NOT delete existing documentation without explicit user approval
- DO NOT produce vague summaries when concrete symbols, files, and decisions can be extracted
- DO NOT duplicate information across doc files — cross-reference instead
- ALWAYS include `<!-- last-verified: YYYY-MM-DD -->` in every generated doc file
- ALWAYS use today's date for `last-verified` when creating or updating a file
- ALWAYS create a run log after every completed session

## Output Format

- **Updating docs**: List created/updated files and summarize key deltas
- **Specs**: Compact table with slice, status, owner, and links to brief/spec/validation docs
- **AI context**: Report index coverage (modules indexed, symbols captured, stale areas)
- **Experience log**: Show the new entry in template format
- **Run log**: Show file path and short summary of actions, files, commands, outcomes
- **Spec generation**: Provide the created or updated slice paths inline and confirm the file paths
