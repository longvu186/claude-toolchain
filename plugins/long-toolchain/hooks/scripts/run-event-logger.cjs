/**
 * Deterministic run logger for Claude Code.
 *
 * Captures observable prompt/tool/result events during a run, appends them to a
 * raw JSONL stream, and materializes one Markdown run log per user prompt plus a
 * machine-readable curation queue. Ported from the Copilot run-event-logger and
 * adapted to Claude's hook model:
 *   - event name comes from argv[2]
 *   - input is JSON on stdin ({ session_id, cwd, tool_name, tool_input, tool_response, prompt })
 *   - Claude events used: UserPromptSubmit, PreToolUse, PostToolUse, Notification,
 *     SubagentStop, Stop, SessionEnd
 *
 * Output location: nearest ancestor of cwd that already contains docs/ai/ ->
 * <root>/docs/ai/run-logs/. Otherwise falls back to ~/.claude/logs/run-logs/.
 */
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const EVENT_NAME = process.argv[2] || "";
const HOME = process.env.USERPROFILE || process.env.HOME || os.homedir();
const STATE_ROOT = path.join(os.tmpdir(), "claude-run-logger");
const MAX_TEXT = 1200;
const MAX_JSON = 2400;
const SENSITIVE_KEY_PATTERN =
  /token|secret|password|authorization|api[-_]?key|cookie/i;
const PROMPT_PREFERENCE_PATTERN =
  /\b(prefer|avoid|always|never|do not|don't|must|should not)\b/i;
const PROMPT_ASSUMPTION_PATTERN =
  /\b(assume|assuming|suspect|likely|probably|maybe|hypothesis|guess)\b/i;
// Correction signals: moments the user overrode/redirected the agent. Highest-value source for the
// cross-project user profile (synthesized by the /consolidate-memory skill). Conservative on purpose.
const PROMPT_CORRECTION_PATTERN =
  /(^|\b)(no,|nope,?|actually,?)|\b(that'?s (not|wrong|incorrect)|that is (not|wrong|incorrect)|not what i|i (said|told you|asked|meant)|you (missed|forgot|misunderstood|didn'?t)|instead of|use .* instead|revert|undo that|stop doing|why did you|don'?t do that)\b/i;
const PROFILE_SIGNAL_FILE = path.join(
  HOME,
  ".claude",
  "logs",
  "profile-signals.jsonl",
);
// Self-correction lesson atoms (tried->failed->worked) mirrored cross-project for /consolidate-memory,
// /learn-from-failures, and the knowledge-cache skill (which promotes command-fixes into commands.md).
const LESSON_SIGNAL_FILE = path.join(
  HOME,
  ".claude",
  "logs",
  "lesson-signals.jsonl",
);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function truncate(value, limit = MAX_TEXT) {
  if (!value) return "";
  const normalized = String(value).replace(/\r\n/g, "\n").trim();
  return normalized.length <= limit
    ? normalized
    : `${normalized.slice(0, Math.max(0, limit - 3))}...`;
}

function safeReadJson(filePath, fallback) {
  try {
    return fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf8"))
      : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

function appendLine(filePath, line) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${line}\n`, "utf8");
}

function readStdin() {
  return new Promise((resolve) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("end", () => resolve(input));
    process.stdin.resume();
  });
}

function isoNow() {
  return new Date().toISOString();
}
function hashText(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex");
}

function formatDateParts(isoText) {
  const date = new Date(isoText);
  const y = String(date.getFullYear());
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return { date: `${y}-${mo}-${d}`, stamp: `${y}-${mo}-${d}-${h}${mi}` };
}

function slugify(text) {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/[`'"“”‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "session-run";
}

// Resolve the run-log directory: prefer an ancestor with an existing docs/ai/,
// otherwise fall back to ~/.claude/logs/run-logs.
function resolveLogTarget(startPath) {
  let current = path.resolve(startPath || process.cwd());
  while (true) {
    if (fs.existsSync(path.join(current, "docs", "ai"))) {
      return {
        workspaceRoot: current,
        runLogDir: path.join(current, "docs", "ai", "run-logs"),
      };
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return {
    workspaceRoot: path.resolve(startPath || process.cwd()),
    runLogDir: path.join(HOME, ".claude", "logs", "run-logs"),
  };
}

function normalizePath(p, workspaceRoot) {
  if (!p) return "";
  const value = String(p);
  const abs = path.isAbsolute(value)
    ? value
    : path.resolve(workspaceRoot || process.cwd(), value);
  if (workspaceRoot && abs.startsWith(workspaceRoot)) {
    return path.relative(workspaceRoot, abs).replace(/\\/g, "/");
  }
  return abs.replace(/\\/g, "/");
}

function sanitizeValue(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (depth > 4) return "[depth-truncated]";
  if (typeof value === "string") return truncate(value, MAX_TEXT);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value))
    return value.slice(0, 12).map((e) => sanitizeValue(e, depth + 1));
  if (typeof value === "object") {
    const out = {};
    for (const [key, entry] of Object.entries(value).slice(0, 40)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? "[redacted]"
        : sanitizeValue(entry, depth + 1);
    }
    return out;
  }
  return truncate(String(value), MAX_TEXT);
}

function summarizeValue(value, limit = MAX_JSON) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return truncate(value, limit);
  try {
    return truncate(JSON.stringify(sanitizeValue(value), null, 2), limit);
  } catch {
    return truncate(String(value), limit);
  }
}

function extractSentences(text, predicate) {
  return String(text || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s && predicate(s));
}

function uniquePush(target, values) {
  const seen = new Set(target);
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    target.push(value);
    seen.add(value);
  }
}

