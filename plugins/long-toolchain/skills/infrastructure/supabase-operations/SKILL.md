---
name: supabase-operations
description: "WORKFLOW SKILL - Troubleshoot Supabase auth/data/RLS/type/build-data issues. Use for SECURITY DEFINER RPC decisions, edge auth forwarding assumptions, schema/type drift, nullable handling, and static-build dataset prerequisites. Trigger phrases: Supabase RLS blocked, edge function 401, FK join type {}, schema drift, build-time DB empty, service role key issue."
argument-hint: "Describe the failing query/function/table flow, error text/status code, and whether this occurs at build time or runtime."
---

# Supabase Operations

Operational knowledge for Supabase data/auth workflows, especially in static-export web apps.

## When to Use

- Writes are blocked by RLS.
- Edge function auth fails (401) despite user session.
- Build-time queries return empty/null unexpectedly.
- TypeScript fails after schema changes.
- Joined relation typing fails (`{}` / missing properties).

## Learned Traits and Preferred Patterns

- Prefer server-authoritative RPC flows for privileged transitions.
- Prefer generated DB types as source of truth after every migration.
- Prefer deterministic, minimal write paths over multi-step client writes.
- Prefer explicit nullable handling before display/formatting logic.

## Preferred Setup and Initiation

1. Validate Supabase URL and keys.
2. Validate build-time key path (service-role vs anon fallback) for server/build flows.
3. Validate RLS policy path for each write operation.
4. Validate schema -> generated types -> literal object compatibility.
5. Validate dynamic route datasets are non-empty at build time.
6. Validate newly created `public` tables include explicit Data API grants plus RLS/policies (do not assume default grants).

## @supabase/server Operational Patterns

- Use `@supabase/server` for stateless, header-authenticated server runtimes: Supabase Edge Functions, Workers, Hono apps, H3/Nuxt server handlers, and similar backends.
- Do not treat it as a replacement for `@supabase/ssr`; `@supabase/ssr` still owns cookie/session refresh flows in SSR frameworks.
- Prefer `ctx.supabase` by default because it is the RLS-respecting client; use `ctx.supabaseAdmin` only for intentional privileged operations.
- Auth modes:
  - `user`: validated JWT, user-scoped RLS client.
  - `publishable`: validated `apikey`, but DB access remains anonymous; RLS still decides visibility.
  - `secret`: validated secret key for server-to-server callers.
  - `none`: open endpoint, package still provides client/context setup.
- Array auth mode only falls through when a credential is absent. A present-but-invalid JWT rejects the request; it does not silently downgrade to another mode.
- Named key auth (`secret:cron`, `publishable:web`) expects `SUPABASE_SECRET_KEYS` / `SUPABASE_PUBLISHABLE_KEYS` JSON maps. Singular env vars are fallback forms.

## Common Supabase Failure Patterns

### 1) Privileged multi-table flows blocked by RLS

- Symptom: Role/status updates partially fail or never persist.
- Fix: Move privileged cross-table writes into a single `SECURITY DEFINER` RPC.

### 2) Edge auth token unavailable in function

- Symptom: Function cannot read bearer token.
- Fix pattern:
  - Use `verify_jwt: false` where function needs raw bearer token in code path.
  - Validate user/role inside function.
  - Invoke with raw `fetch` + explicit `Authorization` and `apikey` headers.

### 3) FK join typing resolves as `{}`

- Symptom: TypeScript property access errors on joined relation fields.
- Fix: Use explicit cast shape for joined relation fields in server code.

### 4) Schema drift breaks literals

- Symptom: Build errors in dummy/test/constants after migration.
- Fix: Audit all literals against updated generated DB types.

### 5) Nullable assumptions break strict builds

- Symptom: `possibly null` failures in formatting/string logic.
- Fix: Normalize values early (`??`, guards) before operations.

### 6) Auth trigger ordering breaks signup/admin user creation

- Symptom: `/auth/v1/signup` and/or `/auth/v1/admin/users` returns 500 with FK errors on role mapping.
- Root cause: Trigger function on `auth.users` inserts mapping into role table before ensuring user profile row exists.
- Fix:
  - Patch trigger function to upsert app user profile row first.
  - Ensure role exists.
  - Insert role mapping only if missing.
  - Re-test both anonymous signup and admin create-user flows.

### 7) Seed/demo content bypasses the real media generation path

- Symptom: Admin preview or manual generation works, but seeded/demo content has no playable media in the client.
- Root cause: Seed script hardcodes `null` or placeholder media keys instead of invoking the same edge/RPC generation flow used by the app.
- Fix:
  - Seed through the real generation/upload path, not inline placeholder fields.
  - If generation is role-gated, create/sign in as a seeded auth user whose profile has the required role before invoking it.
  - Persist returned storage keys so seeded rows contain non-null media references.
- Validation:
  - Query seeded rows first and confirm media keys are present.
  - Only debug playback/UI code after the data layer is verified.

### 8) Analytics fixture seeds drift from dashboard/view semantics

