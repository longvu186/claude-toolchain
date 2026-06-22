---
description: Make the current repo runnable by Claude Code managed cloud (Web/Routines). Writes .claude/settings.json (marketplace + enabled plugins), .claude/cloud/setup.sh, scaffolds .mcp.json, and prints the cloud-console checklist.
argument-hint: "[marketplace-owner/repo] (optional; defaults to longvu186/claude-toolchain)"
---

# cloud-ready

Prepare **this repository** so it can run in Anthropic-managed Claude Code cloud
(Claude Code on the web and Routines). Managed cloud clones the repo from git and
loads **only** committed `.claude/` config — it never sees `~/.claude`. This command
commits the minimal footprint that pulls in the `long-toolchain` plugin (skills,
subagents, hooks, profile/guidance injection) plus this repo's own cloud config.

The toolchain marketplace repo is: **`$1`** (default `longvu186/claude-toolchain` if no argument).
Verify this matches the actual private GitHub repo before finishing.

## Steps — do these in order

### 1. Detect the project shape

Inspect the repo and record:

- Package manager: presence of `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, else `package-lock.json`/npm. If no `package.json`, skip install steps.
- Whether it uses **Supabase** (dependency `@supabase/supabase-js`, a `supabase/` dir, or `SUPABASE_*` env usage).
- Whether it is **GitNexus-indexed** (a `.gitnexus/` dir or GitNexus mentioned in CLAUDE.md/AGENTS.md).
- Framework (Vite/Vue, Next, etc.) for the build command.

### 2. Write `.claude/settings.json`

Merge into any existing file (do not clobber unrelated keys). Ensure it contains:

```json
{
  "extraKnownMarketplaces": {
    "long-tools": {
      "source": { "source": "github", "repo": "MARKETPLACE_REPO" }
    }
  },
  "enabledPlugins": {
    "long-toolchain@long-tools": true
  }
}
```

Replace `MARKETPLACE_REPO` with `$1` (or the default). If the repo legitimately needs
official plugins in cloud (e.g. it does Cloudflare or Supabase work), add them too, e.g.
`"cloudflare@claude-plugins-official": true`, `"supabase@claude-plugins-official": true`.
Keep the list minimal — only what this repo actually uses.

### 3. Write `.claude/cloud/setup.sh`

This is the cloud **environment setup script** (root Bash on Ubuntu 24.04, runs before
Claude starts; it CANNOT run `claude` CLI). Tailor the install line to the detected
package manager and only include `gitnexus analyze` if the repo is GitNexus-indexed:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Install dependencies (adjust to detected package manager).
if [ -f package.json ]; then
  corepack enable || true
  <INSTALL_CMD>   # e.g. pnpm install --frozen-lockfile | npm ci | yarn install --frozen-lockfile
fi

# Refresh the GitNexus index for cloud sessions (only if this repo is indexed).
# npx -y gitnexus@latest analyze .

echo "cloud setup complete"
```

### 4. Scaffold `.mcp.json` (project-scoped MCP)

Account-level **connectors** (claude.ai) already propagate to cloud, so only add
**project-specific** servers here — most importantly the **correct Supabase project**
for THIS repo (the user authenticates different repos against different Supabase
projects/accounts). Only include servers that authenticate via env var / token, NOT
interactive OAuth (OAuth servers cannot authenticate headless in cloud).

If Supabase was detected, scaffold an entry that reads the project ref + access token
from environment variables (which are set per-environment in the cloud console), e.g.:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref",
        "${SUPABASE_PROJECT_REF}"
      ],
      "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" }
    }
  }
}
```

Do NOT hardcode tokens. If the repo already has a `.mcp.json`, merge rather than overwrite.

### 5. Print the cloud-console checklist

After writing files, output a checklist of the steps that MUST be done by hand at
`claude.ai/code` (these cannot be committed):

1. **Marketplace fetch auth:** because the marketplace repo is **private**, set
   `GITHUB_TOKEN` (or `GH_TOKEN`, repo read scope) as an environment variable on the
   cloud environment, or the plugin install at session start will fail.
2. **Secrets / env vars:** list the env vars this repo's `.mcp.json` and `setup.sh`
   reference (e.g. `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, plus any the app
   build needs) — set each as a per-environment variable.
3. **Network access:** confirm the environment's allowlist reaches the package
   registry and any non-connector API hosts the setup/build needs.
4. **Triggers:** for a Routine, choose the trigger (schedule / GitHub PR event / API)
   and confirm the branch policy (cloud pushes to `claude/`-prefixed branches by default).
5. **OAuth MCP note:** call out any MCP server this repo would want that needs
   interactive OAuth — it will NOT work unattended; either drop it or pre-bake a token.

### 6. Verify, don't assume

- Re-read the files you wrote and confirm valid JSON.
- Tell the user exactly which files changed and what they still must do in the console.
- Do NOT commit unless the user asks; if you do, branch first.
