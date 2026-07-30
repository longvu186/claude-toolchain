/**
 * PreToolUse security hook for Claude Code.
 *
 * Blocks destructive shell commands run through the Bash tool.
 * Ported from the Copilot pre-tool-security hook; adapted to Claude's hook I/O:
 *   - input: JSON on stdin ({ tool_name, tool_input, hook_event_name, session_id, cwd })
 *   - block: print a PreToolUse "deny" decision to stdout and exit 0
 *
 * An optional manual-approval escape hatch lets you authorize a blocked scope
 * temporarily: create ~/.claude/hooks/destructive-approval.json with an
 * unexpired JSON payload like
 *   {"expiresAt":"2026-06-05T20:00:00Z","scopes":["destructive-command"],"reason":"manual cleanup"}
 */
const fs = require("fs");
const path = require("path");

const HOME = process.env.USERPROFILE || process.env.HOME || "";
const HOOKS_ROOT = path.join(HOME, ".claude", "hooks");
const APPROVAL_FILE = path.join(HOOKS_ROOT, "destructive-approval.json");
const AUDIT_LOG_FILE = path.join(
  HOME,
  ".claude",
  "logs",
  "pre-tool-security.log",
);

const TERMINAL_VIOLATIONS = [
  {
    scope: "destructive-command",
    reason: "Recursive filesystem deletion (rm -rf) is blocked by default.",
    pattern: /\brm\s+-[^\r\n]*r[^\r\n]*f[^\r\n]*\s+/i,
  },
  {
    scope: "destructive-command",
    reason: "PowerShell recursive deletion is blocked by default.",
    pattern:
      /\bremove-item\b[^\r\n]*(?:-recurse[^\r\n]*-force|-force[^\r\n]*-recurse)/i,
  },
  {
    scope: "destructive-command",
    reason: "Windows recursive deletion (del /s /q) is blocked by default.",
    pattern: /\b(?:del|erase)\b[^\r\n]*\/s[^\r\n]*\/q/i,
  },
  {
    scope: "destructive-command",
    reason: "Windows directory tree removal (rd /s /q) is blocked by default.",
    pattern: /\b(?:rd|rmdir)\b[^\r\n]*\/s[^\r\n]*\/q/i,
  },
  {
    scope: "destructive-command",
    reason: "Git hard resets are blocked by default.",
    pattern: /\bgit\s+reset\s+--hard\b/i,
  },
  {
    scope: "destructive-command",
    reason:
      "Git clean is blocked by default because it can wipe untracked files.",
    pattern: /\bgit\s+clean\s+-[^\r\n]*f[^\r\n]*d/i,
  },
  {
    scope: "destructive-command",
    reason: "Force push without lease is blocked by default.",
    pattern: /\bgit\s+push\s+.+--force(?!-with-lease)\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Formatting a disk is blocked.",
    pattern: /\bformat\s+[a-z]:/i,
  },
  {
    scope: "destructive-command",
    reason: "Filesystem formatting (mkfs) is blocked.",
    pattern: /\bmkfs\./i,
  },
  {
    scope: "destructive-command",
    reason: "Terraform destroy is blocked by default.",
    pattern: /\bterraform\s+destroy\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Docker prune with all resources is blocked by default.",
    pattern: /\bdocker\s+(?:system|volume|builder)\s+prune\b[^\r\n]*\b-a\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Kubernetes namespace deletion is blocked by default.",
    pattern: /\bkubectl\s+delete\s+namespace\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Database drop operations are blocked by default.",
    pattern: /\bdrop\s+(?:table|database|schema|index|view)\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Table truncation is blocked by default.",
    pattern: /\btruncate\s+table\b/i,
  },
  {
    scope: "destructive-command",
    reason: "DELETE without a restrictive WHERE clause is blocked by default.",
    pattern: /\bdelete\s+from\s+\S+(?:\s*;|\s*$)/i,
  },
  {
    scope: "destructive-command",
    reason: "DELETE with WHERE 1=1 is blocked by default.",
    pattern: /\bdelete\s+from\s+\S+\s+where\s+1\s*=\s*1\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Supabase database reset is blocked by default.",
    pattern: /\bsupabase\s+db\s+reset\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Destructive SQL through CLI clients is blocked by default.",
    pattern:
      /\b(?:psql|sqlite3|mysql)\b[^\r\n]*(?:drop|truncate|delete\s+from)\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Wrangler D1 destructive SQL is blocked by default.",
    pattern:
      /\bwrangler\s+d1\s+execute\b[^\r\n]*(?:drop|truncate|delete\s+from)\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Curl-to-shell execution is blocked.",
    pattern: /\bcurl\b[^\r\n]*\|\s*(?:ba)?sh\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Wget-to-shell execution is blocked.",
    pattern: /\bwget\b[^\r\n]*\|\s*(?:ba)?sh\b/i,
  },
  {
    scope: "destructive-command",
    reason: "Bypassing verification hooks (--no-verify) is blocked by default.",
    pattern: /--no-verify\b/i,
  },
];

