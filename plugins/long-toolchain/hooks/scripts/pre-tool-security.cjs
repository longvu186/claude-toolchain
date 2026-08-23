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

// --- Protected-service guard ------------------------------------------------
// 2026-08-09: a Claude session working in another repo ran
// `ps aux | grep -i "next-server"` and killed every PID it found, taking HQ's
// PRODUCTION server down ~50 times over 24h (hq.citizendev.io served 502s on
// every 5s restart gap). A grep over `ps` output cannot distinguish a stray dev
// server from prod, so this resolves each kill target against the protected
// units' cgroups instead of trusting the command text. Restarting these
// services is legitimate — via `systemctl`, never a raw `kill`.
// Fallback list, used only if the tenancy resolver cannot be loaded. The
// resolver reads the full protected set from /etc/claude-vps-tenancy.json;
// this hardcoded minimum keeps the highest-value protection alive even if the
// toolchain lib goes missing, rather than failing fully open.
const PROTECTED_UNITS = ["personal-hq.service"];

/** Lazily load the shared tenancy resolver; null if unavailable. */
let resolverCache;
function tenancy() {
  if (resolverCache !== undefined) return resolverCache;
  try {
    const lib = require(
      path.join(HOME, ".claude", "scripts", "lib", "vps-tenancy.cjs"),
    );
    resolverCache = lib.createResolver();
  } catch {
    resolverCache = null;
  }
  return resolverCache;
}

function protectedUnitPids() {
  const r = tenancy();
  if (r) return r.protectedPids();
  const pids = new Map(); // pid (string) -> unit
  for (const unit of PROTECTED_UNITS) {
    try {
      const procs = fs.readFileSync(
        `/sys/fs/cgroup/system.slice/${unit}/cgroup.procs`,
        "utf8",
      );
      for (const line of procs.split("\n")) {
        const pid = line.trim();
        if (pid) pids.set(pid, unit);
      }
    } catch {
      /* unit not running, or not a cgroup-v2 Linux host */
    }
  }
  return pids;
}

function procDescriptor(pid) {
  let comm = "";
  let cmdline = "";
  try {
    comm = fs.readFileSync(`/proc/${pid}/comm`, "utf8").trim();
  } catch {
    /* process already gone */
  }
  try {
    cmdline = fs
      .readFileSync(`/proc/${pid}/cmdline`, "utf8")
      .replace(/\0/g, " ")
      .trim();
  } catch {
    /* process already gone */
  }
  return `${comm} ${cmdline}`.trim();
}

