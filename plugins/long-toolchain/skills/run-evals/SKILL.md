---
name: run-evals
description: "Run the toolchain eval suite to measure skill/subagent triggering accuracy and output quality, then report pass-rate and regressions vs the last run. Use to establish a baseline before changing skills/agents, to check a change didn't regress triggering, or to grow the eval set from a new failure. Trigger phrases: run evals, eval suite, check triggering accuracy, skill eval, measure toolchain quality, eval baseline."
---

# Run Evals

The measurement half of eval-driven development. You execute the scenarios in `~/.claude/evals/`,
score them, and write a pass-rate summary that makes "did this change help?" answerable.

## Inputs

- `~/.claude/evals/scenarios/*.jsonl` — scenarios (schema in `~/.claude/evals/README.md`).
- Optional arg = tag filter (e.g. `security`, `ui`) → run only matching scenarios.
- `~/.claude/evals/results/latest.md` — previous run, for regression diffing (may not exist).

## Method

1. **Load** scenarios (filter by tag if given). Also load the list of available skills/subagents and
   their `description:` frontmatter (from `~/.claude/skills/*/SKILL.md` and `~/.claude/agents/*.md`).
2. **`trigger` scenarios** — for each, decide _from the descriptions alone_ (simulate the routing
   decision) which skill/agent the prompt would invoke. Pass if: positives → expected skill fires;
   negatives (`fires:false`) → expected skill does NOT fire. Note over-trigger (negative fired) and
   under-trigger (positive missed) separately — they need different fixes (tighten vs broaden the
   description).
3. **`quality` scenarios** — actually perform the task (or a faithful dry-run), then judge the output
   against `rubric` using an **Agent-as-a-Judge (Haiku)** call: score 0–1 with a one-line justification.
   Keep it cheap; this is a signal, not a grade.
4. **Write results** to `~/.claude/evals/results/<YYYY-MM-DD>.jsonl` (one verdict per line) and a human
   summary to `~/.claude/evals/results/latest.md`: overall pass-rate, per-tag pass-rate, the list of
   failures with the specific fix each implies, and a **diff vs the previous `latest.md`** (new failures =
   regressions, fixed = improvements).
5. **Report** the summary inline and stop. Do not auto-edit skills — failures feed `/learn-from-failures`
   and your judgment, not silent rewrites.

## Discipline

- Negative/boundary scenarios matter as much as positives — report over-triggering loudly.
- Don't optimize skill descriptions to pass the judge alone; keep human spot-checks.
- When a real mis-fire or bug happens in normal work, add a scenario for it here so the suite grows from
  reality (this is how edge-case coverage compounds).
- Judge model = Haiku for cost; escalate to the session model only for genuinely ambiguous quality calls.
