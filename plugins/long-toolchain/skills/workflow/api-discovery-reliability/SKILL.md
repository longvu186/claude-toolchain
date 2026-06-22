---
name: api-discovery-reliability
description: "**WORKFLOW SKILL** - Run API and contract discovery with reproducible evidence and low-loss canonical documentation updates. Use when: reverse engineering dashboard APIs, validating server-to-server flows, maintaining capture scripts, documenting third-party API calls, consolidating endpoint behavior into docs, or repairing stale API/query references. Trigger phrases: api discovery, reverse engineer api, third-party api docs, s2s quote flow, capture endpoint behavior, replay quote run, maintain api evidence logs, update api reference."
argument-hint: "Describe the target flow, scripts used, artifact family, and which canonical docs/specs must be updated."
---

# API Discovery Reliability

Use this workflow for API and contract behavior discovery where reproducibility matters more than cleanup.

## Core Principles

1. Treat evidence as immutable:
- Keep raw artifacts append-only (JSON, screenshots, text captures).
- Add indexes and summaries instead of rewriting old evidence files.

2. Classify the run first:
- Browser discovery flow (network capture while using UI).
- S2S automation flow (token/session/upload/run/poll).

3. Preserve replayability:
- Keep env var names explicit and stable.
- Record exact command used and generated artifact filenames.

## Standard Procedure

1. Confirm target behavior and the minimal script/flow to observe it.
2. Run capture/replay and write timestamped artifacts.
3. Extract only stable findings:
- Endpoint paths and method.
- Required payload keys and validation errors.
- Completion/status fields used for success checks.
4. Update canonical docs:
- `memories/repo/third-party-apis.md` or `memories/repo/api-routes.md` first (contract change).
- `memories/repo/query-catalog.md`, `data-model.md`, `edge-functions.md`, or `env-vars.md` if the flow depends on those facts.
- Experience log second (narrative and evidence references).
5. Add run log and refresh retrieval indexes if a new artifact family appears.

## Canonical Reference Rule

Before any API or query-related code search, read the relevant canonical reference. If it is missing, create it from verified evidence before closing the session. If it is stale, update it in the same change that fixes the code.

## S2S Quote Flow Baseline

1. Obtain S2S token.
2. Create quote session.
3. Upload files.
4. Trigger run.
5. Poll session status until terminal state.
6. Resolve output order/quote details from the session-linked order id.

## Operational Pitfalls

- Missing replay context:
  Fix: always log command, env var names, and artifact filename in the same run note.

- Session appears successful but output is ambiguous:
  Fix: assert canonical linking field from session to order id before reading order details.

- Poll loops hang or stop too early:
  Fix: use explicit timeout + poll interval env vars and record final terminal status.

- Discovery logs become noisy and unsearchable:
  Fix: keep append-only artifacts, then maintain an index file by artifact family.

## Validation Checklist

- Artifact written with timestamped name.
- Endpoint/payload deltas reflected in API spec.
- Durable findings appended to experience log.
- Run note added with command and outcome.
- Retrieval index updated when artifact families expand.

## Session Closure

For major implementation phases:
1. Run documentation refresh workflow.
2. Run memory/skill curation workflow.
3. Close only after both are complete.

## Provenance

- Promoted on 2026-03-31 from repeated API discovery + S2S quote maintenance sessions where append-only evidence and strict closure checklists improved reproducibility.
