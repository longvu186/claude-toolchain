---
name: knowledge-cache
description: "Read-first / write-back project knowledge cache so agents stop re-searching for the same facts. Use when about to search for or having just discovered a run/build/deploy/test command, an env var, a key function location, an API call signature, or a cross-page styling convention. Trigger phrases: deploy command, build command, how do I run this, run the app, where is the deploy script, project commands, command registry, styling conventions, design system doc, cross-page consistency, project facts, knowledge cache, stop re-searching, memoize this."
---

# Knowledge Cache — convert search into lookup

A search is expensive and unreliable; a lookup against a curated registry is cheap and deterministic.
This skill defines the **one contract** that makes runs reliable over time:

> **READ-FIRST → on-miss SEARCH → on-success WRITE-BACK.**

Every expensive discovery that yields a durable fact (a command, an env var, a function location, an
API signature, a styling decision) is written to a registry, and the registry is read **before** any
search. After a few runs the registries cover the common cases and search nearly disappears.

This generalizes the `api-discovery-reliability` skill's Canonical Reference Rule to **all** recurring
facts — most importantly **commands** (the "find the deploy command" problem) and **design conventions**
(cross-page consistency). For external/third-party API reverse-engineering specifically, defer to
`api-discovery-reliability` (append-only evidence + `third-party-apis.md`/`api-routes.md`).

## The registries (per project, under `memories/repo/`)

| File                                                                                       | Holds                                                                                                                                                                             | Read before                                                    |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `commands.md`                                                                              | run/dev, build, typecheck, lint, test, deploy, db/migrate, codegen — exact invocations + cwd + when to use; **plus a "Paths, URLs & key variables" block** (see rule below)       | running any build/deploy/test/run command; deriving any served URL / port / path |
| `design-system.md`                                                                         | tokens in use, component variants, layout shells, spacing/radius/shadow conventions, the established pattern for each repeated surface (header, card, button, empty state, table) | building or styling **any** UI surface                         |
| `functions-and-symbols.md` _(optional)_                                                    | only facts GitNexus can't serve fast — entry points, "the X lives in Y" shortcuts                                                                                                 | hunting for a key symbol (else use GitNexus `query`/`context`) |
| `env-vars.md`, `api-routes.md`, `third-party-apis.md`, `data-model.md`, `query-catalog.md` | per `api-discovery-reliability`                                                                                                                                                   | the matching code search                                       |

**Critical commands also belong in always-loaded `AGENTS.md`** (a short "Commands" block) so the 4–5
most-used invocations need no file read at all. `commands.md` holds the long tail.

### Paths, URLs & key variables are cacheable facts too (fs path ≠ served URL)

Deterministic project facts — **served URL prefixes, framework serving conventions, ports, build/output
and DB paths, and key variable/env names** — are exactly the kind of thing to look up, never re-derive.
The classic bug is turning a filesystem path into a URL by string-manipulation:

- Next.js serves the `.next/static/` dir at the URL **`/_next/static/`** (not `/static/`); optimized
  images at `/_next/image`. Vite serves `public/` at root and hashed assets under `/assets/`.
- `public/` (Next) is served at site root **live from disk** — a public-asset edit needs no rebuild.
- `NEXT_PUBLIC_*` / `VITE_*` vars are inlined into the client bundle at **build** time — changing one
  needs a rebuild, not just a restart.

Record these in a **"Paths, URLs & key variables"** block in `commands.md` (a small table: thing → fs
path / served URL / notes), and promote the handful that bite most into the always-loaded profile digest
(`memories/repo/project-profile.md` invariants, or `AGENTS.md`). Read them before constructing any URL,
port, path, or env reference; write back the moment one is confirmed.

## The contract (follow exactly)

### READ-FIRST

1. Before searching for a command / convention / recurring fact, read the matching registry (and the
   `AGENTS.md` Commands block). **Hit → use it, no search.**
2. Trust the registry but sanity-check freshness: if `<!-- last-verified -->` is old or the fact fails
   on first use, treat as a miss and re-verify.

### ON-MISS SEARCH

3. Only if the registry lacks the fact (or it's stale), search/grep/GitNexus to discover it.

### ON-SUCCESS WRITE-BACK ← the step that makes the next run reliable

4. The moment a discovered fact **works** (command succeeds, convention is established), append it to the
   matching registry **before** closing the task. Promote a critical command into the `AGENTS.md` block.
5. If a fact was wrong and you corrected it, **replace** the stale entry (don't keep both).

A discovery that isn't written back is a bug in the loop — the next run pays the search cost again.

## Registry file format

Keep entries terse, copy-pasteable, and stamped. Example `commands.md`:

```markdown
<!-- last-verified: 2026-06-27 -->

# Commands — <project>

## Run / Dev

- `pnpm dev` — local dev server (cwd: repo root, http://localhost:5173)

## Build gates (MUST pass before deploy)

- `pnpm typecheck` && `pnpm build`

## Test

- `pnpm test` — unit | `pnpm test:e2e` — Playwright

## Deploy

- `pnpm deploy` → wraps `wrangler deploy` (cwd: repo root). Needs CF_API_TOKEN in env.
  Gotcha: run typecheck+build first; deploy does NOT.
```

Example `design-system.md` entry:

```markdown
<!-- last-verified: 2026-06-27 -->

# Design System — <project>

## Conventions in use

- Buttons: `<Button variant="primary|ghost">` (never raw `bg-*`); icon buttons use `size="icon"`.
- Cards: `rounded-2xl shadow-sm border-border`; page padding `px-6 py-8`, max-width `max-w-6xl`.
- Repeated surfaces resolved as shared shells: AppHeader, EmptyState, DataTable (sticky header, internal scroll).
- Color/spacing/radius come from tokens (CSS vars + Tailwind config) — no hex literals at call sites.
```

## How this is fed automatically

- The `run-event-logger` hook captures **self-correction lesson atoms** (`tried X → failed → Z worked`)
  to `_lesson-atoms.jsonl` + `~/.claude/logs/lesson-signals.jsonl`. A `Bash` failure→success pair is
  usually exactly a command-fix lesson → promote it into `commands.md`.
- `/consolidate-project` and `experience-memory-curator` read those atoms and the curation queue and
  fold durable commands/conventions into these registries during synthesis.

## Bootstrap

`bootstrap-workspace-docs` / `refresh-workspace-docs` scaffold empty `commands.md` and `design-system.md`
with the `<!-- last-verified -->` header so the write-back target always exists.
