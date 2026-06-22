---
name: environment-quirks
description: "Environment-specific gotchas and workarounds for this user's stack. Use when working on Windows/PowerShell, Supabase, Cloudflare Pages/Workers, Vercel, Tailwind v4, Storybook, Electron packaging, or Bubble.io capture, to avoid known platform pitfalls. Trigger phrases: windows quirk, powershell error, supabase auth, cloudflare pages ssl, vercel env, tailwind v4, electron packaging, bubble capture."
---

# Environment Quirks

## Windows / PowerShell

- Use `;` to chain commands, never `&&`.
- Paths use backslash but most tools accept forward slash.
- `npx` may hang if Node not on PATH — verify with `Get-Command node`.
- `rg` may be unavailable in some PowerShell sessions; use `Select-String` plus `Get-ChildItem` as the deterministic fallback for text/file scans.
- Paths containing square brackets (for example Next route folders like `[...slug]`) are treated as wildcard patterns; use `-LiteralPath` for `Remove-Item`, `Get-Item`, and `Test-Path` to avoid false matches or no-op deletes.
- PowerShell 5.1 does not support expression-style inline if/ternary patterns used in newer shells; for scripted one-liners use statement form `if (...) { ... } else { ... }`.
- Avoid inline `node -e` or Playwright validation scripts that contain JavaScript template literals, `$`, or backticks; PowerShell can mangle them. Put repeatable JS validation in a temporary or checked-in `.mjs` file, and clean up temporary scripts after the run.
- In persistent VS Code terminals, old Playwright or DOM-probe scrollback can look like current output. Anchor on the latest explicit summary marker or rerun the minimal probe in a fresh command before deciding a fix failed.

## Crawl4AI (web scraping on Windows)

- **Vietnamese (and any non-Latin) text crashes the crawl on stdout.** `crwl.exe` is Python; under Windows' default cp1252 console codec it throws `'charmap' codec can't encode character 'ủ'…` and the wrapper exits 1 — the _crawl succeeded_, only the stdout print failed, so it looks like a fetch failure. Fix: set `$env:PYTHONIOENCODING="utf-8"; $env:PYTHONUTF8="1"` (and `[Console]::OutputEncoding=[System.Text.Encoding]::UTF8`) before invoking, and write output to a file with `Out-File -Encoding utf8`. Without this, every Vietnamese page silently fails.
- Wrapper flag is `-Output` (markdown|json|html|markdown-fit), NOT `-Format`; single URL only (loop for batches); `-BypassCache` for freshness. Direct fallback: `crwl.exe "<url>" -o markdown`.
- Many VN/news sites are client-rendered SPAs (Vietcetera homepage, SpaceSpeakers, some brand sites) — crawl returns an empty shell (~tens of words). Detect via a min-length gate (≥200 chars) and either harvest article links from a server-rendered section page instead, or escalate that URL to Playwright.
- **Deep article URLs cannot be guessed** — they 404. Crawl a section/listing page, then harvest real `[text](url)` links from its markdown (`grep -oE` long-slug filter), or use WebSearch to find current URLs.

## Bubble.io Capture

- PIN inputs auto-advance: use `page.keyboard.press('DigitN')` with 400ms delay.
- Bubble routing is slow: 5-8s waits needed after login and nav.
- Mobile nav uses `iconify-icon` web components: `{ force: true }` on click.
- CDN assets: `https://{hash}.cdn.bubble.io/f{timestamp}/{filename}`.

## Cloudflare Pages

- New Pages projects get transient `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` on first deploy — resolves in ~5 min.
- Preview alias cache can lag — check deployment URL directly if alias appears stale.
- Pages Functions access KV/R2 bindings via `context.env.BINDING_NAME`. Bind in `wrangler.toml`.
- KV is eventually consistent — match TTLs across all cache tiers (DB, KV, client) to avoid stale-layer conflicts.

## Vercel Serverless Deployments

- Local `.env` parity can hide missing production env vars; verify runtime keys in Vercel project env before and after deploy.
- Long-running upload/process handlers need explicit per-function `maxDuration` overrides; default function limits are often too low for file-processing flows.
- For chained integrations, fail fast on missing secrets with explicit machine-readable error codes to speed cross-team debugging.
- Path-based Vercel CLI deploy/link flows can silently rewrite `.vercel/project.json` if link context drifts; run with explicit `--cwd` target and verify `projectId`/`orgId` in `.vercel/project.json` before and after deploy.
- `nodemailer` requires Node.js crypto/net — it does NOT work in the Vercel Edge runtime. Any Next.js route or cron handler that uses nodemailer must export `export const runtime = "nodejs"`.
- Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the env var is set. Always validate this header and return 401 on mismatch to prevent unauthenticated cron triggers.
- **Un-awaited post-response work is silently dropped.** A fire-and-forget `fn().catch(console.error)` started during a request handler is killed when the function freezes after the response returns. A DB write that ran before it persists (so a "sent" flag looks set), but the slower follow-up (SMTP/webhook/3rd-party) never runs — no delivery, no error. Use `after()` from `next/server` (or `waitUntil()` from `@vercel/functions`) for deferred work; `await` inside cron routes / server actions is fine as-is. "Never await email in the response path" is incomplete advice — the correct rule is use `after()`/`waitUntil()`, never a bare un-awaited `.catch()`. See `tech-pitfalls` → Serverless Post-Response Side-Effects.

## Supabase

