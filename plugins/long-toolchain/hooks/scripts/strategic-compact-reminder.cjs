/**
 * PreToolUse hook (Edit|Write matcher): suggest a manual /compact when the
 * session's real context-window pressure crosses a threshold, so compaction
 * happens at a logical boundary you choose instead of an arbitrary auto-compact
 * mid-task.
 *
 * Mined & adapted from ECC (affaan-m/ecc) skills/strategic-compact. Kept the
 * valuable core — deriving true context size from the transcript's latest
 * `usage` record — and dropped the rest:
 *   - Single self-contained .cjs (ECC split it across lib/utils + lib/transcript-
 *     context); matches this toolchain's one-file-per-hook, self-resolving idiom.
 *   - Dropped ECC's secondary "tool-call count" signal — ECC itself calls it a
 *     weak proxy for window pressure, and this toolchain is nag-averse. Context
 *     size is the only signal; if the transcript is unreadable the hook stays
 *     silent rather than nudging blind.
 *   - Large-window (1M) default threshold raised from ECC's 250k to 700k: a 1M
 *     window exists precisely to AVOID early compaction, so nudging at 25% is
 *     premature. 700k (70%) leaves real headroom while still warning before the
 *     window is exhausted. All thresholds are env-overridable.
 *
 * Context size = input_tokens + cache_read_input_tokens +
 * cache_creation_input_tokens from the newest assistant `usage` block (these
 * partition the prompt, so the sum is the turn's true context size). The window
 * is detected from the model id ([1m] marker) or inferred (>200k observed → 1M),
 * and overridable via CLAUDE_CODE_AUTO_COMPACT_WINDOW / ECC_CONTEXT_WINDOW_TOKENS.
 *
 * Non-blocking, pure-JS, no LLM call. Fires once per "bucket" of context growth
 * per session (state in os.tmpdir()); fails open-quiet on any error (exit 0,
 * emit nothing) per the always-exit-0 hook contract.
 *
 * Env knobs:
 *   COMPACT_CONTEXT_THRESHOLD  tokens before first suggestion (0 disables).
 *                              default 160k on a 200k window, 700k on a 1M window.
 *   COMPACT_CONTEXT_INTERVAL   token growth before the suggestion repeats.
 *                              default 60k (200k window) / 100k (1M window).
 *   COMPACT_STATE_TTL_DAYS     days before stale per-session state is swept (default 14).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const STANDARD_WINDOW = 200000;
const LARGE_WINDOW = 1000000;
const DEFAULT_THRESHOLD_STANDARD = 160000;
const DEFAULT_THRESHOLD_LARGE = 700000; // deviation from ECC's 250k — see header
const DEFAULT_INTERVAL_STANDARD = 60000;
const DEFAULT_INTERVAL_LARGE = 100000;
const TAIL_BYTES = 256 * 1024;
const MAX_TOKEN_SETTING = 10000000;
const LARGE_WINDOW_MARKER = "[1m]";
const STATE_DIR = path.join(os.tmpdir(), "claude-strategic-compact");
const DEFAULT_TTL_DAYS = 14;

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

/** Read the trailing `tailBytes` of a file (latest transcript records live at the end). */
function readFileTail(filePath, tailBytes) {
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
  } catch {
    return null;
  }
  try {
    const size = fs.fstatSync(fd).size;
    const start = Math.max(0, size - tailBytes);
    const length = size - start;
    if (length <= 0) return { text: "", truncated: false };
    const buf = Buffer.alloc(length);
    const n = fs.readSync(fd, buf, 0, length, start);
    return { text: buf.toString("utf8", 0, n), truncated: start > 0 };
  } catch {
    return null;
  } finally {
    try {
      fs.closeSync(fd);
    } catch {
      /* ignore */
    }
  }
}

function usageTokens(record) {
  const u = record && record.message && record.message.usage;
  if (!u || typeof u !== "object") return 0;
  const t =
    (Number.isFinite(u.input_tokens) ? u.input_tokens : 0) +
    (Number.isFinite(u.cache_read_input_tokens)
      ? u.cache_read_input_tokens
      : 0) +
    (Number.isFinite(u.cache_creation_input_tokens)
      ? u.cache_creation_input_tokens
      : 0);
  return t > 0 ? t : 0;
}

/** Scan the transcript tail backwards for the newest record with a usage block. */
function latestContextTokens(transcriptPath) {
  if (typeof transcriptPath !== "string" || !transcriptPath) return null;
  const tail = readFileTail(transcriptPath, TAIL_BYTES);
  if (!tail) return null;
  const lines = tail.text.split("\n");
  const firstLine = tail.truncated ? 1 : 0; // first line of a truncated tail is partial JSON
  for (let i = lines.length - 1; i >= firstLine; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    const tokens = usageTokens(record);
    if (tokens > 0) {
      const model =
        record.message && typeof record.message.model === "string"
          ? record.message.model
          : "";
      return { tokens, model };
    }
  }
  return null;
}

