# Documentation Staleness Audit

## How to Check Staleness

Every documentation file should contain a `<!-- last-verified: YYYY-MM-DD -->` comment. To audit:

1. Search all doc files for the `last-verified` comment
2. Compare the date against today
3. Flag any file older than 30 days

## Staleness Thresholds

| Age | Status | Action |
|-----|--------|--------|
| 0-14 days | Fresh | No action needed |
| 15-30 days | Aging | Review if related code changed |
| 31-60 days | Stale | Verify accuracy, update date if still correct |
| 60+ days | Critical | Full review required, likely outdated |

## Common Staleness Patterns

| File | Why it goes stale | How to detect |
|------|-------------------|---------------|
| `context.md` | Dependencies updated, new modules added | Check `package.json` diff, new directories |
| `code-index.json` | New files created, exports changed | Compare file list against actual `src/` |
| `symbol-map.md` | Functions renamed, new exports | grep for exports not in map |
| `env-vars.md` | New vars added in `.env`, code references new vars | Search for `process.env.` or `import.meta.env.` |
| `modules.md` | New top-level directories | Compare against `ls src/` |
| `docs/specs/active/*/spec.md` | Scope changed, rollout moved, or lifecycle details drifted | Check recent PRs/commits and shipped follow-ups |

## Refresh Workflow

1. Run staleness audit
2. Prioritize: critical > stale > aging
3. For each stale file:
   - Read the current content
   - Check the corresponding source files for changes
   - Update the doc content
   - Update `<!-- last-verified: YYYY-MM-DD -->` to today
4. Report which files were refreshed and key changes
