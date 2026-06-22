---
name: audit-skills
description: "Audit the toolchain's skills and subagents against Anthropic Agent Skills best practices — SKILL.md size, progressive disclosure, description/triggering quality, gerund naming, and least-privilege tool grants. Use to review skill/agent health, before adding many skills, or to find token bloat and over-privileged agents. Trigger phrases: audit skills, review skills, skill health, skill best practices, check subagents, least privilege audit, skill token bloat."
---

# Audit Skills

Holds the skill/subagent library to Anthropic's published Agent Skills standards. Two layers:

1. **Mechanical** — run `node ~/.claude/skills/audit-skills/check.cjs` for the deterministic checks
   (frontmatter present, SKILL.md ≤ 500 lines, description length, subagents missing `tools:`).
   It prints a severity-ranked finding list. Pass custom roots as args if auditing a project's skills.
2. **Judgement** (you do this on top): for each skill, assess what a script can't —
   - **Description triggering quality:** does it state _when to use_ with concrete trigger phrases AND
     boundaries (when NOT to use)? Weak descriptions cause under/over-triggering. Cross-check the
     `~/.claude/evals/` triggering results if present.
   - **Progressive disclosure:** is detail used <20% of the time? Move it to `references/` and point to it.
   - **Naming:** gerund-style ("processing-pdfs", not "helper"/"manager").
   - **Token cost:** every paragraph should justify itself — if removing a sentence wouldn't confuse a
     competent reader, cut it.
   - **Overlap:** do two skills compete for the same trigger? Disambiguate descriptions.

## Method

1. Run `check.cjs`; capture findings.
2. For each HIGH/MED finding, decide the fix (split, tighten description, declare tools, add references/).
   Note acceptable exceptions explicitly (e.g. a large _reference_ skill like `tech-pitfalls`/`wrangler`
   is fine if it's genuinely a lookup doc — but prefer moving bulk into `references/`).
3. For subagents missing `tools:`, recommend explicit grants — **but** if the agent uses MCP tools
   (Playwright/Pencil), the allowlist MUST enumerate those MCP tools or it breaks the agent
   (see `~/.claude/security/agent-tool-matrix.md`). Verify MCP-tool syntax live before applying.
4. Write a short report; apply only safe, high-confidence fixes, propose the rest. Do not mass-rewrite
   skills automatically — regressions in descriptions hurt triggering.

## Discipline

- A skill description is the ONLY thing preloaded (~30–50 tokens each) — it is the highest-leverage text
  in the whole system. Optimize descriptions before bodies.
- Re-run `/run-evals` after description changes to confirm triggering didn't regress.
