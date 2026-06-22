/**
 * SessionStart hook for Claude Code.
 *
 * Injects, via additionalContext:
 *   1) the user-model profile digest,
 *   2) the global user-guidance digest (policy that does NOT auto-load in cloud),
 *   3) the project quick-understanding digest,
 *   4) consolidation-due reminders,
 *   5) a common-feature quality reminder, and
 *   6) a concise summary of the latest run logs (if any) for session continuity.
 *
 * Cloud-portable: when bundled in a plugin, profile.md and global-guidance.md are
 * read from ${CLAUDE_PLUGIN_ROOT} (managed cloud has no ~/.claude). Locally it falls
 * back to ~/.claude so the same script works in both places.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const HOME = process.env.USERPROFILE || process.env.HOME || os.homedir();
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || "";
const MAX_SUMMARY_LENGTH = 180;
const RUN_LOG_COUNT = 3;

const FEATURE_QUALITY_REMINDER = [
  "Common feature baseline:",
  "- Research common features before coding and prefer existing or mature libraries for commodity surfaces.",
  "- Preserve local design tokens and styling docs over Mobbin by default; use Mobbin primarily for layout and feature mapping unless a style clone is requested.",
  "- For admin/data UI, default to viewport-bound sidebars, internal table scroll with sticky headers, header CTA -> dialog/sheet flows, and formatted currency inputs.",
  "- Design-system docs must include component usage rules and interaction states, not just token lists.",
].join("\n");

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

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

// Read the delimited digest block (token-light) from a profile/guidance doc.
function extractDigest(content) {
  if (!content) return "";
  const match = content.match(
    /<!--\s*digest:start\s*-->([\s\S]*?)<!--\s*digest:end\s*-->/i,
  );
  if (!match) return "";
  return match[1].replace(/^\s*##.*$/m, "").trim();
}

// Prefer the plugin-bundled copy (works in cloud); fall back to ~/.claude (local).
function resolveBundled(pluginRelPath, homeRelSegments) {
  if (PLUGIN_ROOT) {
    const p = path.join(PLUGIN_ROOT, pluginRelPath);
    if (fs.existsSync(p)) return p;
  }
  return path.join(HOME, ".claude", ...homeRelSegments);
}

// The compact, behavior-shaping user model. Only the digest block is injected each session.
function buildProfileDigest() {
  const body = extractDigest(
    safeReadFile(resolveBundled("profile.md", ["profile.md"])),
  );
  return body
    ? `User profile digest (read the full profile when personalizing approach, scoping, or judgment calls):\n${body}`
    : "";
}

// Global user-level guidance (i18n, stack, agent routing, policy). This auto-loads locally via
// ~/.claude/CLAUDE.md but NOT in managed cloud, so inject its digest from the bundled copy.
function buildGlobalGuidanceDigest() {
  const body = extractDigest(
    safeReadFile(resolveBundled("global-guidance.md", ["CLAUDE.md"])),
  );
  return body ? `Global user guidance (always apply):\n${body}` : "";
}

// Walk up from cwd to the workspace root (nearest ancestor with memories/repo or docs/ai).
function resolveWorkspaceRoot(startPath) {
  let current = path.resolve(startPath || process.cwd());
  while (true) {
    if (
      fs.existsSync(path.join(current, "memories", "repo")) ||
      fs.existsSync(path.join(current, "docs", "ai"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

// Inject the project's quick-understanding digest (memories/repo/project-profile.md).
function buildProjectDigest(workspaceRoot) {
  if (!workspaceRoot) return "";
  const body = extractDigest(
    safeReadFile(
      path.join(workspaceRoot, "memories", "repo", "project-profile.md"),
    ),
  );
  return body
    ? `Project digest (full quick-understanding in memories/repo/project-profile.md):\n${body}`
    : "";
}

// Phase 1.3 auto-trigger surfacing. Compare consolidation counters to thresholds and remind (no LLM).
const CONSOLIDATION_THRESHOLDS = { projectRuns: 8, corrections: 5 };
function buildConsolidationDue(workspaceRoot) {
  const reminders = [];
  const userState = safeReadJson(
    path.join(HOME, ".claude", "logs", "_consolidation-state.json"),
  );
  if (
    userState &&
    (userState.correctionsSinceConsolidation || 0) >=
      CONSOLIDATION_THRESHOLDS.corrections
  ) {
    reminders.push(
      `- User profile: ${userState.correctionsSinceConsolidation} correction signals since last consolidation — run \`/consolidate-memory\` (then it resets ~/.claude/logs/_consolidation-state.json).`,
    );
  }
  if (workspaceRoot) {
    const projState = safeReadJson(
      path.join(
        workspaceRoot,
        "docs",
        "ai",
        "run-logs",
        "_consolidation-state.json",
      ),
    );
    if (
      projState &&
      ((projState.runsSinceConsolidation || 0) >=
        CONSOLIDATION_THRESHOLDS.projectRuns ||
        (projState.correctionsSinceConsolidation || 0) >=
          CONSOLIDATION_THRESHOLDS.corrections)
    ) {
      reminders.push(
        `- Project understanding: ${projState.runsSinceConsolidation} runs / ${projState.correctionsSinceConsolidation} corrections since last consolidation — run \`/consolidate-project\`.`,
      );
    }
  }
  return reminders.length
    ? `Consolidation due (the learning loop wants a synthesis pass):\n${reminders.join("\n")}`
    : "";
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function truncate(text, max) {
  if (!text || text.length <= max) return text || "";
  return `${text.slice(0, max - 3).trim()}...`;
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function resolveRunLogDir(startPath) {
  let current = path.resolve(startPath || process.cwd());
  while (true) {
    const candidate = path.join(current, "docs", "ai", "run-logs");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return path.join(HOME, ".claude", "logs", "run-logs");
}

function extractRunLogSummary(content) {
  if (!content) return { title: null, summaryBits: [] };
  const lines = content.split(/\r?\n/);
  const titleLine = lines.find((l) => l.trim().startsWith("# "));
  const title = titleLine ? normalize(titleLine.replace(/^#\s+/, "")) : null;
  const start = lines.findIndex((l) => /^##\s+Summary\s*$/i.test(l.trim()));
  const summaryBits = [];
  if (start >= 0) {
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("## ")) break;
      if (line.startsWith("- "))
        summaryBits.push(normalize(line.replace(/^-\s+/, "")));
      if (summaryBits.length >= 4) break;
    }
  }
  return { title, summaryBits };
}

function buildRunLogContext(runLogDir) {
  let entries;
  try {
    entries = fs
      .readdirSync(runLogDir)
      .filter((name) => name.endsWith(".md"))
      .map((name) => {
        const full = path.join(runLogDir, name);
        let mtime = 0;
        try {
          mtime = fs.statSync(full).mtimeMs;
        } catch {}
        return { full, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, RUN_LOG_COUNT);
  } catch {
    return "";
  }
  if (!entries.length) return "";

  const blocks = [];
  for (const entry of entries) {
    const { title, summaryBits } = extractRunLogSummary(
      safeReadFile(entry.full),
    );
    if (!title) continue;
    const bits = summaryBits
      .slice(0, 2)
      .map((b) => truncate(b, MAX_SUMMARY_LENGTH));
    blocks.push(`- ${title}${bits.length ? ` — ${bits.join("; ")}` : ""}`);
  }
  if (!blocks.length) return "";
  return ["Recent run-log context (latest sessions):", ...blocks].join("\n");
}

async function main() {
  const rawInput = await readStdin();
  let data = {};
  try {
    data = JSON.parse((rawInput || "").replace(/^﻿/, "") || "{}");
  } catch {}

  const cwd = data.cwd || process.cwd();
  const runLogDir = resolveRunLogDir(cwd);
  const workspaceRoot = resolveWorkspaceRoot(cwd);
  const runLogContext = buildRunLogContext(runLogDir);
  const profileDigest = buildProfileDigest();
  const guidanceDigest = buildGlobalGuidanceDigest();
  const projectDigest = buildProjectDigest(workspaceRoot);
  const consolidationDue = buildConsolidationDue(workspaceRoot);

  const additionalContext = [
    profileDigest,
    guidanceDigest,
    projectDigest,
    consolidationDue,
    FEATURE_QUALITY_REMINDER,
    runLogContext,
  ]
    .filter(Boolean)
    .join("\n\n");

  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext,
    },
  });
  // Flush before exiting: process.exit() can truncate a buffered stdout pipe write.
  process.stdout.write(payload, () => process.exit(0));
}

main().catch(() => process.exit(0));