// ---- Claude tool classification ----
const READ_TOOLS = new Set(["Read", "NotebookRead"]);
const WRITE_TOOLS = new Set(["Edit", "MultiEdit", "Write", "NotebookEdit"]);
const SEARCH_TOOLS = new Set(["Grep", "Glob"]);

function extractFilePaths(toolInput) {
  const files = [];
  if (!toolInput || typeof toolInput !== "object") return files;
  for (const key of ["file_path", "notebook_path", "path"]) {
    if (typeof toolInput[key] === "string" && toolInput[key].trim())
      files.push(toolInput[key]);
  }
  if (Array.isArray(toolInput.edits) && typeof toolInput.file_path === "string")
    files.push(toolInput.file_path);
  return [...new Set(files)];
}

function extractToolQuery(toolName, toolInput) {
  if (!toolInput || typeof toolInput !== "object") return "";
  if (toolName === "Grep" && typeof toolInput.pattern === "string")
    return truncate(toolInput.pattern, 240);
  if (toolName === "Glob" && typeof toolInput.pattern === "string")
    return truncate(toolInput.pattern, 240);
  if (toolName === "WebSearch" && typeof toolInput.query === "string")
    return truncate(toolInput.query, 240);
  if (toolName === "WebFetch" && typeof toolInput.url === "string")
    return truncate(toolInput.url, 240);
  if (typeof toolInput.query === "string" && toolInput.query.trim())
    return truncate(toolInput.query, 240);
  return "";
}

function classifyAction(toolName, toolInput) {
  if (READ_TOOLS.has(toolName)) {
    const f =
      (toolInput && (toolInput.file_path || toolInput.notebook_path)) || "";
    return f ? `Read ${f}` : "Read file";
  }
  if (WRITE_TOOLS.has(toolName)) {
    const f =
      (toolInput && (toolInput.file_path || toolInput.notebook_path)) || "";
    return f ? `${toolName} ${f}` : `${toolName} file`;
  }
  if (toolName === "Bash")
    return truncate(
      (toolInput && toolInput.command) || "Ran shell command",
      200,
    );
  if (SEARCH_TOOLS.has(toolName))
    return `${toolName}: ${extractToolQuery(toolName, toolInput)}`;
  if (toolName === "Task")
    return truncate(
      (toolInput && (toolInput.description || toolInput.prompt)) ||
        "Dispatched subagent",
      200,
    );
  const q = extractToolQuery(toolName, toolInput);
  return q ? `${toolName}: ${q}` : toolName || "Tool invocation";
}

function extractNotificationText(data) {
  for (const [key, value] of Object.entries(data || {})) {
    if (
      typeof value === "string" &&
      /(message|text|content|note|notification)/i.test(key)
    )
      return truncate(value);
  }
  return "";
}