// --- Secret-access guard ---------------------------------------------------
// Prevents secret material from ever entering the chat transcript. Applies to
// Read/Grep (file targets) and Bash (reader verbs, env dumps). This is a HARD
// block: it is NOT consulted against the manual-approval file, so the greenlight
// window (which grants only "destructive-command") can never unlock it.
// To USE a secret value, run it through `with-secrets -- <cmd>`; to see the set
// of keys, run `list-secret-keys`.
const READER_VERB =
  /\b(?:cat|bat|tac|less|more|head|tail|nl|xxd|od|strings|hexdump|grep|egrep|fgrep|rg|ag|awk|sed)\b/i;

function isSecretFile(p) {
  if (typeof p !== "string" || !p) return false;
  const name = p.replace(/^.*[\/\\]/, ""); // basename
  // Credential-store directories: block everything inside (Infisical CLI auth
  // holds the vault passphrase, login token, and machine-identity client secret).
  if (/[\/\\]\.config[\/\\]infisical[\/\\]|[\/\\]\.infisical[\/\\]/i.test(p))
    return true;
  // Whitelist templates/examples — they carry no live values.
  if (/\.(?:example|sample|template|dist)$/i.test(name)) return false;
  return (
    /^\.env(?:\.[\w-]+)*$/i.test(name) || // .env, .env.local, .env.production.local
    /\.env$/i.test(name) || // foo.env, machine-identity.env (ends in .env)
    /^\.dev\.vars$/i.test(name) || // Cloudflare Workers local secrets
    /\.pem$/i.test(name) ||
    /^id_rsa\b/i.test(name) ||
    /^id_ed25519\b/i.test(name) ||
    /\.key$/i.test(name) ||
    /^secrets?\./i.test(name) ||
    /\.secret$/i.test(name)
  );
}

