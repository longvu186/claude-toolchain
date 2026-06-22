---
name: tech-pitfalls
description: "Cross-project failure patterns and recovery strategies (150+ documented). Use when something breaks unexpectedly, a fix keeps regressing, or before implementing in an area with known traps such as auth/billing/webhooks, SSR/hydration, Next.js static export, imported landing pages, Postgres error codes, OAuth, migrations, Playwright/E2E, or visual regression. Trigger phrases: why did this break, recurring failure, known pitfall, regression, keeps failing. Boundary: for a NEW bug whose cause is unknown, lead with the debugging skill; tech-pitfalls is for recognizing KNOWN recurring traps and checking them before/while implementing."
---

# Reusable Tech Pitfalls

## AI Toolchain Policy Drift

- When updating cross-workspace AI/toolchain policy, scan every deployment surface for stale wording: live user-level files, Codex bridges, workspace templates, and packaged replication artifacts.
- Structural migrations need explicit sync/refresh rules. A new scaffold or template does not retire the old control plane by itself; closure must audit retired layouts, migrate active content forward, update guidance references, and remove or archive obsolete active scaffolds in the same release pass.
- When retiring an old docs surface (for example `docs/requirements/`), keep a thin pointer `README` at the retired path after archiving. Removing the path entirely breaks inbound references and agent lookup habits during transition windows.
- Release closure must advance live version manifests, deployable marker templates, packaged baselines, and parity docs in the same pass; shipping behavior without moving all four surfaces creates immediate post-release drift.
- Treat package snapshots as executable distribution assets, not archival docs; stale guidance there will be copied into future workspaces.
- For cross-workspace UI system rules, harden every high-traffic UI entry-point skill, not only the primary builder skill. If architecture, review, research, branding, packaging, or framework-specific skills keep the old guidance, page-first styling habits will leak back in through those bypass paths.
- UI consistency heuristics are softer than destructive-command heuristics. If `pre-tool-security.cjs` starts blocking normal UI repair work, keep the page-local restyle detector but downgrade it to guidance or audit mode (`allow-with-guidance`) and reserve hard denials for destructive-command and protected security-control paths.
- Re-evaluate conditional asset deployment against the current repo topology on every sync, including nested apps and secondary packages; a workspace can be version-synced while still missing newly applicable instruction surfaces.
- Session continuity bootstrap needs a fallback path: if SessionStart summary injection is unavailable, manually read the latest 3 run logs before non-trivial work and record that fallback in the current run log.
- Run-log cadence should be phase-granular, not end-only: log planned chunk milestones, refactor sessions, and issue-fix sessions so closure evidence stays complete.
- A sync is incomplete if the workspace marker is version-only; keep executable sync steps in the marker and verify both unresolved-placeholder checks and user-vs-workspace MCP server-set parity before closure.
- Make sync checklists capability-gated: when a workspace lacks specific surfaces (for example app pipelines, component trees, or DB layers), record those assets as not-applicable with explicit reasons instead of flagging false drift.
- If runtime MCP coverage is partial, do not skip closure gates; use deterministic shell evidence (asset presence, placeholder scan, server-set parity compare) and log the fallback path in the run log.
- Protected user-level template files may be unreadable through direct file APIs during sync work; use terminal-based reads as deterministic fallback and log the fallback path in the run log.
- MCP parity checks should enforce a required shared server set and explicitly allow workspace-additive servers (for example project-local tools) to avoid false mismatch failures.
- If Codex skill mirror counts drift during parity checks, rerun `~/.copilot/scripts/sync-codex-context.ps1` before re-auditing mirror totals or assuming the packaged copy is stale.
- Secret-bearing HTTP MCP servers in VS Code `mcp.json` cannot be mirrored blindly into Codex config surfaces; treat them as documented manual-parity exceptions until there is a secret-aware sync path.
- Workspace-local MCP discovery files are active configuration, not harmless placeholders: empty `{}` files at repo root or `.vscode/mcp.json` can shadow healthy user-level servers, and `.vscode/mcp.json` may need `servers` only even when root `mcp.json` carries both keys.
- Learning closure is a hard gate: if Experience Memory Curator tooling is unavailable during sync, mark the gate blocked in context/run logs and complete manual memory extraction before marking the sync complete.
- Closure enforcement is more reliable in hooks than in prose: record follow-up during the run with append-only queue artifacts plus a small unresolved-state file, then have SessionStart inject reminders for any remaining closure work.
- Hook registrations drift from prose claims during toolchain ports: "automatically" / "MUST" / "gate" language in docs does not create hook entries in `settings.json`. After every port, audit the full hook list against every automation claim in AGENTS.md and CLAUDE.md — gaps are silent until the automation is needed.
- Advisory planning rules do not hold consistently under time pressure; enforce research + micro-plan as a PreToolUse gate for actionable mutating work using same-run evidence, and deny actions when either signal is missing.
- Deployment safety checks should be command-gated, not checklist-only: block deploy/publish commands unless the same run includes frontend E2E evidence for critical navigation and API actions.
- End-of-session summaries lose decision context under long runs; write in-run live log artifacts and capture explicit decision/issue signals during execution so curation and incident review use first-order evidence.
- For Windows hook JSON, prevent known bad command forms at write time: a PreToolUse guard can scan newly added patch lines and block `windows` commands containing literal `%USERPROFILE%` or `~/.copilot`, which otherwise ship broken hook paths.
- Codex parity requires a minimum workspace file set (`.codex/config.toml`, `.codex/rules/default.rules`, `.agents/skills/README.md`); marker/version updates alone do not establish dual-tool parity.
- In non-git workspaces, reconstruct review and refresh context from recent run logs, current docs, and live template/manifest surfaces, and use tool-specific non-git fallbacks instead of treating missing `.git` as a hard blocker.

## Agent Subtask Prompt Size Limits

- In large workspaces, long `explore_subagent` prompts can fail with `invalid_request_error` for context length.
- Keep subagent prompts narrow (one objective, tight scope), and split broad discovery into multiple short searches.

## apply_patch Recovery On Dense Code Files

- If a broad `apply_patch` leaves a dense source file half-mutated, stop trying to salvage the broken middle. Rebuild from a known-good file version plus the intended changes, then rerun the narrow validation; repeated in-place rescue patches usually compound syntax drift.

## Crawl4AI PowerShell Wrapper Args

- The local `crawl4ai-url.ps1` wrapper selects output shape with `-Output`; `-Format` is not a valid wrapper parameter. Use `-Output markdown|json|html` or fall back to direct `crwl.exe -o ...` calls.

## Cloudflare Worker Secret Verification

- `wrangler secret list` alone can be misleading during outages; verify live behavior on auth endpoints and inspect deployment version bindings before concluding secrets are missing.
- Treat endpoint outcomes (`OAuth redirect` vs `?error=auth_config`) as source-of-truth for runtime auth binding state.

## Next.js Native Rebuild And Preview Inspection

- In nested-workspace Next.js rebuilds, root scripts can point at the wrong package surface; use the package-scoped build command (`npm --prefix web run build`) when the app lives under a subfolder, not the root alias.
- In repos where the root package exposes bridge scripts into a nested app, `npm run <root-alias>` is cwd-sensitive: if the shell has drifted into the child package, npm resolves against that child `package.json` and can false-fail with `Missing script`. Reset to repo root (`Push-Location <repo>`) before release-validation commands.
- A successful preview deploy does not guarantee unauthenticated browser inspection access. Treat protected preview pages as a separate verification concern and use the required bypass or authenticated inspection path before concluding the preview is visually valid.

## Imported Landing Pages In Existing Multi-Route Sites

- Treat an imported or AI-generated landing page as a route-owned slice, not a mandate to restyle the whole site. Keep shared layout chrome on inner routes and suppress it only on the imported route when needed.
- Scope imported fonts and other design tokens through route-local CSS variables so the new landing page can keep its typography without forcing a global redesign.
- If the imported visual system later needs to spread across the rest of the site, move shell changes through shared layout and presentation primitives first (`layout`, global tokens, header/footer, hero/card/detail wrappers), then audit only the remaining route files that still hardcode palette or surface classes.
- When the destination route file is only a thin wrapper around metadata and one component, recover from bad partial patches by replacing the whole file and rerunning validation; fragment edits can leave broken syntax faster than they save time.

## Shared Staff/Admin UI Primitive Layers

