/**
 * PostToolUse hook: runs prettier on edited files after Write, Edit, MultiEdit, or NotebookEdit.
 * Non-blocking — prettier failure is silently ignored.
 * Adapted from the Copilot post-edit-format.cjs for Claude Code tool names.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUPPORTED_EXTENSIONS = new Set([
  '.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs',
  '.json', '.css', '.scss', '.html', '.md',
  '.yaml', '.yml', '.vue', '.svelte', '.astro',
]);

const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);

function readStdin() {
  return new Promise((resolve) => {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => resolve(input));
    process.stdin.resume();
  });
}

async function main() {
  const rawInput = await readStdin();
  let data = {};
  try { data = JSON.parse((rawInput || '').replace(/^﻿/, '') || '{}'); } catch { process.exit(0); }

  if (!WRITE_TOOLS.has(data.tool_name)) process.exit(0);

  // Claude uses file_path for Write/Edit/MultiEdit, notebook_path for NotebookEdit
  const filePath = data.tool_input?.file_path || data.tool_input?.notebook_path || '';
  if (!filePath) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) process.exit(0);

  if (!fs.existsSync(filePath)) process.exit(0);

  const cwd = data.cwd || path.dirname(filePath);
  spawnSync('npx', ['prettier', '--write', '--ignore-unknown', filePath], {
    cwd,
    stdio: 'ignore',
    timeout: 15000,
    shell: process.platform === 'win32',
  });

  process.exit(0);
}

main().catch(() => process.exit(0));