function bashSecretViolation(command) {
  if (/(?:^|[;&|]\s*)printenv\b/i.test(command))
    return "Dumping the environment (printenv) can expose injected secrets.";
  if (/(?:^|[;&|]\s*)env\s*(?:\||>|$)/i.test(command))
    return "A bare `env` dump can expose injected secrets.";
  if (
    /\becho\s+["']?\$\{?\w*(?:KEY|SECRET|TOKEN|PASSWORD|PASSWD|CREDENTIAL|APIKEY)\w*/i.test(
      command,
    )
  )
    return "Echoing a secret-like variable is blocked.";
  // Direct infisical value-dumping prints secret VALUES to stdout → transcript.
  // The safe wrappers (`with-secrets`, `list-secret-keys`) call infisical as a
  // subprocess, so this tool-level check never sees — or blocks — them.
  if (/\binfisical\s+export\b/i.test(command))
    return "`infisical export` prints secret values. Use `with-secrets -- <cmd>` to inject, or `list-secret-keys` for names.";
  if (/\binfisical\s+secrets\s+get\b/i.test(command))
    return "`infisical secrets get` prints a secret value. Use `with-secrets -- <cmd>` instead.";
  if (
    /\binfisical\s+secrets\b(?![^\r\n]*\b(?:set|folders|delete)\b)/i.test(
      command,
    )
  )
    return "`infisical secrets` prints values. Use `list-secret-keys` (names only) or `with-secrets -- <cmd>` (inject).";
  if (READER_VERB.test(command)) {
    const tokens = command.split(/[\s'"=(){};&|<>]+/).filter(Boolean);
    for (const t of tokens)
      if (isSecretFile(t))
        return `Reading secret file "${t}" into output is blocked.`;
  }
  const redir = command.match(/<\s*([^\s'"|;&]+)/);
  if (redir && isSecretFile(redir[1]))
    return `Reading secret file "${redir[1]}" via redirection is blocked.`;
  return null;
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

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function safeWriteAudit(record) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG_FILE), { recursive: true });
    fs.appendFileSync(AUDIT_LOG_FILE, `${JSON.stringify(record)}\n`, "utf8");
  } catch {
    /* logging must never break the hook */
  }
}

function loadManualApproval() {
  const raw = safeReadText(APPROVAL_FILE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const expiresAt = Date.parse(parsed.expiresAt || "");
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
    const scopes = Array.isArray(parsed.scopes)
      ? parsed.scopes.map(String)
      : typeof parsed.scopes === "string"
        ? [parsed.scopes]
        : [];
    if (scopes.length === 0) return null;
    return {
      scopes,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch {
    return null;
  }
}

function isApproved(approval, scope) {
  return Boolean(
    approval &&
    (approval.scopes.includes("*") || approval.scopes.includes(scope)),
  );
}

function deny(reason, scope) {
  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        `${reason} (scope: ${scope}). To authorize temporarily, create ${APPROVAL_FILE} ` +
        `with {"expiresAt":"<future ISO>","scopes":["${scope}"],"reason":"..."}.`,
    },
  });
  // Flush before exiting: process.exit() can truncate a buffered stdout pipe write.
  process.stdout.write(payload, () => process.exit(0));
}

// Hard block for secret material. Deliberately does NOT mention the approval
// hatch — this scope is not bypassable. Points at the sanctioned alternatives.
function denySecret(reason) {
  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        `${reason} (scope: secret-access). Secret values must never enter the transcript. ` +
        "To inject values into a subprocess use `with-secrets -- <cmd>`; to view key names use `list-secret-keys`.",
    },
  });
  process.stdout.write(payload, () => process.exit(0));
}

async function main() {
  const rawInput = await readStdin();
  let data;
  try {
    data = JSON.parse((rawInput || "").replace(/^﻿/, "") || "{}");
  } catch {
    process.exit(0);
  }

  const toolName = data.tool_name || "";
  const toolInput = data.tool_input || {};

  // --- Secret-access hard block (Read / Grep targeting a secret file). ---
  if (toolName === "Read" || toolName === "Grep") {
    const target =
      typeof toolInput.file_path === "string"
        ? toolInput.file_path
        : typeof toolInput.path === "string"
          ? toolInput.path
          : "";
    if (isSecretFile(target)) {
      safeWriteAudit({
        at: new Date().toISOString(),
        decision: "blocked",
        scope: "secret-access",
        tool: toolName,
        target,
      });
      return denySecret(`Reading secret file "${target}" is blocked.`);
    }
    process.exit(0);
  }

  // Everything else below is shell execution.
  if (toolName !== "Bash") process.exit(0);
  const command =
    typeof toolInput.command === "string" ? toolInput.command : "";
  if (!command) process.exit(0);

  // --- Secret-access hard block (Bash reader verbs / env dumps). ---
  const secretReason = bashSecretViolation(command);
  if (secretReason) {
    safeWriteAudit({
      at: new Date().toISOString(),
      decision: "blocked",
      scope: "secret-access",
      command,
    });
    return denySecret(secretReason);
  }

  const approval = loadManualApproval();
  for (const violation of TERMINAL_VIOLATIONS) {
    if (violation.pattern.test(command)) {
      if (isApproved(approval, violation.scope)) {
        safeWriteAudit({
          at: new Date().toISOString(),
          decision: "approved",
          scope: violation.scope,
          command,
        });
        return; // allow: node exits naturally once stdin drains
      }
      safeWriteAudit({
        at: new Date().toISOString(),
        decision: "blocked",
        scope: violation.scope,
        reason: violation.reason,
        command,
      });
      return deny(violation.reason, violation.scope); // stop here so the async flush isn't raced by a trailing exit
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
