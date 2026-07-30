/**
 * PostToolUse hook (Bash + TodoWrite matchers): nudge Claude to checkpoint
 * documentation at natural mid-run milestones, not just at session end or
 * right before compaction (see precompact-checkpoint-reminder.cjs).
 *
 * Rationale: a long session can run for a long time without ever hitting
 * auto-compact, so PreCompact alone doesn't guarantee incremental
 * documentation. This hook catches two tool-agnostic signals that a
 * significant, worth-recording step just happened:
 *   - a Bash command that looks like a deploy/migration/push action
 *   - a TodoWrite call where a todo whose text mentions significant work
 *     (migration/deploy/schema/security/production/etc.) just flipped to
 *     "completed" — this is tool-agnostic, so it also catches milestones
 *     driven by MCP tools (e.g. apply_migration) without enumerating every
 *     possible tool name across every project's MCP servers.
 *
 * Debounced per-session (default 5 min) so it doesn't nag on every matching
 * call in a burst (e.g. several migration-related Bash commands in a row).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const DEBOUNCE_MS = 5 * 60 * 1000;
const STATE_DIR = path.join(os.tmpdir(), "claude-milestone-checkpoint");

const BASH_MILESTONE_RE =
  /\b(supabase\s+db\s+push|wrangler\s+(deploy|pages\s+deploy)|git\s+push\b|npm\s+run\s+deploy|docker\s+push|terraform\s+apply|kubectl\s+apply)\b/i;
const TODO_MILESTONE_RE =
  /\b(migrat|deploy|schema|security|production|prod\b|rls|rpc|breaking\s*change|incident|rollback)/i;

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function emit(reason) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext:
          `Milestone checkpoint: ${reason}. Before moving on, write a brief note now ` +
          "(active run-log in docs/ai/run-logs/, or this project's equivalent, and the " +
          "always-loaded project-profile digest if state changed) — don't wait until the " +
          "session ends or a compaction reminder to capture this. Skip quietly if it's " +
          "already documented.",
      },
    }),
  );
}

function debounceOk(sessionId) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const stateFile = path.join(STATE_DIR, `${sessionId || "unknown"}.json`);
    const now = Date.now();
    let last = 0;
    try {
      last = JSON.parse(fs.readFileSync(stateFile, "utf8")).lastNudgeAt || 0;
    } catch {
      /* no prior state */
    }
    if (now - last < DEBOUNCE_MS) return false;
    fs.writeFileSync(stateFile, JSON.stringify({ lastNudgeAt: now }));
    return true;
  } catch {
    return true; // fail open — better to nudge than silently never nudge
  }
}

function main() {
  let data = {};
  try {
    data = JSON.parse(readStdin() || "{}");
  } catch {
    return;
  }

  const toolName = data.tool_name || "";
  const toolInput = data.tool_input || {};
  let reason = null;

  if (toolName === "Bash" && BASH_MILESTONE_RE.test(toolInput.command || "")) {
    reason = "a deploy/migration/push-style command just ran";
  } else if (toolName === "TodoWrite" && Array.isArray(toolInput.todos)) {
    const hit = toolInput.todos.find(
      (t) =>
        t &&
        t.status === "completed" &&
        TODO_MILESTONE_RE.test(t.content || ""),
    );
    if (hit) {
      reason = `a significant todo was just completed ("${String(hit.content).slice(0, 80)}")`;
    }
  }

  if (reason && debounceOk(data.session_id)) {
    emit(reason);
  }
}

main();
