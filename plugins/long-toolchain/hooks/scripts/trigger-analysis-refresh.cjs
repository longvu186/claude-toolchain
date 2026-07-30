/**
 * Stop hook: spawns analysis-refresh.cjs as a detached background process
 * when a refresh-request.json exists in the workspace's docs/ai/.analysis/.
 * Called via the Stop hook so it fires after every response turn that finalized a run.
 */
const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const HOME =
  process.env.USERPROFILE || process.env.HOME || require("os").homedir();
const REFRESH_SCRIPT = path.join(
  HOME,
  ".claude",
  "hooks",
  "scripts",
  "analysis-refresh.cjs",
);

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

function resolveWorkspaceRoot(cwd) {
  let current = path.resolve(cwd || process.cwd());
  while (true) {
    if (fs.existsSync(path.join(current, "docs", "ai"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

async function main() {
  const rawInput = await readStdin();
  let data = {};
  try {
    data = JSON.parse((rawInput || "").replace(/^﻿/, "") || "{}");
  } catch {
    process.exit(0);
  }

  const workspaceRoot = resolveWorkspaceRoot(data.cwd || process.cwd());
  if (!workspaceRoot) process.exit(0);

  const requestFile = path.join(
    workspaceRoot,
    "docs",
    "ai",
    ".analysis",
    "refresh-request.json",
  );
  if (!fs.existsSync(requestFile)) process.exit(0);

  const lockFile = path.join(
    workspaceRoot,
    "docs",
    "ai",
    ".analysis",
    "refresh.lock",
  );
  if (fs.existsSync(lockFile)) process.exit(0);

  const child = childProcess.spawn(
    process.execPath,
    [REFRESH_SCRIPT, workspaceRoot],
    {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    },
  );
  child.unref();

  process.exit(0);
}

main().catch(() => process.exit(0));
