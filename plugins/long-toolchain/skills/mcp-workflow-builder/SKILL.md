---
name: mcp-workflow-builder
description: "**WORKFLOW SKILL** - Build production-ready MCP servers and tool workflows from API research through evaluation. Use when: build mcp server, design mcp tools, implement mcp workflow, mcp builder, model context protocol server, tool schema planning, mcp evaluation harness."
argument-hint: "Provide target API/service, language (Python or TypeScript), auth method, and priority workflows."
portability: adapt-port
source-skill: ComposioHQ/awesome-claude-skills/mcp-builder
overlap-gate:
  existing-skill: workflow/mcp-setup-reliability
  overlap-score: 45
  decision: create-new
---

# MCP Workflow Builder

Portability tag: adapt-port.

Use this skill to design and implement MCP servers that solve complete user workflows instead of exposing raw endpoint wrappers.

## When to Use

- Building a new MCP server from an external API
- Refactoring an MCP server with weak tool design
- Creating MCP evaluation scenarios before release
- Improving tool schemas, error guidance, and response quality

## Procedure

### Phase 1: Research and Workflow Design

1. Identify 3-8 high-value user workflows before naming tools.
2. Read MCP protocol docs and chosen SDK docs for the target language.
3. Map each workflow to a minimal tool set with clear input/output contracts.
4. Decide read-only vs mutating tools and mark annotations accordingly.

### Phase 2: Tool Contract Design

1. Create strict validation models (Pydantic or Zod) with constraints.
2. Standardize response format options (`markdown` and `json`) where useful.
3. Define pagination, truncation, and stable identifiers.
4. Design actionable error messages with next-step hints.

### Phase 3: Implementation

1. Build shared infrastructure first: auth, request helpers, error helpers, formatting.
2. Implement tools in workflow order (prerequisites first).
3. Add MCP tool annotations: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`.
4. Keep return formats consistent across similar tools.

### Phase 4: Verification

1. Run syntax/type checks first.
2. Avoid foreground hangs from long-running MCP servers; test through harnesses or short timeouts.
3. Validate representative calls for each tool family.
4. Confirm that common user goals can be completed end-to-end.

### Phase 5: Evaluation

1. Create 10 independent, read-only, verifiable QA pairs.
2. Prefer realistic, multi-step questions.
3. Store evaluation inputs/answers in versioned files.
4. Fail the release if critical workflows cannot be solved reliably.

## Safety Defaults and Fallback Behavior

- Default to read-only tools first; delay mutating tools until contracts are proven.
- Never expose secrets in tool output or logs.
- If protocol or SDK docs are unavailable, continue with local references and mark assumptions explicitly.
- If upstream API docs are incomplete, implement only clearly documented operations and mark remaining workflows as deferred.
- If evaluation harness is unavailable, run a constrained manual validation matrix and document coverage gaps.

## Output Checklist

- Tool inventory grouped by workflow
- Validation models and annotation policy documented
- End-to-end verification evidence captured
- Evaluation set added and runnable
- Deferred items and risk notes recorded
