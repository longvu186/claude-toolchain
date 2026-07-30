/**
 * PreCompact hook: nudge Claude to checkpoint durable state to disk BEFORE
 * compaction discards fine-grained context.
 *
 * The Stop-hook session-closure checker (see settings.json) only catches
 * undocumented work once a turn ends — on a long run, compaction can fire
 * mid-session and summarize away decisions/state before that gate ever runs.
 * This hook fires right before both manual (/compact) and auto compaction,
 * giving Claude one more turn to write a brief checkpoint (run-log entry,
 * project-profile digest update, memory) while the detail is still live in
 * context. Deliberately unconditional + non-blocking: cheap pure-JS, no LLM
 * call, and the instruction tells Claude to skip quietly if there's nothing
 * new — false positives cost nothing, but a missed checkpoint loses real work.
 */
function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

const fs = require("fs");

// Consumed but not required — this hook fires unconditionally regardless of
// trigger ("manual" vs "auto") or session_id.
readStdin();

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreCompact",
      additionalContext:
        "Compaction is about to run and may discard fine-grained detail from this session. " +
        "Before continuing: if there is undocumented progress worth keeping (code changes, " +
        "migrations applied, key decisions, pending/half-done state), write a brief checkpoint " +
        "now — append to the active run-log in docs/ai/run-logs/ (or this project's equivalent) " +
        "and update the always-loaded project-profile digest if state changed. This keeps the " +
        "next turn resumable from disk instead of a lossy summary. Skip quietly if nothing new " +
        "since the last checkpoint.",
    },
  }),
);
