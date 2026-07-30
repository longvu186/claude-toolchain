/**
 * Stop hook (async): event-driven trigger for memory consolidation.
 *
 * Instead of a polling cron, this fires at run-end and spawns the detached
 * auto-consolidate.cjs worker ONLY when the user-scope consolidation backlog has
 * crossed threshold and no draft is already pending review. The worker produces a
 * DRAFT (profile.md.draft + a report) and never overwrites profile.md — apply is
 * human-ratified via /apply-consolidation (matches the always-loaded ratification rule).
 *
 * Gates (all must pass): not already inside an auto-consolidate run; backlog over
 * threshold; no draft pending; not locked; cooldown elapsed. Mirrors the detached-
 * spawn pattern of trigger-analysis-refresh.cjs. Cheap pure-JS gate; no LLM here.
 */
const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = process.env.USERPROFILE || process.env.HOME || os.homedir();
const LOGS_DIR = path.join(HOME, ".claude", "logs");
const WORKER = path.join(
  HOME,
  ".claude",
  "hooks",
  "scripts",
  "auto-consolidate.cjs",
);
const STATE_FILE = path.join(LOGS_DIR, "_consolidation-state.json");
const AUTO_STATE_FILE = path.join(LOGS_DIR, "_auto-consolidate-state.json");
const DRAFT_MARKER = path.join(LOGS_DIR, "_consolidation-draft-ready.json");
const LOCK_DIR = path.join(LOGS_DIR, "auto-consolidate.lock");

// Auto-draft fires less eagerly than the SessionStart nudge (corrections >= 5): we only spend an
// unattended LLM run when there's a real backlog. Tunable.
const BACKLOG_THRESHOLD = 15; // corrections + lessons since last consolidation
const RUNS_THRESHOLD = 40; // runs since last consolidation
const COOLDOWN_MS = 12 * 60 * 60 * 1000; // don't re-draft within 12h
const LOCK_STALE_MS = 20 * 60 * 1000;

function readStdin() {
  return new Promise((resolve) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (input += c));
    process.stdin.on("end", () => resolve(input));
    process.stdin.resume();
  });
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function resolveWorkspaceRoot(cwd) {
  let current = path.resolve(cwd || process.cwd());
  while (true) {
    if (fs.existsSync(path.join(current, "docs", "ai"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return HOME;
    current = parent;
  }
}

async function main() {
  // Never recurse: the headless consolidation run sets this env var.
  if (process.env.CLAUDE_AUTO_CONSOLIDATE) process.exit(0);

  const rawInput = await readStdin();
  let data = {};
  try {
    data = JSON.parse((rawInput || "").replace(/^﻿/, "") || "{}");
  } catch {
    process.exit(0);
  }

  // A draft already awaiting review — don't regenerate until the human applies/discards it.
  if (fs.existsSync(DRAFT_MARKER)) process.exit(0);

  const s = safeReadJson(STATE_FILE) || {};
  const backlog =
    (s.correctionsSinceConsolidation || 0) + (s.lessonsSinceConsolidation || 0);
  const runs = s.runsSinceConsolidation || 0;
  if (!(backlog >= BACKLOG_THRESHOLD || runs >= RUNS_THRESHOLD))
    process.exit(0);

  // Lock: skip if a worker is active (and not stale).
  try {
    const st = fs.statSync(LOCK_DIR);
    if (Date.now() - st.mtimeMs < LOCK_STALE_MS) process.exit(0);
    fs.rmdirSync(LOCK_DIR);
  } catch {
    /* no lock — proceed */
  }

  // Cooldown.
  const auto = safeReadJson(AUTO_STATE_FILE) || {};
  if (
    auto.lastAutoRun &&
    Date.now() - Date.parse(auto.lastAutoRun) < COOLDOWN_MS
  )
    process.exit(0);

  const workspaceRoot = resolveWorkspaceRoot(data.cwd || process.cwd());
  const child = childProcess.spawn(process.execPath, [WORKER, workspaceRoot], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  process.exit(0);
}

main().catch(() => process.exit(0));