- Symptom: Dashboard totals/rankings look "wrong" after seeding even though seed scripts complete successfully.
- Root cause: Fixtures are inserted at the wrong layer (derived table/view assumptions) or with contract-breaking filters/signs/time windows.
- Fix:
  - Seed source event tables, not derived views.
  - Encode aggregation contracts as explicit validation checks in seed flow:
    - daily activity grouped by completion timestamp date bucket,
    - monthly leaderboard from current-month positive ledger amounts only,
    - deterministic candidate queries for low-score targeting windows (today/week/month).
  - Keep fixture timestamps deterministic so ordering and windowing are reproducible.
- Validation:
  - Query source events and derived views together and assert expected ordering/totals.
  - Include at least one negative/debit transaction to verify positive-only leaderboard filters.

### 9) New `public` tables inaccessible via Data API (grant-default rollout)

- Symptom: New table works over direct SQL, but `supabase-js`, `/rest/v1`, or `/graphql/v1` returns `42501` / permission denied.
- Root cause: New `public` table has no explicit grants for API roles under updated Data API defaults.
- Rollout checkpoints:
  - New projects: effective 2026-05-30.
  - Existing projects: enforced from 2026-10-30.
- Fix:
  - Add explicit table grants in the same migration that creates the table.
  - Enable RLS and add role-appropriate policies.
  - Keep grants/policies as part of table-provisioning boilerplate.
- Validation:
  - Re-run failing API query; verify no `42501`.
  - Check Security Advisor for any remaining table-level privilege findings.
  - If `42501` persists, apply the exact `GRANT` hinted by PostgREST and retry.

### 10) `@supabase/server` auth mode blocked before handler runs

- Symptom: Edge Function using `withSupabase({ auth: 'publishable' | 'secret' | 'none' })` returns auth failure before application code runs.
- Root cause: Platform-level Edge Function JWT verification is still enabled, so Supabase rejects the request before `@supabase/server` can validate the intended auth mode.
- Fix:
  - In `supabase/config.toml`, set `verify_jwt = false` for functions that use `publishable`, `secret`, or `none` auth modes.
  - Keep `verify_jwt` enabled for pure `user` JWT endpoints unless you have a specific reason not to.
- Validation:
  - Confirm the request now reaches handler code.
  - Confirm `ctx.authMode` matches the configured mode.
  - Confirm `ctx.supabase` remains anon for `publishable` and `none`, and use `ctx.supabaseAdmin` only when privileged access is required.

### 11) Connecting to Supabase Postgres from Cloudflare Workers

- Prefer a direct connection over Hyperdrive: `postgres-js` supports raw TCP natively via `cloudflare:sockets` when it detects the Workers runtime (needs `nodejs_compat`), so a Worker can reach Supabase's Supavisor pooler without a Hyperdrive binding at all.
- Pick pooler mode deliberately: transaction-mode (port 6543) needs `{ prepare: false, max: 1 }`; session-mode (port 5432) supports prepared statements but pins one backend per connection. See `tech-pitfalls` ("Cloudflare Hyperdrive False Invalid Database Credentials..." and "Supabase Supavisor Pooler Mode Selection...") for the full incident and the exact symptom-to-fix mapping if Hyperdrive provisioning itself fails.

### 12) `SECURITY DEFINER` function can't resolve `pgcrypto` functions after `set search_path = public`

- Symptom: `function gen_random_bytes(integer) does not exist` (or `crypt`/`gen_salt`) on a function/script that clearly loaded `pgcrypto` and worked before hardening `search_path`.
- Root cause: Supabase-hosted Postgres installs `pgcrypto` (and most default extensions) into the `extensions` schema, not `public`. Narrowing a `SECURITY DEFINER` function's `search_path` to `public` — a correct, recommended hardening against search-path-injection — cuts it off from `extensions` at the same time.
- Fix: add `extensions` to the function's `search_path` (`set search_path = public, extensions`) for every function that calls a pgcrypto function. Grep the migration for `gen_random_bytes|crypt(|gen_salt(` to find every affected function — don't fix only the one that errored first.
- Same bug, different shape, in raw SQL scripts (e.g. `seed.sql`): a bare `SET search_path = ...;` statement at the top of the script does NOT reliably persist, because Supabase's pooler can reset session state between batched statements. Fix by schema-qualifying every call directly (`extensions.crypt(...)`, `extensions.gen_salt(...)`) instead of relying on a session-level `SET`.

### 13) `safeupdate` extension rejects WHERE-less `DELETE`/`UPDATE` even inside a `SECURITY DEFINER` function — and a raw superuser/management connection won't expose the bug

