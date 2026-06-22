---
name: action-automation-runner
description: "**WORKFLOW SKILL** - Execute tool-driven automation safely using a discover-connect-execute pattern with explicit verification. Use when: run automation action, composio action runner, rube workflow execution, multi-tool automation run, execute external tool workflow, automation orchestration, MiniMax CLI automation, multimodal CLI generation workflow, mmx media pipeline."
argument-hint: "Provide the target system, desired outcome, and whether mutating actions are allowed."
portability: adapt-port
source-skill: ComposioHQ/awesome-claude-skills/composio-skills/*-automation + MiniMax-AI/skills/skills/minimax-multimodal-toolkit (merged lane)
overlap-gate:
  existing-skill: workflow/action-automation-runner
  overlap-score: 79
  decision: merge-upgrade
---

# Action Automation Runner

Portability tag: adapt-port.

Use this skill to run external-tool automations with consistent safeguards and traceability.

## Core Pattern

1. Discover tools
2. Validate connection and permissions
3. Execute schema-compliant steps
4. Verify outcomes and record evidence

## Procedure

### Step 1: Discover

- Always discover currently available tools and input schemas before execution.
- Capture tool identifiers, required fields, and known pitfalls.

### Step 2: Connection Check

- Verify active connection/session to the target toolkit.
- Confirm required scopes/permissions for requested operations.

### Step 3: Plan

- Convert the user goal into ordered tool calls.
- Separate read-only probes from mutating operations.
- Reuse a single session id for one workflow run when supported.

### Step 4: Execute

- Run calls with schema-compliant arguments only.
- Pass outputs from each step to the next.
- Handle pagination until completion for list/search flows.

### Step 5: Verify

- Confirm terminal success states and expected side effects.
- Return concise evidence: ids, counts, statuses, links.
- Record retries/errors and final resolution.

## Safety Defaults and Fallback Behavior

- Default mode is read-only discovery and preview; require explicit confirmation before destructive actions.
- If schema discovery is unavailable, stop mutating calls and fall back to manual plan output.
- If toolkit connection is inactive, return auth/reconnect steps instead of retry loops.
- If tool execution fails repeatedly, degrade to smallest safe operation and report the blocked fragment.
- Never log secrets or raw credentials in workflow traces.

## Optional Runner Mapping (Composio-style)

- Discover: `RUBE_SEARCH_TOOLS`
- Connection status: `RUBE_MANAGE_CONNECTIONS`
- Execute: `RUBE_MULTI_EXECUTE_TOOL`
- Expanded schema when needed: `RUBE_GET_TOOL_SCHEMAS`

When these tools are unavailable, map the same discover-connect-execute flow to the active MCP/tooling stack.

## Batch 4 Merge-Upgrade Lane: MiniMax MMX CLI

Portability tag: adapt-port.

Use this lane when the automation target is MiniMax CLI (`mmx`) for text, image, video, speech, music, search, or quota operations.

1. Validate runtime first (`mmx --help`, auth presence, region selection).
2. Force non-interactive defaults for agents: `--non-interactive --quiet --output json`.
3. Use `--async` for long video jobs and follow with task status polling.
4. Use explicit output paths for downloadable artifacts to keep run evidence deterministic.

### MMX CLI Safety and Fallback

- Never print API keys, credential files, or raw auth tokens in logs.
- For high-cost or uncertain calls, run `--dry-run` first when command supports it.
- If `mmx` is unavailable, emit a command-ready fallback plan instead of ad-hoc API calls.
- If media generation is blocked by quota/content filters, return failure evidence and a narrowed retry strategy.

## Output Checklist

- Discovery evidence captured
- Connection status confirmed
- Execution plan and run results reported
- Safety gating applied for mutating calls
- Blocked fragments isolated and labeled