- If staff-facing pages keep re-implementing the same headers, panels, stat cards, badges, buttons, and feedback states locally, a nominal design system will still drift. Move that grammar into shared primitives first, then migrate one concrete workflow slice to establish the canonical composition for later screens.
- Lock primary action tokens in the shared primitive layer instead of page-level classes. Primary-button color drift is an early sign that the shared layer is incomplete.

## Shared Rich-Text Renderers And Mobile Overflow

- Raw URL strings inside shared paragraph/list renderers can create horizontal mobile overflow and noisy screenshot diffs. Shared renderers should detect URLs, emit anchors, and force wrapping (`overflow-wrap:anywhere` / `word-break:break-word`) instead of relying on content authors to format links perfectly.
- In flex/grid section shells, apparent text overflow is often caused by missing shrink safety on parent containers (`min-width: 0`, shrinkable grid/flex items), not the leaf node that visibly overflows. Audit top-level section/grid items before only patching text styles.
- Reused cross-page modules can reintroduce overflow through imported container styles even when the local page styles are correct. Any shared or borrowed module wrapper needs its own mobile shrink contract.

## Static SSR And Hydration First-Paint Drift

- In hydration-heavy static-export deployments, runtime copy guards alone do not guarantee first-paint correctness if stale text remains in static SSR HTML.
- Treat copy sources as layered contracts: static SSR entry HTML (first paint), hydration/runtime payloads (post-hydration), and runtime DOM guards (safety net).
- Close copy-fix incidents with a two-phase production check: sub-second timed probes on target routes (including `t0`) and delayed full-route marker audits across desktop/mobile.
- Framer static mirrors can split visible headings/hero text into per-letter SSR spans; raw full-string audits can pass while rendered first paint is still stale. Audit rendered text at staged checkpoints (`0ms`, `100ms`, `300ms`, etc.).
- When patching Framer hydration modules, cache-bust both HTML `script`/`modulepreload` references and `script_main` route imports. Otherwise production can replay cached chunks even when static HTML and runtime cleanup are updated.
- If runtime assets change multiple times in one release pass, advance the cache-bust token on each live-serving change and close only after the public alias references the final token and no superseded token remains in route HTML.
- In Framer static mirrors, do not append custom content near `</body>`; mount inside `[data-framer-root]` or mutate native route sections before footer-like blocks so visual order stays correct.
- Avoid repeated `outerHTML` replacement of runtime-owned sections during cleanup/capture; browser-normalized markup can detach nodes. Prefer stable IDs, in-place mutation, and tolerant capture selectors.

## Framer Static Mirror Component Mutation

- In Framer static mirrors, mutate native route/component patterns in place when they exist; replacing sections with generated cards, grids, or tables can keep copy correct while breaking visual parity and interactions.
- In Framer static mirrors, treat native table cells as layout primitives during normalization: preserve outer borders, force explicit per-cell padding/alignment, and center icon-only states, or copy can stay correct while the rendered table looks broken.
- If a Framer "native" table is actually a fake div-grid and one or more normalization passes still leave visible table defects, stop coercing the fake grid. Own the section with a semantic `<table>`, move any related CTA into the owned block, remove legacy fake-grid rows before mount, and use horizontal scroll on narrow screens instead of recreating faux-table behavior.
- Close fake-table repairs with rendered QA for header/body counts, CTA presence, legacy-row absence, and mobile overflow behavior; DOM presence and cell counts alone are not enough.
- For user-reported visual/component parity bugs, marker/token checks are weak evidence; close with rendered browser QA for visible text, native Framer classes, absence of custom generated classes/IDs, and screenshots.
- Screenshot impressions can misdiagnose duplicate or misplaced sections in Framer mirrors; verify with section-local DOM audits first (visible section count, leading text, visibility state, and nearby footer order) before changing cleanup logic.
- For route-to-route native section reuse, prefer build-time HTML injection in the patcher over runtime fetch cloning; static mirrors can make runtime fetch and hydration timing brittle.
- Generated mirror output can be hidden from normal search/indexing; verify generated HTML with direct file reads or ignored-file-inclusive search.
- Treat briefs/PDF notes as placement instructions first, not as permission to design new layouts.
- Cloned Framer nav anchors inserted after mount may route correctly but miss native hover listeners; validate hover/focus classes and, if needed, toggle the same native `hover` class only on the injected anchors.
- Route-to-route native section clones need idempotent ownership: build patchers should remove stale clone markers/sections, assert exactly one owned clone/build marker, and assert route-owned content -> clone -> FAQ/footer-like order.
- Runtime clone fallback code should dedupe existing build-time/runtime clones before patching, fetching, or cloning again; treat fallback as recovery, not a second insertion path.
- Partial Framer section clones can keep trailing direct child blocks visible after the owned sub-block; when cloning a subsection, prune or hide sibling blocks so only the block owning the target content remains, and validate with rendered visible-text counts plus inter-section gap checks instead of `textContent` alone.
- Framer SSR responsive variants inside cloned cards can duplicate visible and accessibility text; prune or `aria-hidden` non-owned direct `.ssr-variant` wrappers and verify visible/hidden variant counts on desktop and mobile.

## Monorepo Scaffold Validation

- Workspace-level checks can pass while domain pipelines are broken. For scaffold or bootstrap
  phases, close with both shared checks and the product CLI chain in one pass
  (`init -> scan -> build -> verify`) before marking the phase complete.

## CLI Command-Surface Expansion Validation

- When adding new CLI commands, close with smoke checks for every user entry path: direct command,
  workspace/root script alias, and any wrapper helper script.
- If commands support output variants (for example package folder mode and zip mode), validate each
  variant in the same run and clean temporary artifacts afterward so reruns stay deterministic.
- Keep this lane in the same closure pass as baseline checks (`check`/`test`) to catch wrapper
  argument-forwarding and platform-specific packaging regressions before handoff.

## TTS / Content-Addressable Media

- Duplicate synthesis happens when object keys are random or normalization differs across layers.
- Use a deterministic key from voice plus normalized text, then issue storage `HEAD` before synthesis/upload to reuse existing media.
- Mirror the same normalization key on client and server, and add client in-memory cache plus in-flight dedupe to collapse concurrent requests.

## HTTP / JSON Parsing

- Some APIs return JSON bodies without a `Content-Type: application/json` header; strict header-gated parsing can miss structured error payloads.
- Safer parser pattern: if content-type includes JSON then `response.json()`, otherwise read `response.text()` then try `JSON.parse(text)` and fall back to raw text.
- In client fetch flows, parse once with a tolerant helper before branching on `response.ok`; calling `response.json()` directly on error paths can throw on empty/non-JSON bodies and hide the real HTTP failure.
- In route handlers, keep a top-level `try/catch` that returns a stable JSON error envelope (for example `{ error, code }`) for unexpected exceptions so clients never receive framework HTML/empty fallback bodies.

## Regex-Based API Call Extraction Boundaries

- In regex/static-source API parsers, `URLSearchParams` extraction is incomplete if you only read constructor object literals. Also include constructor-by-reference (`new URLSearchParams(paramsObj)`) and later mutations (`params.set(...)`, `params.append(...)`) to recover query keys reliably.
- Object-field extraction for headers/query/body should include shorthand object keys (`{ mode, source }`) in addition to explicit `key: value` pairs; otherwise metadata-depth metrics can appear healthy while silently missing real fields.
- Route analyzers must slice source per route boundary (start at matched route, end at next route declaration) before extracting actions/API calls. Whole-file analysis causes cross-route contamination and false positives in workflow summaries.
- Any source-discovery stage that feeds workflow quality metrics must exclude `.test`/`.spec` files consistently across extractors; otherwise fixture code can inflate workflow totals and hide whether heuristic improvements are real.

## Supabase Browser Auth Bootstrap Readiness