function protectedKillViolation(command, cwd) {
  if (!/\b(?:kill|pkill|killall)\b/i.test(command)) return null;
  const protectedPids = protectedUnitPids();
  const r = tenancy();
  const mine = r && cwd ? r.myTenant(cwd) : null;
  if (protectedPids.size === 0 && !r) return null;

  const advise = (unit) =>
    `Use \`systemctl restart ${unit.replace(/\.service$/, "")}\` if it genuinely needs restarting.`;

  // Explicit numeric targets: `kill 1234`, `kill -9 1234 5678`, `kill -TERM 1234`.
  // `\bkill\b` does not match inside `pkill` (no word boundary after `p`).
  for (const call of command.matchAll(
    /\bkill\b((?:\s+-[\w-]+)*(?:\s+\d+)+)/gi,
  )) {
    for (const target of call[1].matchAll(/\d+/g)) {
      const pid = target[0];
      const unit = protectedPids.get(pid);
      if (unit)
        return `PID ${pid} belongs to the protected service ${unit} — "${procDescriptor(pid)}". Killing it takes production down. ${advise(unit)}`;

      // Cross-tenant: a process owned by a DIFFERENT repo on this shared box.
      // `unknown` owners are allowed through on purpose — see whoOwns().
      if (r && mine) {
        const owner = r.whoOwns(pid);
        if (owner.kind === "repo" && owner.repo && owner.repo !== mine)
          return `PID ${pid} belongs to another tenant on this shared VPS: repo ${owner.repo} — "${owner.desc || ""}". You are ${mine}; your ports are ${r.formatClaims(mine)}. Only signal processes you spawned (\`vps-map pid ${pid}\`).`;
      }
    }
  }

  // Pattern targets: `pkill -f next-server`, `killall node`.
  const byPattern = command.match(
    /\b(?:pkill|killall)\b(?:\s+-[\w-]+)*\s+["']?([^"'\s;&|]+)/i,
  );
  const needle = byPattern && byPattern[1];
  if (needle && !/^\d+$/.test(needle)) {
    for (const [pid, unit] of protectedPids) {
      const desc = procDescriptor(pid);
      if (!desc) continue;
      let matches;
      try {
        matches = new RegExp(needle, "i").test(desc);
      } catch {
        matches = desc.toLowerCase().includes(needle.toLowerCase());
      }
      if (matches)
        return `That pattern also matches PID ${pid} of the protected service ${unit} — "${desc}". Killing it takes production down. ${advise(unit)}`;
    }
  }

  return null;
}

/**
 * Deny binding a port that belongs to another tenant, and deny starting a
 * dev/preview server with no explicit port (frameworks default to 3000, which
 * on this box is HQ production). Mirrors the rule HQ's autonomous dev-runner
 * already enforces on itself in src/lib/agent/dev-runner/policy.ts — this
 * extends the same discipline to interactive sessions.
 */
function portCollisionViolation(command, cwd) {
  const r = tenancy();
  if (!r) return null;
  const mine = cwd ? r.myTenant(cwd) : null;

  // Evaluate per shell segment, and only treat a segment as a server start
  // when the runner is the segment's OWN command (anchored, after any env
  // assignments / sudo / npx). Matching anywhere in the text meant that
  // `git log -p 3000`, `pkill -f 'vite dev'`, and even a heredoc *describing*
  // these commands all tripped the guard. A guard that cries wolf gets
  // switched off, so precision here is a safety property, not politeness.
  const RUNNER =
    /^(?:\w+=\S+\s+)*(?:sudo\s+)?(?:npx\s+|(?:pnpm|yarn|bun)\s+dlx\s+)?(?:next|vite|astro|nuxt|remix|react-scripts|serve|http-server)\s+(?:dev|start|preview)\b/i;
  const PKG_SCRIPT =
    /^(?:\w+=\S+\s+)*(?:sudo\s+)?(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:dev|start|preview)\b/i;

  for (const segment of command.split(/(?:;|&&|\|\||\||\n)/)) {
    const seg = segment.trim();
    if (!seg || !(RUNNER.test(seg) || PKG_SCRIPT.test(seg))) continue;

    let sawPort = false;
    for (const m of seg.matchAll(
      /(?:--port|(?:^|\s)-p|\bPORT)\s*=?\s*(\d{2,5})/gi,
    )) {
      const port = parseInt(m[1], 10);
      sawPort = true;
      const owner = r.ownerOfPort(port);
      if (owner.kind === "service")
        return `Port ${port} is production — ${owner.unit}${owner.repo ? ` (${owner.repo})` : ""}. Binding it would collide with a live public service. Your ports: ${mine ? r.formatClaims(mine) : "see `vps-map mine`"}.`;
      if (owner.kind === "repo" && mine && owner.repo !== mine)
        return `Port ${port} belongs to another tenant on this shared VPS: repo ${owner.repo}. You are ${mine}; your ports are ${r.formatClaims(mine)}. Check with \`vps-map port ${port}\`.`;
    }

    if (!sawPort && mine) {
      return `Starting a dev/preview server without an explicit port: it would default to 3000, which is HQ production on this shared VPS. Pass a port from your band (${r.formatClaims(mine)}).`;
    }
  }
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
  } catch (err) {
    safeWriteAudit({
      at: new Date().toISOString(),
      decision: "blocked",
      scope: "guard-error",
      reason: `pre-tool-security could not parse hook input: ${err instanceof Error ? err.message : String(err)}`,
    });
    return deny(
      "Security guard could not parse its input and is failing closed. Retry the tool call.",
      "guard-error",
    );
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

  // --- Shared-VPS tenancy guards. ---
  // This host runs ~10 services and several repos side by side, and multiple
  // agent sessions share one process table. These two checks stop a session
  // from signalling, or colliding with, something it does not own.
  const cwd = typeof data.cwd === "string" ? data.cwd : "";
  for (const reason of [
    protectedKillViolation(command, cwd),
    portCollisionViolation(command, cwd),
  ]) {
    if (!reason || isApproved(approval, "protected-service")) continue;
    safeWriteAudit({
      at: new Date().toISOString(),
      decision: "blocked",
      scope: "protected-service",
      reason,
      command,
      cwd,
    });
    return deny(reason, "protected-service");
  }

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

main().catch((err) => {
  safeWriteAudit({
    at: new Date().toISOString(),
    decision: "blocked",
    scope: "guard-error",
    reason: `pre-tool-security crashed: ${err instanceof Error ? err.message : String(err)}`,
  });
  return deny(
    "Security guard hit an internal error and is failing closed. Fix the guard or retry.",
    "guard-error",
  );
});
