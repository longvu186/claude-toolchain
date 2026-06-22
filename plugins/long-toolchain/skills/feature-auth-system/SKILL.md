---
name: feature-auth-system
description: "FEATURE SKILL - Build and harden authentication systems for web apps with explicit account lifecycle and moderation states. Use for OAuth/email flows, role models, route guards, callback handling, profile bootstrap, auth UX states, seeded test accounts, quick login, and non-prod auth bypass for automated role testing. Trigger phrases: build auth, oauth setup, login flow, protected routes, role-based auth, callback redirect, Google auth bypass, test accounts, quick login."
argument-hint: "Describe auth providers, role model, protected areas, and deployment model (SSR/static)."
---

# Feature Skill: Auth System

Reusable feature playbook for implementing authentication and authorization.

## Feature Scope

- Registration, invite acceptance, and login entry paths.
- Sign-in methods (OAuth and/or email magic link/password).
- Email verification, password reset, and account recovery.
- Session bootstrap and profile sync.
- Session refresh, revocation, and logout coverage.
- Callback handling and redirect safety.
- Login throttling, brute-force defenses, and generic auth failure messaging.
- Role model (`user`, staff/admin, optional special roles).
- Account lifecycle states (`active`, `suspended`, `blocked`, `deactivated`, `soft_deleted`).
- Optional MFA enrollment and challenge paths.
- Protected routes and unauthorized UX.

## Source Backbone

Use `requirements-pack-enforcement` first for non-trivial auth work.

### Normative

- `OWASP ASVS` for authentication, session management, credential recovery, MFA, and access control requirements.
- `OWASP WSTG` for practical auth, session, reset, callback, and privilege-escalation test scenarios.

### Reference

- `SuperTokens session docs` for rotation, revocation, anti-CSRF tradeoffs, and cookie/header session behavior.

## Preferred Build Pattern

1. Load `requirements-pack-enforcement` and map auth surface before coding.
2. Load `common-feature-research` for current auth baseline expectations unless the local project docs already cover them.
3. Define auth providers and role enum first.
4. Define account lifecycle state model and transition rules.
5. Implement callback endpoint with deterministic redirect rules.
6. Add centralized auth context/provider.
7. Add route guard component/middleware.
8. Add profile bootstrap and missing-profile fallback.
9. Add login throttling, rate limiting, and generic failure responses before polishing the happy path.
10. Add login/logout confirmation and error toasts.
11. Add session refresh, logout-all, reset, and recovery handling where the product supports them.

## Auth Test Access Contract

Use this whenever the product has protected routes, privileged roles, or third-party auth such as Google.

1. Define a role x permission x lifecycle-state matrix before wiring tests.
2. Seed real non-production accounts for every critical role and every restricted state the app enforces.
3. Prefer a first-party auth bootstrap path for automation: API login, session bootstrap, or storage-state setup.
4. Treat interactive third-party login as a last resort for manual QA, not as the primary automated path.
5. Keep quick-login entry points available only in local and preview or staging environments while the app is unpublished.
6. Remove or hide quick-login entry points as soon as the app is marked published.
7. Keep the publish flag explicit in env, config, or data; do not infer it from hostname alone.
8. UI-only impersonation may help manual QA, but it does not replace seeded accounts for backend permission tests.

Minimum account manifest:

- one anonymous or signed-out path
- one active account per critical role
- one restricted account per lifecycle state such as `suspended`, `blocked`, or `deactivated` when those states exist
- optional worker account pool for stateful parallel Playwright suites

Minimum automated auth coverage:

- successful login bootstrap for each critical role
- deny-path checks for wrong role and restricted-state accounts
- destructive and recovery journey coverage when the feature supports lifecycle actions
- explicit signed-out coverage by resetting storage state

Implementation notes:

- Prefer Playwright `storageState` files generated from first-party login helpers over UI-driving Google login pages.
- If the app supports API login, create auth setup through requests instead of browser-only flows.
- If OAuth is the only human login path, add a non-prod-only quick-login or session bootstrap lane for automation.
- Keep test accounts obviously non-production, labeled in the UI, and excluded from published production surfaces.

## Supabase MFA Pattern (TOTP)

Use this when the app stores MFA readiness/authentication state in a profile table and routes are server-rendered.

