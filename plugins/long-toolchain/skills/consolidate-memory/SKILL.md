---
name: consolidate-memory
description: "Synthesis pass that rolls up episodic memory (run-logs, curation queue, correction signals, per-project memories) into the durable cross-project user profile. Use when refreshing the model of the user, merging duplicate memories, promoting repeated patterns, or retiring stale facts. Trigger phrases: consolidate memory, update my profile, what have you learned about me, synthesize memories, refresh user profile, memory consolidation."
---

# Memory Consolidation

You are the **synthesis** half of the memory system. The `experience-memory-curator` agent does
_extraction_ (raw experience → discrete atoms). You do the opposite direction: **many atoms → a few
durable, higher-order beliefs** about the user, written into `~/.claude/profile.md`.

Without this pass the memory system accumulates disconnected facts. Your job is to make it cohere.

## The two layers

| Layer              | Lives in                                                                                     | Nature          | Maintained by         |
| ------------------ | -------------------------------------------------------------------------------------------- | --------------- | --------------------- |
| Episodic (atoms)   | run-logs, `_memory-curation-queue.jsonl`, `profile-signals.jsonl`, per-project `memory/*.md` | what happened   | logger hook + curator |
| Semantic (profile) | `~/.claude/profile.md`                                                                       | who the user is | **this skill**        |

You **rewrite** the profile. You never just append. Appending is what produces the "discrete unrelated
pieces" problem in the first place.

## Inputs to read

1. `~/.claude/profile.md` — the current model (your edit target).
2. `~/.claude/CLAUDE.md` — established policy; do not duplicate it into the profile, reference it.
3. `~/.claude/logs/profile-signals.jsonl` — **cross-project correction signals** (highest value: each line is a moment the user overrode the agent). May not exist yet.
4. Current workspace `docs/ai/run-logs/_memory-curation-queue.jsonl` — preference/assumption candidates from recent runs.
5. Current workspace `docs/ai/run-logs/*.md` — recent run logs (last ~15 by mtime) for behavioral patterns.
6. The per-project auto-memory directory if present (e.g. `.../projects/<slug>/memory/*.md`).

If a path is absent, skip it silently — never fail the pass for missing optional inputs.

## Method

1. **Gather evidence.** Read the inputs above. Group raw items by theme (comms style, decision tendency, stack preference, recurring correction, anti-pattern, domain strength).
2. **Score confidence.** A belief is `established` only if supported by ≥2 independent observations across different sessions/projects. One occurrence stays `provisional` (a hypothesis), labeled as such.
3. **Detect corrections.** Every entry in `profile-signals.jsonl` and every preference candidate is a candidate "Open correction to honor." Promote it; if the same correction recurs, escalate it toward CLAUDE.md / a skill and note that in the change report.
4. **Merge & dedupe.** Collapse atoms that say the same thing. Prefer the shortest phrasing that stays actionable.
5. **Retire stale/contradicted facts.** If newer evidence contradicts an existing profile claim, replace it and record the change in the Changelog. Do not keep both.
6. **Rewrite the profile by section** (Identity, How I work, Decision tendencies, Domain & skill map, Proven preferences, Open corrections, Anti-patterns, Changelog). Keep the `<!-- digest:start -->`/`<!-- digest:end -->` block tight — it is injected every session, so only the highest-behavior-impact facts belong there.
7. **Add a dated Changelog entry** summarizing what changed this pass.

## Guardrails

- Never invent weaknesses or traits without evidence. Absence of evidence ≠ a gap to assert.
- Never store secrets, keys, tokens, or private URLs in the profile.
- Keep the digest block short (≤ ~15 lines). The full sections hold the detail.
- Do **not** edit `~/.claude/CLAUDE.md` here — instead, when a correction is strong enough to become
  policy, flag it in the change report and let the user decide. (If they say "go ahead," then edit it.)
- This pass is read-mostly on the episodic layer: do not delete run-logs or queue files. You may mark a
  consumed `profile-signals.jsonl` by leaving it (the logger rotates it) — do not truncate it unless asked.

## Output

End with a concise **consolidation report**:

- Beliefs promoted to `established` (with the evidence count).
- New `provisional` hypotheses.
- Corrections added to "Open corrections to honor".
- Facts retired/contradicted (and why).
- Anything strong enough to recommend promoting into CLAUDE.md or a skill (ask before editing CLAUDE.md).
- Suggested next consolidation trigger (e.g. "after the next 2 feature sessions").
