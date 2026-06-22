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
2. **Rewrite each section** of `project-profile.md`. Keep the `<!-- digest:start -->`/`<!-- digest:end -->`
   block tight (it's injected every session for this project) — only the facts that change how an agent
   approaches _this_ repo belong there; detail goes in the sections below it.
3. **Architecture map** = synthesize from GitNexus clusters/processes, not a file listing.
4. **Recurring gotchas** = patterns from failed/partial runs and corrections that are project-specific
   (cross-project ones belong in user memory / `tech-pitfalls`, not here).
5. **Retire** stale/contradicted claims (record in the Changelog); never keep both old and new.
6. Stamp `<!-- last-verified: YYYY-MM-DD -->` and add a dated Changelog line.

## Guardrails

- Rewrite-not-append. Keep the digest ≤ ~18 lines.
- Project-specific facts only — don't duplicate user-level preferences (those live in `~/.claude/profile.md`).
- No secrets/keys/private URLs.
- This is read-mostly on the episodic layer: don't delete run-logs or queues.
- Reset the consolidation counter when done (see `~/.claude/logs/` / the SessionStart "consolidation due"
  flag) so the auto-trigger starts a fresh count.

## Output

A short report: sections rewritten, new gotchas captured, facts retired, and anything that should be
promoted to a user-level memory or `tech-pitfalls` skill (project-spanning patterns).
