# User-level guidance (longvu186@gmail.com)

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
- **Preserve full research-agent output before planning from it.** When parallel research/audit agents
  produce large findings, write each agent's full output verbatim into its own dedicated file in the
  spec bundle (e.g. `audit-findings.md`, `gap-delta.md`) BEFORE starting implementation — the condensed
  plan is a synthesis on top of that record, never a replacement for it. Confirmed preference: "your
  documented plan above was way larger. document them all carefully before starting so we don't lose
  context."
- **Automation over polling:** prefer backend-side automation that reduces client/Bubble polling and
  workflow steps when reliability holds. For third-party integrations, use their webhooks over interval
  polling whenever the provider offers one.
- **Destructive/privilege actions:** use a reusable styled confirmation modal, not native `window.confirm`.
- **System-first UI:** push repeated headers, footers, buttons, cards, toolbars, empty states, and
  section shells into shared tokens/variants/layout shells before page-local styling. For parity work,
  align container max-width, cross-view paddings, and primary font early.
- **UI validation is screenshot-backed**, not code-inspection-only, before deploying touched surfaces.
  Prefer focused regression suites over full-matrix reruns unless shared layout/routing/tokens change.
- **Build gates:** `typecheck` + build must pass before any deploy. Close code-changing sessions with
  app-scoped validation + a run log — and before writing "resolved/live/sent" anywhere, verify the
  external effect (deploy platform's own deployment timestamp, delivered notification) actually
  shipped, not just that the local build/typecheck succeeded. A false "resolved" is worse than an
  honest "not done yet."
- **API reverse-engineering:** keep raw evidence artifacts append-only; add index files, never rewrite captures.
- **Cloning a paid vendor's UX for migration:** mine the vendor's public, unauthenticated webpack
  bundle first (route table, permission enums, i18n vocabulary) — often enough on its own, and it
  carries no risk to a live account. An authenticated crawl of my own tenant is a per-project,
  per-session ask — session-eviction risk and ToS vary by vendor, so get an explicit go/no-go each
  time rather than treating an earlier yes as standing authorization. Never redistribute the
  vendor's actual compiled JS/CSS/asset files as output — extract facts, not files. Details:
  `webpack-spa-mining` skill.
- **Knowledge cache (read-first/write-back):** before searching for a run/build/deploy/test command,
  env var, or styling convention, read `memories/repo/commands.md` + `design-system.md` (and the
  `AGENTS.md` Commands block). When a discovered command/convention works, write it back before closing.
  Turns repeated search into deterministic lookup. Details: `knowledge-cache` skill.
- **Case matrix before code:** for any CRUD or data-mutation feature, enumerate the case matrix
  (happy/negative/boundary/permission/concurrency) as the first artifact, before test or implementation
  code — one step ahead of TDD's red-green loop. Details: `test-case-matrix` skill.
- **Secrets — Infisical only, values never in chat.** Secrets live in Infisical (shared project
  `hq-secrets`, folder `/<repo-slug>` per repo). To _use_ a secret run `with-secrets -- <cmd>` (injects
  into the subprocess env); to _see what exists_ run `list-secret-keys` (names only). NEVER run
  `infisical export` / `infisical secrets [get|--plain]` / `cat .env*` — they print values into the
  transcript and the `pre-tool-security` guard hard-blocks them. Need a blocked command allow-listed?
  Ask the human to add it — agents can't self-grant. Details: `~/.claude/scripts/README-secrets.md`.

## Code style

- **Primary architecture: Next.js + Supabase + Cloudflare Workers.** Vue is a secondary framework, not the default.
- Tailwind utilities; `@apply` only when reused 3+ times. kebab-case files, PascalCase components.
- No direct Supabase calls in components — route through the data layer (Next.js: server actions / route handlers / hooks; Vue: stores/composables).
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

Don't swap these custom agents for generic plugin equivalents (e.g. `coderabbit:code-reviewer`,
`feature-dev:code-reviewer`) without evidence — they're wired into repo-specific rules and the
run-log/memory loop that plugins discard. Plugins add value only where no custom agent exists.

## Environment

Primary dev box is a **Linux Contabo VPS** (not Windows anymore — `.ps1` scripts in `~/.claude/scripts`
are legacy; prefer POSIX equivalents). Node v22 at `/usr/local/bin`.

- **Shared dependencies — install once, reuse across projects.** Node: use **pnpm** (global
  content-addressable store at `/root/.pnpm-store`, `package-import-method=hardlink`) — overlapping deps
  are stored once and hard-linked into each project's `node_modules`. Prefer `pnpm` over `npm`/`yarn`.
  Python: use **uv** (global cache `/root/.cache/uv`, hard-linked into venvs). Don't `npm i -g` app deps.
  **Exception:** CLI tools with native addons (better-sqlite3, sharp, bcrypt, etc.) — use
  `npm install -g`, not pnpm; pnpm's hard-linked store breaks compiled binding paths. Details: `environment-quirks`.
- **VPS infra:** Netdata at `status.citizendev.io` (loopback-bound, behind CF Access), cloudflared as a
  systemd service, earlyoom + cgroup caps guard against OOM freezes. Details: `environment-quirks`.

## MCP / tool policy

Use strong tools when they materially reduce guesswork; don't front-load tool use.

- **Context7** — version-sensitive or unfamiliar library/API docs only; reuse results within a session.
- **GitNexus** — structure, impact, ownership, refactor risk (per-project; index lives in the workspace).
- **Playwright** — browser automation, screenshots, visual diff, multi-step/auth flows.
- **Supabase** — any Supabase DB/Auth/Edge/RLS work.
- Domain-specific tools only when the task touches that domain.
- **MCP sprawl:** stdio servers spawn one process per session (RAM cost). Prefer HTTP transport for
  stateless/shareable ones (context7 uses its hosted endpoint). Don't re-add servers already dropped as
  redundant (e.g. chrome-devtools-mcp — covered by Playwright). Details: `environment-quirks`.

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

- `environment-quirks` — Windows/PowerShell, Supabase, Cloudflare, Vercel, Tailwind v4, Electron gotchas, plus Claude Code hook/MCP/cloud-config quirks and this VPS's infra.
- `tech-pitfalls` — cross-project failure patterns and recovery strategies. Consult when something breaks unexpectedly.
- `context-economy` — token/cache/compaction/JIT + subagent/tool best practices. Consult when optimizing context or designing skills/agents/tools.
- `knowledge-cache` — read-first/write-back registries (`commands.md`, `design-system.md`) so runs stop re-searching for commands/conventions.

## Self-improving loop (two scopes)

- **User model:** `~/.claude/profile.md` ← `/consolidate-memory` (synthesis) ← correction signals + curation queues.
- **Project model:** `memories/repo/project-profile.md` ← `/consolidate-project` ← run-logs + GitNexus.
- **Measure:** `/run-evals` (triggering + quality), `_token-ledger.jsonl`. **Learn from bugs:** `/learn-from-failures` (governed: propose → ratify).
- SessionStart surfaces "consolidation due" when counters cross thresholds. Promotions to always-loaded surfaces are human-ratified (governance in `~/.claude/learning/`).
- **Where toolchain + VPS work happens:** `personal-hq/docs/toolchain/` (charter, architecture, VPS runbook, replication guide, archived history). The old `ai-optimization` workspace is deprecated as of 2026-07-30. `~/.claude/` stays the live source of truth.
