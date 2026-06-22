/**
 * PostToolUse hook: re-indexes the GitNexus graph after `git commit` or `git merge`.
 * Preserves embeddings if previously generated (checks .gitnexus/meta.json).
 * Runs async — does not block Claude after a commit.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function readStdin() {
  return new Promise((resolve) => {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => resolve(input));
    process.stdin.resume();
  });
}

function findGitnexusRoot(startPath) {
  let current = path.resolve(startPath || process.cwd());
  while (true) {
    if (fs.existsSync(path.join(current, '.gitnexus'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

async function main() {
  const rawInput = await readStdin();
  let data = {};
  try { data = JSON.parse((rawInput || '').replace(/^﻿/, '') || '{}'); } catch { process.exit(0); }

  const command = typeof data.tool_input?.command === 'string' ? data.tool_input.command : '';
  if (!/\bgit\s+(?:commit|merge)\b/.test(command)) process.exit(0);

  const cwd = data.cwd || process.cwd();
  const root = findGitnexusRoot(cwd);
  if (!root) process.exit(0);

  let hasEmbeddings = false;
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(root, '.gitnexus', 'meta.json'), 'utf8'));
    hasEmbeddings = typeof meta?.stats?.embeddings === 'number' && meta.stats.embeddings > 0;
  } catch {}

  const analyzeArgs = hasEmbeddings ? ['gitnexus', 'analyze', '--embeddings'] : ['gitnexus', 'analyze'];
  try {
    spawnSync('npx', analyzeArgs, {
      cwd: root,
      stdio: 'ignore',
      timeout: 120000,
      shell: process.platform === 'win32',
    });
  } catch {}

  process.exit(0);
}

main().catch(() => process.exit(0));
