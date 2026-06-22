---
name: learn-from-failures
description: "Reflective improvement pass (GEPA-style) — read failed/partial runs, corrections, and raw traces, diagnose the root cause in natural language, and propose the smallest guidance/skill/prompt edit that prevents recurrence. Use to auto-learn from bugs and mistakes, turn recurring failures into durable fixes, or review what keeps going wrong. Trigger phrases: learn from failures, why do we keep failing, turn bugs into improvements, reflective improvement, propose fixes from run logs, what should we change."
---

# Learn From Failures

Implements the GEPA loop (reflective prompt/guidance evolution): execution traces → natural-language
diagnostic → prescriptive edit. Reads what went wrong and proposes the change that stops it recurring.
Output is a **proposal**, never a silent edit (governance: `~/.claude/learning/README.md`).

## Inputs (skip absent)

- `docs/ai/run-logs/_memory-curation-queue.jsonl` — runs with `outcome:"partial"`, `failures[]`, and
  `corrections[]`.
- `docs/ai/run-logs/.raw/*.jsonl` — full traces for the failing runs (inputs, tool calls, errors).
- `~/.claude/logs/profile-signals.jsonl` — cross-project correction signals.
- `~/.claude/evals/results/latest.md` — failing eval scenarios.
- Existing skills/agents/CLAUDE.md/AGENTS.md (the edit targets).

## Method (per recurring pattern, not per one-off)

1. **Cluster** failures/corrections by pattern. Ignore one-offs; focus on what repeats (≥2) or is
   high-severity. Count recurrence — it drives `severity` and salience escalation.
2. **Diagnose (NL, GEPA reflective step):** for each cluster, write what failed, the _root cause_ (use
   the `debugging` skill's reasoning, not symptom-patching), and why current guidance allowed it.
3. **Prescribe the smallest edit:** which skill description / SKILL.md / CLAUDE.md rule / hook / tool
   description would have prevented it. Prefer tightening one description over adding new always-loaded
   text. If it's a cross-project code trap, target `tech-pitfalls`.
4. **Write a proposal** to `~/.claude/learning/proposals/YYYY-MM-DD-<slug>.md` (schema in the learning
   README) with `provenance` (the exact run-logs/signals/eval ids) and `recurrence`.
5. **Salience escalation:** if a matching `applied` proposal already exists in `ledger.md` and the
   failure recurred anyway, mark the new proposal `severity: high` and recommend escalating
   provisional → established → hard rule (e.g. promote into CLAUDE.md).
6. **Add an eval scenario** to `~/.claude/evals/scenarios/` capturing the failure, so the fix is
   measurable and regressions are caught.

## Guardrails

- Propose; don't apply to always-loaded surfaces. The user ratifies (see learning README lifecycle).
- Root cause over symptom; smallest viable edit over broad rewrites.
- Every proposal carries provenance and a rollback note. No secrets.

## Output

The list of proposals written (path + one-line summary + recurrence), plus anything urgent enough to
recommend ratifying now.
