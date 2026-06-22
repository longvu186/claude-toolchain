# User-level guidance (longvu186@gmail.com)

<!-- digest:start -->

## Always-apply rules (injected each session)

- **i18n Vietnamese-first** for app UI: never hardcode Vietnamese text; route through i18n. Preserve native script/diacritics.
- **Build gates:** `typecheck` + build must pass before any deploy.
- **UI validation is screenshot-backed**, not code-inspection-only, before deploying touched surfaces.
- **Destructive/privilege actions:** use a reusable styled confirmation modal, never native `window.confirm`.
- **System-first UI:** push shared headers/footers/buttons/cards/shells into tokens/variants/layout shells before page-local styling.
- **Stack:** Vue 3 `<script setup lang="ts">` + Pinia setup stores + Tailwind + Supabase. No direct Supabase in components — always via stores/composables.
- **Comms:** terse, direct; action over explanation. Internal reasoning in English.
<!-- digest:end -->

Global preferences and policy for my Claude Code toolchain. Keep this file short — detailed knowledge
lives in skills, agents, and the reference skills noted at the bottom.

**Who I am:** the synthesized model of how I work lives in `~/.claude/profile.md` (its digest is injected
at session start). Read the full profile when personalizing approach, scoping, or making judgment calls.

## Communication

- Short, direct answers. Prefer action over explanation — implement changes rather than describe them.
- Internal reasoning stays in English.

## Working preferences

- **i18n is mandatory** for app UI: Vietnamese-first bilingual. Never hardcode Vietnamese text; route
  through i18n. Preserve native script and diacritics; proofread high-salience labels.
- **Planning docs:** use a simple `docs/specs/active/<slice>/{brief,spec,validation}.md` bundle — not
  dashboards or traceability matrices. Use GitNexus for implementation traceability.
- **Automation over polling:** prefer backend-side automation that reduces client/Bubble polling and
  workflow steps when reliability holds.
- **Destructive/privilege actions:** use a reusable styled confirmation modal, not native `window.confirm`.
- **System-first UI:** push repeated headers, footers, buttons, cards, toolbars, empty states, and
  section shells into shared tokens/variants/layout shells before page-local styling. For parity work,
  align container max-width, cross-view paddings, and primary font early.
- **UI validation is screenshot-backed**, not code-inspection-only, before deploying touched surfaces.
  Prefer focused regression suites over full-matrix reruns unless shared layout/routing/tokens change.
- **Build gates:** `typecheck` + build must pass before any deploy. Close code-changing sessions with
  app-scoped validation + a run log.
- **API reverse-engineering:** keep raw evidence artifacts append-only; add index files, never rewrite captures.

## Code style (Vue stack)

- Vue 3 `<script setup lang="ts">` (no Options API); Pinia setup stores with ref/computed.
- Tailwind utilities; `@apply` only when reused 3+ times. kebab-case files, PascalCase components.
- No direct Supabase calls in components — always via stores/composables.
- Resilient Playwright selectors (`getByRole`, `getByText`, `data-testid`) over utility-CSS classes.

## Agent routing

Handle simple edits directly. Delegate only when the specialized workflow clearly improves the result.

- UI analysis, screenshot/visual diff, design parity, screen/feature mapping → `ui-analyst`
- Code/PR/architecture review, plan critique, pre-merge checks → `code-reviewer`
- Tests, coverage, Playwright, flaky triage, test dashboard → `quality-manager`
- Docs, run logs, AI context, spec bundles, toolchain docs → `documentation-manager`
- Requirements clarification or scoping → `deep-interview`
- New project planning/initiation → `project-architect`
- Promoting durable lessons into memories/skills → `experience-memory-curator`

## MCP / tool policy

Use strong tools when they materially reduce guesswork; don't front-load tool use.

- **Context7** — version-sensitive or unfamiliar library/API docs only; reuse results within a session.
- **GitNexus** — structure, impact, ownership, refactor risk (this workspace is indexed; see workspace CLAUDE.md).
- **Pencil** (.pen) — highest-authority design source when present: `get_variables` for tokens,
  `batch_get` depth 2 for component specs, `get_screenshot` for validation.
- **Playwright** — browser automation, screenshots, visual diff, multi-step/auth flows.
- **Supabase** — any Supabase DB/Auth/Edge/RLS work.
- Domain-specific tools only when the task touches that domain.

## Web research

- Public page reads: prefer `~/.claude/scripts/crawl4ai-url.ps1` (default `markdown`; `json` for links;
  `-BypassCache` when freshness matters) before browser tools.
- Escalate to Playwright/browser only for screenshots, login/session reuse, multi-step interaction, or
  when crawl output is blocked/insufficient. Load the `crawl4ai-web-research` skill when URLs are central.

## Memory discipline

- Record only durable facts (preferences, decisions, ongoing priorities) — not every exchange.
- Read the target file before editing; prefer minimal updates. Don't modify user-authored Obsidian notes unless asked.
- Two layers: **extraction** (`experience-memory-curator` turns sessions into atoms) and **synthesis**
  (`/consolidate-memory` rolls atoms + correction signals into `~/.claude/profile.md`). Run consolidation
  periodically so the profile stays a coherent model of me, not a pile of disconnected facts.

## Reference skills (load on demand)

- `environment-quirks` — Windows/PowerShell, Supabase, Cloudflare, Vercel, Tailwind v4, Electron gotchas.
- `tech-pitfalls` — cross-project failure patterns and recovery strategies. Consult when something breaks unexpectedly.
- `context-economy` — token/cache/compaction/JIT + subagent/tool best practices. Consult when optimizing context or designing skills/agents/tools.

## Self-improving loop (two scopes)

- **User model:** `~/.claude/profile.md` ← `/consolidate-memory` (synthesis) ← correction signals + curation queues.
- **Project model:** `memories/repo/project-profile.md` ← `/consolidate-project` ← run-logs + GitNexus.
- **Measure:** `/run-evals` (triggering + quality), `_token-ledger.jsonl`. **Learn from bugs:** `/learn-from-failures` (governed: propose → ratify).
- SessionStart surfaces "consolidation due" when counters cross thresholds. Promotions to always-loaded surfaces are human-ratified (governance in `~/.claude/learning/`).
