/**
 * Detached worker spawned by trigger-consolidation.cjs.
 *
 * Runs `claude -p` headless to synthesize the user profile, but in DRAFT mode:
 * it writes ~/.claude/profile.md.draft + a diff report under ~/.claude/learning/queue/
 * and must NOT overwrite ~/.claude/profile.md or reset the consolidation counters.
 * The human ratifies with /apply-consolidation (which applies the draft + resets counters).
 *
 * Lifecycle: acquire lock -> record lastAutoRun -> run claude (niced) -> drop a
 * draft-ready marker -> release lock. Set AUTO_CONSOLIDATE_DRYRUN=1 to exercise the
 * plumbing without spending an LLM run.
 *
 * argv[2] = workspaceRoot (used as cwd so project run-logs are in scope).
 */
const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = process.env.USERPROFILE || process.env.HOME || os.homedir();
const LOGS_DIR = path.join(HOME, ".claude", "logs");
const QUEUE_DIR = path.join(HOME, ".claude", "learning", "queue");
const AUTO_STATE_FILE = path.join(LOGS_DIR, "_auto-consolidate-state.json");
const DRAFT_MARKER = path.join(LOGS_DIR, "_consolidation-draft-ready.json");
const DRAFT_FILE = path.join(HOME, ".claude", "profile.md.draft");
const LOCK_DIR = path.join(LOGS_DIR, "auto-consolidate.lock");
const LOG_FILE = path.join(LOGS_DIR, "auto-consolidate.log");
const PROFILE_SIGNALS = path.join(LOGS_DIR, "profile-signals.jsonl");
const LESSON_SIGNALS = path.join(LOGS_DIR, "lesson-signals.jsonl");

const WORKSPACE_ROOT = process.argv[2] || HOME;
const RUN_TIMEOUT_MS = 15 * 60 * 1000;

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}
function isoNow() {
  return new Date().toISOString();
}
function log(msg) {
  try {
    ensureDir(LOGS_DIR);
    fs.appendFileSync(LOG_FILE, `${isoNow()} ${msg}\n`);
  } catch {
    /* ignore */
  }
}
function writeJson(p, v) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(v, null, 2));
}

function reportPathForToday() {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  return path.join(QUEUE_DIR, `consolidation-${stamp}.md`);
}

const DRAFT_PROMPT = [
  "Run the consolidate-memory skill to synthesize ~/.claude/profile.md from the latest",
  "correction signals (~/.claude/logs/profile-signals.jsonl), self-correction lesson atoms",
  "(~/.claude/logs/lesson-signals.jsonl), and recent run-log curation queues.",
  "",
  "CRITICAL UNATTENDED-DRAFT OVERRIDE:",
  "- Do NOT modify ~/.claude/profile.md. Write the fully rewritten profile to ~/.claude/profile.md.draft instead.",
  `- Write a concise diff summary (sections changed, facts added, facts retired, confidence) to ${reportPathForToday()}.`,
  "- Do NOT reset the consolidation counters — the human applies the draft separately via /apply-consolidation.",
  "- Keep the <!-- digest:start -->/<!-- digest:end --> block tight. No secrets/keys.",
  "Output a one-paragraph summary of what changed.",
].join("\n");

function acquireLock() {
  try {
    fs.mkdirSync(LOCK_DIR); // atomic: fails if exists
    return true;
  } catch {
    try {
      const st = fs.statSync(LOCK_DIR);
      if (Date.now() - st.mtimeMs > RUN_TIMEOUT_MS + 60000) {
        fs.rmdirSync(LOCK_DIR);
        fs.mkdirSync(LOCK_DIR);
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }
}
function releaseLock() {
  try {
    fs.rmdirSync(LOCK_DIR);
  } catch {
    /* ignore */
  }
}

function countLines(f) {
  try {
    const c = fs.readFileSync(f, "utf8");
    return c ? c.split("\n").filter(Boolean).length : 0;
  } catch {
    return 0;
  }
}

// Snapshot the signal files the headless run is about to consume, recording exact line counts.
// /apply-consolidation archives this snapshot and trims those first-N lines from the live files, so
// signals are consumed exactly once even when apply happens days after the draft was generated.
function snapshotSignals() {
  const stamp = isoNow().replace(/[:.]/g, "-");
  const dir = path.join(QUEUE_DIR, `consumed-${stamp}`);
  const consumed = {
    stamp,
    snapshotDir: dir,
    profileSignalsLines: 0,
    lessonSignalsLines: 0,
  };
  try {
    ensureDir(dir);
    for (const [src, key, base] of [
      [PROFILE_SIGNALS, "profileSignalsLines", "profile-signals.jsonl"],
      [LESSON_SIGNALS, "lessonSignalsLines", "lesson-signals.jsonl"],
    ]) {
      const n = countLines(src);
      consumed[key] = n;
      if (n > 0) fs.copyFileSync(src, path.join(dir, base));
    }
  } catch (e) {
    log(`snapshot error: ${e && e.message}`);
  }
  return consumed;
}

function main() {
  if (!acquireLock()) {
    log("lock held — another worker active; exiting");
    return;
  }
  try {
    writeJson(AUTO_STATE_FILE, {
      lastAutoRun: isoNow(),
      workspaceRoot: WORKSPACE_ROOT,
    });
    ensureDir(QUEUE_DIR);
    const report = reportPathForToday();
    // Capture exactly what this run will consume (pre-run state) for archive-on-apply.
    const consumed = snapshotSignals();

    if (process.env.AUTO_CONSOLIDATE_DRYRUN) {
      fs.writeFileSync(DRAFT_FILE, `# profile draft (dryrun) ${isoNow()}\n`);
      fs.writeFileSync(report, `# Consolidation draft (dryrun) ${isoNow()}\n`);
      log("DRYRUN: wrote fake draft + report");
    } else {
      log("starting headless draft consolidation");
      const res = childProcess.spawnSync(
        "nice",
        ["-n", "19", "ionice", "-c", "3", "claude", "-p", DRAFT_PROMPT],
        {
          cwd: WORKSPACE_ROOT,
          env: { ...process.env, CLAUDE_AUTO_CONSOLIDATE: "1" },
          timeout: RUN_TIMEOUT_MS,
          stdio: ["ignore", "ignore", "ignore"],
        },
      );
      if (res.error) {
        log(`claude run error: ${res.error.message}`);
        return;
      }
      if (res.status !== 0) {
        log(`claude exited ${res.status} (signal ${res.signal || "none"})`);
        // Still mark a draft if one was produced; otherwise bail.
        if (!fs.existsSync(DRAFT_FILE)) return;
      }
      log("headless draft consolidation finished");
    }

    if (fs.existsSync(DRAFT_FILE)) {
      writeJson(DRAFT_MARKER, {
        createdAt: isoNow(),
        draftFile: DRAFT_FILE,
        reportPath: report,
        workspaceRoot: WORKSPACE_ROOT,
        consumed,
      });
      log("draft-ready marker written");
    } else {
      log("no draft produced — leaving counters/marker untouched");
    }
  } catch (e) {
    log(`worker exception: ${e && e.message}`);
  } finally {
    releaseLock();
  }
}

main();
