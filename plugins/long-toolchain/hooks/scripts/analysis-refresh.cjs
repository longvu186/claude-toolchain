/**
 * Analysis refresh worker for Claude Code.
 * Runs `npx gitnexus analyze` + `npx repomix` when a refresh-request.json exists
 * under docs/ai/.analysis/ in the workspace root.
 *
 * Invoked with workspaceRoot as process.argv[2].
 * Uses a lock file to prevent concurrent runs (stale lock threshold: 30 min).
 *
 * Ported from ~/.copilot/hooks/scripts/analysis-refresh.cjs.
 */
const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const workspaceRoot = process.argv[2] ? path.resolve(process.argv[2]) : "";
const ANALYSIS_REFRESH_STALE_LOCK_MS = 30 * 60 * 1000;
const MAX_CAPTURE = 4000;
const REPOMIX_IGNORE_PATTERNS = [
  "docs/ai/run-logs/**",
  "docs/ai/.analysis/**",
  "**/.git/**",
  "**/node_modules/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/.open-next/**",
  "**/.wrangler/**",
  "**/coverage/**",
  "**/dist/**",
  "**/dist-*/**",
  "**/out/**",
].join(",");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

function truncate(value, limit = MAX_CAPTURE) {
  if (!value) return "";
  const normalized = String(value).replace(/\r\n/g, "\n").trim();
  return normalized.length <= limit
    ? normalized
    : `${normalized.slice(0, Math.max(0, limit - 3))}...`;
}

function isoNow() {
  return new Date().toISOString();
}

function getRefreshPaths(root) {
  const analysisDir = path.join(root, "docs", "ai", ".analysis");
  return {
    analysisDir,
    requestFile: path.join(analysisDir, "refresh-request.json"),
    statusFile: path.join(analysisDir, "refresh-status.json"),
    lockFile: path.join(analysisDir, "refresh.lock"),
    repomixOutputFile: path.join(analysisDir, "repomix-output.xml"),
  };
}

function acquireLock(lockFile) {
  ensureDir(path.dirname(lockFile));
  try {
    const stats = fs.statSync(lockFile);
    if (Date.now() - stats.mtimeMs > ANALYSIS_REFRESH_STALE_LOCK_MS)
      fs.unlinkSync(lockFile);
  } catch {}
  try {
    fs.writeFileSync(
      lockFile,
      JSON.stringify({ pid: process.pid, startedAt: isoNow() }, null, 2),
      { encoding: "utf8", flag: "wx" },
    );
    return true;
  } catch {
    return false;
  }
}

function releaseLock(lockFile) {
  try {
    fs.unlinkSync(lockFile);
  } catch {}
}

function resolveNpxCommand() {
  if (process.platform === "win32" && process.env.APPDATA) {
    const cmdPath = path.join(process.env.APPDATA, "npm", "npx.cmd");
    if (fs.existsSync(cmdPath)) return cmdPath;
  }
  return "npx";
}

function resolveGitNexusInvocation() {
  if (process.platform === "win32" && process.env.APPDATA) {
    const cmdPath = path.join(process.env.APPDATA, "npm", "gitnexus.cmd");
    if (fs.existsSync(cmdPath)) return { command: cmdPath, baseArgs: [] };
  }
  return { command: resolveNpxCommand(), baseArgs: ["-y", "gitnexus@latest"] };
}

function hasGitMetadata(root) {
  return fs.existsSync(path.join(root, ".git"));
}

function runCommand(command, args, cwd) {
  const startedAt = Date.now();
  const result = childProcess.spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    shell: process.platform === "win32",
    windowsHide: true,
  });
  return {
    command,
    args,
    durationMs: Date.now() - startedAt,
    exitCode:
      typeof result.status === "number" ? result.status : result.error ? -1 : 0,
    ok: !result.error && result.status === 0,
    stdout: truncate(result.stdout),
    stderr: truncate(
      result.stderr || (result.error ? result.error.message : ""),
    ),
  };
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function buildStatus(baseStatus, request) {
  return {
    workspaceRoot,
    repoName: path.basename(workspaceRoot),
    lastRequestedAt: request?.requestedAt || baseStatus.lastRequestedAt || "",
    lastSuccessfulRequestAt: baseStatus.lastSuccessfulRequestAt || "",
    lastStartedAt: baseStatus.lastStartedAt || "",
    lastCompletedAt: baseStatus.lastCompletedAt || "",
    lastOutcome: baseStatus.lastOutcome || "idle",
    request: request
      ? {
          requestedAt: request.requestedAt,
          runId: request.runId,
          runIndex: request.runIndex,
          reason: request.reason,
          prompt: request.prompt,
          filesChanged: request.filesChanged || [],
        }
      : baseStatus.request || null,
    gitnexus: baseStatus.gitnexus || null,
    repomix: baseStatus.repomix || null,
  };
}

function refreshOnce(refreshPaths, request) {
  const existingStatus = safeReadJson(refreshPaths.statusFile, {});
  const status = buildStatus(existingStatus, request);
  status.lastRequestedAt = request.requestedAt;
  status.lastStartedAt = isoNow();
  status.lastOutcome = "running";
  writeJson(refreshPaths.statusFile, status);

  const gitnexusInvocation = resolveGitNexusInvocation();
  const gitnexusArgs = [...gitnexusInvocation.baseArgs, "analyze", "."];
  if (!hasGitMetadata(workspaceRoot)) gitnexusArgs.push("--skip-git");
  status.gitnexus = runCommand(
    gitnexusInvocation.command,
    gitnexusArgs,
    workspaceRoot,
  );
  writeJson(refreshPaths.statusFile, status);

  const npxCommand = resolveNpxCommand();
  status.repomix = runCommand(
    npxCommand,
    [
      "-y",
      "repomix@latest",
      ".",
      "--output",
      refreshPaths.repomixOutputFile,
      "--style",
      "xml",
      "--ignore",
      REPOMIX_IGNORE_PATTERNS,
    ],
    workspaceRoot,
  );
  status.repomix.outputFile = path
    .relative(workspaceRoot, refreshPaths.repomixOutputFile)
    .replace(/\\/g, "/");
  status.repomix.outputBytes = getFileSize(refreshPaths.repomixOutputFile);

  status.lastCompletedAt = isoNow();
  status.lastOutcome =
    status.gitnexus.ok && status.repomix.ok ? "success" : "failure";
  if (status.lastOutcome === "success")
    status.lastSuccessfulRequestAt = request.requestedAt;
  writeJson(refreshPaths.statusFile, status);
  return status;
}

function main() {
  if (!workspaceRoot) process.exit(0);

  const refreshPaths = getRefreshPaths(workspaceRoot);
  const request = safeReadJson(refreshPaths.requestFile, null);
  if (!request || !request.requestedAt) process.exit(0);

  if (!acquireLock(refreshPaths.lockFile)) process.exit(0);

  try {
    let currentRequest = request;
    for (let iteration = 0; iteration < 3; iteration += 1) {
      const currentStatus = safeReadJson(refreshPaths.statusFile, {});
      if (
        currentStatus.lastSuccessfulRequestAt &&
        currentStatus.lastSuccessfulRequestAt === currentRequest.requestedAt
      )
        break;

      refreshOnce(refreshPaths, currentRequest);

      const latestRequest = safeReadJson(refreshPaths.requestFile, null);
      if (
        !latestRequest ||
        latestRequest.requestedAt === currentRequest.requestedAt
      )
        break;
      currentRequest = latestRequest;
    }
  } finally {
    releaseLock(refreshPaths.lockFile);
  }

  process.exit(0);
}

main();
