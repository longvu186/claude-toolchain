---
name: environment-quirks
description: "REFERENCE SKILL - Platform and toolchain quirks that cause silent failures or surprising behaviour across projects. Covers Vercel/Next.js serverless lifecycle, Supabase, PowerShell/Windows, Tailwind v4, Electron, Cloudflare edge, and Claude Code toolchain hooks. Trigger phrases: silent failure, never fired, works locally but not prod, missing env var, platform lifecycle, old_string no match, formatter hook, port already in use."
argument-hint: "Describe the platform (Vercel, Supabase, Cloudflare, Windows, Claude Code hooks), the symptom, and whether the issue is local-only or prod-only."
---

# Environment Quirks

Platform and toolchain gotchas that recur across projects. Load when something works locally but fails in prod, or when a side-effect appears to complete but has no visible result.

## Vercel / Next.js Serverless

### Un-awaited post-response work is silently dropped

- **Symptom:** A fire-and-forget async call (e.g., `sendMail(...).catch(console.error)`) appears to have run (a DB "sent" timestamp is set) but the actual side-effect (SMTP delivery, webhook, third-party API) never completes. No error is logged.
- **Root cause:** Serverless functions freeze immediately after the HTTP response is returned. Any un-awaited Promise that hasn't resolved yet is killed at freeze time.
- **Trap:** A DB write that precedes the async call _will_ persist (it finished before the response); only the slower follow-up (e.g., SMTP) is lost. This creates a false "sent" state with no delivery and no error.
- **Fix:** Wrap deferred work in `after()` from `next/server` (Next.js 15+) or `waitUntil()` from `@vercel/functions`. These register work that Vercel guarantees to complete after the response.
- **Not affected:** Cron route handlers and Server Actions that `await` the call directly — those are fine as-is.
- **Anti-pattern to avoid:** "Never await email in the response path" is incomplete advice. The correct rule is: use `after()`/`waitUntil()`, never a bare un-awaited `.catch()`.

```ts
// BAD — silently dropped on serverless freeze
sendMail(options).catch(console.error);

// GOOD — Vercel waits for this before freezing
import { after } from "next/server";
after(async () => {
  await sendMail(options);
});
```

### Environment variables missing at runtime

- **Symptom:** Code references `process.env.SOME_VAR`; it's set in `.env.local` and in Vercel dashboard, but is `undefined` at runtime.
- **Common causes:** Variable not added to the correct Vercel environment (Preview vs Production); `NEXT_PUBLIC_` prefix missing for client-side access; redeploy not triggered after adding the variable.
- **Fix:** Always redeploy after adding/changing env vars. Verify with a debug log or `/api/health` endpoint that echoes non-secret env keys.

## Supabase

### RLS silently returns empty results instead of erroring

- **Symptom:** A query returns `[]` or `null` where data is expected; no error thrown.
- **Root cause:** Row-Level Security policy blocks the row; Supabase returns empty rather than `403`.
- **Fix:** Test with `service_role` key to bypass RLS and confirm data exists; then fix the policy.

### Auth session not available in Server Components

- **Symptom:** `supabase.auth.getUser()` returns `null` in a Server Component or API route even though the user is logged in client-side.
- **Root cause:** Cookie-based session requires the `@supabase/ssr` helpers with correct `cookies()` wiring.
- **Fix:** Use `createServerClient` from `@supabase/ssr` with `cookies()` from `next/headers`.

## Database / Migrations

See also: `tech-pitfalls` — Migration-in-repo does not mean migration-in-prod.

## Windows / PowerShell

### Path separators in shell scripts

- **Symptom:** Scripts using forward slashes fail on Windows PowerShell.
- **Fix:** Use backslashes or PowerShell path joining (`Join-Path`). In npm scripts, use cross-env or cross-platform tools.

### `$env:VAR` not `$VAR`

- **Symptom:** Environment variable reads as empty in PowerShell.
- **Fix:** Use `$env:VAR_NAME` syntax; `$VAR` is a regular variable, not an env var.

## Tailwind v4

### Utility class purge in dynamic strings

- **Symptom:** Dynamically constructed class names (e.g., `bg-${color}-500`) are purged from the output CSS.
- **Fix:** Use full class strings in source, or add to the safelist. Never construct partial Tailwind class names at runtime.

## Claude Code Toolchain

### PostToolUse formatter hook invalidates old_string in the next Edit

- **Symptom:** An Edit call immediately after another Edit fails with "old_string not found" even though the target region was just read or just edited.
- **Root cause:** A `PostToolUse` hook (e.g., Prettier, ESLint auto-fix, custom formatter) reformats the file after every Edit call. The file on disk no longer matches what was in memory.
- **Fix:** After any PostToolUse notification appears (or whenever an Edit follows another Edit on the same file), Read the file again before constructing the next `old_string`. This is mandatory whenever a formatter hook is active in the workspace.
- **Detection:** Check `.claude/settings.json` or `.claude/settings.local.json` for `PostToolUse` hooks targeting `Edit`.

### Dev server port already in use on Linux VPS

- **Symptom:** Starting `next dev` silently binds to an unexpected port or fails with `EADDRINUSE` because previous dev server sessions were not terminated.
- **Root cause:** Long-running VPS sessions accumulate orphaned Node processes holding ports 3000/3001/3002.
- **Fix:** Before starting a new dev server, probe the expected port: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/`. If it responds, kill the existing process (`fuser -k 3001/tcp`) or use a different port flag.

## Cloudflare Edge

See also: `cloudflare-operations` skill for deployment and alias propagation quirks.

### `fetch` in Workers does not support all Node.js options

- **Symptom:** A `fetch` call with `agent`, `keepAlive`, or other Node.js-specific options fails silently or throws.
- **Fix:** Use only web-standard Fetch API options in Workers/Edge runtime. Move Node-specific logic to a serverful route.
