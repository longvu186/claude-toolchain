---
name: consolidate-project
description: "Synthesis pass that rolls up a project's episodic memory (run-logs, curation queue, GitNexus structure) into the living quick-understanding doc memories/repo/project-profile.md. Use to refresh project understanding, rebuild the context/architecture map, or after meaningful changes to a repo. Trigger phrases: consolidate project, update project understanding, refresh project profile, rebuild context doc, update project-profile, what have we learned about this project."
---

# Consolidate Project

The project-scope counterpart to `/consolidate-memory`. Where that builds the cross-project **user**
model, this builds the per-project **quick-understanding** in `memories/repo/project-profile.md` — the
living successor to the old `context.md`. Synthesis, not accumulation: you **rewrite**, you don't append.

## Inputs (skip any that are absent)

1. `memories/repo/project-profile.md` — current understanding (your edit target).
2. `docs/ai/run-logs/*.md` — recent run logs (last ~15 by mtime) for what's been worked on + gotchas.
3. `docs/ai/run-logs/_memory-curation-queue.jsonl` — preference/correction/failure atoms.
4. `docs/ai/run-logs/_token-ledger.jsonl` — heavy-token areas worth noting.
5. **GitNexus** (if indexed): `gitnexus_query` for key flows, the `clusters` resource for the architecture
   map, the `processes` resource for execution flows. Use this for structure rather than grepping.
6. Other `memories/repo/*.md` canonical references; `AGENTS.md`.

## Method (reflection synthesis, not a dump)

1. **Gather**, then **cluster** related observations by theme (architecture, key flows, conventions,
   gotchas, glossary, hot spots). Score what to keep by recency × relevance × importance — recent +
   load-bearing + frequently-touched wins; one-off trivia is dropped.
2. **Rewrite the digest block** — the content between `<!-- digest:start -->`/`<!-- digest:end -->`, which
   is the ONLY part injected into every session for this project (via the SessionStart hook). Everything
   below `digest:end` is read-on-demand, so it does NOT reach the agent unless it goes looking. Therefore
   the digest must be **self-sufficient for the common case**: an agent should be able to answer "what is
   this project, what's the lexicon, what's in-flight, what must I not break" WITHOUT searching. If an
   agent has to grep/Explore to recover a load-bearing term or a half-done feature, that fact belonged in
   the digest. The digest is **always-fed context, not an index to search.** See "Digest standard" below.
3. **Architecture map** (below the digest) = synthesize from GitNexus clusters/processes, not a file listing.
4. **Recurring gotchas** = patterns from failed/partial runs and corrections that are project-specific
   (cross-project ones belong in user memory / `tech-pitfalls`, not here).
5. **Retire** stale/contradicted claims (record in the Changelog); never keep both old and new.
6. Stamp `<!-- last-verified: YYYY-MM-DD -->` and add a dated Changelog line.

## Digest standard (the always-loaded block — cover all six dimensions)

The digest is fed on EVERY run, so budget it deliberately: **target ~1,500–2,500 tokens (~40–80 lines)** —
generous enough to hold the whole project's working context, tight enough to stay cheap. Prefer dense
bullets over prose. It MUST cover all six dimensions (omit a heading only if the project genuinely has
nothing for it):

1. **What & stack** — one-liner on the product + the stack/hosting/data facts that shape every decision.
2. **Primary features / functional map** — the main surfaces and WHERE each lives (`src/app/...`,
   `functions/...`). This is the "file paths" index so the agent never greps to find a feature's home.
3. **Key symbols** — the load-bearing functions, RPCs, tables, env vars, and primary variables an agent
   will touch repeatedly (e.g. the reconcile RPC, the lifecycle orchestrator, the capacity column).
4. **Ubiquitous language / lexicon** — a glossary defining EVERY project-specific term, alias, enum value,
   and code name in one authoritative place. If a noun appears in prompts or code and a fresh agent
   couldn't define it from general knowledge, it belongs here. (This is the P0 lesson from the
   2026-06-30 context-loss incident: an undefined term — "Circle" = Circle.so — triggered a 68k-token
   re-derivation. Never again: define it in the digest.)
5. **Pending / in-flight / half-done** — what's shipped vs. WIP vs. known-broken-but-deferred, with the
   specific gap. This is how the agent knows not to "re-fix" done work or assume WIP is complete.
6. **Hard rules & destructive-action invariants** — non-negotiables (i18n, brand-hiding, no-sandbox-
   checkout, etc.) AND every invariant that gates a destructive or time-delayed action (grace windows,
   which function is destructive vs. status-only, what's irreversible). Any env var controlling a
   destructive/delayed action MUST be named here, not only in code.

Below the digest, keep the richer sections (full architecture map, key flows, all gotchas, hot spots,
changelog) as the read-on-demand tier. The digest is the summary; those are the depth.

## Guardrails

- Rewrite-not-append. Keep the digest within the ~1,500–2,500-token budget — if it grows past that, tighten
  wording or demote detail below `digest:end`; do NOT drop a whole dimension to save space.
- Project-specific facts only — don't duplicate user-level preferences (those live in `~/.claude/profile.md`).
- No secrets/keys/private URLs.
- This is read-mostly on the episodic layer: don't delete run-logs or queues.
- Reset the consolidation counter when done (see `~/.claude/logs/` / the SessionStart "consolidation due"
  flag) so the auto-trigger starts a fresh count.

## Output

A short report: sections rewritten, new gotchas captured, facts retired, and anything that should be
promoted to a user-level memory or `tech-pitfalls` skill (project-spanning patterns).