function isFailureResponse(toolResponse) {
  if (!toolResponse) return false;
  if (typeof toolResponse === "string")
    return /^error\b|\berror:/i.test(toolResponse.trim().slice(0, 80));
  if (typeof toolResponse === "object")
    return Boolean(toolResponse.is_error || toolResponse.error);
  return false;
}

// ---- state / run model ----
function getStatePaths(workspaceRoot, runLogDir, sessionId) {
  const rootHash = hashText(workspaceRoot).slice(0, 12);
  return {
    stateFile: path.join(STATE_ROOT, rootHash, `${sessionId}.json`),
    runLogDir,
    rawLogFile: path.join(runLogDir, ".raw", `${sessionId}.jsonl`),
    curationQueueFile: path.join(runLogDir, "_memory-curation-queue.jsonl"),
    tokenLedgerFile: path.join(runLogDir, "_token-ledger.jsonl"),
    lessonAtomsFile: path.join(runLogDir, "_lesson-atoms.jsonl"),
  };
}

// Char/4 token proxy. Not exact — used for TREND tracking, not billing. Counts the observable run
// surface (prompt + tool inputs/responses + actions); real provider counts aren't exposed to hooks.
function estimateTokens(text) {
  return Math.ceil(String(text || "").length / 4);
}

function appendTokenLedger(tokenLedgerFile, state, run) {
  let toolIn = 0;
  let toolOut = 0;
  for (const t of run.tools) {
    toolIn += estimateTokens(t.inputSummary);
    toolOut += estimateTokens(t.responseSummary) + estimateTokens(t.error);
  }
  const promptTok = estimateTokens(run.prompt);
  const actionsTok = estimateTokens(run.actions.join("\n"));
  appendLine(
    tokenLedgerFile,
    JSON.stringify({
      timestamp: isoNow(),
      sessionId: state.sessionId,
      runIndex: run.index,
      outcome: summarizeOutcome(run),
      toolCalls: run.tools.length,
      filesChanged: run.filesChanged.length,
      est: {
        prompt: promptTok,
        toolInput: toolIn,
        toolOutput: toolOut,
        actions: actionsTok,
        observedTotal: promptTok + toolIn + toolOut + actionsTok,
      },
    }),
  );
}

function defaultState(sessionId, workspaceRoot) {
  return {
    sessionId,
    workspaceRoot,
    runCounter: 0,
    currentRunId: null,
    runs: [],
  };
}

function ensureState(sessionId, workspaceRoot, stateFile) {
  const state = safeReadJson(stateFile, defaultState(sessionId, workspaceRoot));
  state.sessionId = sessionId;
  state.workspaceRoot = workspaceRoot;
  state.runs = Array.isArray(state.runs) ? state.runs : [];
  if (typeof state.runCounter !== "number")
    state.runCounter = state.runs.length;
  return state;
}

function findRun(state, runId) {
  return state.runs.find((r) => r.id === runId) || null;
}

function createRun(state, prompt) {
  state.runCounter += 1;
  const run = {
    id: `${state.sessionId}-r${String(state.runCounter).padStart(2, "0")}`,
    index: state.runCounter,
    startedAt: isoNow(),
    endedAt: "",
    prompt: truncate(prompt || "", MAX_JSON),
    tools: [],
    searchQueries: [],
    filesRead: [],
    filesChanged: [],
    notifications: [],
    failures: [],
    subagents: [],
    preferences: [],
    assumptionCandidates: [],
    corrections: [],
    lessons: [],
    actions: [],
    outcome: "success",
    finalized: false,
  };
  uniquePush(
    run.preferences,
    extractSentences(prompt, (s) => PROMPT_PREFERENCE_PATTERN.test(s)),
  );
  uniquePush(
    run.assumptionCandidates,
    extractSentences(prompt, (s) => PROMPT_ASSUMPTION_PATTERN.test(s)),
  );
  uniquePush(
    run.corrections,
    extractSentences(prompt, (s) => PROMPT_CORRECTION_PATTERN.test(s)),
  );
  // Mirror correction signals into a global, cross-project queue the
  // /consolidate-memory skill reads. Best-effort: never block the run.
  for (const correction of run.corrections) {
    try {
      appendLine(
        PROFILE_SIGNAL_FILE,
        JSON.stringify({
          timestamp: isoNow(),
          kind: "correction",
          sessionId: state.sessionId,
          workspaceRoot: state.workspaceRoot,
          runIndex: run.index,
          text: truncate(correction, 400),
        }),
      );
    } catch {
      /* ignore */
    }
  }
  state.runs.push(run);
  state.currentRunId = run.id;
  return run;
}