1. Model profile flags explicitly: `two_fa_selected`, `two_fa_setup`, `two_fa_authenticated`, and `two_fa_method`.
2. On password sign-in success, clear `two_fa_authenticated=false` when `two_fa_selected=true` before computing redirects.
3. Keep redirect order deterministic: `selected && !setup -> /authentication-setup`, `selected && setup -> /authentication`, else role home.
4. Keep setup/challenge pages wrapped in server guards that require session and load profile flags before rendering client forms.
5. Setup form flow: `auth.mfa.enroll({ factorType: "totp" })` -> render QR/manual key -> `challengeAndVerify` -> persist profile flags/method.
6. Challenge flow: `auth.mfa.listFactors()` (prefer verified TOTP factor) -> validate 6-digit input -> `challengeAndVerify` -> persist authenticated flag -> redirect to role home.
7. If a second factor method (for example SMS) is not wired yet, keep it notice-only and never mark setup as complete.

Implementation notes:

- Some SDKs return QR as raw SVG, others as data URI. Normalize to a data-image source before rendering.
- In Next.js, data-URI QR rendering via `next/image` should use `unoptimized`.
- Persist profile state immediately after verify to keep server-route guards and client session state in sync.

## Common Pitfalls

- Environment-aware callback URLs built from runtime origin in static deployments.
- Profile row missing after first OAuth login.
- OAuth-only login shipped without a non-prod automation bypass, forcing brittle browser-driven third-party auth in tests.
- Dev quick-login/bypass route gated by a `NEXT_PUBLIC_*` flag (in `.env.local`) instead of `NODE_ENV` — it bakes into a _local_ production build and can ship a live bypass. Relatedly, enabling the Supabase Email provider just for one test account opens public email signups on a live project.
- Quick-login or test-account UI left visible after publish because the publish gate is implicit or environment-specific.
- UI-only impersonation mistaken for permission coverage even though backend authorization still runs under another actor.
- Role checks duplicated across pages instead of centralized guard.
- Inconsistent redirect handling between desktop/mobile or providers.
- Auth errors that leak whether the email exists, whether the password is wrong, or whether the account is disabled.
- Login endpoints with no throttling/rate-limit path, making brute-force protection an afterthought.
- Session/guard helpers changed from sync to async without a callsite await sweep, causing unresolved-promise access (`TS2339` on `session.*`) across route handlers.
- MFA selected users bypassing challenge routes because `two_fa_authenticated` was not reset on new sign-in.
- MFA guard checks executed in the wrong order, causing setup/challenge redirect loops.
- Missing explicit handling for suspended/blocked/deactivated users in guards and session bootstrap logic.

## Account Lifecycle Baseline

For auth-driven systems, model and enforce transitions for:

- active
- suspended/unsuspended
- blocked/unblocked
- deactivated/reactivated
- soft_deleted/restored (and hard-delete policy where applicable)

Every restricted-state transition should include:

- server-side permission check
- reason code when policy requires it
- audit log event
- deterministic guard behavior on next request

## Advanced Patterns

### Admin Impersonation

- Use client-side profile override in auth context provider — admin's real session stays intact, but `effectiveUserId` resolves to impersonated user.
- Persist impersonation state in `sessionStorage` (clears on tab close, no accidental persistence across sessions).
- Show a prominent colored banner (e.g., amber) across all pages during impersonation (`z-[100]` to stay above all UI).
- All data-fetching and display components use `effectiveUserId` from context, not raw auth user.
- Hide sensitive tabs (settings, account deletion) during impersonation.
- Pitfall: Supabase RLS still enforces the admin's real session — impersonation is UI-only. For write operations, consider whether the impersonated user's permissions or admin's should apply.

### Custom Role Extension

- When adding roles beyond standard user/admin (e.g., `artist`, `moderator`):
  - Add to DB enum and regenerate types.
  - Create dedicated route group with `ProtectedRoute` guard for the role.
  - Auto-set role when linking user to domain entity (e.g., linking user to verified artist record → set role to `artist`).
  - Ensure role downgrade/cleanup when unlinking.

### Supabase OAuth-only Local Access (service-role magic-link bypass)

