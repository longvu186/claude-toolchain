# claude-toolchain

A private Claude Code **plugin marketplace** that packages Long's personal toolchain so it
runs identically locally and in Anthropic-managed cloud (Claude Code on the web / Routines).

Managed cloud clones repos from git and loads only committed `.claude/` config — it never
sees `~/.claude`. This repo is the single source of truth that cloud (and any repo) pulls from.

## What's inside

`plugins/long-toolchain/` — the plugin:

- `skills/` — personal skills (toolchain, learning loop, feature/planning, domain).
- `agents/` — the 7 custom subagents.
- `commands/` — slash commands, including **`/long-toolchain:cloud-ready`** (prepares any repo for cloud).
- `hooks/` — `hooks.json` + `scripts/*.cjs` (run-logging, learning loop, security gate, formatter,
  GitNexus reindex). Paths use `${CLAUDE_PLUGIN_ROOT}` so they work in the plugin cache and cloud.
- `profile.md` — the user model (digest injected at SessionStart).
- `global-guidance.md` — user-level policy (digest injected at SessionStart, since `~/.claude/CLAUDE.md`
  does not auto-load in cloud).

## Use it in a repo

1. Push this repo to a **private** GitHub repo (e.g. `longvu186/claude-toolchain`).
2. In a target repo, run `/long-toolchain:cloud-ready` (after enabling the plugin), or add to
   that repo's `.claude/settings.json`:
   ```json
   {
     "extraKnownMarketplaces": {
       "long-tools": {
         "source": { "source": "github", "repo": "longvu186/claude-toolchain" }
       }
     },
     "enabledPlugins": { "long-toolchain@long-tools": true }
   }
   ```
3. For **cloud** use of a private marketplace, set `GITHUB_TOKEN` (repo read scope) on the cloud
   environment so the plugin installs at session start.

## Local development

Test changes without installing:

```bash
claude --plugin-dir ./plugins/long-toolchain
```

Validate before pushing:

```bash
claude plugin validate .
claude plugin validate ./plugins/long-toolchain
```

Version is the git commit SHA (no explicit `version` in the manifest), so every push is a new
version that cloud sessions pick up.