function ensureCurrentRun(state) {
  return (
    (state.currentRunId && findRun(state, state.currentRunId)) ||
    createRun(state, "(implicit run)")
  );
}

function getOrCreateTool(run, data) {
  const id =
    data.tool_use_id || `${data.tool_name || "tool"}-${run.tools.length + 1}`;
  let tool = run.tools.find((t) => t.toolUseId === id);
  if (!tool) {
    tool = {
      toolUseId: id,
      toolName: data.tool_name || "",
      status: "started",
      inputSummary: summarizeValue(data.tool_input),
      actionLabel: classifyAction(data.tool_name || "", data.tool_input),
      responseSummary: "",
      error: "",
    };
    run.tools.push(tool);
  }
  return tool;
}

function recordAction(run, summary) {
  if (!summary || run.actions[run.actions.length - 1] === summary) return;
  run.actions.push(summary);
}

function recordRawEvent(rawLogFile, state, run, data) {
  const record = {
    timestamp: isoNow(),
    event: EVENT_NAME,
    sessionId: state.sessionId,
    runIndex: run ? run.index : null,
    toolName: data.tool_name || "",
    summary: truncate(
      EVENT_NAME === "UserPromptSubmit"
        ? data.prompt || ""
        : data.tool_name
          ? `${data.tool_name}: ${classifyAction(data.tool_name, data.tool_input)}`
          : extractNotificationText(data) || EVENT_NAME,
      400,
    ),
    payload: sanitizeValue(data),
  };
  appendLine(rawLogFile, JSON.stringify(record));
}

function applyEventToRun(run, data, workspaceRoot) {
  if (EVENT_NAME === "UserPromptSubmit") {
    recordAction(run, `Prompt received: ${truncate(data.prompt, 180)}`);
    return;
  }
  if (EVENT_NAME === "PreToolUse") {
    const tool = getOrCreateTool(run, data);
    tool.toolName = data.tool_name || tool.toolName;
    tool.inputSummary = summarizeValue(data.tool_input);
    recordAction(
      run,
      `Used ${tool.toolName}: ${classifyAction(tool.toolName, data.tool_input)}`,
    );
    const query = extractToolQuery(tool.toolName, data.tool_input);
    if (query) uniquePush(run.searchQueries, [query]);
    if (READ_TOOLS.has(tool.toolName))
      uniquePush(
        run.filesRead,
        extractFilePaths(data.tool_input).map((f) =>
          normalizePath(f, workspaceRoot),
        ),
      );
    if (WRITE_TOOLS.has(tool.toolName))
      uniquePush(
        run.filesChanged,
        extractFilePaths(data.tool_input).map((f) =>
          normalizePath(f, workspaceRoot),
        ),
      );
    return;
  }
  if (EVENT_NAME === "PostToolUse") {
    const tool = getOrCreateTool(run, data);
    if (isFailureResponse(data.tool_response)) {
      tool.status = "failure";
      tool.error = truncate(summarizeValue(data.tool_response), 600);
      run.outcome = "partial";
      run.failures.push({
        timestamp: isoNow(),
        toolName: tool.toolName,
        error: tool.error,
      });
      recordAction(run, `Failure in ${tool.toolName}: ${tool.error}`);
    } else {
      tool.status = "success";
      tool.responseSummary = summarizeValue(data.tool_response);
    }
    return;
  }
  if (EVENT_NAME === "Notification") {
    const message = extractNotificationText(data);
    if (message) {
      uniquePush(run.notifications, [message]);
      recordAction(run, `Notification: ${message}`);
    }
    return;
  }
  if (EVENT_NAME === "SubagentStop") {
    const detail = truncate(
      extractNotificationText(data) || summarizeValue(data),
      500,
    );
    run.subagents.push({ timestamp: isoNow(), detail });
    recordAction(run, `SubagentStop: ${detail}`);
  }
}

