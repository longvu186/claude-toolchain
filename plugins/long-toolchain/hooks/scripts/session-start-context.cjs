/**
 * SessionStart hook for Claude Code.
 *
 * Injects, via additionalContext:
 *   1) a common-feature quality reminder, and
 *   2) a concise summary of the latest run logs (if any) for session continuity.
 *
 * Ported from the Copilot session-start-version-check hook; the toolchain
 * version-drift check is intentionally dropped (Copilot-specific). Reads run
 * logs from the nearest ancestor of cwd containing docs/ai/run-logs, else from
 * ~/.claude/logs/run-logs (matching run-event-logger.cjs).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const HOME = process.env.USERPROFILE || process.env.HOME || os.homedir();
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

// Pull the compact, behavior-shaping user model from ~/.claude/profile.md. Only the delimited
// digest block is injected each session (token-light); the full profile is read on demand.
function buildProfileDigest() {
  const content = safeReadFile(path.join(HOME, ".claude", "profile.md"));
  if (!content) return "";
  const match = content.match(
    /<!--\s*digest:start\s*-->([\s\S]*?)<!--\s*digest:end\s*-->/i,
  );
  if (!match) return "";
  const body = match[1].replace(/^\s*##.*$/m, "").trim();
  return body
    ? `User profile digest (full model in ~/.claude/profile.md — read it when personalizing approach):\n${body}`
    : "";
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

// Inject the project's quick-understanding digest (memories/repo/project-profile.md). Only the
// delimited block loads each session; the full doc loads on demand. The digest is the project's
// ALWAYS-FED working context and must be self-sufficient across six dimensions (what/stack, feature→path
// map, key symbols, lexicon/glossary, pending/half-done, hard rules & destructive invariants) so agents
// never have to search for load-bearing facts — see the `consolidate-project` skill's "Digest standard".
function buildProjectDigest(workspaceRoot) {
  if (!workspaceRoot) return "";
  const content = safeReadFile(
    path.join(workspaceRoot, "memories", "repo", "project-profile.md"),
  );
  if (!content) return "";
  const match = content.match(
    /<!--\s*digest:start\s*-->([\s\S]*?)<!--\s*digest:end\s*-->/i,
  );
  if (!match) return "";
  const body = match[1].replace(/^\s*##.*$/m, "").trim();
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

// Notify: the event-driven auto-consolidate worker drafts a profile rewrite when the backlog crosses
// threshold, but never applies it (always-loaded surfaces are human-ratified). Surface the pending draft.
function buildConsolidationDraftReady() {
  const marker = safeReadJson(
    path.join(HOME, ".claude", "logs", "_consolidation-draft-ready.json"),
  );
  if (!marker) return "";
  const when = marker.createdAt
    ? marker.createdAt.slice(0, 16).replace("T", " ")
    : "recently";
  return [
    `Consolidation DRAFT ready for review (auto-generated ${when}):`,
    `- A proposed ~/.claude/profile.md rewrite is at ~/.claude/profile.md.draft; summary: ${marker.reportPath || "(see ~/.claude/learning/queue/)"}.`,
    "- Review & apply with `/apply-consolidation`, or discard the draft. profile.md was NOT changed.",
  ].join("\n");
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
  const projectDigest = buildProjectDigest(workspaceRoot);
  const consolidationDue = buildConsolidationDue(workspaceRoot);
  const consolidationDraft = buildConsolidationDraftReady();

  const additionalContext = [
    profileDigest,
    projectDigest,
    consolidationDraft,
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