Use when login is OAuth-only (e.g. Google) **and** email/password sign-in is disabled, but you need a real, RLS-valid session to reach protected routes locally. (UI-only mock harnesses don't exercise RLS/RPCs — see the mock-render harness for pure layout review instead.)

**Don't:**

- Enable the Email provider just to use `signInWithPassword`. Supabase's Email toggle also permits email **sign-ups**, and you usually can't disable global signups to compensate without breaking OAuth onboarding — leaving a standing public signup surface on a live project.
- Mint a session server-side and inject `@supabase/ssr` cookies via `document.cookie`. The in-page client refreshes the _foreign_ session and PostgREST may reject the rotated key (`PGRST301`/401), even though the same token validates 200 via curl.

**Do (proven):**

1. Provision a dedicated, labeled non-prod admin account via service-role: `auth.admin.createUser({ email, email_confirm: true })` then upsert its profile row with the role set explicitly. No password needed. (No DB trigger may auto-create the profile row — insert it yourself; service-role bypasses RLS.)
2. Helper script (service-role key from **local env only**): `auth.admin.generateLink({ type: 'magiclink', email })` → `properties.hashed_token`. `generateLink` is an admin op and works **even when email sign-in is disabled**. Print a ready URL `http://localhost:<port>/dev-login?token=<hash>`.
3. Dev-only `/dev-login` route: the **browser** calls `supabase.auth.verifyOtp({ token_hash, type: 'email' })` (fallback `'magiclink'`) → a **client-owned** session whose refresh cycle is native → redirect to the protected route. This is what dodges the injection/refresh failure above.

**Security & gating:**

- Access is gated purely by possession of the local service-role key — no password, no public signup surface, no auth-config change. Tokens are single-use, short TTL (~1h); re-mint per session.
- Gate the route on `process.env.NODE_ENV === "development"`, **not** a `NEXT_PUBLIC_*` flag. A flag in `.env.local` bakes into a _local_ production build and can ship a live bypass (especially where deploy ships the whole tree); `NODE_ENV` is `development` only under the dev server and `production` in every build/export.
- Static export: wrap `useSearchParams` in `<Suspense>`; the disabled branch must not call Supabase.
- Verify end-to-end (token URL → land on the protected route as the role, no 401s). A benign `404` on serverless/edge functions (e.g. Cloudflare Pages Functions) under the local dev server is expected and not an auth failure.

## Validation Checklist

- Invite, registration, and login entry paths are covered.
- New user can login and gets profile row.
- Existing user returns to intended route after callback.
- Automated auth strategy is explicit: seeded accounts plus first-party bootstrap or `storageState`, not interactive third-party login.
- Quick-login or test-account UI is limited to local and preview or staging while unpublished and hidden after publish.
- Role x permission x lifecycle-state matrix exists and matches automated allow and deny coverage.
- Unauthorized users are redirected consistently.
- Email verification and password reset flows are explicit when supported.
- Login failure responses stay generic across invalid user, invalid password, and disabled account states when enumeration resistance is required.
- Login throttling or rate limiting is explicit and tested for repeated failures.
- Suspended/disabled user state is handled explicitly.
- Blocked/deactivated users are denied protected actions and shown deterministic UX.
- Auth guard logic matches lifecycle state policy (no state leakage between routes).
- Lifecycle transitions (`suspend`, `block`, `deactivate`, `restore`) are audited.
- Logout clears both UI and data-fetching state.
- Session refresh and revoke/logout-all behavior is explicit and tested when supported.
- Auth events such as failed login, lockout, recovery, and sensitive-state transitions are logged when policy requires it.
- After any auth helper signature change (`start/require/get session`, role guards), all callsites are awaited and typecheck is clean (no promise-property access errors).
- MFA-selected users are always challenged again after fresh password login.
- Setup success transitions flags and method atomically enough for next server render (`selected/setup/authenticated=true`, method set).
- Challenge route redirects non-selected users to home and selected-but-unconfigured users to setup without loops.
- TOTP form blocks invalid codes client-side (not 6 digits) before remote verify call.

## Works With Technical Skills

- `supabase-operations`: provider wiring, RLS and profile sync, RPC for privileged auth transitions.
- `nextjs-static-export-reliability`: callback URL and env bake issues for static export.
- `cloudflare-operations`: preview/production callback behavior and deploy verification.
- `requirements-pack-enforcement`: source-backed auth coverage and definition-of-done gate.
- `entity-lifecycle-operations`: account lifecycle action coverage.
- `role-based-access-control`: role x action guard policy.
- `audit-logging-patterns`: transition audit trails.
- `feature-user-moderation-and-appeals`: suspension/block/appeal flows.

## Output Contract

When invoked, provide:

1. Auth architecture sketch.
2. Route protection map.
3. Provider/callback contract.
4. Risk list and validation plan.