function summarizeOutcome(run) {
  if (run.failures.length > 0) return "partial";
  return "success";
}

function summarizeTopTools(run) {
  const counts = new Map();
  for (const tool of run.tools)
    counts.set(
      tool.toolName || "tool",
      (counts.get(tool.toolName || "tool") || 0) + 1,
    );
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([n, c]) => `${n} x${c}`);
}

// Self-correction lesson atoms: a tried->failed->worked pair within a run, matched per tool in
// chronological order. The highest-signal experience there is. For Bash this is usually a command-fix
// (e.g. wrong deploy command -> right one) -> promote into memories/repo/commands.md (knowledge-cache).
function buildLessons(run) {
  const lessons = [];
  const pendingByTool = new Map(); // toolName -> { tried, error }
  for (const t of run.tools) {
    const name = t.toolName || "tool";
    if (t.status === "failure") {
      pendingByTool.set(name, {
        tried: t.actionLabel || t.inputSummary || name,
        error: t.error,
      });
    } else if (t.status === "success" && pendingByTool.has(name)) {
      const failed = pendingByTool.get(name);
      const worked = t.actionLabel || t.inputSummary || name;
      if (worked && worked !== failed.tried) {
        lessons.push({
          tool: name,
          tried: truncate(failed.tried, 200),
          error: truncate(failed.error, 300),
          worked: truncate(worked, 200),
        });
      }
      pendingByTool.delete(name);
    }
  }
  return lessons;
}

function writeLessonAtoms(state, run, lessonAtomsFile) {
  if (!run.lessons || run.lessons.length === 0) return;
  for (const lesson of run.lessons) {
    const record = JSON.stringify({
      timestamp: isoNow(),
      kind: "self-correction",
      sessionId: state.sessionId,
      workspaceRoot: state.workspaceRoot,
      runIndex: run.index,
      ...lesson,
    });
    // Project-scoped atoms beside run logs; global mirror for cross-project synthesis.
    try {
      appendLine(lessonAtomsFile, record);
    } catch {
      /* ignore */
    }
    try {
      appendLine(LESSON_SIGNAL_FILE, record);
    } catch {
      /* ignore */
    }
  }
}

function buildTakeaway(run) {
  if (run.lessons && run.lessons.length > 0)
    return `Self-correction: ${run.lessons[0].tool} "${run.lessons[0].tried}" failed; "${run.lessons[0].worked}" worked. Promote durable commands/conventions into the knowledge-cache registries.`;
  if (run.failures.length > 0)
    return `${run.failures[0].toolName || "A tool"} failed during the run (${run.failures[0].error}). Preserve as a recurring troubleshooting signal if it recurs.`;
  if (run.preferences.length > 0)
    return "The run exposed explicit user operating preferences worth preserving for follow-up sessions.";
  if (run.searchQueries.length > 0)
    return "Search-driven run; the query trail reduces repeated context recovery in future sessions.";
  return "The run completed without strong failure signals; raw log and curation queue remain available.";
}