- Browser auth surfaces should fail soft when public Supabase env vars are missing: block submit actions and show a direct configuration message instead of surfacing opaque auth errors.
- Keep client creation lazy behind a config guard (for example `hasSupabaseBrowserConfig` + singleton factory) so unconfigured environments do not crash during initial render.
- In Next.js App Router, avoid module-scope browser auth client initialization on reset/recovery pages; initialize in browser-only code paths (`useEffect`, event handlers) to prevent build-time non-browser runtime failures.
- Gate sign-in/sign-up actions on both config presence and initial session bootstrap readiness to avoid racey or misleading auth-state UX.
- In Cloudflare/OpenNext worker deployments, missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` at worker runtime can hard-fail login/signup submits with Zod `invalid_type` before credentials are evaluated; confirm via `wrangler tail` and fix worker bindings/secrets first.

## Supabase Auth Session Corruption + Edge Invoke Retry

- Public reset/recovery flows calling `supabase.functions.invoke()` can fail on first attempt when local auth storage contains a stale/invalid refresh token or when the edge function returns a transient 5xx.
- Use bounded recovery: clear local auth session on refresh-token corruption signals, retry the invoke once, then surface the normal error if the retry fails.
- Keep retries capped at one in credential-reset surfaces to avoid duplicate writes and to keep real outages visible.

## Async Session-Helper Signature Migration (TypeScript)

- When session/guard helpers shift from sync returns to `Promise` returns, stale callers commonly fail with `TS2339` property-access errors on unresolved promises (for example `session.userId` on `Promise<CustomerSessionRecord>`).
- Treat this as an API-contract migration, not a local refactor: convert helper signatures, run a global callsite sweep for helper names, apply `await` consistently, then rerun `typecheck`, tests, and build gates before closure.
- In endpoint-heavy repos, keep typecheck in CI so unawaited auth/session helper calls fail before merge.

## Webhook Side-Effect Persistence Before Acknowledgement

- If webhook handlers create review/audit rows without awaiting the write, operator dashboards and follow-up handlers can observe missing rows and classify valid events as unknown.
- Await persistence helper writes and return a persisted record (or explicit controlled error) before final webhook response handling.

## Supabase MFA Guard-State Consistency

- If MFA routing decisions depend on profile flags (`two_fa_selected`, `two_fa_setup`, `two_fa_authenticated`), reset `two_fa_authenticated=false` right after successful password sign-in whenever MFA is selected; stale authenticated flags can bypass challenge routes.
- Keep server guard order deterministic for MFA routes: evaluate "MFA selected" before "MFA setup complete" to avoid redirect loops and accidental setup forcing for users who never opted in.
- After `auth.mfa.challengeAndVerify()` succeeds, persist profile MFA flags in the same success path before redirecting so server-rendered guards and client auth state stay aligned.

## Supabase Migration Helper Naming + Deploy Gates

- In repos that use shared SQL helper functions, keep migration references aligned to the canonical helper names already defined in prior migrations, and gate deployment on both a clean migration inventory check and a successful `supabase db push`.

## Supabase Auth Manual Seed Row-Shape Parity

- Manually seeded `auth.users` and `auth.identities` rows can look valid but still fail sign-in if their shape drifts from a known working email-password account.
- Keep seeded auth rows aligned on four points: bcrypt cost, `auth.identities.provider_id` identity mapping (`user_id::text`), required `identity_data` keys (`sub`, `email`, `email_verified`, `phone_verified`), and non-null/normalized auth token + metadata fields.
- Treat parity as unproven until both checks pass: migration-ledger parity across local/remote and browser login verification for each seeded role persona.

## Supabase Admin Identity + Role Bootstrap

- For low-volume internal admin/staff auth, keep authorization in a dedicated app table with `role` and `is_active`, and treat env allowlists only as bootstrap fallback. Resolve privileged identity from the database first so role changes and deactivation do not require redeploying env config.
- If authenticated users need to discover only their own privileged identity row, prefer self-read RLS over broad directory access: grant `SELECT`, enable RLS, and match the active row to `auth.jwt()->>'email'` case-insensitively. This supports DB-backed role bootstrap without exposing the full admin directory.
- Stamp downstream authorization claims needed by handlers, such as `role` and optional `displayName`, into the server-side session at login time and centralize write-path checks behind one helper such as `requireAdminRole()`. Inline per-route role checks tend to drift and miss new mutation endpoints.

## Serverless CORS / Preflight

- Browser CORS failures often come from missing preflight handling, not the main POST/GET logic.
- Always handle `OPTIONS` explicitly at the route edge and return `204` with the full CORS header set (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, and when needed `Access-Control-Allow-Credentials`).
- Ensure the same CORS headers are attached to every response path: success, validation errors, and unhandled/server errors.
- Use one request-aware CORS helper and apply it consistently to avoid header drift between branches.
- Validate in production-like conditions by checking both preflight and actual method responses for CORS headers.

## Serverless Missing-Dependency Contracts

- For routes that depend on runtime secrets (object-storage tokens, provider keys), detect missing configuration at the boundary and return a controlled `503` with an actionable error code/message instead of a generic `500`.
- Keep local handler smoke tests expecting that `503` path in unconfigured environments so missing-secret behavior is treated as a known contract state, not a false regression.

## Iframe Embed Session Bootstrap Security

- For guest/embed bootstrap flows, bind signed token claims to the full session context (`session_id`, `mode`, `parent_origin`, and optional business entity id) and reject any mismatch at both create/resume and read endpoints.
- In dynamic read routes, enforce path-id-to-token-id equality before returning state; route auth alone is not enough to prevent cross-session reads.
- Use bounded TTL with explicit clamp rules and rotate token + expiry on successful reads/resumes to reduce replay windows.
- Keep signature verification constant-time and treat missing production signing secret as a deployment misconfiguration, not a silent long-term fallback.

## Cross-Service Upload Flows

- If source files already exist in object storage, prefer passing `file_url` between services over forwarding large base64 payloads.
- After successful downstream upload, immediately write back the downstream canonical model ID to the upstream system to keep repricing calls stateless and avoid duplicate upload churn.
- Do not assume upload success implies writeback success; model writeback should be a first-class stage with explicit status (`updated|skipped|failed`) and response diagnostics (`endpoint`, HTTP status, error body) so polling clients can alert on partial integration failure.

## Third-Party Forwarding Boundaries

- For proxy/bridge endpoints that forward payloads to external APIs, validate required nested shape and primitive types at route boundary before forwarding.
- Return 400 with per-field validity flags and a `required` schema object; this converts opaque downstream 4xx/5xx failures into actionable integration errors for upstream systems.

## Storybook Capture Freshness

- `storybook-static` can be stale after UI edits; for post-edit screenshot validation, capture against live Storybook dev server (`npm run storybook`).

## Artifact-Backed Screenshot Verification

- In preview pipelines that support both runtime screenshots and deterministic placeholders, image existence alone is weak evidence; persist capture metadata (for example method + source URL) and verify against that manifest.
- Split extractor quality gates into baseline completeness and metadata-depth completeness. Baseline method/URL coverage can stay green while header/query/body depth regresses.

## Screenshot-Driven Multi-Surface UI Fixes

- When a user reports several screenshot regressions across different views, treat them as one focused visual batch and gate release with one touched-surface regression spec instead of reopening the full route matrix.
- If mobile parity drift clusters around filter/sort surfaces, verify interaction state behavior first (toggle/open/close, visibility state, close affordance) before further spacing tweaks.
- Keep the regression batch route-scoped and screenshot-backed: one assertion/screenshot per changed surface, mobile viewport first when the product is mobile-first.
- For dashboard and summary surfaces, treat stat-card colors/backgrounds, text suffixes, and compact profile strips as parity-critical. If screenshots flag them, handle them as real regressions, not low-priority polish.
- When a dense desktop control does not fit mobile cleanly, swap control type by breakpoint (for example dropdown on mobile, pills or segmented control on desktop) instead of compressing the desktop pattern until it becomes fragile.

## Visualization UI Overhaul Validation

- For major visualization rewrites (for example list-style to builder/console UI), a passing static build alone is a weak release signal.
- Gate closure with three checks in one pass: build/type checks, HTTP checks for both root page and backing snapshot endpoint, and browser assertions on lane-level structure metrics.
- For static-export slices in nested workspaces, serve the generated output from the actual workspace-relative `out` path before HTTP probing; wrong serve paths can produce false failure signals even when build output is healthy.
- Prefer invariant structural assertions (headings present, card/link totals, graph-size expectations) in addition to visual checks so data-binding regressions are caught early.

## Contract-Driven Workflow Diagram Resilience

- When converting workflow semantics into node-link diagrams, derive lanes directly from the existing workflow contract (`triggers`, `conditions`, `actions`, `storage/cache/api`) instead of introducing a UI-only schema; this prevents list/graph drift.
- Keep sparse workflows renderable with explicit fallback nodes/labels per lane rather than hiding empty lanes; empty-lane diagrams reduce operator trust and parity confidence.
- Deduplicate generated edges (for example `${from}->${to}` keys) before SVG/canvas rendering; fan-out graphs otherwise overdraw duplicate paths and misrepresent execution density.

## Inspector/Drawer Context Contract In Graph UIs

- When adding a deep-dive drawer from a graph-mode inspector, keep tab taxonomy aligned across both surfaces (same tab ids, labels, and order).
- Reuse breadcrumb lineage between inspector and drawer headers so drill-down context stays stable during mode/entity pivots.
- Pair relationship/workflow canvases with synchronized detail panels; separating graph and detail contracts causes context drift and slower diagnostics.

## Third-Party Trigger Parity With Custom Dropdown Overlays

- When customizing a non-native dropdown that wraps a third-party trigger UI, keep trigger markup/styles untouched and layer only the custom menu panel.
- Route option selection through the existing control contract (sync `aria-*`, keep `change` dispatch behavior) so host runtime logic and analytics do not regress.
- Prefer wrapper/menu-level styling over trigger restyling; this minimizes parity drift when upstream trigger markup changes.
- In complex nav/header layouts with transforms or overflow clipping, mount the custom menu panel at body level (portal/floating layer) instead of as an in-container absolute panel to prevent clipped UI and dead-click perception.
- For locale/language option menus, keep option typography near nav scale (about 14-16px) and increase panel min-width to match text metrics; oversized option text can look clipped even when interaction logic is correct.

## Nested Trigger Pointer-Events Interop

- In nested trigger trees, clicks can fail when the child target has `pointer-events: none` while handlers are attached at the container/trigger level.
- Fix interop at the intended interactive node (`pointer-events: auto`) before adding extra handlers; event rebinding alone often causes duplicate or brittle click paths.
- Validate both pointer and keyboard paths (`Enter`, `Space`, `ArrowDown`, `Escape`) after the pointer-events fix to avoid accessibility regressions.

## Touch Event Ordering In Overlay Menus

- On touch devices, parent close handlers can fire before inner overlay handlers because pointer/touch/click sequencing is not always the same as desktop bubbling expectations.
- For critical overlay interactions (open/select/keep-open), bind guard logic at window capture for both press and release families (`pointerdown|touchstart|mousedown` and `pointerup|touchend|mouseup`).
- Track whether the interaction started/ended inside overlay bounds, and gate parent-close behavior on that boundary state.
- Run option-selection click handling in capture phase when overlays are nested inside other interactive containers.

## User-Facing Label Sanitization

- Never expose internal fixture, debug, or storage keys in user-facing labels.
- Add a presentation-boundary formatter that maps reserved prefixes (for example `analytics_fixture:`) to safe localized copy and falls back to a default label when the source value is internal-only.
- For ledger, history, and activity feeds, resolve user-facing titles from structured relational context first (for example linked lesson, reward, or event metadata) and use free-text note fields only as the final fallback.

## Multi-Step Flow Completion Guards

- In intro, review, or checkout-style flows, do not keep the final submit CTA disabled by setup-only guards once the user has reached the submit step.
- Split setup readiness from submit readiness (`canPrepareStep` vs `canSubmitStep`) so the completion button only depends on the state that is still relevant at the final action.

## Autodesk APS Derivative Caching

- Signed cookie values may arrive in `Set-Cookie` headers (CloudFront), not only JSON fields; parse headers and forward all signed cookies on derivative download requests.
- Root `.svf` is a zip container; read internal `manifest.json` and cache every referenced sidecar asset (for example `0.pf`, `Materials.json.gz`, `CameraList.bin`) under matching output-relative paths.
- Re-caching an existing URN should use blob/object overwrite mode (`allowOverwrite: true`) or writes can fail on path collisions.
- Nested graphics derivatives can report incomplete child status; inherit parent output-branch `status`/`progress` when normalizing viewer readiness.

## Vite Local API Testing

- In Vite dev setups with file-system API route mounting plugins, local `HTTP /api/*` calls can fail with directory-read errors (for example `EISDIR: illegal operation on a directory, read ./api`) even when handlers are valid.
- For API contract/e2e checks, prefer direct handler invocation (Node/tsx) and mock only external downstream services; this avoids dev-server route-mount instability and keeps tests deterministic.

## SPA Client-Rendered Link Verification

- Route-level HTML fetch checks can miss JS-rendered anchors and report false negatives in deploy validation.
- For SPA link-contract checks, verify links from browser DOM state or inspect deployed JS bundle tokens for expected href patterns.
- For parity-sensitive releases, gate with layered validation: lint/build/problems checks, local/live screenshots, and a live link-contract probe.

## E2E False-Positive Prevention

- End-to-end proof scripts can falsely PASS when they only assert top-level completion and do not verify required downstream side effects.
- Keep strict verdict gates as the default (assert evidence fields such as status/source and required IDs), and fail with non-zero exit when evidence is missing.
- Allow compatibility mode only behind an explicit override flag (for example `REQUIRE_FRESH_UPLOAD=0`), and never enable that override in release-gating CI.
- Shared-component UI refactors often trigger false regressions when broad E2E suites assert exact localized copy, dialog labels, or seeded catalog names on surfaces now owned by shared primitives.
- For shared UI surfaces, put stable hooks at the shared-component boundary and assert roles, structure, and state transitions there; keep copy assertions and seed-name checks in isolated copy-contract or fixture-contract tests.

## Regression Coverage Planning

- Comprehensive regression work should start from a compact coverage record in docs: critical journeys by role, touched contract surfaces, destructive/recovery paths, and named CI tiers. If that record is missing, treat it as a documentation gap before adding more E2E.
- Exploratory testing is reconnaissance, not closure. Any reproducible or release-relevant finding should be promoted into a deterministic automated test in a named tier, or recorded as an explicit tracked gap.

## Reactive UI State With Async Option Data

- Mount-only initialization can miss late-arriving option data and leave media/prompt UI blank on later steps.
- For option-driven UI (image/audio/prompt), derive rendered state from computed/reactive sources tied to option updates instead of one-time setup in `onMounted`.
- Validation should include later-step transitions (not just first render) to catch async reactivity gaps.

## React Derived View State Vs Effect Mirroring

- If a local UI state only decorates an existing source of truth from props, query params, or selection keys, avoid `useEffect` sync that immediately calls `setState` to mirror that input.
- Keep only the user-driven delta in state and derive the visible value during render; this avoids lint/compiler complaints, extra render churn, and reset loops when the canonical input changes.
- Typical pattern: store navigation offset locally, but derive the visible base item from the current selected prop/query value instead of resyncing both pieces through an effect.

## Shared Audio Preference Persistence

- For adjustable playback speed, keep preference state in one shared audio controller/composable and persist it (for example localStorage) instead of setting ad hoc rates in individual components.
- Reapply the persisted `playbackRate` on every audio element creation/play path; setting rate only at preference-change time can miss newly created elements after navigation/reload.

## Polling Pipeline Fallback Inputs

- In multi-stage conversion pipelines, derivative manifests can miss the expected downstream target even when source upload was valid.
- Preserve original source metadata (for example `sourceUrl` and `sourceFileName`) through status-poll requests so the backend can trigger a native-source fallback path when derivative target resolution fails.
- Production proof scripts should forward those fallback input fields during polling, otherwise strict checks can report false failures that only happen in test harnesses.

## API Alias Normalization

- Cross-team integrations frequently mix snake_case and camelCase payload keys.
- Accept both aliases at the route boundary and normalize once into a single internal value before downstream logic.
- Keep alias coverage in strict contract tests so casing differences do not silently regress fallback or retry paths.

## Async Writeback Orchestration

- In multi-step async pipelines, deferring downstream writeback to client polling creates timing races and extra orchestration burden for low-code clients.
- Prefer a bounded server-side follow-up loop immediately after kickoff with env-tuned attempts/intervals and a default-on, explicit opt-out request flag.
- Return a structured follow-up stage result (`updated|failed|timeout|disabled`) with diagnostics (attempts, endpoint, last snapshot) so partial success is observable without log scraping.

## High-Write Analytics / Poll I/O

- For high-frequency vote/event streams, avoid trigger-updated global stats on every write; compute aggregates in scheduled jobs (hourly/daily cron) and serve from aggregate/cache tables.
- Replace serial per-event RPC writes with batch RPC payloads to reduce round trips and remove compensating double-write patterns.
- For admin dashboards, use server-side aggregate RPCs (COUNT/GROUP BY in DB) instead of full table scans in app code.
- Before architecture planning, verify the latest applied migration/schema state; stale assumptions frequently produce invalid design decisions.
- Queue tables are not automatically the right scaling pattern; when idempotent batched direct writes meet throughput and consistency needs, prefer the simpler architecture.

## Offline-First Write Queue Durability

- For client-side offline-first writes, keep a durable local pending queue and flush on lifecycle/network signals (`beforeunload`, `pagehide`, `visibilitychange`, `online`) in addition to normal batch-size/time triggers.
- Guard flush with an in-flight lock to prevent overlapping sends; dequeue only after confirmed server success so transient network/auth failures do not silently drop writes.
- Keep flush logic source-aware at write time (include event source in payload) instead of adding post-write correction passes that increase race/consistency risk.

## Dexie Snapshot Writes + Mode-Gated Freshness

- Large IndexedDB snapshot writes can regress when one Dexie multi-table transaction carries an oversized argument signature.
- Prefer bounded write phases (`clear()` then `bulkPut()` per table) over one broad transaction for published/runtime snapshot persistence.
- Gate local-first reads behind an explicit pinned release/version flag; when no pin exists, keep online remote-first semantics to avoid stale-data regressions.

## Canonical Unordered-Pair Upsert Hardening

- For pairwise events where `(A,B)` and `(B,A)` must be the same logical record, enforce canonical pair identity in DB (for example generated `low_id`/`high_id` columns) and upsert on `(actor_id, low_id, high_id)`.
- Before adding the unique canonical index, run a one-time historical dedupe migration for opposite-direction duplicates; otherwise index rollout can fail or preserve inconsistent legacy rows.
- In `ON CONFLICT ... DO UPDATE`, update mutable metadata (for example source/timestamp) with `IS DISTINCT FROM` guards to avoid no-op write churn while preserving latest semantics.

## Fixed-Size Catalog Invariants

- For admin-managed fixed-slot catalogs (for example avatar/default option sets), enforce slot topology in DB (bounded slot range, unique order, and trigger guards for insert/delete/reorder plus immutable anchor rows), and keep clients query-driven (`ORDER BY sort_order LIMIT N`) with deterministic fallback lists.

## Text Normalization For Cross-API Terminology Matching

- When integrating systems with different terminology (e.g., Bubble field labels → DigiFabster catalog values), normalize text consistently before matching and mapping.
- **Recommended pattern**: NFKD Unicode decomposition → strip combining diacritics [\\u0300-\\u036f] → unify micro symbols (µ/μ → u) → remove non-alphanumeric chars (replace with space) → lowercase → collapse whitespace.
- Apply the same normalization on both keys (mapping dictionary keys) and input (user/payload values) to enable flexible matching across case/punctuation/diacritics variations.
- Use `normalizeText()` across all API integration layers to keep terminology-driven matching deterministic and maintainable.

## Multi-Level Fallback Resolution for Terminology Mapping

- When mapping terminology between systems, use a three-tier resolution strategy to balance precision and flexibility:
  1. **Exact match** (after normalization) — most reliable, handles canonical values
  2. **Prefix match** (either side contains the other) — handles user variations and partial input
  3. **Fallback to original** — preserves unmapped values, prevents silent failures
- This pattern prevents silent regressions where an input value is silently dropped or misinterpreted if not found in the mapping.
- Keep prefix matching broadly scoped initially (bidirectional containment); narrow scope in future if ambiguous matches regress.
- Monitor fallback-to-original hits in observability; they indicate missing mappings that should be added to the dictionary.

## Observable Unmapped Terminology Handling

- Do not silently pass through unmapped values without tracking them; unmapped terminology indicates gaps in the mapping dictionary that could cause downstream API failures.
- Log or meter calls to mapping functions that return the original value (fallback branch), so pipeline operators can identify new materials/tolerances/options entering the system.
- In test/staging, consider stricter gates that fail on unmapped values to catch missing dictionary entries before production.
- In production, err on the side of pass-through (return original) rather than dropping the value, and surface unmapped hits in alerts/dashboards for queue mapping team.

## Electron Packaged Runtime + Native Modules

- Native Node modules (for example `better-sqlite3`) can fail to load reliably when backend logic is embedded in packaged Electron runtime contexts; for desktop reliability, run backend as an external Node worker and gate renderer startup on explicit readiness checks.
- If desktop backend runs out-of-process, keep a network realtime channel (for example websocket) active even when an in-app bridge exists; bridge-only subscriptions can miss external-worker updates.
- Exclude prior release output folders from Electron packaging inputs (for example `!release-dist/**`, `!release-dist-*/**`) to prevent recursive artifact inclusion, package bloat, and disk-space failures such as `ENOSPC`.

## npm Script Argument Forwarding + Playwright List Mode

- In some npm workspace setups, running `npm run <script> -- --list` can still execute the underlying Playwright suite instead of list-only discovery.
- For safe test listing, run `npx playwright test --list` (or a dedicated script that already includes `--list`) instead of forwarding flags to a generic e2e script.
- Playwright UI mode can look empty or misleading when launch scope is implicit; run a discovery precheck (`npx playwright test --list`) before opening UI and fail fast when discovery count is zero.
- For deterministic UI visibility, launch with explicit project scope (`--project <name>` per target project) instead of relying on default project resolution.
- On Windows, Node `child_process` arg-mode launches (`spawn`/`execFile`) for `npm`/`npx` workspace commands can throw `spawn EINVAL`; prefer explicit shell command execution (`execSync` or `spawn` with `shell: true`) for those scripted calls.

## Playwright QA Script Hygiene On PowerShell

- Large inline `node -e` Playwright probes are brittle in PowerShell because nested quotes, selectors, and template strings can be mangled before Node runs.
- For medium/complex QA, use a temporary `.mjs` probe with cleanup or a browser automation tool; emit structured JSON evidence instead of relying on long inline shell snippets.

## Agent Destructive-Action Approval Gates

- In guarded agent environments, patch-based file deletion can be blocked by policy even for temporary artifacts.
- Treat file-delete cleanup as a distinct approval checkpoint: log pending deletions, get explicit scope approval, then execute cleanup.

## Playwright Environment-Gated Specs

- If a spec depends on optional setup (for example dev auth bypass or local-only server context), probe that prerequisite at test start and `test.skip(...)` with a clear reason when unavailable; this avoids false failures from environment mismatch while keeping one portable spec.
- VS Code `runTests` can report zero discovered tests for a specific Playwright file even when tests exist; when deterministic evidence is required, run `npx playwright test <file>` directly in the target environment.

## Next.js Static Export + Cloudflare Pages

- After Vite SPA -> Next App Router static-export migrations, deploy Cloudflare Pages from the generated export directory (for example `out`) instead of source app directories.
- For static export entry compatibility routes, prefer client-side redirect wrappers (`router.replace`) over server-only redirect assumptions.
- Treat build/deploy success as a runtime gate only; add a separate route-specific parity gate (desktop + mobile structural checks) before release.
- Pages custom-domain API success is not verification success: a domain can stay pending with `CNAME record not set` when required DNS records are missing; if DNS is automated through API, ensure the token has zone-level `DNS:Edit` (plus read scopes) or DNS creation will fail with auth errors.
- **`useSearchParams()` requires a `<Suspense>` boundary under `output: "export"`** (Next.js 14+/16). Any client component that calls `useSearchParams`, `usePathname` with search reads, or other CSR-bailout hooks must be wrapped in `<Suspense fallback={...}>` at its parent or build fails with `useSearchParams() should be wrapped in a suspense boundary`. Wrap at the page level when the entire page depends on the param; wrap inline when only one subcomponent needs it.

## Next.js Nested Workspace Lockfile Root Inference

- In nested app layouts where both repository root and app subfolder have lockfiles, Next.js can infer the wrong workspace root and still complete the build with only a warning.
- This warning is not harmless noise: ambiguous root inference can skew output tracing boundaries and bury real warnings in CI logs.
- For nested Next.js apps, either keep one authoritative lockfile or pin `outputFileTracingRoot` in the app `next.config.*` to the intended workspace root.

## Multi-Locale SEO Metadata Drift Prevention

- In App Router sites with mirrored locale routes, page-level metadata objects drift quickly (canonical and alternates diverge) when every route defines metadata inline.
- Prevent drift by routing all page metadata through one shared helper that uses the same route registry as navigation and locale-switch logic.
- The shared helper should generate canonical URL, locale alternates (including `x-default`), Open Graph fields, and Twitter card fields from one source payload.
- Add a lightweight metadata coverage check in closure: all public route pages should export metadata via the helper, not handcrafted per-page objects.

## Playwright + Pixelmatch Quality Gate Mode Sequencing

- Keep one route-check script with explicit modes for smoke-only, baseline-refresh, and strict visual diff instead of splitting logic across unrelated scripts.
- Strict visual mode should fail when baselines are missing or mismatch exceeds tolerance; baseline refresh should be an intentional, separate command.
- Make base URL and visual tolerance environment-configurable so the same script can run unchanged in local, preview, and CI runtimes.
- Use a deterministic local/CI gate order for UI-impacting changes: typecheck -> build -> smoke checks -> baseline refresh (when UI intentionally changed) -> strict visual checks.

## Next.js OpenNext + ESLint Generated Output

- In Next.js App Router API routes deployed with OpenNext, avoid adding route-level `export const runtime = "edge"` unless your OpenNext version explicitly supports it. Builds may fail even when plain Next.js accepts the flag; rely on OpenNext/platform runtime targeting instead.
- OpenNext/Cloudflare workflows generate `.open-next/**` and `.wrangler/**` trees that are not source-owned; linting them can introduce non-actionable failures from generated artifacts.
- Add explicit ESLint ignores for both directories (flat config `ignores` or `.eslintignore`) so `npm run lint` stays scoped to maintained source files.

## Auth Return-Path Redirect Validation

- Never trust a `redirect` query param as-is after login/signup; accept only internal relative paths that start with `/` and reject protocol-relative (`//`) or absolute URLs.
- Pair validation with a fixed safe fallback route so invalid or missing redirect values cannot cause open redirects or broken post-auth UX.
- At guard time, encode the current internal location (pathname + query) into the redirect value so post-auth return stays deterministic.
- For multi-step funnels with multiple context params (for example product/referrer/entity IDs), use one shared path-builder contract across both page-render and server-action redirect code; duplicated builders drift and silently drop context during auth or error handoffs.

## Playwright Stateful Scenario Preconditions

- Filtered E2E/capture runs can fail with missing selectors when required seed/progression state is absent; classify these first as fixture-state failures, not immediate product regressions.
- Add a fast preflight guard for stateful scenarios (required entry button, expected lesson progress/question count, or auth profile context) before core assertions.
- When preflight fails, stop early with a fixture-specific error message and a reseed/reset action so release decisions are not blocked by mislabeled UI failures.
- When a targeted assertion depends on optional seeded data that may legitimately be absent for the current account, mark just that assertion or test as skipped after the preflight check instead of failing the whole focused regression slice.

## Next.js App Router — URL-Driven Server Component Re-Fetch Anti-Pattern

- Anti-pattern: reading tab/modal/selection state from URL `searchParams` inside a Server Component with no caching. Every click changes the param, Next re-runs the whole server component, and re-fetches ALL page data — slow on edge/serverless (Cloudflare/OpenNext) + remote DB (Supabase).
- Decision matrix for fix:
  - Data already loaded and shared across tabs, must be instant → move tab/modal state to a `"use client"` component with `useState`; fetch once in the server parent and pass as props. Mirror to URL via `window.history.replaceState` for deep-linking WITHOUT triggering a re-fetch.
  - Each tab needs different/heavy data you don't want to load upfront → keep URL state but make navigation cheap: per-tab Suspense streaming (`loading.tsx`) + Next Router Cache so only the changed slice re-renders.
  - Modal that should be URL-addressable/shareable → use Intercepting Routes + Parallel Routes (`@modal` slot with `(.)` intercept) — native App Router pattern, no full-page re-render.
- Always-applicable data-layer fixes (orthogonal, apply regardless of state strategy):
  - Parallelize independent `await`s with `Promise.all`; sequential waterfalls multiply latency on serverless.
  - Never load a whole table then filter in JS — push the filter into the query.
  - Wrap hot per-request reads (auth/session checks, lookup tables) in React `cache()` to deduplicate within a single request; without it, layout guards and page guards each hit the DB separately.
  - Memoize stateless service clients (Supabase client, etc.) as module-scope singletons so they are not recreated per request.
- Large client-component extractions (~2000 lines JSX) are mechanical but high-transcription-risk. Keep JSX byte-identical and convert only interaction points (`Link` → `button onClick`, `searchParam` → `useState`); rely on `typecheck` + build to catch errors.

## Next.js App Router Migration

- In Next.js 16 App Router server routes, `params` may be Promise-typed; reading `params.slug` without awaiting can produce false not-found/404 behavior. If the signature is async, await params first.
- In App Router server auth helpers (for example Supabase server-client factories), read `cookies()`/`headers()` before env/config early returns. Deferring request-bound reads until after a guard can misclassify protected routes as static and break auth redirect behavior in production builds.
- During Vite/SPA to App Router migrations, avoid keeping non-route UI modules in `src/pages`; Next can treat `pages` as a routing surface and cause route collisions/confusing precedence. Rename to `src/views` (or similar) and keep route adapters in `app/`.
- When route contracts change (query param detail -> slug detail), keep a temporary compatibility redirect until links/bookmarks/tests are fully migrated.
- When converging split workflows into one canonical route with query modes, migrate internal links and source-aware server-action redirects in the same change; partial migration causes stale-route bounce and redirect drift.

## OAuth POST Redirect Semantics

- For POST-based auth handlers (for example login/logout), prefer `303` redirects so the browser follows with `GET`; `307` preserves `POST` and can cause confusing auth flow failures.
- Add integration assertions for both status code and `Location` on success and error branches to prevent regressions.

## Fixed-Block Scheduling Contract Migration

- When replacing free-form calendar events with fixed blocks, enforce DB enum + unique key (`user_id`, `slot_date`, `slot_block`) and role-aware RLS in the same migration.
- In server actions/services, validate actor-target permissions before upsert/delete so self-service and admin delegation rules cannot drift.

## Next.js Server Action Cross-Surface Redirects

- When the same mutation can be triggered from multiple workspace views, avoid hardcoded post-action destinations; build one source-aware redirect helper that preserves minimal context keys (for example `view`, entity/event id, and `error`).
- Pair the redirect helper with a shared revalidation helper for every affected surface so successful writes do not return users to stale queue/list state.

## Staged Route Delivery Status Drift

- In phased migrations, a route can look "implemented" while core behavior is still missing (persistence, ACL depth, realtime wiring, workflow automation).
- Use two explicit statuses in route docs and phase trackers: `Implemented (UI shell only)` and fully wired implementation.
- Ship every shell route with a graduation checklist (data reads/writes, authZ rules, workflow transitions, realtime needs) to prevent false completion signals.

## Route Discoverability Gate

- A deployment can be technically successful while users report "no new features" if new routes are not linked from authenticated landing surfaces.
- Treat discoverability as a release gate for new route groups: add at least one role-aware in-app entry surface (dashboard launchpad, primary nav, or landing quick links) and verify it in browser for target personas.
- Keep route-smoke checks as availability proof, but always pair them with one explicit UI discoverability proof step.

## Auth-Aware Root Entry Gateway

- In workflow-centric apps with role-based home routes, leaving `/` as a static scaffold increases navigation friction for signed-in users.
- Prefer server-side root resolution: read session + role/profile at `/` and redirect authenticated users to canonical role home; render workflow-entry IA only for unauthenticated paths.
- Include `/` in post-deploy smoke checks to catch redirect loops or role-home contract drift early.

## Destructive Confirmation UX Consistency

- Avoid native browser confirms (`window.confirm`) for destructive actions in app-managed admin/staff interfaces; they bypass product styling/context and drift from trust-critical UX.
- Use one shared in-app confirm dialog component for destructive flows, and support multiline impact summaries with `white-space: pre-line` rendering so risk context stays readable.
- Add a focused regression assertion that the in-app dialog appears and that no browser `dialog` event fires for the same action.

## Webhook Idempotency With Supabase + Pages Functions

- Verify webhook auth on raw request bytes before JSON parsing (HMAC/token first, parse second).
- Persist idempotency in a webhook event ledger table with a unique key on `(provider, provider_event_id)` and process state (`pending|processed|failed`).
- Treat already-processed events as successful duplicates and exit early to avoid replay side effects.
- Always close the ledger record to `processed` or `failed` with a stored error message and related entity ids for auditability.

## Service-Role vs User-Token Write Boundaries

- In user-initiated endpoints, use caller bearer token and never trust client-provided `user_id` for writes.
- Keep privileged state transitions in security-definer RPCs and invoke them from server-side functions using service role credentials.
- For scheduler/worker endpoints, allow explicit internal token or staff bearer auth, but keep database mutations server-side and privilege-minimized.

## Supabase Untyped Tables / RPCs

- When a table or RPC isn't yet in the generated `Database` type (new migration not regenerated, or intentionally omitted), `.from("table_name")` and `.rpc("fn_name")` collapse to `never` and break all chained calls.
- Workaround: cast the string identifier — `supabase.from("community_subscriptions" as never)` and `supabase.rpc("my_fn" as never, args)`. Response shape can still be typed via downstream `as { ... }[]` casts at the destructure site.
- Treat as a temporary bridge; regenerate types (`supabase gen types typescript`) before merge if feasible. Document the cast at each site so future grep can find them.

## Supabase RPC Postgres Error-Code Mapping

- Postgres `RAISE EXCEPTION USING ERRCODE = 'XXXXX'` surfaces on the client as `error.code === 'XXXXX'` on the PostgrestError. Use specific codes to communicate user-actionable conditions instead of generic strings.
- Common idiomatic codes: `23505` unique_violation (cooldowns, idempotent retries, "already done"), `22023` invalid_parameter_value ("already in correct state", invalid transition), `P0001` raise_exception (generic business-rule violation with `MESSAGE`).
- Map at the client boundary to localized toasts: `if (error?.code === '23505') toast("Bạn vừa thực hiện thao tác này, vui lòng thử lại sau")`. Avoid swallowing into a generic `"có lỗi xảy ra"` — users can't recover from that.
- Pair with `RAISE EXCEPTION USING MESSAGE = '...', ERRCODE = '...'` so logs/Sentry still see the human-readable cause.

## PL/pgSQL RETURNS TABLE Ambiguity (42702)

- In PL/pgSQL `RETURNS TABLE` functions, OUT column names share scope with local identifiers and query columns; unqualified references can fail at runtime with `42702` (`column reference is ambiguous`).
- Prevent by defaulting to `#variable_conflict use_column` in function bodies and qualifying source columns with explicit table aliases.
- Apply this proactively when OUT names overlap common fields (`id`, `status`, `offer_id`) so dry-run success does not mask write-mode failures.

## Migration + Backfill Rollout Safety Gate

- Use a four-step rollout gate for retroactive data fixes: apply migration, run backfill dry-run, run write mode, then rerun dry-run to confirm no remaining candidates.
- Treat post-write verification as mandatory evidence: capture applied count, aggregate impact (for example total days adjusted), error count, and final remaining-candidate count.
- Keep backfill scripts idempotent and mode-explicit (`--write` flag, optional `--limit`) so reruns after function fixes are safe and auditable.

## Provider-Parity Promotion Application

- For promotions/credits, keep reserve/apply behavior parity-aligned across all payment providers: if one path reserves at order creation, every paid activation path must apply consistently.
- Include equivalent non-provider activation paths (for example admin/manual activation RPCs) in the same parity checklist to avoid entitlement drift.

## Static Export New-Page Pattern Before Type Regeneration

- When generated DB types lag behind schema, keep new static pages typed with a local view model instead of importing stale generated types.
- For static-export safety, fetch public rows via REST with anon key at build time and provide deterministic fallback data on fetch/env failure.
- Pin the page to static rendering mode (for example `dynamic = "force-static"`) until runtime-dynamic behavior is intentionally required.

## Incremental Validation Under Legacy Lint Debt

- If global lint is red from unrelated debt, gate changes with scoped lint over touched files plus at least one target build command.
- Log both outcomes explicitly: scoped checks passed for changed surface, global lint remains pre-existing debt.

## Subscription Billing Patterns (provider-agnostic)

- **Never test billing flows by triggering the real provider sandbox checkout.** Sandbox runs still create persistent provider-side records, can race with webhooks, and pollute production-shaped data. Build admin-only RPCs/edge actions that simulate every state transition: comp grant (provision a paid subscription with `provider='comp'`), `force_cancel`, `extend_period`, `revoke_comp`, plus stage-advance helpers (`mark_invite_sent`, `mark_invite_accepted`). All payment/onboarding QA goes through these — sandbox is reserved for the final pre-launch end-to-end smoke test.
- **Hide provider brand names from end-users.** UI copy should describe the payment _method_ ("Thẻ tín dụng / ghi nợ", "Chuyển khoản ngân hàng", "Ví điện tử"). Keep provider identifiers (`polar`, `stripe`, `sepay`, `vnpay`, `momo`) as an internal enum in code/DB. Decouples copy from provider swaps and avoids confusing users with unfamiliar brand names.
- **Schedule plan downgrades server-side; never charge or cancel immediately on click.** Pattern: add `pending_plan_id` + `pending_plan_starts_at` columns on the subscription row. Expose a `SECURITY DEFINER` RPC (e.g. `schedule_plan_change`) that validates `auth.uid()`, target plan exists, user has an active subscription, target is cheaper than current, and target uses the same provider — then writes pending fields with `current_period_end` as the start time. Pair with a `cancel_pending_plan_change` RPC that clears them. Standard error codes: `unauthorized`, `target_plan_not_found`, `no_active_subscription`, `already_on_target_plan`, `not_a_downgrade`, `cross_provider_downgrade_unsupported`.
- **DB scheduling MUST be paired with a provider-side executor.** Pending columns are metadata-only — the user's actual subscription product at the provider does not change unless a worker (cron job, renewal webhook handler, or scheduled function) reads pending fields at `current_period_end` and calls the provider API to switch the plan. Without this executor, the downgrade silently fails and the user is overcharged on the next renewal. Always implement and verify both halves before shipping.
- **Mismatched provider downgrades are a footgun.** Reject cross-provider plan transitions (e.g. Polar→Sepay) at the RPC layer with an explicit error; cross-provider switches require cancel+re-subscribe, not in-place downgrade.

## Polar (polar.sh) — Hosted Checkout

- `POST /v1/checkouts` accepts a top-level `customer_email` field in the JSON body to prefill the Polar-hosted checkout form. Pass the verified Supabase session email so users don't retype it and Polar's customer record auto-matches the app account on the first purchase.
- Combine with `metadata.app_user_id` (or equivalent) so the webhook can reconcile the Polar `customer.id` back to the app's `auth.users.id` even before the email/customer resolution completes on Polar's side.

## TypeScript Readonly Tuple Contracts

- Arrays declared with `as const` are readonly tuples; assigning them into mutable `T[]` fields causes build-time type failures (`readonly [...]` not assignable to mutable array).
- When shared enum lists are reused across API and UI metadata, type consumer fields as `readonly T[]`/`ReadonlyArray<T>` to keep compile-time contracts aligned.

## React Derived State + Render Purity (lint reliability)

- If component state is a pure derivation of props/store/query data, compute it with `useMemo` (or inline derivation) instead of `setState` inside `useEffect`; this avoids `set-state-in-effect` violations and effect-driven render churn.
- Do not call non-deterministic time/random APIs (`Date.now()`, `new Date()`, `Math.random()`) in render paths that feed links/keys/props. Generate once in event handlers or controlled setup paths to satisfy React purity and avoid hydration/static-output drift.

## Optimistic Kanban Reorder Race Control

- In drag-and-drop boards with optimistic reorder, keep drag sources and drop zones disabled while reorder sync is in flight; concurrent drags during the same write window often cause order flapping and duplicate mutation payloads.
- Keep rollback deterministic: apply optimistic order locally for responsiveness, but on reorder API failure refetch the canonical board state (and any selected detail panel) instead of trying to patch local state heuristically.

## Static Mirror + Runtime Dynamic Imports

- For mirrored/static deployments of JS-heavy sites (Framer and similar), crawler-only asset capture is insufficient. Runtime navigation and locale switches can request lazy `.mjs` chunks that were never discovered at crawl time, causing blank pages with `Failed to fetch dynamically imported module`.
- Add a runtime-asset discovery pass using Playwright `response` events while sweeping representative routes and scrolling enough to trigger lazy loads; download missing runtime assets before packaging the mirror.
- In mirror post-processing, normalize critical third-party script URLs to canonical absolute origins (for example analytics/event scripts) to avoid local MIME/path mismatches that break module execution in static hosting.
- For local browser validation, ensure the static server serves `.mjs` as JavaScript; Python `http.server` can serve modules as `text/plain`, so prefer `serve-handler`, Vite preview, or another MIME-correct server.

## Locale Switcher Robustness In Static Mirrors

- For mirrored pages, prefer one delegated `document`-level `change` handler for locale selection over mutation-heavy rebinding per route/view update.
- Keep the locale switcher as one canonical source file and inject it into all mirrored HTML routes during build; mirrored copies should be generated from that source to prevent drift between script variants.

## Relative Internal Links In Nested Locale Routes

- In mirrored/static site builds, relative internal anchors (for example `./sponsors`) can resolve against the current nested path (`/en/venue` -> `/en/venue/sponsors`) instead of the locale root, causing broken navigation.
- Normalize internal relative anchors client-side to locale-root-aware absolute paths (for example preserve locale prefix like `/en` and resolve to `/en/sponsors`), while leaving external/hash links untouched.
- If nested-path flashes still occur before correction, intercept same-origin internal clicks in capture phase and force deterministic hard navigation (`preventDefault` + propagation stop + `window.location.assign`) before framework/router handlers run.
- Validate with an exact click-flow replay (including locale switch) and assert final URL pathname for both preview and production to catch environment-specific routing differences.

## Framer Authoring Artifact Suppression In Public Mirrors

- Framer-generated HTML can leak authoring traces (`framer.com/edit/init.mjs`, `__framer_force_showing_editorbar_since`, `Edit content`) into public mirrors, and hydration can reinsert them after initial load.
- Use a two-layer guard: strip known tooling tokens at build-time, then run runtime cleanup with `MutationObserver` that clears editorbar localStorage and removes matching nodes on each mutation batch.
- When locale picker markup is upstream-controlled, inject a deterministic style block with a stable id at build-time and normalize picker accessibility attributes (`label`, `aria-label`, `title`) at runtime so hydration updates do not regress UX.
- Gate deploy with three checks: static HTML token assertions, local Playwright UI/nav checks, and live Playwright smoke checks against the deployed URL.

## Framer Hydration Copy Source-Of-Truth

- Avoid viewport/geometry-driven split-letter remaps for semantic copy fixes; node ordering and grouping can differ between desktop and mobile and cause text corruption.
- If mirrored copy reverts after first paint, patch stale literals in hydration source modules (`framerusercontent.com/sites/.../*.mjs`) and keep deterministic runtime route rules only as a fallback safety net.
- Even after hydration-module patches are deployed, cached payloads can still replay stale text for the first paint window; treat first-frame drift as a cache-staleness class, not immediate patch failure.
- MutationObserver-only cleanup can react too late for first-frame flashes; run a short bounded warmup cleanup loop before observer-only mode to suppress late hydration reverts faster.
- Close copy fixes with a full route x viewport live marker audit plus live screenshots; spot checks are not enough when one runtime script affects every page.

## Map Embed URL Contract Stability

- Prefer explicit query-based embed URLs (place name + full address) over opaque prebuilt route payloads when copy/address parity matters; query embeds are easier to verify and less likely to drift across locales/builds.

## Production Mirror Validation Gate (Route Sweep)

- After mirror deploys, gate release with a browser route sweep over both default and localized paths that checks: fatal console/page errors (especially dynamic-import signatures), minimum rendered text length, `<html lang>` correctness per locale, and locale-switch navigation outcome.
- Include controlled scrolling in validation runs to trigger below-the-fold lazy assets; many dynamic-import gaps only appear after scroll-triggered runtime loads.

## Protected Preview Endpoint Contract Verification

- In protected preview/staging deployments, endpoint checks that fetch remote fixture URLs can fail with 401/403 when bypass context is not propagated to the nested source fetch.
- To isolate handler logic in contract verification, prefer inline payload fields (raw text/base64) over source URL fields when the endpoint supports both.
- If URL-source behavior must be verified, bootstrap preview bypass first and replay the same auth context for both the route call and the upstream source fetch.

## Serverless Post-Response Side-Effects (Vercel/Next.js)

- A bare un-awaited `fn().catch(console.error)` fired during a request handler is silently dropped on Vercel: the function freezes once the HTTP response returns, killing the in-flight promise mid-work. Symptom: a DB "sent"/status flag the function sets FIRST gets persisted, but the slower follow-up (SMTP send, webhook POST, third-party API) never completes — looks done, no delivery, no error logged. Fix: wrap deferred work in `after()` from `next/server` (or `waitUntil()` from `@vercel/functions`). Awaited sends in cron routes / server actions are unaffected. Rule: "never await email in the response path" is WRONG on serverless — use `after()`/`waitUntil()`, never a bare un-awaited `.catch()`. (BSides Hanoi 2026-06-08: registration emails silently never sent for exactly this reason.)

## Migration-In-Repo Is Not Migration-In-Prod

- Symptom: runtime `42703 column does not exist` for a feature that was code-reviewed and merged; the migration file exists in the repo. Root cause: the migration runner is manual / not wired into deploy, so the file was committed but never applied to prod. Fix: verify applied state against prod (`select column_name from information_schema.columns where table_name=...`, or a migrations-tracking table) before trusting a column-gated feature; wire migrations into the deploy pipeline or add a startup assertion. A column-gated feature is not "done" until the column is confirmed present in prod.

## Component-Isolation Tests Create False Confidence

- A standalone "it works" check (e.g. a script calling the SMTP transport directly, a unit test of one function) can pass while the integrated feature fails in prod, because it bypasses the real path: DB idempotency columns, platform lifecycle (serverless freeze), auth middleware, env resolution. "The test passed" != "the feature works in prod." For email/webhook/payment side-effects the only reliable proof is triggering the real route with a real/staging payload and confirming the downstream effect (delivery, DB state change, third-party receipt) — not just an HTTP 200.

## Swallowed Errors Hide Prod Failures

- `.catch(console.error)` on a critical side-effect (email, payment write, audit log) makes a hard runtime error invisible: the endpoint still returns success and monitoring sees nothing. For anything the product depends on, surface failures — write an error column, emit a structured error-level log, show a visible operator status, or rethrow when the caller must retry. Reserve bare `.catch(console.error)` for truly optional side-effects.

## Code-Tracing Is Not Runtime Verification

- Reading code proves intent, not runtime state. Answering "is X working?" by tracing code alone misses env vars not set, migrations not applied, and platform-lifecycle behavior. "Verify before done" spans three layers: logic (review) + environment (env vars present, schema matches code) + runtime (exercise the integrated path end-to-end against the target env, confirm the downstream effect). Heuristic: if a feature touches email / payments / DB-schema / auth, do not mark it done without a prod-environment smoke test.

## Zod datetime-local Schema Validation Mismatch

- HTML `<input type="datetime-local">` produces naive strings like `2026-12-31T23:59` with no timezone offset.
- `z.string().datetime({ offset: true })` (Zod's default for datetime) rejects these with a validation error because no offset is present.
- Fix: use `z.string().optional().nullable()` (or `z.string().nullable().optional()`) for any schema field backed by a `datetime-local` input. Pair with server-side coercion to UTC if you need to store a real timestamp.
- Apply to all admin form schemas that include date/time pickers — the mismatch is silent in dev if the field is optional and only surfaces as a 400 on submit.

## Idempotent Claim / Counter-Increment Pattern

- When a counter (e.g. usage_count, redemption_count) must be incremented exactly once per qualifying event, avoid a simple read-then-increment — concurrent calls will double-count.
- Safe two-step pattern:
  1. `UPDATE resource SET claimed_at = NOW() WHERE id = $id AND claimed_at IS NULL RETURNING foreign_key_id` — the guard column (`claimed_at`) acts as an atomic mutex; only one concurrent call wins a row.
  2. If a row was returned, increment the counter on the related table: `UPDATE parent SET counter = counter + 1 WHERE id = $foreign_key_id`.
- Re-runs (retry, webhook replay) return no row → skip increment → no double-count.
- Generalizes to any "do once" claim: discount redemptions, coupon uses, seat reservations. Choose the guard column based on the event lifecycle (claimed_at, used_at, locked_at).
