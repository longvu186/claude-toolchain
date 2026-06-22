#!/usr/bin/env node
/**
 * Mechanical skill/subagent linter for the Anthropic Agent Skills best practices.
 * Read-only. Flags what a deterministic check can catch; the /audit-skills skill does the
 * judgement calls (description quality, progressive-disclosure decisions) on top of this.
 *
 * Checks per SKILL.md:
 *  - line count (> 500 = over budget; move detail to references/)
 *  - has YAML frontmatter with name + description
 *  - description length (too short = weak triggering; too long = token cost)
 *  - name present (gerund-style is a judgement call, not flagged mechanically)
 *  - presence of a references/ dir when the body is long
 * Subagents (~/.claude/agents/*.md): flags missing `tools:` (inherits ALL = over-privilege).
 *
 * Usage: node check.cjs [skillsRoot] [agentsRoot]
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const HOME = process.env.USERPROFILE || process.env.HOME || os.homedir();
const SKILLS_ROOT = process.argv[2] || path.join(HOME, ".claude", "skills");
const AGENTS_ROOT = process.argv[3] || path.join(HOME, ".claude", "agents");
const MAX_LINES = 500;
const DESC_MIN = 40;
const DESC_MAX = 1200;

function readFrontmatter(text) {
  // Tolerate leading BOM and CRLF line endings (Windows files).
  const m = text.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return fm;
}

function listDirs(root) {
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

const findings = [];
function flag(scope, name, severity, msg) {
  findings.push({ scope, name, severity, msg });
}

// --- Skills ---
let skillCount = 0;
for (const dir of listDirs(SKILLS_ROOT)) {
  const file = path.join(SKILLS_ROOT, dir, "SKILL.md");
  if (!fs.existsSync(file)) continue;
  skillCount++;
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/).length;
  const fm = readFrontmatter(text);
  const hasRefs =
    fs.existsSync(path.join(SKILLS_ROOT, dir, "references")) ||
    fs.existsSync(path.join(SKILLS_ROOT, dir, "reference"));
  if (!fm) flag("skill", dir, "HIGH", "no YAML frontmatter");
  else {
    if (!fm.name) flag("skill", dir, "HIGH", "frontmatter missing name");
    if (!fm.description)
      flag(
        "skill",
        dir,
        "HIGH",
        "frontmatter missing description (won't trigger reliably)",
      );
    else {
      if (fm.description.length < DESC_MIN)
        flag(
          "skill",
          dir,
          "MED",
          `description very short (${fm.description.length} chars) — weak triggering`,
        );
      if (fm.description.length > DESC_MAX)
        flag(
          "skill",
          dir,
          "LOW",
          `description long (${fm.description.length} chars) — preloaded every session`,
        );
    }
  }
  if (lines > MAX_LINES)
    flag(
      "skill",
      dir,
      "MED",
      `SKILL.md ${lines} lines (>${MAX_LINES}) — move detail to references/${hasRefs ? "" : " (no references/ dir yet)"}`,
    );
}

// --- Subagents ---
let agentCount = 0;
try {
  for (const f of fs.readdirSync(AGENTS_ROOT)) {
    if (!f.endsWith(".md")) continue;
    agentCount++;
    const text = fs.readFileSync(path.join(AGENTS_ROOT, f), "utf8");
    const fm = readFrontmatter(text);
    const name = (fm && fm.name) || f.replace(/\.md$/, "");
    if (!fm || fm.tools === undefined)
      flag(
        "agent",
        name,
        "MED",
        "no `tools:` declared → inherits ALL tools (least-privilege risk)",
      );
    if (fm && !fm.description)
      flag("agent", name, "HIGH", "missing description");
  }
} catch {}

// --- Report ---
const order = { HIGH: 0, MED: 1, LOW: 2 };
findings.sort((a, b) => order[a.severity] - order[b.severity]);
const counts = findings.reduce(
  (a, f) => ((a[f.severity] = (a[f.severity] || 0) + 1), a),
  {},
);
console.log(`# Skill/Subagent Audit`);
console.log(`Scanned ${skillCount} skills, ${agentCount} subagents.`);
console.log(
  `Findings: ${findings.length} (HIGH ${counts.HIGH || 0}, MED ${counts.MED || 0}, LOW ${counts.LOW || 0})\n`,
);
for (const f of findings)
  console.log(`- [${f.severity}] ${f.scope}/${f.name}: ${f.msg}`);
if (!findings.length) console.log("No mechanical issues found.");
