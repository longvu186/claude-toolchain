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

const CLAUDE_HOME = path.join(HOME, ".claude");

// argv[2] is the triggering session's cwd. It is frequently an EPHEMERAL
// dev-runner worktree (/root/projects/.hq-dev-worktrees/sweep/<id>/...) that is
// torn down after the sweep, so by the time this detached worker runs the path
// may be gone — which would make spawnSync fail with ENOENT. Validate, and fall
// back to a stable root rather than trusting the caller.
const STABLE_ROOT = fs.existsSync("/root/projects/personal-hq")
  ? "/root/projects/personal-hq"
  : HOME;
const REQUESTED_ROOT = process.argv[2] || STABLE_ROOT;
const WORKSPACE_ROOT = fs.existsSync(REQUESTED_ROOT)
  ? REQUESTED_ROOT
  : STABLE_ROOT;

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

// Markers the worker parses out of stdout. See STDOUT-NOT-WRITE below.
const DRAFT_BEGIN = "<<<PROFILE_DRAFT_BEGIN>>>";
const DRAFT_END = "<<<PROFILE_DRAFT_END>>>";
const REPORT_BEGIN = "<<<REPORT_BEGIN>>>";
const REPORT_END = "<<<REPORT_END>>>";

// STDOUT-NOT-WRITE (fixed 2026-08-23, after ~8 weeks of silent no-ops):
// this worker used to ask the model to WRITE ~/.claude/profile.md.draft itself.
// That can never work. Two independent blocks, both verified by hand:
//   1. headless `claude -p` has no write permission by default — it replies
//      "I don't have permission to write to that file" and exits 0;
//   2. the CLI additionally flags anything under ~/.claude as sensitive, so
//      even --permission-mode acceptEdits refuses it.
// Exit 0 + empty stderr is why every run logged the benign-looking
// "no draft produced" and nobody noticed.
// So: the model EMITS the draft between markers on stdout and this worker
// persists it. Deterministic code owns the filesystem; the LLM owns the text.
// Reads still need --add-dir (the signal files live under ~/.claude, outside cwd).
const DRAFT_PROMPT = [
  "Run the consolidate-memory skill to synthesize the user profile from the latest",
  "correction signals (~/.claude/logs/profile-signals.jsonl), self-correction lesson atoms",
  "(~/.claude/logs/lesson-signals.jsonl), and recent run-log curation queues.",
  "",
  "CRITICAL UNATTENDED-DRAFT OVERRIDE — READ CAREFULLY:",
  "- Do NOT write, edit or create ANY file. You do not have permission to, and",
  "  attempting it is the bug this prompt exists to avoid. Emit text only.",
  "- Do NOT modify ~/.claude/profile.md.",
  "- Do NOT reset the consolidation counters — the human applies the draft",
  "  separately via /apply-consolidation.",
  "- Keep the <!-- digest:start -->/<!-- digest:end --> block tight. No secrets/keys.",
  "",
  "Emit EXACTLY this envelope, with no other commentary outside the markers:",
  DRAFT_BEGIN,
  "<the complete rewritten profile.md content>",
  DRAFT_END,
  REPORT_BEGIN,
  "<concise diff summary: sections changed, facts added, facts retired, confidence>",
  REPORT_END,
  "",
  "If you cannot produce a profile (e.g. no usable signals), emit the envelope",
  "with an EMPTY draft body — do not emit a partial or placeholder profile.",
].join("\n");

/** Pull one marker-delimited block out of stdout. Returns "" when absent. */
function extractBlock(text, begin, end) {
  const i = text.indexOf(begin);
  if (i === -1) return "";
  const j = text.indexOf(end, i + begin.length);
  if (j === -1) return "";
  return text.slice(i + begin.length, j).trim();
}

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
      log(`starting headless draft consolidation (cwd=${WORKSPACE_ROOT})`);
      // --add-dir: the signal files live under ~/.claude, outside cwd, and a
      // sandboxed session refuses to read them without it. Verified by hand.
      // stdout is CAPTURED (not ignored) — it carries the draft envelope.
      const res = childProcess.spawnSync(
        "nice",
        [
          "-n",
          "19",
          "ionice",
          "-c",
          "3",
          "claude",
          "-p",
          DRAFT_PROMPT,
          "--add-dir",
          CLAUDE_HOME,
        ],
        {
          cwd: WORKSPACE_ROOT,
          env: { ...process.env, CLAUDE_AUTO_CONSOLIDATE: "1" },
          timeout: RUN_TIMEOUT_MS,
          maxBuffer: 32 * 1024 * 1024,
          encoding: "utf8",
          // Never "ignore" stderr on a spawn whose failure is the thing you
          // would need to debug — that is what hid this for 8 weeks.
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      if (res.error) {
        log(`claude run error: ${res.error.message}`);
        return;
      }
      const stderr = (res.stderr || "").trim();
      if (stderr) log(`claude stderr: ${stderr.slice(0, 800)}`);
      if (res.status !== 0) {
        log(`claude exited ${res.status} (signal ${res.signal || "none"})`);
        return;
      }
      const stdout = res.stdout || "";
      const draft = extractBlock(stdout, DRAFT_BEGIN, DRAFT_END);
      const reportBody = extractBlock(stdout, REPORT_BEGIN, REPORT_END);
      if (!draft) {
        // Distinguish the three failure shapes instead of one vague line.
        const why = !stdout.trim()
          ? "empty stdout"
          : stdout.includes(DRAFT_BEGIN)
            ? "envelope present but draft body empty"
            : `no envelope in stdout; first 300 chars: ${stdout.trim().slice(0, 300)}`;
        log(`no draft produced — ${why}`);
        return;
      }
      fs.writeFileSync(DRAFT_FILE, draft.endsWith("\n") ? draft : `${draft}\n`);
      fs.writeFileSync(
        report,
        `# Consolidation draft ${isoNow()}\n\n${reportBody || "(no report body emitted)"}\n`,
      );
      log(
        `headless draft consolidation finished — draft ${draft.length}B, report ${reportBody.length}B`,
      );
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
