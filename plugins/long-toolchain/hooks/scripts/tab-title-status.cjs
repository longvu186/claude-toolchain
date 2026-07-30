#!/usr/bin/env node
// tab-title-status.cjs — surface Claude Code session status in the code-server browser tab.
//
// Writes a status emoji into <workspaceRoot>/.vscode/settings.json "window.title".
// VSCode/code-server applies window.title changes live, so the browser tab updates
// immediately. Multiple parallel sessions in one workspace are aggregated in the
// sidecar (keyed by session_id) with priority: 🔴 any needs input > 🟠 any working
// > ✅ all done. The original title is restored only when the last session ends.
//
// Event is passed via process.argv[2] (same pattern as run-event-logger.cjs);
// stdin carries the hook JSON payload ({ cwd, session_id, hook_event_name, ... }).

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const STATUS_BY_EVENT = {
  UserPromptSubmit: "working",
  PostToolUse: "working",
  Notification: "attention",
  Stop: "done",
  SessionEnd: "ended",
};

const SIDECAR_NAME = ".claude-tab-title.json";
// Sessions killed without SessionEnd (e.g. browser tab closed) never clean up;
// drop their entries after this long without a fresh event.
const STALE_SESSION_MS = 2 * 60 * 60 * 1000;

function findWorkspaceRoot(startDir) {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 12; i++) {
    if (
      fs.existsSync(path.join(dir, ".vscode")) ||
      fs.existsSync(path.join(dir, ".git"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(startDir);
}

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

// Atomic-ish write so a concurrent hook never reads torn JSON.
function writeJsonAtomic(file, value) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(tmp, file);
}

// Keep git status clean for files we create: if settings.json is untracked,
// list it in .git/info/exclude so the status indicator never dirties the repo.
function excludeFromGit(root, relPaths) {
  const gitDir = path.join(root, ".git");
  try {
    if (!fs.statSync(gitDir).isDirectory()) return;
  } catch {
    return;
  }
  const excludeFile = path.join(gitDir, "info", "exclude");
  let existing = "";
  try {
    existing = fs.readFileSync(excludeFile, "utf8");
  } catch {
    /* no exclude file yet */
  }
  const missing = relPaths.filter((p) => {
    if (existing.split(/\r?\n/).includes(p)) return false;
    const tracked = spawnSync(
      "git",
      ["-C", root, "ls-files", "--error-unmatch", p],
      {
        stdio: "ignore",
        timeout: 3000,
      },
    );
    return tracked.status !== 0; // only exclude untracked files
  });
  if (missing.length === 0) return;
  try {
    fs.mkdirSync(path.dirname(excludeFile), { recursive: true });
    const sep = existing && !existing.endsWith("\n") ? "\n" : "";
    fs.appendFileSync(excludeFile, `${sep}${missing.join("\n")}\n`);
  } catch {
    /* best effort */
  }
}

// Prune stale sessions in place, then fold the rest into one tab status.
function aggregate(sessions) {
  const now = Date.now();
  let attention = 0;
  let working = 0;
  let total = 0;
  for (const [id, entry] of Object.entries(sessions)) {
    if (!entry || now - entry.ts > STALE_SESSION_MS) {
      delete sessions[id];
      continue;
    }
    total++;
    if (entry.status === "attention") attention++;
    else if (entry.status === "working") working++;
  }
  if (attention > 0) {
    const rest = working > 0 ? `, ${working} working` : "";
    return {
      emoji: "🔴",
      label: `${attention} need${attention === 1 ? "s" : ""} INPUT${rest}`,
    };
  }
  if (working > 0) {
    return {
      emoji: "🟠",
      label: working === 1 ? "Claude working" : `${working} working`,
    };
  }
  if (total > 0) return { emoji: "✅", label: "Claude done" };
  return null; // no live sessions — restore the original title
}

function main(payload) {
  const event = process.argv[2] || payload.hook_event_name;
  const status = STATUS_BY_EVENT[event];
  if (!status) return;

  const root = findWorkspaceRoot(payload.cwd || process.cwd());
  const vscodeDir = path.join(root, ".vscode");
  const settingsFile = path.join(vscodeDir, "settings.json");
  const sidecarFile = path.join(vscodeDir, SIDECAR_NAME);

  let settings = {};
  let settingsExisted = false;
  if (fs.existsSync(settingsFile)) {
    settingsExisted = true;
    settings = readJsonSafe(settingsFile);
    // JSONC (comments/trailing commas) would be destroyed by a rewrite — leave it alone.
    if (settings === undefined) return;
  }

  const sidecar = readJsonSafe(sidecarFile) || {};
  const sessions = sidecar.sessions || {};
  const sessionId = payload.session_id || "unknown";

  if (status === "ended") {
    delete sessions[sessionId];
  } else {
    sessions[sessionId] = { status, ts: Date.now() };
  }

  const agg = aggregate(sessions);

  if (agg === null) {
    // Last session gone: restore whatever was there before we started decorating.
    if (
      "lastWritten" in sidecar &&
      settings["window.title"] === sidecar.lastWritten
    ) {
      if (sidecar.original !== undefined && sidecar.original !== null) {
        settings["window.title"] = sidecar.original;
      } else {
        delete settings["window.title"];
      }
      writeJsonAtomic(settingsFile, settings);
    }
    try {
      fs.unlinkSync(sidecarFile);
    } catch {
      /* already gone */
    }
    return;
  }

  const title = `${agg.emoji} ${path.basename(root)} · ${agg.label}`;

  // First decoration: remember the user's own title (if any). If the user later
  // changes their title while we're decorating, adopt it as the new original.
  if (!("lastWritten" in sidecar)) {
    sidecar.original =
      settings["window.title"] !== undefined ? settings["window.title"] : null;
  } else if (
    settings["window.title"] !== undefined &&
    settings["window.title"] !== sidecar.lastWritten &&
    !/^[🟠🔴✅] /u.test(settings["window.title"])
  ) {
    sidecar.original = settings["window.title"];
  }

  fs.mkdirSync(vscodeDir, { recursive: true });
  if (settings["window.title"] !== title) {
    settings["window.title"] = title;
    writeJsonAtomic(settingsFile, settings);
  }
  sidecar.lastWritten = title;
  sidecar.sessions = sessions;
  writeJsonAtomic(sidecarFile, sidecar);

  const excludes = [`.vscode/${SIDECAR_NAME}`];
  if (!settingsExisted) excludes.push(".vscode/settings.json");
  excludeFromGit(root, excludes);
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let payload = {};
  try {
    payload = JSON.parse(input);
  } catch {
    /* run with defaults */
  }
  try {
    main(payload);
  } catch {
    /* never block the agent on a cosmetic hook */
  }
});
