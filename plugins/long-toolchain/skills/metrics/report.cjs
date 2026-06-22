#!/usr/bin/env node
/**
 * Toolchain metrics aggregator (Phase 5.2). Read-only. Crunches the deterministic signals so /metrics
 * can report trends without an LLM doing arithmetic. Run per-workspace (cwd) for project metrics.
 *
 * Usage: node report.cjs [workspaceRoot]
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const HOME = process.env.USERPROFILE || process.env.HOME || os.homedir();
const ws = path.resolve(process.argv[2] || process.cwd());

function readJsonl(file) {
  try {
    return fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function findRunLogDir(start) {
  let cur = start;
  while (true) {
    const c = path.join(cur, "docs", "ai", "run-logs");
    if (fs.existsSync(c)) return c;
    const p = path.dirname(cur);
    if (p === cur) return path.join(HOME, ".claude", "logs", "run-logs");
    cur = p;
  }
}

const runLogDir = findRunLogDir(ws);
const tokens = readJsonl(path.join(runLogDir, "_token-ledger.jsonl"));
const curation = readJsonl(
  path.join(runLogDir, "_memory-curation-queue.jsonl"),
);
const signals = readJsonl(
  path.join(HOME, ".claude", "logs", "profile-signals.jsonl"),
);

// Token trend: last 10 runs vs previous 10.
const totals = tokens.map((t) => (t.est && t.est.observedTotal) || 0);
const avg = (a) =>
  a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
const recent = totals.slice(-10);
const prior = totals.slice(-20, -10);

const partial = curation.filter((c) => c.outcome === "partial").length;
const corrections = curation.reduce(
  (n, c) => n + ((c.corrections && c.corrections.length) || 0),
  0,
);

console.log(`# Toolchain Metrics`);
console.log(`Workspace: ${ws}`);
console.log(`Run-log dir: ${runLogDir}\n`);
console.log(`## Volume`);
console.log(`- Runs logged: ${tokens.length}`);
console.log(`- Partial/failed runs: ${partial}`);
console.log(`- Correction signals (this workspace queue): ${corrections}`);
console.log(`- Global correction signals (all projects): ${signals.length}\n`);
console.log(`## Observed token trend (char/4 proxy — trend only, not billing)`);
console.log(`- Avg observed/run, last 10: ${avg(recent)}`);
console.log(`- Avg observed/run, prior 10: ${avg(prior)}`);
if (prior.length && recent.length) {
  const delta = avg(recent) - avg(prior);
  const pct = avg(prior) ? Math.round((delta / avg(prior)) * 100) : 0;
  console.log(
    `- Change: ${delta >= 0 ? "+" : ""}${delta} (${pct >= 0 ? "+" : ""}${pct}%)`,
  );
}
console.log(`\n## Eval & learning (read alongside)`);
console.log(`- Eval results: ~/.claude/evals/results/latest.md`);
console.log(`- Learning ledger: ~/.claude/learning/ledger.md`);
console.log(`- Pending proposals: ~/.claude/learning/proposals/`);