function buildRunLogContent(state, run) {
  const outcome = summarizeOutcome(run);
  const summaryLines = [
    `- Prompt: ${truncate(run.prompt || "(implicit run)", 240)}`,
    `- Outcome: ${outcome}`,
    `- Session: ${state.sessionId}`,
    `- Run index: ${run.index}`,
    `- Tool calls: ${run.tools.length}`,
    `- Search queries: ${run.searchQueries.length}`,
    `- Failures: ${run.failures.length}`,
  ];
  const actionLines =
    run.actions.length > 0
      ? run.actions.slice(0, 20).map((a, i) => `${i + 1}. ${a}`)
      : ["1. No observable actions were captured for this run."];
  const toolLines =
    run.tools.length > 0
      ? run.tools.map((t) => {
          const parts = [`- ${t.toolName || "tool"} (${t.status})`];
          if (t.inputSummary)
            parts.push(`  - Input: ${truncate(t.inputSummary, 260)}`);
          if (t.responseSummary)
            parts.push(`  - Response: ${truncate(t.responseSummary, 260)}`);
          if (t.error) parts.push(`  - Error: ${truncate(t.error, 260)}`);
          return parts.join("\n");
        })
      : ["- No tool activity captured."];
  const filesReadLines =
    run.filesRead.length > 0 ? run.filesRead.map((f) => `- ${f}`) : ["- None"];
  const filesChangedLines =
    run.filesChanged.length > 0
      ? run.filesChanged.map((f) => `- ${f}`)
      : ["- None"];
  const issueLines = run.failures.map(
    (f) => `- ${f.toolName || "tool"} failed: ${f.error}`,
  );
  const topTools = summarizeTopTools(run);

  return [
    `<!-- last-verified: ${formatDateParts(run.startedAt).date} -->`,
    `# Session Run Log: ${truncate(run.prompt || `Run ${run.index}`, 80)}`,
    "",
    "## Summary",
    ...summaryLines,
    topTools.length
      ? `- Top tools: ${topTools.join(", ")}`
      : "- Top tools: none",
    "",
    "## Prompt",
    run.prompt || "(implicit run)",
    "",
    "## Actions Taken",
    ...actionLines,
    "",
    "## Tool Evidence",
    ...toolLines,
    "",
    "## Files Read",
    ...filesReadLines,
    "",
    "## Files Changed",
    ...filesChangedLines,
    "",
    "## Issues Encountered",
    ...(issueLines.length > 0 ? issueLines : ["- None captured."]),
    "",
    "## Self-Correction Lessons",
    ...(run.lessons && run.lessons.length > 0
      ? run.lessons.map(
          (l) =>
            `- ${l.tool}: tried \`${l.tried}\` (failed: ${l.error}) → \`${l.worked}\` worked`,
        )
      : ["- None captured."]),
    "",
    "## Memory Curation Candidates",
    "### Takeaway",
    `- ${buildTakeaway(run)}`,
    ...(run.preferences.length > 0
      ? [
          "### Preference Candidates",
          ...run.preferences.slice(0, 8).map((p) => `- ${p}`),
        ]
      : []),
    "",
  ].join("\n");
}

function writeRunLog(runLogDir, state, run) {
  ensureDir(runLogDir);
  const dateParts = formatDateParts(run.startedAt);
  const baseSlug = slugify(run.prompt || `run-${run.index}`).slice(0, 60);
  const baseName = `${dateParts.stamp}-${baseSlug}-r${String(run.index).padStart(2, "0")}`;
  let filePath = path.join(runLogDir, `${baseName}.md`);
  if (fs.existsSync(filePath))
    filePath = path.join(
      runLogDir,
      `${baseName}-${state.sessionId.slice(0, 8)}.md`,
    );
  fs.writeFileSync(filePath, buildRunLogContent(state, run), "utf8");
  return filePath;
}

// Consolidation counters (Phase 1.3 auto-trigger). Pure bookkeeping — no LLM. SessionStart compares
// these to thresholds and surfaces "consolidation due"; the /consolidate-* skills reset them.
function bumpConsolidationState(filePath, run) {
  const s = safeReadJson(filePath, {
    runsSinceConsolidation: 0,
    correctionsSinceConsolidation: 0,
    lastConsolidation: null,
  });
  s.runsSinceConsolidation = (s.runsSinceConsolidation || 0) + 1;
  s.correctionsSinceConsolidation =
    (s.correctionsSinceConsolidation || 0) +
    (run.corrections ? run.corrections.length : 0);
  s.lessonsSinceConsolidation =
    (s.lessonsSinceConsolidation || 0) + (run.lessons ? run.lessons.length : 0);
  s.updatedAt = isoNow();
  try {
    writeJson(filePath, s);
  } catch {
    /* best-effort */
  }
}

function bumpConsolidationCounters(runLogDir, run) {
  // Project scope lives beside the run logs; user scope is global under ~/.claude/logs.
  bumpConsolidationState(
    path.join(runLogDir, "_consolidation-state.json"),
    run,
  );
  bumpConsolidationState(
    path.join(HOME, ".claude", "logs", "_consolidation-state.json"),
    run,
  );
}

