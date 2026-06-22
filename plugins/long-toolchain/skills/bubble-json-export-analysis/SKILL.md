---
name: bubble-json-export-analysis
description: "Analyze and inventory Bubble.io JSON exports for migration. Use when auditing Bubble pages, workflows, actions, data types, plugins, and API workflows, or doing behavior-first discovery before migrating Bubble to code. Trigger phrases: analyze bubble export, bubble json forensic, bubble workflow inventory, bubble migration discovery, bubble AST extraction."
---

# Skill: Bubble JSON Export Analysis

Trigger phrases: analyze bubble export, bubble json forensic, bubble workflow inventory, bubble migration discovery, bubble AST extraction

Use this skill when:
- You need a reliable inventory of Bubble pages, workflows, actions, data types, plugins, and API workflows.
- You are migrating Bubble to code and need behavior-first evidence before implementation.
- You need to separate active behavior from disabled or deprecated logic.

## Objectives

1. Build machine-readable inventories first.
2. Verify reference integrity before interpretation.
3. Convert high-volume workflow/action data into human-readable docs for rebuild planning.
4. Derive migration risk and replacement plans from plugin-like actions.

## Proven Pipeline

1. Parse and normalize export JSON.
2. Extract workflows/actions with owner context.
3. Compute active scope:
- Exclude workflows with `properties.workflow_disabled = true`.
- Exclude workflows under owners whose name contains `NOT IN USE`.
4. Reconcile references:
- Ensure `target_element_id` exists in known element IDs.
- Ensure `custom_event` references resolve to known custom event IDs.
5. Emit core artifacts:
- `docs/ai/extraction/summary.json`
- `docs/ai/extraction/workflows*.json`
- `docs/ai/extraction/actions*.json`
- `docs/ai/extraction/custom-event-edges-active.json`
- `docs/ai/extraction/unresolved-references.json`
6. Generate forensic docs:
- Top complexity workflows ranked by action_count.
- Plugin replacement matrix from plugin-like action types.
7. Generate readable app docs:
- overview, pages, database, workflows-by-page, components, plugins, option-sets, styles, api-workflows.

## Data Model For Extraction

Minimal normalized records:

- WorkflowRecord
- workflow_key, workflow_id
- trigger_type, trigger_element_id
- has_condition, action_count
- active, deprecated_by_name
- owner context (id, name, type, path)

- ActionRecord
- workflow_id, workflow_key, action_key, action_id
- action_type, has_condition
- target_element_id, custom_event, api_event
- plugin_like, active_workflow

## Classification Rules

- Built-in action allowlist must be explicit.
- Any non-allowlisted action is plugin-like.
- Treat numeric-prefixed action types as unknown plugin actions requiring reverse mapping.
- Keep trigger/action counters for both all and active scope.

## Quality Gates

Gate 1: Inventory integrity
- Workflows and actions counts are produced for all and active.
- Active-only artifacts exist and are consistent.

Gate 2: Reference health
- `unresolved_element_ref_count == 0`
- `unresolved_custom_event_count == 0`

Gate 3: Coverage traceability
- Workflow forensic sample generated (at least top-50 by complexity).
- Plugin-like action categories generated.

Gate 4: Human-readable parity context
- Generated docs count aligns with summary/manifest counts.

## Expression Translation Strategy

Bubble expressions are linked AST chains (`type`, `properties`, `next`).

Translation approach:
1. Translate base node types (`CurrentUser`, `GetElement`, `Search`, `TextExpression`, `Conditional`, etc.).
2. Walk `next` chain as possessive/message chain.
3. Provide safe fallbacks (`[expression]`, `[value]`) instead of throwing.
4. Limit recursion depth to prevent runaway structures.

This is sufficient for migration planning and workflow narrative generation.

## Prioritization Heuristics

- Sort workflow actions by ordinal string keys numerically when possible.
- Rank workflows by action_count to focus forensics on highest complexity first.
- Start migration analysis with high-frequency action types:
- `ShowElement`, `HideElement`, `SetCustomState`, `DisplayGroupData`, `ChangeThing`.
- Start trigger analysis with `ButtonClicked`, then `CustomEvent` and `PageLoaded`.

## Known Durable Pitfalls

1. Active-scope inflation risk:
- Counting disabled/deprecated workflows can distort migration priorities.
- Fix: enforce active filter before all downstream analysis.

2. Plugin blind spot:
- Unknown numeric plugin action IDs are easy to ignore.
- Fix: promote them to explicit backlog items in plugin replacement matrix.

3. Expression ambiguity:
- Deep nested expressions can lose semantics if translator is too strict.
- Fix: best-effort translation with graceful placeholders, then manually review high-risk workflows.

4. Sorting errors:
- Action keys are strings; lexicographic sorting misorders steps (`10` before `2`).
- Fix: numeric-aware sort fallback.

## Validation Checklist

- Run extractor and verify summary + active inventories emitted.
- Confirm unresolved references are zero (or documented).
- Regenerate forensics and plugin matrix.
- Regenerate readable docs and verify counts against manifest.
- Log metrics and open questions in run logs.

## Practical Baseline Example

A proven baseline from a production-scale export:
- 1466 workflows total, 1433 active
- 3352 actions total, 3298 active
- 0 unresolved element refs
- 0 unresolved custom-event refs
- Top triggers dominated by `ButtonClicked`
- Top actions dominated by visibility/state/data mutation operations

This profile indicates a UI-heavy orchestration app with extensive event-driven behavior, suitable for phased migration by feature clusters.

## Anti-Patterns

- Starting rebuild implementation before extraction/reference-health gates pass.
- Treating plugin-like actions as uniform without endpoint/action-level mapping.
- Using only sampled workflows without a full active inventory baseline.
- Losing owner path metadata, which is needed to map workflows back to page/component context.

## Output Expectations

Always deliver:
- Machine inventories
- Forensic sample dossier
- Plugin replacement matrix (draft or detailed)
- Readable docs bundle
- Measured counts and unresolved-reference status
- Next-step backlog based on highest complexity workflows and plugin risks
