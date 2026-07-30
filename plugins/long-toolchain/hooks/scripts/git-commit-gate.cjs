/**
 * PreToolUse hook: injects a gitnexus_detect_changes reminder before `git commit`.
 * Outputs additionalContext so Claude sees the MUST rule before executing the commit.
 */
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

function isGitCommit(cmd) {
  if (!cmd || typeof cmd !== "string") return false;
  // Match `git commit` (optionally with leading env/flags) across &&/;/| chained segments.
  return /(^|[\n;&|]|\)\s*)\s*(?:[A-Za-z_][\w]*=[^\s]*\s+)*git\s+(?:-[^\s]+\s+|--[^\s]+\s+)*commit\b/.test(
    cmd,
  );
}

async function main() {
  const raw = await readStdin(); // drain stdin before writing stdout
  let cmd = "";
  try {
    cmd = (JSON.parse(raw || "{}").tool_input || {}).command || "";
  } catch {}
  if (!isGitCommit(cmd)) {
    process.stdout.write("{}", () => process.exit(0));
    return;
  }
  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext:
        "CLAUDE.md MUST rule: run gitnexus_detect_changes() before this git commit " +
        "to verify only expected symbols and execution flows changed.",
    },
  });
  process.stdout.write(payload, () => process.exit(0));
}

main().catch(() => process.exit(0));