function appendCurationQueue(curationQueueFile, run, logRelativePath) {
  appendLine(
    curationQueueFile,
    JSON.stringify({
      timestamp: isoNow(),
      title: truncate(run.prompt || `Run ${run.index}`, 160),
      prompt: run.prompt,
      runIndex: run.index,
      outcome: summarizeOutcome(run),
      logPath: logRelativePath,
      preferences: run.preferences,
      assumptionCandidates: run.assumptionCandidates,
      corrections: run.corrections,
      lessons: run.lessons || [],
      searchQueries: run.searchQueries,
      failures: run.failures,
      filesChanged: run.filesChanged,
      filesRead: run.filesRead,
      takeaway: buildTakeaway(run),
    }),
  );
}

const HIGH_VALUE_FILE_PATTERN =
  /CLAUDE\.md|AGENTS\.md|MEMORY\.md|\.claude\/settings\.json|docs\/specs\//i;

function writeRefreshRequest(workspaceRoot, run) {
  if (
    run.filesChanged.length < 2 &&
    !run.filesChanged.some((f) => HIGH_VALUE_FILE_PATTERN.test(f))
  )
    return;
  try {
    const requestFile = path.join(
      workspaceRoot,
      "docs",
      "ai",
      ".analysis",
      "refresh-request.json",
    );
    writeJson(requestFile, {
      requestedAt: isoNow(),
      runId: run.id,
      runIndex: run.index,
      reason: "files-changed",
      prompt: truncate(run.prompt || "", 400),
      filesChanged: run.filesChanged,
    });
  } catch {
    /* ignore */
  }
}

// --- Context-freshness gate (Stop hook) --------------------------------------
// A recurring toolchain failure: sessions ship real code changes but never update the always-loaded
// context (project-profile.md digest / context.md / specs / changelog), so the next session's injected
// digest is stale and the agent re-derives via search. This gate blocks the FIRST Stop of a run that
// changed real code without touching any context surface, telling the agent exactly what to update. It
// is guarded (`run.contextFreshnessBlocked`) so a second Stop always passes — never a trap or loop, and
// the human/agent can always override by simply stopping again.

// A change to any of these counts as "context was refreshed" — the gate passes.
const CONTEXT_SURFACE_PATTERN =
  /(^|\/)(project-profile\.md|context\.md|MEMORY\.md|CHANGELOG(\.\w+)?|AGENTS\.md|CLAUDE\.md|GEMINI\.md)$|(^|\/)docs\/specs\/|(^|\/)docs\/ai\/|(^|\/)memories\/repo\//i;

// Real source files. Docs (.md), tests, and build artifacts are excluded so they don't trigger the gate.
const REAL_CODE_PATTERN =
  /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|py|go|rs|rb|java|kt|php|sql|css|scss|sass)$/i;
const CODE_EXCLUDE_PATTERN =
  /\.(test|spec)\.|(^|\/)(node_modules|\.next|\.open-next|dist|build|out|coverage)\//i;
// A single one of these ("huge update" signals) is enough to require a context refresh.
const HIGH_VALUE_CODE_PATTERN =
  /(^|\/)supabase\/migrations\/|webhook|lifecycle|daily-maintenance|migration|schema/i;

function contextFreshnessBlock(run) {
  if (!run || run.contextFreshnessBlocked) return null;
  const changed = run.filesChanged || [];
  if (!changed.length) return null;
  // If any context surface was updated this run, the agent already did the work — pass.
  if (changed.some((f) => CONTEXT_SURFACE_PATTERN.test(f))) return null;
  const codeFiles = changed.filter(
    (f) => REAL_CODE_PATTERN.test(f) && !CODE_EXCLUDE_PATTERN.test(f),
  );
  const highValue = codeFiles.filter((f) => HIGH_VALUE_CODE_PATTERN.test(f));
  // Trigger: >=2 code files, or any single high-value ("huge update") file. Trivial 1-file tweaks pass.
  if (codeFiles.length < 2 && highValue.length === 0) return null;
  const shown = codeFiles.slice(0, 8);
  const more =
    codeFiles.length > shown.length
      ? ` (+${codeFiles.length - shown.length} more)`
      : "";
  const bigNote = highValue.length
    ? ` This looks like a significant/structural change (${highValue[0]}), so a context update is especially important.`
    : "";
  return [
    `This session changed ${codeFiles.length} code file(s) but did not update any always-loaded context surface.${bigNote}`,
    "",
    "Before finishing, update the surfaces that load on EVERY future run so the next session doesn't have to re-derive by searching:",
    "- memories/repo/project-profile.md — the `<!-- digest:start -->`/`<!-- digest:end -->` block: new/changed features, file paths, key symbols, lexicon terms, and especially PENDING/half-done state and any destructive-action invariants (grace windows, what's irreversible).",
    "- docs/specs/active/<slice>/spec.md — if behavior, a state transition, or an invariant changed.",
    "- docs/ai/context.md and/or a Changelog line — for a notable delta.",
    "",
    `Changed code files: ${shown.join(", ")}${more}`,
    "",
    "If the context is genuinely already current or this change doesn't warrant a doc update, just stop again — this gate blocks only once per run and will not stop you a second time.",
  ].join("\n");
}
// -----------------------------------------------------------------------------

