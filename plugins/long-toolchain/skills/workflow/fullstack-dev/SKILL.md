---
name: fullstack-dev
description: "**WORKFLOW SKILL** - Design and implement full-stack systems with clear backend layering, lifecycle-complete operations, frontend-backend contracts, and production hardening. Use when: build full-stack app, scaffold backend plus frontend, CRUD API integration, auth flow implementation, service architecture, real-time features, production hardening."
argument-hint: "Provide frontend stack, backend stack, data store, auth model, and required real-time or file-handling capabilities."
portability: adapt-port
source-skill: MiniMax-AI/skills/skills/fullstack-dev
overlap-gate:
  existing-skill: project-tech-stack-interview
  overlap-score: 63
  decision: create-new
---

# Fullstack Dev

Portability tag: adapt-port.

Use this skill to keep backend architecture and frontend integration decisions aligned from day one.

## When to Use

- Starting a full-stack product or major feature slice
- Defining service layers and API contracts
- Implementing auth, error handling, and cross-boundary data flows
- Adding real-time channels and upload workflows safely

## Procedure

### Phase 1: Architectural Decisions

1. Load `requirements-pack-enforcement` and the relevant domain packs before design starts.
2. If the feature is a common product surface (auth, admin CRUD, tables, forms, charts, currency input, uploads, notifications), load `common-feature-research` before choosing implementation details.
3. Choose app shape (monolith, modular monolith, service split) based on team scope.
4. Define API style and contract ownership (REST/OpenAPI, GraphQL, typed clients).
5. Define data ownership and migration path.
6. Define lifecycle coverage policy for core entities before implementation.

### Phase 2: Backend Foundation

1. Enforce feature-first module boundaries.
2. Keep controller-service-repository responsibilities separate.
3. Add typed validation, typed errors, and structured logging from the start.
4. Implement role-gated lifecycle operations, not CRUD only.
5. Keep contract sources explicit for public APIs, webhooks, and schema-validated boundaries.

### Phase 3: Frontend Integration

1. Build a typed API client and environment-safe base URLs.
2. Standardize loading, error, and retry semantics for UX consistency.
3. Implement auth session/refresh flow with explicit unauthorized handling.
4. Prefer proven UI/data libraries for standard surfaces instead of bespoke widgets when the requirement matches a commodity pattern.

### Phase 4: Reliability and Hardening

1. Add health/readiness checks and graceful shutdown.
2. Add security headers, CORS allowlists, and secret hygiene.
3. Add contract and integration tests at boundaries.
4. Add tests for destructive/recovery paths (archive/delete/restore/deactivate/block).

## Lifecycle Completeness Gate

For each critical entity, define and verify:

- role x action matrix
- confirmation policy for high-risk actions
- audit logging for lifecycle mutations
- recovery and rollback paths

Use shared workflow skills:

- `entity-lifecycle-operations`
- `role-based-access-control`
- `audit-logging-patterns`
- `feature-saas-foundations`
- `testing/api-contract-and-edge-case-testing`

## Safety Defaults and Fallback Behavior

- Never hardcode secrets, tokens, or environment-specific URLs.
- If API contracts are unstable, lock to an explicit version and publish change notes.
- If real-time channels fail, degrade to polling with clear UX status.
- If infra dependencies are unavailable, provide local stubs and mark non-production mode.
- If a feature has well-known UX conventions, do not ship the minimum technical surface without the expected formatting, feedback, and recovery states.

## Output Checklist

- Architecture and contract decisions recorded
- Backend layering and validation policies in place
- Frontend API integration and auth flow validated
- Hardening checklist completed
- Lifecycle matrix and destructive/recovery test coverage documented