- Symptom: an admin/reset/cleanup RPC written as a straight sequence of `delete from x; delete from y;` (no WHERE clause — deliberate, "wipe the whole table") passes review and even runs successfully when tested via a direct Postgres/Management-API connection, but fails with a generic-looking error the FIRST time it's actually invoked via PostgREST/the client SDK (the path real callers use): a foreign-key violation, a permission error, or (root cause) `safeupdate`'s own rejection of a bare, unconditional `DELETE`/`UPDATE`. Supabase enables `safeupdate` by default on every project specifically to catch this class of "forgot the WHERE clause" mistake — but it does not apply uniformly to every connection role, so testing via `supabase db query`/a raw admin connection can give a false "it works" signal.
- Fix: give every delete/update in the function a real (if trivial) predicate — `delete from x where id is not null` (or the table's actual PK column) — rather than a bare `delete from x;`. Also re-check FK ordering while you're in there: a delete-everything function is a common place to discover a table was never added to the cleanup list at all (in this case `reviews`, which had a NOT NULL FK to `reservations` with no `ON DELETE CASCADE`).
- **Never trust "it compiled" or "it ran once via an admin connection" for a reset/cleanup RPC** — invoke it for real via the same client path (PostgREST/service-role key over HTTP, or an actual E2E test's global setup) before relying on it, exactly as you would for any other function.

### 14) `verify_jwt` gate rejects non-user-JWT callers before function code ever runs — audit every call path, not just the obvious ones

- Symptom: a webhook receiver, cron job, or shared-secret ops endpoint returns 401 with no logs from inside the function at all — `console.log` at the top of the handler never fires.
- Root cause: Supabase's platform gateway checks for a valid Supabase user JWT BEFORE the request reaches function code. Any in-function auth logic (a shared job-secret header check, a webhook signature check) never gets a chance to run if the platform-level check rejects first. Per-function `verify_jwt = false` in `config.toml` (or `--no-verify-jwt` on deploy) is the only way to disable this gate — it cannot be worked around from inside the function.
- **Audit every call path, not just the function that's "obviously" a webhook/cron target**: any function with a DUAL auth path (accepts either a real user JWT OR a shared secret, e.g. because it's called both by a logged-in user's browser AND by an internal scheduler) needs `verify_jwt = false` too — the secret-only leg (no `Authorization: Bearer <user-jwt>` header) hits the exact same platform-level wall as a pure ops endpoint. Grep every edge function for calls to a shared-secret/job-secret checker (not just `requireUser()`) and confirm each one's entry in `config.toml` has `verify_jwt = false`.
- Validation: after deploying, invoke each secret-only/webhook function with ONLY its intended auth header (no user bearer token) and confirm it reaches application code (a 401 from inside your own auth check is fine; a 401 with zero function logs means the gate, not your code, rejected it).

## MCP and Tooling Issue Patterns

- Infra tooling may fail while database is healthy; keep a manual fallback path.
- Build-time route errors may be data/key failures, not route implementation failures.
- Query errors after schema updates are often stale select clauses or stale generated types.
- MCP auth can be valid while pointing at the wrong org/project; verify project context before remediation.
- If MCP permissions/context are wrong, prefer Supabase CLI as authoritative fallback for schema and function patches.

## Advanced Data Patterns

### JSONB State Consolidation

- When multiple small tables store per-user state (e.g., rankings, inclusions, exclusions), consolidate into a single table with JSONB columns.
- Reduces page-load queries (e.g., 4 → 2) and simplifies atomic updates.
- Create a single `SECURITY DEFINER` RPC for atomic upsert of all JSONB fields.
- Keep high-volume event/log tables (e.g., individual comparison records) as separate rows for future streaming migration.

### Hybrid Cache-First RPC

- For expensive aggregate queries (stats, counts), create a cache table (e.g., `stats_cache`) with a `computed_at` timestamp.
- RPC reads cache first; only recomputes when stale (e.g., >12h).
- Mark as `SECURITY DEFINER` so public callers can read without RLS overhead.
- Pair with edge KV cache for additional layer (see `cloudflare-operations`).

### Phantom Data Prevention

- Auto-save features that fire on page load can create phantom rows (e.g., default rankings saved without user interaction).
- Always guard background save operations with an interaction check (e.g., `comparisons.size > 0`, `isDirty` flag).
- If phantom data occurs, clean up with targeted DELETE + add guard.

## Cross-Skill Collaboration

- Use with `cloudflare-operations` when issue spans deploy + data.
- Rule of thumb:
  - If failure starts before deploy or inside DB/auth path -> start here.
  - If deploy succeeded but production/preview behavior differs -> pair with Cloudflare skill.

## Combined Operation Examples

### Example A: "Deploy is green, but new content missing"

1. Run Supabase checks: keys, dataset baseline, query correctness.
2. Confirm build-time data source was non-empty.
3. Hand off to `cloudflare-operations` to verify alias cache lag vs unique deployment URL.

### Example B: "Edge function 401 during upload/deploy trigger"

1. Validate Supabase function auth mode and header forwarding assumptions.
2. Validate client invocation uses explicit headers.
3. Hand off to `cloudflare-operations` only if function call succeeds but deployed site behavior still stale.

## Output Contract

When invoked, provide:

1. Failure class (`RLS`, `edge-auth`, `type-drift`, `build-data`, `schema-mismatch`).
2. Root cause hypothesis with confidence.
3. Minimal fix sequence.
4. Exact validation checks to prove fix.
5. Whether Cloudflare skill should be invoked next.