function finalizeRun(state, run, paths, reason) {
  if (!run || run.finalized) return;
  run.endedAt = isoNow();
  run.outcome = summarizeOutcome(run);
  run.lessons = buildLessons(run);
  writeLessonAtoms(state, run, paths.lessonAtomsFile);
  const logFilePath = writeRunLog(paths.runLogDir, state, run);
  const logRelativePath = path
    .relative(state.workspaceRoot, logFilePath)
    .replace(/\\/g, "/");
  run.finalized = true;
  run.finalizedReason = reason;
  appendCurationQueue(paths.curationQueueFile, run, logRelativePath);
  appendTokenLedger(paths.tokenLedgerFile, state, run);
  bumpConsolidationCounters(paths.runLogDir, run);
  writeRefreshRequest(state.workspaceRoot, run);
}

async function main() {
  if (!EVENT_NAME) process.exit(0);
  const rawInput = await readStdin();
  let data;
  try {
    data = JSON.parse((rawInput || "").replace(/^﻿/, "") || "{}");
  } catch {
    process.exit(0);
  }

  const { workspaceRoot, runLogDir } = resolveLogTarget(
    data.cwd || process.cwd(),
  );
  const sessionId = String(data.session_id || "unknown-session");
  const paths = getStatePaths(workspaceRoot, runLogDir, sessionId);
  const state = ensureState(sessionId, workspaceRoot, paths.stateFile);

  if (EVENT_NAME === "UserPromptSubmit") {
    const current = state.currentRunId
      ? findRun(state, state.currentRunId)
      : null;
    if (current && !current.finalized) {
      finalizeRun(state, current, paths, "next-user-prompt");
      state.currentRunId = null;
    }
    const run = createRun(state, data.prompt || "");
    recordRawEvent(paths.rawLogFile, state, run, data);
    applyEventToRun(run, data, workspaceRoot);
    writeJson(paths.stateFile, state);
    process.exit(0);
  }

  const current = state.currentRunId
    ? findRun(state, state.currentRunId)
    : null;
  const terminal = EVENT_NAME === "Stop" || EVENT_NAME === "SessionEnd";
  if (terminal && !current) {
    recordRawEvent(paths.rawLogFile, state, null, data);
    writeJson(paths.stateFile, state);
    if (EVENT_NAME === "SessionEnd") {
      try {
        fs.unlinkSync(paths.stateFile);
      } catch {}
    }
    process.exit(0);
  }

  const run = current || ensureCurrentRun(state);
  recordRawEvent(paths.rawLogFile, state, run, data);
  applyEventToRun(run, data, workspaceRoot);

  // Context-freshness gate: only on Stop (SessionEnd cannot be blocked). Block once, before finalizing,
  // so the run stays open for the doc-update work. Guarded against looping inside contextFreshnessBlock.
  if (EVENT_NAME === "Stop") {
    const reason = contextFreshnessBlock(run);
    if (reason) {
      run.contextFreshnessBlocked = true;
      writeJson(paths.stateFile, state);
      process.stdout.write(JSON.stringify({ decision: "block", reason }), () =>
        process.exit(0),
      );
      return;
    }
  }

  if (terminal) {
    finalizeRun(state, run, paths, EVENT_NAME);
    state.currentRunId = null;
  }

  writeJson(paths.stateFile, state);
  if (EVENT_NAME === "SessionEnd") {
    try {
      fs.unlinkSync(paths.stateFile);
    } catch {}
  }
  process.exit(0);
}

main().catch(() => process.exit(0));