function resolveWindow(tokens, model) {
  const envWindow = Number.parseInt(
    process.env.ECC_CONTEXT_WINDOW_TOKENS ||
      process.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW ||
      "",
    10,
  );
  if (Number.isInteger(envWindow) && envWindow > 0) return envWindow;
  if (typeof model === "string" && model.includes(LARGE_WINDOW_MARKER))
    return LARGE_WINDOW;
  if (Number.isFinite(tokens) && tokens > STANDARD_WINDOW) return LARGE_WINDOW;
  return STANDARD_WINDOW;
}

function resolveThreshold(windowTokens) {
  const raw = process.env.COMPACT_CONTEXT_THRESHOLD;
  if (raw !== undefined && raw !== null && raw !== "") {
    const parsed = Number.parseInt(raw, 10);
    if (parsed === 0) return 0; // disabled
    if (Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_TOKEN_SETTING)
      return parsed;
  }
  return windowTokens >= LARGE_WINDOW
    ? DEFAULT_THRESHOLD_LARGE
    : DEFAULT_THRESHOLD_STANDARD;
}

function resolveInterval(windowTokens) {
  const parsed = Number.parseInt(process.env.COMPACT_CONTEXT_INTERVAL, 10);
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_TOKEN_SETTING)
    return parsed;
  return windowTokens >= LARGE_WINDOW
    ? DEFAULT_INTERVAL_LARGE
    : DEFAULT_INTERVAL_STANDARD;
}

/** -1 below threshold; 0 at threshold; +1 per `interval` tokens of growth beyond it. */
function contextBucket(tokens, threshold, interval) {
  if (!Number.isFinite(tokens) || threshold <= 0 || tokens < threshold)
    return -1;
  return Math.floor((tokens - threshold) / interval);
}

function ttlDays() {
  const parsed = Number.parseInt(process.env.COMPACT_STATE_TTL_DAYS, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_DAYS;
}

function stateFileFor(sessionId) {
  return path.join(STATE_DIR, `${sessionId}.json`);
}

function readLastBucket(stateFile) {
  try {
    const b = JSON.parse(fs.readFileSync(stateFile, "utf8")).lastBucket;
    return Number.isInteger(b) && b >= 0 ? b : -1;
  } catch {
    return -1;
  }
}

function writeLastBucket(stateFile, bucket) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(
      stateFile,
      JSON.stringify({ lastBucket: bucket, at: Date.now() }),
    );
  } catch {
    /* fail open-quiet */
  }
}

/** Sweep stale per-session state; never throws. Preserves the active session's file. */
function sweepStale(currentFile) {
  let entries;
  try {
    entries = fs.readdirSync(STATE_DIR, { withFileTypes: true });
  } catch {
    return;
  }
  const cutoff = Date.now() - ttlDays() * 24 * 60 * 60 * 1000;
  const keep = path.basename(currentFile);
  for (const e of entries) {
    if (!e.isFile() || e.name === keep || !e.name.endsWith(".json")) continue;
    const full = path.join(STATE_DIR, e.name);
    try {
      if (fs.statSync(full).mtimeMs < cutoff) fs.rmSync(full, { force: true });
    } catch {
      /* ignore */
    }
  }
}

function windowLabel(w) {
  return w >= LARGE_WINDOW ? "1M" : `${Math.round(w / 1000)}k`;
}

function main() {
  let data = {};
  try {
    data = JSON.parse(readStdin() || "{}");
  } catch {
    return;
  }

  const transcriptPath =
    typeof data.transcript_path === "string" ? data.transcript_path : "";
  const sessionId =
    String(data.session_id || "default").replace(/[^a-zA-Z0-9_-]/g, "") ||
    "default";
  const stateFile = stateFileFor(sessionId);

  sweepStale(stateFile);

  const usage = latestContextTokens(transcriptPath);
  if (!usage) return; // no transcript / no usage record → stay silent

  const windowTokens = resolveWindow(usage.tokens, usage.model);
  const threshold = resolveThreshold(windowTokens);
  if (threshold <= 0) return; // disabled

  const interval = resolveInterval(windowTokens);
  const bucket = contextBucket(usage.tokens, threshold, interval);
  if (bucket < 0 || bucket <= readLastBucket(stateFile)) return; // below threshold or already fired

  writeLastBucket(stateFile, bucket);

  const approx = `${Math.round(usage.tokens / 1000)}k`;
  const percent = Math.round((usage.tokens / windowTokens) * 100);
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext:
          `Strategic compact: context is ~${approx} tokens (${percent}% of the ${windowLabel(windowTokens)} window). ` +
          "At the next logical boundary (after finishing the current step, not mid-edit) consider running /compact — " +
          "and checkpoint any undocumented progress to disk first, since compaction discards fine-grained detail. " +
          "Skip quietly if you're mid-task or the context is still fresh.",
      },
    }),
  );
}

main();
