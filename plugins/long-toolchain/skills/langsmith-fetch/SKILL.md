---
name: langsmith-fetch
description: "**WORKFLOW SKILL** - Debug LangChain and LangGraph behavior by fetching and analyzing LangSmith traces, failures, tool calls, and latency patterns. Use when: debug LangSmith traces, inspect agent execution, analyze tool calls, investigate trace failures, review token usage, LangChain observability."
argument-hint: "Provide project name, time window, and whether you need quick triage, deep trace analysis, or export." 
portability: adapt-port
source-skill: ComposioHQ/awesome-claude-skills/langsmith-fetch
overlap-gate:
  existing-skill: debugging
  overlap-score: 59
  decision: create-new
---

# LangSmith Fetch

Portability tag: adapt-port.

Use this skill to move from vague agent failures to evidence-backed root causes by analyzing execution traces.

## When to Use

- Agent behavior is unexpected and you need trace-level evidence
- Tool selection/execution appears wrong
- You need failure rates, latency patterns, or token usage review
- You need exportable debug artifacts for team handoff

## Procedure

### Phase 1: Environment Check

1. Verify `langsmith-fetch` availability.
2. Verify required environment variables (`LANGSMITH_API_KEY`, project context).
3. Confirm target time window and scope.

### Phase 2: Quick Triage

1. Fetch recent traces for short windows first.
2. Report success/failure counts, common errors, and top failing tool calls.
3. Isolate one representative failing trace.

### Phase 3: Deep Trace Analysis

1. Inspect step-by-step execution flow.
2. Identify exact failure point and upstream trigger.
3. Distinguish configuration failures vs logic failures vs external dependency failures.

### Phase 4: Performance and Reliability

1. Extract latency and token cost signals.
2. Detect recurring patterns across failures.
3. Suggest targeted fixes with clear verification steps.

### Phase 5: Export and Handoff

1. Export trace bundles for reproducibility.
2. Summarize root cause, impact, fix, and prevention.
3. Record any open unknowns with required follow-up data.

## Safety Defaults and Fallback Behavior

- Do not print API keys or secret values in logs/reports.
- If CLI is missing, provide install and config commands before analysis.
- If project access fails, fall back to local logs and mark confidence reduction.
- Treat incomplete traces as partial evidence, not definitive root cause.

## Output Checklist

- Trace window and scope confirmed
- Failure summary provided
- Root-cause path documented
- Fix and validation steps proposed
- Export/handoff artifacts produced when requested
