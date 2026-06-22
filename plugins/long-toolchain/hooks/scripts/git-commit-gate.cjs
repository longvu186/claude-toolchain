/**
 * PreToolUse hook: injects a gitnexus_detect_changes reminder before `git commit`.
 * Outputs additionalContext so Claude sees the MUST rule before executing the commit.
 */
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
  await readStdin(); // drain stdin before writing stdout
  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext:
        'CLAUDE.md MUST rule: run gitnexus_detect_changes() before this git commit ' +
        'to verify only expected symbols and execution flows changed.',
    },
  });
  process.stdout.write(payload, () => process.exit(0));
}

main().catch(() => process.exit(0));
