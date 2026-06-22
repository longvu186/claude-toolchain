---
name: context-economy
description: "Token, context, subagent, and tool best practices for the agents themselves — prompt-cache stability, compaction, just-in-time context, progressive disclosure, subagent model routing, and the 7-element tool design rules. Use when optimizing token usage, designing/reviewing skills/subagents/hooks/tools, deciding what to load into context, or auditing context bloat. Trigger phrases: token optimization, reduce tokens, context bloat, prompt caching, compaction, subagent design, tool design, just-in-time context, progressive disclosure."
---

# Context Economy

The constraint is context, not intelligence. These are the agent-facing best practices (Anthropic
context-engineering + Agent Skills + 2025–26 token-optimization research) for keeping the toolchain fast
and cheap without losing capability.

## Prompt-cache stability (biggest cost lever)

- Caching turns ~$3.00/MTok into ~$0.30/MTok at >90% hit — but only on a **stable prefix**.
- Keep the always-loaded prefix byte-stable across turns: user `CLAUDE.md`, workspace `AGENTS.md`/
  `CLAUDE.md`, and SessionStart digests should NOT contain per-turn timestamps, counters, or volatile
  text. Put anything volatile (run-log continuity, "consolidation due") _after_ the stable block.
- Don't reorder or rewrite the system/instruction prefix mid-session.

## Just-in-time (JIT) context — don't pre-dump

- Pass **identifiers** (file paths, symbol names, IDs), let the agent fetch via Read/Grep/GitNexus on
  demand. Prefer discovery tools over data dumps.
- Use `memories/repo/` canonical refs + GitNexus instead of pasting large code/SQL into context.
- Start with summaries (digests, profiles); drill into detail only when the task needs it.

## Progressive disclosure (skills)

- Only a skill's name+description preloads (~30–50 tokens). SKILL.md loads on trigger; `references/`
  load only when used. Dozens of skills cost less than one activated skill.
- Keep SKILL.md ≤ 500 lines; move >20%-rarely-used detail to `references/`. Every paragraph justifies
  its tokens — if cutting a sentence wouldn't confuse a competent reader, cut it.

## Compaction (long sessions)

- Near ~80% of the window, compact: replace verbose history with "User wants X, tried Y, learned Z".
- Cache-safe forking: keep the same system prompt + tools + history, append the compaction instruction
  as a new message (don't rewrite the cached prefix).
- Demote large tool outputs to retrievable references rather than keeping them inline.
- Persist durable decisions/findings to the project profile or a notes file, not the live window.

## Subagent design

- Decompose wide tasks into focused subagents with **narrow** context; the main agent synthesizes.
- **Least privilege:** grant only needed tools (code-reviewer = Read/Grep/Glob). MCP-dependent agents
  must enumerate their MCP tools in the allowlist or they break (see security/agent-tool-matrix.md).
- **Model routing:** route mechanical/cheap sub-work to Haiku; reserve Opus/Sonnet for hard reasoning.
  Agent _teams_ burn ~7× tokens — match the model to the task.
- Action-oriented descriptions ("Use PROACTIVELY when…") so delegation triggers reliably.

## Tool design (7 elements)

Simple accurate name (no "helper"); detailed description incl. return format; non-overlapping
functionality; single-action (≤1 nesting level for params); input/output examples; explicit
constrained params; tested before use. Every tool must justify its existence.

## Context-rot prevention

Watch for and remove: **poisoning** (wrong/outdated facts), **distraction** (irrelevant data),
**confusion** (similar-but-distinct items mixed), **clash** (contradictions). The consolidation passes
should actively retire these, not just add.
