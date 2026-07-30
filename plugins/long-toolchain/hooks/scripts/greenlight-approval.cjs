/**
 * UserPromptSubmit "safeword" hook for Claude Code.
 *
 * Automates the pre-tool-security manual-approval escape hatch. When your prompt
 * contains the greenlight safeword, this writes a short-lived
 * ~/.claude/hooks/destructive-approval.json so subsequent destructive commands
 * pass without hand-writing that file. When it contains the revoke word, the
 * approval file is deleted immediately. Both auto-expire via TTL regardless.
 *
 *   Safeword     (default SESAME)   -> open a greenlight window
 *   Revoke word  (default LOCKDOWN) -> close it now
 *
 * Config (env):
 *   CLAUDE_GREENLIGHT_WORD        safeword token           (default "SESAME")
 *   CLAUDE_GREENLIGHT_REVOKE_WORD revoke token             (default "LOCKDOWN")
 *   CLAUDE_GREENLIGHT_TTL_SEC     window length in seconds (default 300)
 *
 * Design notes:
 *   - Case-SENSITIVE, word-boundary match => near-zero accidental trigger.
 *   - Grants scope "destructive-command" ONLY, never "*", so a stray safeword
 *     can never unlock the "secret-access" hard block. Defense in depth.
 *   - Pure sync regex, sub-ms; no per-turn LLM latency.
 */
const fs = require("fs");
const path = require("path");

const HOME = process.env.USERPROFILE || process.env.HOME || "";
const HOOKS_ROOT = path.join(HOME, ".claude", "hooks");
const APPROVAL_FILE = path.join(HOOKS_ROOT, "destructive-approval.json");
const AUDIT_LOG_FILE = path.join(HOME, ".claude", "logs", "greenlight.log");

const SAFEWORD = process.env.CLAUDE_GREENLIGHT_WORD || "SESAME";
const REVOKE_WORD = process.env.CLAUDE_GREENLIGHT_REVOKE_WORD || "LOCKDOWN";
const TTL_SEC = Math.max(
  30,
  Number(process.env.CLAUDE_GREENLIGHT_TTL_SEC) || 300,
);
const GRANT_SCOPES = ["destructive-command"];

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

function safeWriteAudit(record) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG_FILE), { recursive: true });
    fs.appendFileSync(AUDIT_LOG_FILE, `${JSON.stringify(record)}\n`, "utf8");
  } catch {
    /* logging must never break the hook */
  }
}

// Standalone, case-sensitive token match (surrounding whitespace/punctuation OK).
function containsToken(text, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^A-Za-z0-9_])${escaped}(?:[^A-Za-z0-9_]|$)`).test(
    text,
  );
}

function emitContext(message) {
  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: message,
    },
  });
  process.stdout.write(payload, () => process.exit(0));
}

function humanTtl(sec) {
  return sec % 60 === 0 ? `${sec / 60}m` : `${sec}s`;
}

async function main() {
  const rawInput = await readStdin();
  let data;
  try {
    data = JSON.parse((rawInput || "").replace(/^﻿/, "") || "{}");
  } catch {
    process.exit(0);
  }

  const prompt = typeof data.prompt === "string" ? data.prompt : "";
  if (!prompt) process.exit(0);

  // Revoke takes precedence over grant if both somehow appear.
  if (containsToken(prompt, REVOKE_WORD)) {
    try {
      fs.rmSync(APPROVAL_FILE, { force: true });
    } catch {
      /* ignore */
    }
    safeWriteAudit({
      at: new Date().toISOString(),
      action: "revoke",
      session: data.session_id || "",
    });
    return emitContext(
      "🔒 greenlight revoked — destructive commands blocked again.",
    );
  }

  if (containsToken(prompt, SAFEWORD)) {
    const expiresAt = new Date(Date.now() + TTL_SEC * 1000).toISOString();
    const record = {
      expiresAt,
      scopes: GRANT_SCOPES,
      reason: `greenlight via safeword @ ${new Date().toISOString()}`,
    };
    try {
      fs.mkdirSync(HOOKS_ROOT, { recursive: true });
      fs.writeFileSync(
        APPROVAL_FILE,
        `${JSON.stringify(record, null, 2)}\n`,
        "utf8",
      );
    } catch {
      process.exit(0);
    }
    safeWriteAudit({
      at: new Date().toISOString(),
      action: "grant",
      ttlSec: TTL_SEC,
      scopes: GRANT_SCOPES,
      session: data.session_id || "",
    });
    return emitContext(
      `🟢 greenlight active ${humanTtl(TTL_SEC)} (scope: ${GRANT_SCOPES.join(", ")}). ` +
        `Destructive commands will pass until it expires; say ${REVOKE_WORD} to close early.`,
    );
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
