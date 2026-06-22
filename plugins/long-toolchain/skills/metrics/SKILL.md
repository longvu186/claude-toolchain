---
name: metrics
description: "Report the self-improving toolchain's health metrics — token-usage trend, partial/failed run rate, correction-signal volume, eval pass-rate, and learning-ledger status. Use to see whether the system is actually improving over time, check token trends, or get a health digest. Trigger phrases: toolchain metrics, how is the system doing, token trend, am I improving, learning metrics, health digest, show metrics."
---

# Metrics

The dashboard for "is the loop actually improving things?" Combines the deterministic ledgers with the
eval and learning records.

## Method

1. Run `node ~/.claude/skills/metrics/report.cjs` (pass a workspace path for project-scoped numbers).
   It prints volume, token trend (last-10 vs prior-10), partial-run rate, and correction counts.
2. Read `~/.claude/evals/results/latest.md` for triggering/quality pass-rate (and the regression diff).
3. Read `~/.claude/learning/ledger.md` for what's been learned and whether it stuck (recurrence after
   applying). Count pending `~/.claude/learning/proposals/`.
4. **Synthesize a short digest** (don't just dump numbers): what's trending up/down, what's churning
   (learnings that didn't stick), and the single highest-leverage next action. Flag anything alarming
   (rising token trend, rising partial-run rate, recurring failures).

## What good looks like

- Token/run trend flat or down (after caching/compaction work).
- Partial-run + correction rates trending down as failure-learning lands.
- Eval pass-rate flat or up; no unaddressed regressions.
- Ledger shows learnings that _stuck_ (Stuck? = yes), few recurring "no"s.

## Discipline

- The token proxy is char/4 — a **trend** signal, not billing. Don't over-interpret absolute values.
- Metrics inform judgement; they don't replace it. A rising correction rate might mean harder work, not
  worse performance — read alongside what was actually being done.
