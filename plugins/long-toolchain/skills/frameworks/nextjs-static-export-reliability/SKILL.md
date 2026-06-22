---
name: nextjs-static-export-reliability
description: "WORKFLOW SKILL - Harden Next.js App Router projects using output: export. Use for generateStaticParams failures, stale build data, env bake errors, route export pitfalls, and static deploy regressions. Trigger phrases: missing generateStaticParams, static export build fails, stale data after build, output export issue, dynamic route export, query route for admin edit."
argument-hint: "Describe the build failure, route pattern, and current scripts/env flags."
---

# Next.js Static Export Reliability

Reusable playbook for diagnosing and fixing static-export failures and stale-data issues in Next.js App Router projects.

## When to Use

- Build errors mention missing `generateStaticParams()`.
- Dynamic routes work in dev but 404 after deployment.
- Fresh DB/content changes do not appear after rebuild.
- OAuth or canonical URLs point to wrong domain.
- Nested routes lose metadata assets (favicon/OG).

## Core Checks

1. Confirm `next.config` static mode.
2. Verify every dynamic route has deterministic build-time params.
3. Verify build-time datasets are non-empty where required.
4. Verify build scripts clear `.next` before build.
5. Verify env flags are baked by scripts (not only local shell).

## Learned Traits and Preferred Patterns

- Prefer build-time determinism over runtime patching in static-export projects.
- Prefer minimal route surfaces for mutable admin entities (query routes over dynamic path params).
- Prefer explicit environment contracts in scripts (`build:preview`, `build:prod`) over ad-hoc shell env setup.
- Prefer root-cause diagnostics on data availability/connectivity before route refactors.

## Preferred Setup and Initiation

1. Confirm static-export mode and build scripts.
2. Confirm environment bake strategy and site URL strategy.
3. Confirm dynamic routes and their build-time data sources.
4. Confirm baseline seed prerequisites for each route.
5. Run clean build and verify on unique deploy URL before alias checks.

## Tooling and MCP-like Quirks

- Build logs can surface misleading route errors when root issue is build-time data emptiness.
- CDN alias URLs can lag behind a successful deploy; unique deployment URL is the authoritative immediate check.
- Cache-related regressions often masquerade as routing bugs; clear build artifacts first.

## Common Failure Patterns

### 1) Misleading `generateStaticParams` errors

- Symptom: Build claims route is missing `generateStaticParams()` even when function exists.
- Typical root cause: Build-time dataset is empty or DB access failed.
- Fix:
  - Validate DB connectivity and service/anon keys.
  - Seed at least one row for each dynamic route source.
  - Add defensive fallback params only if architecturally safe.

### 2) Stale build-time data across rebuilds

- Symptom: Feature flags/content stay old after rebuild+deploy.
- Root cause: Next.js fetch cache reuse in `.next/cache/`.
- Fix:
  - Always run `rimraf .next && next build` (or equivalent) for static builds.
  - Do NOT force `cache: \"no-store\"` for server data in export mode.

### 3) Mutable admin IDs with static paths

- Symptom: Newly created admin entities 404 on edit page.
- Root cause: Dynamic path `[id]` not present at export build time.
- Fix:
  - Use query-based edit routes (`/edit?id=...`) for mutable admin data.
  - Keep dynamic segments for stable public content only.

### 4) Wrong environment URL at runtime

- Symptom: OAuth callback/canonical URLs point to localhost or production in preview.
- Root cause: URLs built from `window.location.origin` or unbaked env values.
- Fix:
  - Build absolute URLs from `NEXT_PUBLIC_SITE_URL` fallback constants.
  - Inject env flags in build scripts per environment.

### 5) Route group conflict

- Symptom: Real homepage replaced by scaffolded default page.
- Root cause: Conflicting root `app/page.tsx` overshadowing grouped route page.
- Fix: Keep only the intended root-resolved page.

### 6) Nested route asset path failures

- Symptom: Favicon/metadata icons missing on deep routes.
- Root cause: Relative metadata paths.
- Fix: Use absolute asset paths beginning with `/`.

### 7) Build-time feature flags with admin toggle

- Symptom: Feature flags toggled in admin but not reflected on site.
- Root cause: Flags read at build time from DB; changes require redeploy.
- Pattern:
  - Store flags in a DB table (e.g., `site_settings`).
  - Read flags in a server-side helper (`getFeatureFlags()`) during build.
  - Use flags in layouts/nav to conditionally render routes and links.
  - Create a `FeatureGate` wrapper component that shows "coming soon" for disabled features.
  - Admin toggle page must remind operator to redeploy after changing flags.
- Pitfall: `cache: "no-store"` is incompatible with `output: "export"`. Flags are inherently build-time in static export.
- Admin preview: Let admins bypass feature gate with a yellow info banner and "view as user" toggle.

### 8) Server vs client fetch strategy for list/detail consistency

- Symptom: List page shows articles that 404 on detail page, or vice versa.
- Root cause: List fetched at runtime (client) but detail pages are static (build-time).
- Fix: Use build-time server fetch for both list and detail pages in static export. Client-side fetching for lists can show undeployed content.

### 9) Next.js 16 async `params` in dynamic App Router pages

- Symptom: Type errors or runtime access issues when reading `params.slug` directly in dynamic route page components.
- Root cause: In Next.js 16 App Router, dynamic route `params` can be delivered as a `Promise` in page components.
- Fix:
  - Type page props as `params: Promise<{ ... }>` when the route surface expects async params.
  - `await params` before reading `slug` or other route keys.
  - Keep `generateStaticParams()` deterministic so the async prop shape does not hide real export gaps.

### 10) Metadata routes in `output: "export"` builds

- Symptom: `app/sitemap.ts` or `app/robots.ts` breaks an otherwise static-exportable build.
- Root cause: In some Next.js 16 export builds, metadata routes are not inferred as fully static without an explicit static hint.
- Fix:
  - Add `export const dynamic = "force-static"` to `src/app/sitemap.ts` and `src/app/robots.ts` when they are pure build-time outputs.
  - Keep those route handlers free of runtime-only dependencies.

## Build Checklist

- `rimraf .next` before every static build.
- Build-time DB key valid and accessible.
- Baseline rows exist for every dynamic route generator.
- Env baked by scripts for each target environment.
- Verify using unique deployment URL (not only alias URL).

## Output Contract

When invoked, provide:

1. Root-cause classification.
2. Exact failing route(s) and data source(s).
3. Minimal fix plan in priority order.
4. Verification steps for local build and deployed URL.
