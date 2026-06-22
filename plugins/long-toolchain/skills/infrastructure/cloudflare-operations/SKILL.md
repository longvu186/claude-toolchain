---
name: cloudflare-operations
description: "WORKFLOW SKILL - Troubleshoot Cloudflare Pages/Workers deploy and verification flows. Use for wrangler execution patterns, alias cache lag, preview/production env mismatches, deploy validation, and edge rollout checks. Trigger phrases: wrangler deploy issue, pages alias stale, preview mismatch, workers route issue, deploy green but site old."
argument-hint: "Describe deploy command/path, target environment, resulting URL behavior, and whether unique deployment URL differs from alias."
---

# Cloudflare Operations

Operational playbook for Cloudflare Pages/Workers deployment reliability and verification.

## When to Use

- Deploy succeeded but alias still serves stale UI/content.
- Preview and production show different behavior unexpectedly.
- Wrangler execution fails or command mismatch occurs.
- Workers or Pages route behavior differs from expected rollout state.

## Learned Traits and Preferred Patterns

- Prefer deterministic deploy scripts over ad-hoc CLI commands.
- Prefer immediate verification on unique deployment URLs before alias judgments.
- Prefer environment-explicit deploy flows (`preview` vs `production`) with baked settings.
- Prefer deployment diagnosis as separate phase from application data diagnosis.
- Separate build timing from deploy timing. When artifacts are already generated and validated locally, Cloudflare Pages deployment itself is usually a quick upload-plus-propagation step; do not misclassify slow builds as slow Pages rollout.

## Preferred Setup and Initiation

1. Validate deploy command path (`npx wrangler` or npm scripts).
2. Validate target environment and branch mapping.
3. Validate environment variables are correctly set for target.
4. Capture and validate immutable deployment URL from deploy output (for example, `https://<hash>.<project>.pages.dev`) before alias/custom-domain checks.
5. For SPA route/link checks, validate browser-rendered DOM links or bundle token patterns (not only raw route HTML fetch).
6. Validate cache propagation timing before rollback decisions.

## Common Cloudflare Failure Patterns

### 1) CLI mismatch

- Symptom: Command not found / wrong wrangler behavior.
- Fix: Use `npx wrangler` or repository deploy scripts, not bare `wrangler`.

### 2) Alias cache lag after successful deploy

- Symptom: Alias URL remains old while deploy reports success.
- Fix: Validate unique deployment URL first; recheck alias after propagation window.

### 2b) Verified only alias/custom domain

- Symptom: Team reports inconsistent deploy state because checks only run on alias/custom domains.
- Root cause: Alias cache or DNS propagation hides the freshly deployed artifact.
- Fix: Treat immutable deployment URL as source of truth first, then verify alias/custom domains.

### 3) Environment mismatch

- Symptom: Preview/production URLs behave with wrong config.
- Fix: Validate environment-specific build/deploy scripts and env variables.

### 5) Production branch mismatch (Pages)

- Symptom: Deploy command succeeds but production domain does not update.
- Root cause: Deployment went to preview branch alias instead of production branch target.
- Fix: For production verification flows, deploy with explicit production branch mapping (for this class of setup, `--branch=main`).

### 4) Static export + deploy mismatch perception

- Symptom: Routing/content appears broken after deploy.
- Fix: Verify whether issue is actually upstream data/build artifact problem; coordinate with Supabase skill.

### 6) SPA HTML fetch false negatives for client-rendered links

- Symptom: Deploy checks report missing route CTA links while browser navigation still works.
- Root cause: Validation relies on route HTML shell fetch, which excludes client-rendered anchors.
- Fix: Validate link contracts from browser DOM state or deployed bundle token probes for expected href patterns.
- Verification: Keep layered checks for parity-sensitive releases (lint/build/problems, local/live screenshots, and live link probe).

## KV Cache Layer Patterns

### Pages Functions as KV Proxies
- Use Cloudflare Pages Functions (`functions/api/`) to proxy expensive backend queries through KV.
- Pattern: Function checks KV first → returns cached JSON if fresh → falls back to backend RPC → writes result to KV with TTL.
- Different endpoints can have different TTLs (e.g., stats 12h, entity lists 30min).
- Client fetches KV endpoint first with backend direct-query fallback.

### Multi-Tier Cache Architecture
- **Tier 1 (DB)**: Cache table with `computed_at` timestamp; RPC reads cache-first, recomputes when stale.
- **Tier 2 (Edge KV)**: Pages Function reads/writes KV with TTL; adds `Cache-Control` headers for CDN/browser.
- **Tier 3 (Client)**: Client-side cache with TTL (e.g., localStorage/memory with expiry check).
- All tiers should use matching freshness windows to avoid stale-layer conflicts.

### KV Wrangler Configuration
- Bind KV namespace in `wrangler.toml` under `[[kv_namespaces]]`.
- Bind R2 bucket under `[[r2_buckets]]` for media upload functions.
- Pages Functions auto-detected from `functions/` directory structure.
- Access bindings via `context.env.BINDING_NAME` in Pages Functions.

### Cache Purge Pattern
- Create an admin-only purge endpoint that deletes specific KV keys.
- Validate admin role via Supabase auth before allowing purge.
- Wire purge to admin dashboard so operators can force-refresh after data changes.

## MCP and Tooling Issue Patterns

- Toolchain success does not guarantee edge propagation complete.
- Deploy outputs can be green while alias consistency is delayed.
- CLI path/auth issues can masquerade as application bugs.

## Cross-Skill Collaboration

- Use with `supabase-operations` for full pipeline diagnosis.
- Rule of thumb:
  - If unique deployment URL is correct but alias is stale -> stay here.
  - If both unique and alias are wrong after successful deploy -> invoke Supabase skill to inspect build-time data/auth path.

## Combined Operation Examples

### Example A: "Preview alias still old"

1. Validate deploy artifact and unique deployment URL (Cloudflare).
2. If unique is correct: treat as alias propagation delay.
3. If unique is also wrong: hand off to `supabase-operations` for build-time data checks.

### Example B: "Production deploy built but missing dynamic pages"

1. Confirm Cloudflare deploy target/env correctness.
2. Confirm this is not pure cache lag via unique URL check.
3. Invoke `supabase-operations` to validate dynamic route datasets and build-time DB access.

## Output Contract

When invoked, provide:

1. Failure class (`cli-path`, `alias-cache`, `env-mismatch`, `route-rollout`).
2. Root cause hypothesis with confidence.
3. Minimal fix sequence.
4. Verification steps (immutable deployment URL, alias/custom domain URL, environment checks).
5. Whether Supabase skill should be invoked next.
6. Explicit statement of whether deploy target is preview or production branch.