- Type generation: run `npm run supabase:gen-types` after any schema change.
- Phone auth uses synthetic email pattern in Bubble: `{phone}@{domain}` — native Supabase phone auth replaces this.
- `SECURITY DEFINER` RPCs bypass RLS — use for privileged aggregates and cross-table writes. Always validate caller inside the function.
- JSONB columns reduce per-user query count when multiple small state tables can be consolidated into one row.
- Strict TS + Supabase responses in Pinia: map/select API results into explicit local interfaces (or typed normalizer functions) before assigning to refs/computed state to avoid unstable union inference and `never` cascades.
- Permission/role model changes should be shipped atomically: DB migration + RLS helper/policy logic + regenerated shared DB types in one change set.
- For role-gated UI/actions, sync role state from the canonical profile row during auth initialization before evaluating permission predicates.
- When adding/removing lifecycle Edge Functions tied to schema events, verify trigger/function contract compatibility immediately after migration to avoid silent automation drift.
- For phone- or identity-based bootstrap flows, normalize identifiers at DB and edge-function boundaries in the same rollout to prevent privilege drift from format mismatch.

## Auto-Save / Background Operations

- Auto-save firing on page visit (without interaction) creates phantom DB rows. Guard with interaction check (`isDirty`, `count > 0`, form touched).

## Drag-and-Drop (Web)

- Native HTML5 drag unreliable on touch devices. Always provide up/down button fallback.
- Mixed drag/pointer handlers can block SPA client-side navigation. Force hard navigation (`window.location.assign`) from heavy drag pages if transitions stall.

## Tailwind CSS v4

- Uses `@theme` directive in CSS instead of `tailwind.config.js`. Tokens as `--color-*` custom properties inside `@theme { }` auto-generate utility classes.
- Font tokens: `--font-sans: 'DM Sans', sans-serif;` → `font-sans` class.

## Storybook + vue-tsc

- Stories importing `@sb/mock-data` cause type errors in `vue-tsc --noEmit`. Workaround: `npx vite build` to verify compilation without type-checking stories.
- Story IDs in automation can drift when story names are renamed/reformatted (for example hyphenated variants). Keep an explicit story-id map in capture scripts and verify expected capture count to fail fast on mismatches.

## replace_string_in_file Reliability

- Always `read_file` before `replace_string_in_file` on Vue templates — even small whitespace differences cause match failures. Copy exact text from the read output.

## Icon Library Migration

- Switching icon libraries (e.g., mingcute → lucide) with @iconify/vue: the import stays the same, only `icon=""` prop strings change. Use grep to find all instances.

## OpenNext / Cloudflare Workers — Dev-Time Secret Injection Gap

- With `next dev` (Turbopack) + OpenNext Cloudflare adapter, Cloudflare Worker bindings and secrets (for example `SUPABASE_SERVICE_ROLE_KEY`) are NOT reliably injected into `process.env` per-route during local development. Data-backed pages can 500 with "service client not configured" inconsistently across routes, and the error reproduces on unchanged code.
- Workaround: validate UI logic against a temporary mock-rendered route with mock props (no DB call). Do real data validation against a Cloudflare/Vercel preview deploy where bindings are properly resolved.
- Do not interleave `npm run dev` (Turbopack) with `npm run build` (webpack) in the same workspace state — it corrupts `.next/types` and the subsequent build fails on a stale generated `route.js` import. Fix: `Remove-Item -Recurse -Force .next` then rebuild from scratch.
- Turbopack dev-cache can spontaneously corrupt mid-session on Windows (SST files in `.next/dev/cache/turbopack` vanish; dev server logs "Failed to restore task data ... os error 3" and panics). Recovery: stop the dev server, run `Remove-Item -Recurse -Force .next/dev/cache/turbopack`, then restart. If port 3000 is still held by the crashed process, the restarted server will bind to 3001 — check the console for the actual port before opening a browser tab.

## Claude Code Hook Engineering

- **Hook-policy drift:** After any toolchain port, scan AGENTS.md/CLAUDE.md for "automatically", "MUST", "hook", and "gate" claims and cross-reference each against `~/.claude/settings.json` hooks. Gaps are silent — nothing errors until the automation is expected.
- **Sub-tool filtering without a matcher group:** Use `"if": "Bash(git commit *)"` directly on individual PreToolUse/PostToolUse entries. Permission-rule glob syntax works here; no separate matcher group needed.
- **Async PostToolUse hooks:** Set `"async": true` on any PostToolUse hook that shells out to a slow process (gitnexus analyze, npm build, linters). Without it, Claude's response stalls until the hook returns — silent to the user.
- **spawnSync over execSync in hook scripts:** Default to `spawnSync('cmd', ['arg1', 'arg2'], { stdio: 'inherit' })` in all hook .cjs files. The security-guidance PostToolUse plugin performs static analysis on newly written files and blocks `execSync`/`exec` with string-command arguments immediately on write; spawnSync + arg array passes the check.
- **security-guidance plugin scope:** It fires globally (not only in security contexts) on every file write. Treat it as a fast linter — when it fires, replace the offending call with spawnSync/execFileSync + arg array and re-write.

## Windows Electron Packaging

- Before rerunning installer builds, clear prior release output folders (for example release-dist) to avoid stale/locked artifact conflicts.
- If desktop/dev builds behave inconsistently, terminate stale node/electron processes before retrying packaging or runtime smoke tests.
