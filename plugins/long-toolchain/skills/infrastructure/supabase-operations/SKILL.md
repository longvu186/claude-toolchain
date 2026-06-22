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
