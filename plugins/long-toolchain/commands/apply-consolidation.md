---
description: "Review and ratify the auto-generated profile consolidation draft, then apply it to ~/.claude/profile.md and reset the consolidation counters."
argument-hint: "Optionally: 'discard' to drop the draft without applying."
---

Ratify (or discard) the pending consolidation draft produced by the event-driven auto-consolidate worker.
This is the human-ratification step for the always-loaded user profile — never auto-applied.

## Inputs

- Marker: `~/.claude/logs/_consolidation-draft-ready.json` (points at the draft + report).
- Draft: `~/.claude/profile.md.draft` (proposed full rewrite).
- Report: `~/.claude/learning/queue/consolidation-*.md` (what changed).
- Live: `~/.claude/profile.md` (current).

## If argument is `discard`

Delete `~/.claude/profile.md.draft` and `~/.claude/logs/_consolidation-draft-ready.json`. Leave
`~/.claude/profile.md` and the consolidation counters untouched. Report that the draft was discarded.

## Otherwise (review → apply)

1. If no marker/draft exists, say so and stop.
2. Show a focused diff of `~/.claude/profile.md.draft` vs `~/.claude/profile.md` — emphasize the
   `<!-- digest:start -->`/`<!-- digest:end -->` block and any facts added/retired. Summarize from the report.
3. Sanity-check the draft: no secrets/keys, digest block tight (≤ ~18 lines), no obviously wrong/retired
   facts reintroduced. Flag anything suspicious and ask before applying.
4. On confirmation:
   - Back up current profile to `~/.claude/profile.md.bak`.
   - Move the draft to `~/.claude/profile.md`.
   - **Archive the consumed signals** (so the next consolidation never re-reads them — this is what
     stops `profile-signals.jsonl` from growing unbounded and being re-read in full every pass). Use the
     `consumed` block in the marker, which records the exact line counts the draft was built from:
     - For each of `profile-signals.jsonl` and `lesson-signals.jsonl`: let `N` = the recorded consumed
       line count. Remove the **first N lines** from the live file (keep any lines appended after the
       snapshot — those are unconsolidated and must survive). Move `consumed.snapshotDir` to
       `~/.claude/learning/archive/`.
     - Fallback if the marker has no `consumed` block (older draft): archive the whole signal files to
       `~/.claude/learning/archive/<date>/` and truncate the live files.
   - Reset counters in `~/.claude/logs/_consolidation-state.json`: set `runsSinceConsolidation` to 0,
     `correctionsSinceConsolidation` and `lessonsSinceConsolidation` to the **remaining** (post-trim)
     line counts of the two signal files (not blindly 0 — preserve the unconsolidated tail), and
     `lastConsolidation` to now (ISO).
   - Delete `~/.claude/logs/_consolidation-draft-ready.json` and `~/.claude/profile.md.draft`. Move the
     report into `~/.claude/learning/archive/` for the audit trail.
5. Report: sections applied, facts added/retired, signals archived (count), counters reset, backup location.

Keep edits minimal and reversible. The digest block is injected every session — treat changes to it as
the highest-scrutiny part of the review.
