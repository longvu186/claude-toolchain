---
name: tech-pitfalls
description: "Cross-project failure patterns and recovery strategies (150+ documented). Use when something breaks unexpectedly, a fix keeps regressing, or before implementing in an area with known traps such as auth/billing/webhooks, SSR/hydration, Next.js static export, imported landing pages, Postgres error codes, OAuth, migrations, Playwright/E2E, or visual regression. Trigger phrases: why did this break, recurring failure, known pitfall, regression, keeps failing. Boundary: for a NEW bug whose cause is unknown, lead with the debugging skill; tech-pitfalls is for recognizing KNOWN recurring traps and checking them before/while implementing."
---

# Reusable Tech Pitfalls

## GitNexus Pre-Commit Gate Ordering

- Run `impact` on every modified function BEFORE `git add`, not after commit. CLAUDE.md in indexed repos makes this a hard requirement.
- A CRITICAL blast-radius on a function with an unchanged signature and return type reflects call-graph width, not correctness risk. TypeScript typecheck is the correctness gate; GitNexus impact rating is the change-scope gate. Both are needed; neither replaces the other.
- Workflow: identify modified functions → run `impact` each → if HIGH/CRITICAL surface blast radius to user before staging → run `detect_changes()` after staging before committing.
- `detect_changes({scope: "all"})` over a large uncommitted batch (many files, several unrelated slices of work) can exceed the MCP tool's max-token response size — it fails with "result exceeds maximum allowed tokens" and auto-saves the full JSON to a local tool-results file instead. Don't treat the failure as "the check didn't run": read the saved file with `Read`'s `offset`/`limit` (or `jq` for structured queries) rather than retrying the same call. Prefer `detect_changes({scope: "compare", base_ref: "<default-branch>"})` up front when the working tree already carries a large backlog — a diff scoped against the base branch is usually smaller than `scope: "all"` and less likely to hit the limit at all.
- `detect_changes({scope: "all"})` counts every unstaged change sitting in the working tree, including files that have nothing to do with the commit being prepared (e.g. leftover unrelated doc edits from an earlier pass). Before attributing a `scope:"all"` risk level solely to the change you're about to commit, run `git status` first and separate real signal from working-tree noise — `scope:"staged"` excludes the noise entirely if the spec/task doesn't specifically require `scope:"all"`.
- A file rewritten with different line endings by a post-edit auto-format hook shows as a 100%-line-changed diff — every symbol in that file gets flagged "touched" in `detect_changes` even when only one function's body actually changed. Confirm with `git diff --cached -- <file>`: if every hunk is a paired remove+add with byte-identical content except inside the function you actually edited, it's a line-ending/formatting artifact from the hook, not a real change to the rest of the file — don't let it inflate the reported blast radius.
- When `impact()` returns HIGH/CRITICAL because you're **widening a union type** or **adding an optional parameter** to an exported symbol, the specific thing to check at each real call site is exhaustiveness: a `switch`/`match` over the union with no `default` case breaks on a new variant, but a passthrough assignment (`type: value.type`) or a call site that doesn't pass the new optional param does not. Read every real call site before concluding "it's additive, so it's safe" — additive changes are only safe when nothing downstream is exhaustive, and that has to be verified, not assumed from the change's shape.
- A third `detect_changes` false-signal shape, distinct from the `scope:"all"` unstaged-noise pattern and the format-hook line-ending-rewrite pattern above: **large insertions earlier in a file shift line numbers enough that an untouched function well after the insertion point gets misattributed as "touched."** Confirmed twice in one session — an untouched component ~200 lines after an edited region, and several untouched interface properties in a different file. Verify with `git diff -U0 <file> | grep -E "^@@"` to list every actual changed hunk's line-range, then check whether the flagged symbol's own declared start/end lines fall inside any hunk — if not, it's a line-shift misattribution, not a real change. (Format-hook rewrites flag the _whole file_; `scope:"all"` noise flags _unrelated files_; this one flags a real, same-file, but wrong symbol.)

## `git add <path>` Stages The Whole File, Not Just Your Intended Diff

- `git add <path>` / `git commit` (without `-a`) always stages a path's entire current working-tree content — not a targeted hunk. In repos that habitually carry legitimate, already-decided work uncommitted for a while, touching any file for a small, unrelated fix silently carries along whatever else was already sitting in that file, and a reviewer (human or subagent) can misread the resulting diff as undisclosed scope creep or a regression.
- Before staging/committing a file you didn't fully author in the current task: `git diff HEAD -- <path>` (or `git diff --cached` before committing) and explicitly separate "my intended change" from "whatever was already there." Never assume a large diff in a touched file is scope creep — check whether the content already existed in the commit _before_ your task's own changes (`git show <prior-commit>:<path>`) before reverting or flagging it.
- To stage only part of a file's changes, use `git add -p` (interactive hunk selection) or a hand-built patch (`git apply --cached`, verified first with `--check`) when the intended hunk is adjacent to unrelated pre-existing changes that `-p` can't cleanly separate.

## Committing A Large Uncommitted Backlog: Bare `commit` Ignores Your `add` Pathspec, And `reset --soft` Targets Need Double-Checking

- `git commit -m "..."` with **no pathspec commits whatever the index currently holds**, not just the paths you just `git add`ed. Excluding a file from `git add` (e.g. `git add docs ':!path/to/risky-file'`) does nothing to protect you if that file was _already staged_ from before the session — it rides along into the commit regardless, because the exclusion pathspec only affected `add`, and `commit` re-reads the whole index. Fix: when a backlog commit must exclude a specific path, pass the **same explicit pathspec to `git commit` too** (`git commit -m "..." -- <paths>`), not only to `git add`. Before committing any large uncommitted backlog, run `git status`/`git diff --cached --stat` immediately before the commit (not just before the `add`) to confirm the index matches intent.
- If a bad commit needs undoing with `git reset --soft <target>`, verify `<target>` against **both** the intended undo-scope and `origin/<branch>` — picking a commit just because it "matches origin" isn't enough if there were also legitimate local commits further back that predate the mistake. Explicitly enumerate the range being undone first: `git log --oneline <target>..HEAD`, confirm it's exactly the commits you mean to undo, before running the reset. A soft reset preserves the working tree, so recovery from a wrong target is possible (`git diff <target> -- . ':!<known-excluded-paths>'` should come back empty/explainable) — but verify tree identity and `git rev-list --count HEAD..origin/<branch>` (confirms nothing was ever pushed) before recommitting, don't assume.

## Local Copy / Domain Constant Sync Gap

- When a `"use client"` component cannot import a `as const` domain array (for example to avoid bundling domain logic into the client chunk), a local numeric/string array copy may exist. These are synced by convention, not by import, and TypeScript will not catch divergence.
- Pattern: before editing a domain constant array, grep for inline literal copies with the same values in component files. Rename-and-import or add a runtime assertion if the gap is high-risk.

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

## Bash Env Var Written After The Command Silently Becomes A Positional Arg

- `command VAR=value` (var assignment placed AFTER the command, e.g. after `node -e '...'`) does NOT export `VAR` into that command's environment — it's parsed as a trailing positional argument instead, so `process.env.VAR` is `undefined` inside the command. Prefix form (`VAR=value command`) or `export VAR=value` beforehand are the only two shapes that actually set it.
- Concretely dangerous when the undefined value is interpolated into a secret/connection string and written to a file (`.env`/`.dev.vars`) — the result is a file containing the literal substring `undefined` in place of a credential, which then fails downstream with a generic/misleading connection or auth error instead of an obviously-wrong value.
- Prevention: after constructing any secret/connection-string value from shell variables, print a redacted shape-check (length, prefix, absence of literal `undefined`/`null` substrings) immediately after writing it, before relying on it in any downstream step — never assume a shell variable substitution succeeded silently.

## Cloudflare Worker Secret Verification

- `wrangler secret list` alone can be misleading during outages; verify live behavior on auth endpoints and inspect deployment version bindings before concluding secrets are missing.
- Treat endpoint outcomes (`OAuth redirect` vs `?error=auth_config`) as source-of-truth for runtime auth binding state.

## Next.js Native Rebuild And Preview Inspection

- In nested-workspace Next.js rebuilds, root scripts can point at the wrong package surface; use the package-scoped build command (`npm --prefix web run build`) when the app lives under a subfolder, not the root alias.
- In repos where the root package exposes bridge scripts into a nested app, `npm run <root-alias>` is cwd-sensitive: if the shell has drifted into the child package, npm resolves against that child `package.json` and can false-fail with `Missing script`. Reset to repo root (`Push-Location <repo>`) before release-validation commands.
- A successful preview deploy does not guarantee unauthenticated browser inspection access. Treat protected preview pages as a separate verification concern and use the required bypass or authenticated inspection path before concluding the preview is visually valid.
- Before assuming plain `next dev`/`next build` works, check for project-specific multi-target build scripts (e.g. separate admin/public build entrypoints that stash-and-restore overlapping route groups). A project with custom build tooling can make the framework's own default command fail or behave differently from what actually ships; grep `package.json` scripts and any `scripts/build-*` files first.

## Served URL ≠ Filesystem Path (don't string-strip a build path into a URL)

- A framework's on-disk build/output dir is not its public URL. **Next.js serves the `.next/static/` dir at the URL `/_next/static/`** (not `/static/`), optimized images at `/_next/image`; **Vite** serves hashed assets under `/assets/` and `public/` at root; **CRA/webpack** emit under `/static/`. Deriving a URL by stripping the fs prefix (`.next/…` → `/…`) silently produces a 404 (often served as an HTML error page, so a status check "passes" with the wrong content-type). Look the prefix up; don't compute it from the path.
- `public/` (Next) / `static/` (many frameworks) is served at site root **live from disk** — editing a file there needs no rebuild, unlike hashed build assets.
- Public env vars (`NEXT_PUBLIC_*`, `VITE_*`, `REACT_APP_*`) are inlined into the client bundle at **build** time; changing one requires a rebuild, not a restart. Verify by grepping the built client bundle for the value.
- Record these deterministic facts (served-URL prefixes, ports, output/DB paths, key var names) in the project's `commands.md` "Paths, URLs & key variables" block per the `knowledge-cache` skill, and read them before constructing any URL/path/port.

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

## SQLite Idempotent Column Migrations (better-sqlite3)

- SQLite has **no `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`**, and `CREATE TABLE IF NOT EXISTS` will not add columns to a table that already exists — so a re-runnable migrate script cannot upgrade a live DB just by editing the `CREATE TABLE` in `schema.sql`.
- Guard each added column: read `PRAGMA table_info(<table>)`, skip if the column is already present, else run `ALTER TABLE <table> ADD COLUMN ...`. Keep the column in BOTH `schema.sql`'s `CREATE TABLE` (fresh DBs) and the guarded ALTER in the migrate script (existing DBs).
- Added columns need a **constant** default (`NOT NULL DEFAULT 1`); SQLite rejects non-constant defaults on ALTER.
- After adding columns, sweep aggregate queries: capacity/stats counts that were `COUNT(*)` may need `SUM(quantity)` once one row represents multiple units.

## Multi-Tenant API: A Second, Finer-Grained Scoping Param May Be Required

- If an endpoint 400s with "missing data: X, Y" for a required param that seems present, check for a
  **second, finer-grained scoping param** the UI never surfaces a selector for — e.g. a request scoped
  by a company/org/tenant-level ID alone can require a brand/workspace/sub-tenant-level ID too, when
  that parent entity turns out to span multiple children.
- Don't guess or give up: enumerate the finer-grained IDs from a sibling list endpoint (e.g.
  `/brands?company_uid=X`) rather than trial-and-error, then pin the correct child ID explicitly in
  every subsequent call.

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

## Preview/Demo Code Paths That Duplicate Timing Logic Diverge Silently

- When a preview/demo rendering branch (e.g. `?preview=1`) duplicates timing/animation/interval logic from the "real" code path instead of sharing it, the two are not automatically kept in sync. Concrete instance: a countdown's decrementing `setInterval` lived only inside the real path's function, while the preview branch returned early before ever calling it — so preview showed a static initial value forever. Typecheck/lint/build/unit tests all passed cleanly; only watching the rendered UI over time caught it (a single static screenshot doesn't show it either — needs two observations seconds apart, or a DOM value read after a wait).
- Confirmed instance of why screenshot/rendered verification catches bugs code-inspection and a green build cannot. When a preview/demo path is added, grep for whether it reuses the real path's effect/interval, or re-implements it — re-implementation is the risk signal, not a code smell to dismiss.

## Storybook Capture Freshness

- `storybook-static` can be stale after UI edits; for post-edit screenshot validation, capture against live Storybook dev server (`npm run storybook`).

## Artifact-Backed Screenshot Verification

- In preview pipelines that support both runtime screenshots and deterministic placeholders, image existence alone is weak evidence; persist capture metadata (for example method + source URL) and verify against that manifest.
- Split extractor quality gates into baseline completeness and metadata-depth completeness. Baseline method/URL coverage can stay green while header/query/body depth regresses.

## `fullPage` Screenshots Show Lazy Images As Blank — Not A Broken Path

- `page.screenshot({fullPage:true})` expands the viewport but does NOT reliably trigger
  `loading="lazy"` images below the original fold. Result: a full-page capture with empty
  image cards that looks exactly like broken `src` paths or missing asset files.
- Do NOT diagnose missing images from a fullPage screenshot alone, and do not start "fixing"
  asset paths off that evidence. Confirm the actual state first, cheapest check first:
  `curl -o /dev/null -w "%{http_code} %{size_download}"` the asset URL, then in-page assert
  `naturalWidth > 0`.
- To capture correctly, force-load and await decode before shooting:
  ```js
  const imgs = [...document.querySelectorAll("img")];
  imgs.forEach((i) => (i.loading = "eager"));
  await Promise.all(
    imgs.map((i) =>
      i.complete
        ? null
        : new Promise((r) => {
            i.onload = r;
            i.onerror = r;
          }),
    ),
  );
  return imgs
    .filter((i) => !i.complete || i.naturalWidth === 0)
    .map((i) => i.src); // [] == all good
  ```
- The same evaluate pass is the right place to collect layout evidence that eyeballing a
  screenshot gets wrong: compare `getBoundingClientRect()` tops/heights per grid row instead of
  judging alignment visually. Apparent "misalignment" in a card grid is usually just text
  wrapping to a second line (cards not equal-height), which is a component-wide pre-existing
  trait — measure before treating it as a regression you introduced.
- If the first `browser_take_screenshot` after a heavy force-load times out on "waiting for
  fonts", simply re-issue it; the second call succeeds against the now-warm page.

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

## Playwright `page.evaluate()` Under tsx: `__name is not defined`

- Passing a TS function reference (arrow or named) containing **nested named function declarations**
  to `page.evaluate()` while running the script via `tsx` throws `ReferenceError: __name is not defined`
  inside the browser context. Cause: tsx/esbuild wraps named functions in a `__name(fn, "name")` helper
  for stack-trace fidelity at compile time; Playwright serializes the evaluate callback via `.toString()`
  and ships that compiled wrapper reference into the browser sandbox, where `__name` doesn't exist.
- Fix: pass browser-side evaluate scripts as a plain JS string, or restrict the passed function to
  arrow functions with zero nested named function declarations, whenever the calling script itself runs
  under `tsx`.

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

## OpenNext/Cloudflare Silent Static-Route Drop (build log lies)

- A route can be reported as a successfully generated static (●) route in the Next.js build log while **no file is actually written to disk** for it — with no build warning or error anywhere. Bitten twice on the same project: (1) two routes in different route groups sharing a terminal URL segment (`(auth)/login` and `pos/login` both flatten to basename `login` since route groups are invisible in the URL — the second one silently wins, the first's output never lands), and (2) data-reading admin pages that "looked" static-eligible to Next's optimizer despite reading session/live data.
- This is invisible in `next dev` (which never exercises the static-output-writing path) and only surfaces as a **404 on the deployed artifact** for a route the build log claims exists.
- Standing rule: any route segment that reads cookies/session or live per-request data should carry an explicit `export const dynamic = "force-dynamic"` — don't rely on Next's static-eligibility inference to guess right. Apply it at the layout level when every page under it is auth-gated (for example an admin layout), not per-page.
- Route-reachability must be HTTP-verified against the actual deployed artifact after every deploy (`curl -I` or Playwright each critical route) — never trust the build log's own "generated N static pages" success claim for routes that matter. This is the OpenNext/Cloudflare-worker-adapter analog of the `output: "export"` static-export pitfalls in `frameworks/nextjs-static-export-reliability`; that skill's build checklist applies here too even though this project isn't in export mode.

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
- **Dedup check must query state the handler itself owns** — e.g. "does a row already exist in the ledger/audit table THIS webhook handler writes to." Never infer "already processed" from a status column a DIFFERENT writer sets (for example a synchronous edge/API call that eagerly flips `status='captured'` for immediate UI feedback, before the webhook ever fires). If the webhook's dedup check reads that other writer's column, it reads "done" on every NORMAL delivery, not just genuine redeliveries — the handler silently no-ops forever and its real side effect (e.g. writing the ledger entry) never happens. Symptom: the "success" response and status column look correct, but a downstream table that only the webhook populates stays permanently empty — caught only by checking that table directly, not by trusting the 200 response.

## Webhook-Only Ingestion Misses Backlog — Pair With a Reconciliation Sweep

- Any purely webhook/event-driven ingestion (incident triage, sync, notifications, indexing) structurally sees ONLY events that fire after wiring. Pre-existing open items, and anything dropped while the receiver was down/misconfigured, are invisible forever — the pipeline looks "done" while silently missing the entire backlog. This is a design gap, not a bug, and it won't surface in any test that only sends fresh events.
- Always ship a companion **reconciliation sweep**: a deterministic job that pulls the provider's currently-OPEN items via its query/list API and feeds them through the same downstream path (or writes them to the same queue) as live webhooks. Run it once at cutover to drain the backlog, then on a schedule as a safety net for missed deliveries.
- Make the sweep **idempotent** and **escalate/surface-only**: dedupe against items already open (by a stable fingerprint), and never let a sweep mass-_act_ on a backlog (a reconciliation surfaces; the live path with its guardrails acts). Use the SAME fingerprint scheme on both paths or they won't dedupe against each other (e.g. Sentry: key both the webhook normalizer and the sweep on `shortId`, since the list API exposes `shortId` while the webhook payload also carries it — a numeric-id-vs-shortId mismatch double-surfaces every issue).
- Watch the auth asymmetry: the live receiver only needs to _verify_ inbound signatures, but the sweep needs _read_ credentials for each provider's list API — which may be a different/broader token, or only available via an MCP/OAuth session rather than the plain runtime. If a provider can't be swept (no read token), log that gap explicitly rather than silently covering fewer sources.

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

## PostgREST Silent 1000-Row Cap On Client-Side Aggregation

- `supabase-js` `.from(table).select(columns)` with filters but no `.range()`/`.limit()` is silently capped by PostgREST's `db-max-rows` (default 1000). No error is thrown — the query just returns the first 1000 matching rows and stops. Invisible in dev/testing with small datasets; only manifests once real row volume for that filter crosses the threshold, and gets worse over time as data grows.
- Concrete failure: a finance dashboard summed `community_orders` client-side with `.reduce()` for a YTD card; once paid orders for the year passed 1000, revenue silently under-reported by exactly the sum of the rows past the cap. Sibling MTD/QTD cards on the same page looked fine only because each stayed under 1000 rows individually — a false all-clear.
- Fix: never client-side sum/count/reduce over an unbounded or growing `.select()` result. Aggregate server-side via a Postgres RPC (`SELECT SUM(...) FROM table WHERE ...`, `SECURITY DEFINER`) or a view — PostgREST's row cap only applies to raw table/view REST reads, not to RPC return values.
- Detection heuristic: grep for `.select(` followed by `.reduce(`, `.length`, or manual summation with no accompanying `.range()`, especially on tables that grow unboundedly over time (orders, transactions, events, logs) filtered by date range or status.

## PL/pgSQL RETURNS TABLE Ambiguity (42702)

- In PL/pgSQL `RETURNS TABLE` functions, OUT column names share scope with local identifiers and query columns; unqualified references can fail at runtime with `42702` (`column reference is ambiguous`).
- Prevent by defaulting to `#variable_conflict use_column` in function bodies and qualifying source columns with explicit table aliases.
- Apply this proactively when OUT names overlap common fields (`id`, `status`, `offer_id`) so dry-run success does not mask write-mode failures.

## Nested Aggregate Functions In jsonb_agg (42803)

- Postgres rejects an aggregate call (`AVG()`, `COUNT()`, `SUM()`, etc.) placed as a direct argument inside another aggregate (for example `jsonb_agg(jsonb_build_object(..., 'x', AVG(t.v)))`) in the same `SELECT` scope — fails at execution time with `42803: aggregate function calls cannot be nested`.
- Fix: compute the per-row aggregate in an inner subquery with its own `GROUP BY` so each group collapses to one pre-aggregated row, then `jsonb_agg()` that row in the outer query: `SELECT jsonb_agg(row) FROM (SELECT jsonb_build_object('x', AVG(t.v)) AS row FROM t GROUP BY t.k) sub`.
- The broken form is syntactically valid SQL — it passes `tsc --noEmit` and a code-only review, and only fails when actually executed. When writing or reviewing any jsonb-building RPC with computed per-group stats, check specifically for this nesting shape in every function, not just once per file: having written the subquery-wrap pattern correctly in a sibling function in the same migration does not prevent repeating the flat-nested mistake in the next one.
- Backend RPC changes should be exercised end-to-end (actually called against real data) before being considered verified, not just read for syntax correctness — the same principle as "UI validation is screenshot-backed, not code-inspection-only," extended to SQL execution paths that TypeScript has zero visibility into.

## RETURNS TABLE Column Rename Needs DROP + CREATE

- `CREATE OR REPLACE FUNCTION` cannot rename or retype a column in a `RETURNS TABLE (...)` signature; Postgres rejects the replace outright. Renaming/retyping requires `DROP FUNCTION IF EXISTS public.fn(args);` followed by a fresh `CREATE FUNCTION public.fn(args) RETURNS TABLE (...)`.
- `DROP FUNCTION` also drops every `GRANT` on that function. Always re-run `GRANT EXECUTE ON FUNCTION public.fn(args) TO <roles>;` immediately after recreating, or the function silently becomes inaccessible to roles (`anon`, `authenticated`) that could call it before — this surfaces later as a permission-denied error, not at migration time.
- Applies to any Postgres RPC signature change, Supabase or otherwise, whenever a `RETURNS TABLE` column list's names or types change shape.

## Postgres NULL Silently Defeats `!=`-Based Authorization Guards (3-Valued Logic)

- `IF auth.uid() != v_row.owner_id THEN RAISE EXCEPTION ...` (or any `IF <NULL-comparison> THEN raise`) is NOT a safe ownership guard. Postgres uses 3-valued logic: `NULL != x` evaluates to `NULL`, not `TRUE`, and `IF NULL THEN ...` behaves exactly like `IF FALSE` — the raise is **skipped**, not triggered. An unauthenticated/`anon` caller (where `auth.uid()` is `NULL`) sails straight through every guard written this way.
- This is generic Postgres semantics, not Supabase-specific, but it bites hardest in Supabase's `SECURITY DEFINER` RPCs exposed over PostgREST, where `anon` frequently has default `EXECUTE` (see "New `public` tables inaccessible..." and the PUBLIC-grant entry below) — the NULL-bypass plus a default grant is a real, exploitable authz hole, not theoretical.
- Fix: add an explicit `IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;` guard at the top of every function that later compares `auth.uid()` to anything — this makes every downstream `!=`/`=` comparison NULL-safe by construction. Verify empirically, don't just trust the fix by reading it: `SELECT (NULL::uuid != gen_random_uuid());` returns `NULL`, and `CASE WHEN NULL THEN 'raise' ELSE 'skip' END` confirms `'skip'`.
- Audit trigger: any Postgres project's security advisor (`supabase db advisors` or equivalent) that flags `anon` `EXECUTE` on a `SECURITY DEFINER` function should prompt grepping that function's body for `auth.uid() != `/`auth.uid() = ` comparisons with no preceding NULL guard — treat every hit as a confirmed bypass until proven otherwise.

## Postgres Default EXECUTE Grant Lands On `PUBLIC`, Not On Named Roles — `REVOKE ... FROM anon` Alone Is A No-Op

- Every role (including `anon`/`authenticated`) implicitly inherits whatever privileges the `PUBLIC` pseudo-role holds, and a newly `CREATE FUNCTION`'d Postgres function grants `EXECUTE` to `PUBLIC` by default. `REVOKE EXECUTE ON FUNCTION f() FROM anon;` does nothing observable because the grant it's trying to remove was never on `anon` in the first place — it's on `PUBLIC`, and `anon` still executes fine through inheritance.
- Verify with `has_function_privilege('anon', 'f()', 'EXECUTE')` before AND after any revoke — a revoke that "worked" without this check is unverified.
- Correct lockdown: `REVOKE EXECUTE ON FUNCTION f() FROM PUBLIC;` then explicitly `GRANT EXECUTE ON FUNCTION f() TO <intended-role>;` for each role that legitimately needs it. Applies to any newly created `SECURITY DEFINER` function meant to be privileged/internal-only (admin RPCs, trigger-only functions, ops/cron endpoints) — the safe default posture is revoke-from-PUBLIC-then-allowlist, not "revoke from the specific role I'm worried about."

## Cloudflare Hyperdrive False "Invalid Database Credentials" Against Supabase Postgres

- Symptom: `wrangler hyperdrive create` against a Supabase Postgres direct-connection endpoint fails with Cloudflare-side error code 2013, "Invalid database credentials" — even though the exact same credentials connect successfully both directly and through Supabase's Supavisor pooler from the same machine.
- Root cause: an IPv6/network-reachability quirk on Cloudflare's Hyperdrive validation path against this class of endpoint, not an actual credential problem.
- Fix: before concluding the credentials are wrong, verify the same credentials work via a direct/pooled connection test from elsewhere. If Hyperdrive keeps failing, consider dropping it and connecting directly from the Worker instead — `postgres-js` supports raw TCP natively via `cloudflare:sockets` when the Workers runtime is detected (needs `nodejs_compat`), so a Hyperdrive binding isn't a hard requirement to reach Postgres from a Worker.

## Supabase Supavisor Pooler Mode Selection For Serverless/Edge Postgres Clients

- Supavisor's **transaction-mode** pooler (port 6543) does not support session-scoped prepared statements — construct `postgres-js` with `{ prepare: false }` (and typically `max: 1` per Workers isolate) when connecting through it, or every prepared-statement query fails.
- The **session-mode** pooler (port 5432) does support prepared statements (matches Drizzle's default query behavior with zero code changes) but pins one Postgres backend per client connection — less appropriate for a serverless/edge deployment that wants many short-lived connections.
- `drizzle-kit` only auto-loads a plain `.env`, not Wrangler's `.dev.vars` — source it manually before running `generate`/`migrate` locally: `set -a; source .dev.vars; set +a`.

## Supabase/PostgREST Layered Overload Diagnosis Ladder

- Symptom cluster: uniform REST `503`/`504` across every table including trivial ones, a client `OPTIONS 200` with no matching `GET` completion, and `execute_sql`/direct-connection queries timing out even on `SELECT 1` while the platform's HTTP management API (project info, logs) still responds.
- Diagnosis ladder, cheapest/most-decisive check first — don't skip straight to "restart the database":
  1. **Which layer is actually down?** Direct REST probe (`curl .../rest/v1/<tiny_table>?select=col&limit=1` with the anon key) vs `pg_stat_activity`. If the probe 503s/hangs for 10s+ while `pg_stat_activity` shows Postgres mostly IDLE (0-2 active, connections sitting in `ClientRead`) → the PostgREST/gateway layer is wedged and Postgres itself is healthy. Don't blame "the database" on this evidence alone.
  2. **Wedge driver:** look for a still-deployed no-limit `select=*` + full-join query streaming multi-MB responses (to crawlers or a hot loop) — that alone can saturate the REST layer's worker pool even though Postgres is fine.
  3. **Disk-IO burst-budget exhaustion tell:** check the slow-query log for absurdly-slow-trivial plans — e.g. a ~100-row catalog-table seq scan taking 10-30s, or internal telemetry/cron queries taking 10s+ that normally complete in milliseconds. Plans running 10^4-10^6x slower than their normal cost, alongside repeated `statement timeout`/`cron job startup timeout` kills, means the compute instance's disk-IO burst budget is exhausted — not a lock, not a query bug. Confirm on the platform dashboard's IO-budget metric before proposing anything else.
  4. Only once 1-3 are ruled out, treat it as a genuine query/lock/index-specific problem.
- Remediation: a project/DB restart clears a wedged gateway process and buys a few minutes, but if the root cause is IO-budget exhaustion the refill burns off almost immediately and it re-wedges — a second/third restart is not the fix. The real fix is (a) reducing whatever read/write amplification burned the budget and (b) bumping compute tier — a resize provisions a fresh instance with a fresh IO budget and higher baseline IOPS, a plain restart does not.
- Circular trap: if the fix that would relieve the load can only ship via a build/deploy pipeline that itself depends on the wedged API (e.g. static-generation queries needed at build time), the build cannot succeed until the API recovers on its own — see "Outage-Blocked Deploy: Health-Watcher Loop" below to break this without babysitting a manual retry loop.

## SQLite 64-Bit `INTEGER` → Postgres 32-Bit `integer` Silent Narrowing

- SQLite's `INTEGER` affinity is always 64-bit regardless of declared width. Postgres's plain `integer` is only 32-bit. A schema port (e.g. Drizzle `sqlite-core` → `pg-core`) that maps `integer()` to `integer()` 1:1 silently narrows the column's real range — it type-checks and migrates cleanly, and only overflows once a value exceeds ~2.1 billion (money amounts in minor units, snowflake-style IDs, transaction counters).
- Fix: for any column that held SQLite `INTEGER` money/amount/external-id values, use `bigint({ mode: "number" })` (or `mode: "bigint"` if values can exceed `Number.MAX_SAFE_INTEGER`) in Drizzle's `pg-core` instead of `integer()`.
- Check every money/amount/counter/external-id column during a SQLite-to-Postgres port specifically for this — it's easy to convert the schema mechanically column-by-column without re-evaluating range per column.

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

## Stripe Idempotency Keys Are Scoped To One Operation, Not One Row/Resource

- Stripe's idempotency contract is per-operation: reusing an idempotency key from one API call (e.g. `paymentIntents.create()`) on a DIFFERENT call against the same object (e.g. a later `paymentIntents.capture()`) is rejected outright — Stripe treats the second call as a conflicting replay of the first, not as "the same logical thing happening again." A generic "capture_failed" error is the only symptom; the PaymentIntent itself is usually completely healthy (manually retrieving/capturing it directly against Stripe succeeds immediately).
- This bites any design that persists "last idempotency key used" on a row that passes through multiple lifecycle stages (authorize → capture → refund/reverse) and naively reuses "whatever's already stored" for the next Stripe call on that row.
- Fix: give every idempotency key a deterministic, operation-scoped shape (e.g. `${operation}:${resourceId}`, such as `"capture:pay_123"` vs `"place-hold:pay_123"`). At the call site, only reuse a stored key if it matches the CURRENT operation's prefix; otherwise build a fresh one. This is safe specifically because the key is deterministic — recomputing it is equivalent to "the key this exact retry would have used" — so there's no need to read back a previous value to get retry-safety.
- Audit checklist when adding Stripe idempotency to a multi-stage money flow: grep every call site that reads a stored idempotency-key column, and confirm each one checks the operation prefix before reusing rather than passing the column value straight through.

## Stripe Transfer Objects Have No "Succeeded" Webhook Event; Live API Can Outpace Pinned SDK Types

- Stripe's `Transfer` object only ever emits `transfer.created`, `transfer.updated`, and `transfer.reversed` as webhook events (confirmed against the `stripe` npm package's own `Events.d.ts`) — there is no `transfer.paid`/`transfer.succeeded`/`transfer.failed`. Code that waits for a "transfer succeeded" event to flip a status column will wait forever; every transfer stays stuck at whatever "pending/processing" state it started in.
- The correct completion signal is the synchronous API response: a successful `stripe.transfers.create()` call means the funds already moved into the connected account's Stripe balance — mark it done at that point, and use `transfer.created`'s webhook delivery only to write the confirming ledger entry (the actual source-of-truth event), with `transfer.reversed` handled separately for later reversals.
- **Pinned SDK type definitions can lag the live API**: registering a real webhook endpoint via Stripe's own `webhook_endpoints` creation API surfaced `transfer.canceled` as a real, selectable event for a live account, despite it not existing in the pinned SDK version's TS union. When SDK types and a live platform API disagree on what events/fields exist, trust the live API response, not the pinned type defs — and add a defensive handler for the undocumented-in-types event rather than assuming the SDK is exhaustive.
- Generalizes beyond Stripe Transfers: for any provider object with an ambiguous "is this done yet" webhook story, check the SDK's actual event-type enum (not assumption/memory) before designing a status state machine around a webhook event name.

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

## Verify Deployment Shipped Before Claiming "Resolved/Live/Sent"

- Symptom: a run log or status update declares an issue "resolved," a fix "live," or a notification "sent" — but the underlying artifact was only built/typechecked locally, or a dispatch's success was assumed rather than confirmed. Production keeps exhibiting the original symptom because the fix never actually shipped (or the send never actually fired). This has recurred across unrelated incidents (an egress fix built but not deployed for a full day; an announcement email/DM logged as sent that was never actually dispatched).
- Why it happens: "implemented + built + typechecked" _feels_ done, so it gets written up as done. But the user's actual concern (egress dropping, an email arriving, an outage clearing) only changes once the external effect happens. A false "resolved" is worse than an honest "not done yet" — it stops anyone from looking again while the underlying problem continues.
- Fix — before writing "resolved/deployed/live/sent" anywhere:
  1. Check the deploy platform's own record of what's actually running (`wrangler deployments list`, a Vercel/Netlify deployment list, a rollout-status command) and compare its timestamp against the local build's mtime/hash — a build newer than the last deployment record means built-but-not-shipped.
  2. For any dispatched side-effect (email, webhook, notification), confirm delivery at the provider or recipient, not just that the send call returned 200.
  3. Add one live-surface spot check (a fetch, screenshot, or log line from the actual running environment) as the closing piece of evidence.
  4. Only after 1-3 pass may a run log or status message use the word "resolved"/"live"/"sent." Until then, say "built, not yet deployed" or "attempted, delivery unconfirmed."
- When reading a past "resolved/deployed" claim (your own or someone else's), treat it as unverified until you find that evidence — this exact claim has been wrong twice in the same project.

## Outage-Blocked Deploy: Health-Watcher Loop Breaks The Circular Trap

- Symptom: the fix for an outage can't be deployed because the deploy pipeline itself depends on the thing that's currently down (e.g. a build step fetches data at build time from the same API that's 503ing) — you can't ship the fix until the outage clears, but babysitting a manual retry loop wastes the first viable recovery window.
- Fix: arm a background watcher that probes the dependency on a short interval (every 15-20s) and, on N consecutive fast/healthy responses, immediately fires the full gated deploy pipeline (typecheck → build → any safety gates → deploy) unattended. Give it a bounded deadline (a few hours) rather than letting it run forever; if it exhausts without a healthy window, escalate to a different remediation (e.g. a resize/restart) instead of re-arming it blindly.
- This turns "wait around and manually retry the deploy" into a one-shot background task and guarantees the fix ships in the very first viable window instead of losing time to human latency after recovery.
- Generalizes beyond DB outages: any "can't ship the fix until external system X recovers" situation (CDN purge propagation, a third-party auth provider outage blocking a build-time fetch) can use the same pattern.

## Partial Fixes Silently Persist Without A Repo-Wide Gate

- Symptom: a class of bug (an inefficient query shape, an insecure pattern, a resource-cleanup omission) gets fixed on the surfaces touched in one session, the incident is declared closed, and it later turns out other surfaces in the repo still have the same problem — the symptom returns and gets re-diagnosed from scratch as if it were new.
- Root cause (two compounding failures): (1) a fix applied only to the surfaces you happened to touch is never audited against the whole repo for the same pattern; (2) a documented-but-unenforced convention (a comment/doc saying "don't do X, do Y instead") has no teeth — it doesn't stop the next surface written from habit/copy-paste from reintroducing X, even when the convention has existed for a long time.
- Fix: (1) before declaring a bug class "fixed," grep/search the entire repo for the anti-pattern's signature — not just the files you already changed — and fix every hit in the same pass; (2) convert the convention into a mechanical build/deploy-time gate (a lint rule, a CI grep-and-fail step, a type constraint) so a future violation fails the pipeline instead of silently shipping. A comment or doc next to the code is not sufficient once the convention has already been proven violatable in practice.
- Generalizes beyond query patterns: any "please don't do X" convention (security pattern, resource cleanup, naming, cross-provider parity) earns a mechanical gate once it's been violated once.

## Migration-In-Repo Is Not Migration-In-Prod

- Symptom: runtime `42703 column does not exist` for a feature that was code-reviewed and merged; the migration file exists in the repo. Root cause: the migration runner is manual / not wired into deploy, so the file was committed but never applied to prod. Fix: verify applied state against prod (`select column_name from information_schema.columns where table_name=...`, or a migrations-tracking table) before trusting a column-gated feature; wire migrations into the deploy pipeline or add a startup assertion. A column-gated feature is not "done" until the column is confirmed present in prod.

## Schema Migration Ahead Of Frontend Deploy Breaks Live Prod, With No Git Rollback

- Symptom: applying a Supabase migration that changes an RPC/table's _return shape_ (renamed or split columns) directly to the production DB, before the compatible frontend is deployed, immediately breaks the ALREADY-LIVE frontend that still expects the old shape — e.g. ISR/SSR pages crash on `undefined.charAt()` and cascade into global site-wide errors.
- Critical trap: `git checkout`/revert to the last commit does NOT fix this. The old code is now permanently incompatible with the migrated live schema — reverting just re-deploys code that still breaks against the new DB shape. The only forward-consistent recovery is deploying the NEW, schema-compatible frontend, not rolling back.
- Fix: never let a live-breaking schema migration and its dependent frontend deploy have a gap. Either (a) deploy the compatible frontend in the same breath as the migration (build the new frontend first, apply migration and deploy together), or (b) make the RPC/table change backward-compatible (keep both old and new columns) until the new frontend is confirmed live, then drop the old columns in a follow-up migration.
- Generalizes: for any live product, "I can always revert to git HEAD" is false once a schema migration that changed a live dependency's return shape has been applied — schema state, not git state, is what the deployed code runs against.

## Reproduce A Prod-Only Bug By Building An Old Commit In A Git Worktree

- To confirm a hypothesis like "the currently-deployed old code is what's crashing against the new schema/environment" without touching production, create an isolated worktree from the suspect commit (`git worktree add /tmp/x <ref>`) and run the project's REAL production build script inside it (not a synthetic repro). This reproduces the exact prerender/runtime crash locally and gives certainty about root cause before taking any deploy or rollback action.
- Faster and safer than bisecting in the live environment; use before deciding between "roll back" and "roll forward" when a prod incident might be code/schema version-skew.
- Gotcha when wiring the worktree's dependencies: see Turbopack symlinked `node_modules` entry below — copy, don't symlink, `node_modules` from outside the worktree root.

## Turbopack Rejects A Symlinked `node_modules` Pointing Outside The Project Root

- Symptom: `TurbopackInternalError: Symlink [project]/node_modules is invalid, it points out of the filesystem root` when a Next.js/Turbopack project's `node_modules` is a symlink to a directory outside the current project root (common when using `git worktree add` and symlinking the main repo's `node_modules` in to avoid a full reinstall).
- Fix: copy the real `node_modules` into the worktree (`cp -r`, or a hardlink-aware copy) instead of symlinking. Applies to any Next.js/Turbopack project using git worktrees with dependencies that live outside the worktree directory.

## An Auto-Assigned Isolation Worktree Can Be Pinned To A Stale Branch/Commit

- When a subagent session runs with `isolation: "worktree"` (dispatched by the harness, not self-created), its worktree may be checked out on an older commit/different branch than the one the task narrative describes — its `src/`/`docs/` can be weeks stale, not merely "missing the latest work."
- Before trusting a worktree's files as reflecting the described task/branch, verify: `git worktree list`, `git branch --show-current`, `git log --oneline -3`. If it doesn't match, read source-of-truth content from the main working tree via absolute paths, while still writing outputs into the assigned worktree's own paths (don't skip the write just because the read had to be redirected).
- Symptom this causes if missed: doc/summary output that's internally coherent but describes a stale snapshot of the codebase, silently regressing docs that were already more current in the main tree.

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

## Cache-Until-Content-Changes: Four Reusable Read/Write Patterns

For read-heavy public content backed by a database, "query on every render" doesn't scale. Pick one of these four patterns per surface instead of defaulting to a live query:

1. **ISR/ISG page + DB-trigger purge** — the page sets a long safety-net revalidate window (e.g. 24h), and a DB trigger on the content table calls the framework's on-demand-revalidate endpoint (by path or tag) on any publish-relevant change. Freshness comes from the trigger, not the timer; the timer is purely a fallback.
2. **Tag-cached route handler + trigger tag-invalidation** — for public JSON read by a client (not a page), wrap a plain unauthenticated/anon-credential fetch in the framework's data-cache primitive (e.g. Next's `unstable_cache`) tagged by resource id, with the same kind of DB trigger invalidating that tag on write. Build the cached fetch on a fixed/anon credential path, not a per-request authenticated client — request-scoped auth (cookies, per-user tokens) breaks most frameworks' data-cache memoization silently. Pair with **optimistic client-side updates** on mutation so the author isn't stuck waiting out the cache/trigger latency to see their own write.
3. **Per-isolate TTL memo** — for tiny, extremely hot, tolerant-of-minutes-of-staleness config/flag rows, a module-level `{value, expiresAt}` memo with a short TTL (a few minutes) collapses what would otherwise be thousands of daily queries for a handful of booleans into one query per TTL window per isolate.
4. **Buffered counters via a stateful edge primitive + scheduled flush** — never do `UPDATE <content_table> SET counter = counter + 1` per user action when the row also carries the main content body; that's a full-row rewrite (WAL + index + replication/logical-decode churn) on every click. Buffer the increment in a stateful primitive (Durable-Object-style, or an equivalent in-memory/queue buffer) and flush on a schedule via a batched RPC/update.

- Key safety insight for patterns 1/2: if the purge/invalidation channel is fire-and-forget (e.g. a DB trigger firing an async HTTP call with no retry), a purge that races a deploy window can be silently dropped. Always keep a safety-net revalidate window even when triggers cover every write path, and document it explicitly as "lost-purge insurance," not as the freshness mechanism — otherwise it gets "optimized away" later by someone who doesn't know why it's there.
- Pair with a build-time gate that rejects new unbounded/full-column reads on this content (e.g. failing the build on an embedded star-join in a `select` string) — see "Partial Fixes Silently Persist Without A Repo-Wide Gate" above for why the gate matters more than the documented pattern alone.

## Hash-Keyed Build/Install Caches Must Enumerate ALL Governing Inputs

- A cache keyed by `sha256(command + lockfile)` (or any similar "hash the obvious input" scheme for a build/install/compile step) misses config files that sit beside the lockfile and can change the output without touching it -- e.g. `.npmrc`, `pnpm-workspace.yaml` (`allowBuilds`/`overrides`/`onlyBuiltDependencies`), `.nvmrc`, tool config (`.babelrc`, `tsconfig.json` `paths`) read by the same step.
- Symptom: you fix a broken governing-config file, but the fix appears to do nothing -- the cache key is unchanged (lockfile untouched) so the cache keeps serving the stale, pre-fix artifact forever. No error, no log, just "I fixed it and it's still broken."
- Fix: before shipping any hash-keyed cache, list every file read during the step being cached (not just the obvious primary input) and fold all of them into the hash, with a stable "absent" marker for files that may not exist (so presence/absence changes the key too).
- Same rule one level up: cache-invalidation design review should ask "what inputs govern this output?" as an explicit checklist item, not just "what's the primary input?"

## Synchronous Recursive fs Ops Are An Event-Loop-Blocking Hazard, Not Just execSync

- The "never execSync long work inside a long-lived Node server (blocks the event loop, health watchdog/heartbeat misses it, restarts mid-task)" rule generalizes beyond child_process: any synchronous recursive filesystem call on a large tree -- `fs.rmSync(dir, {recursive: true})`, `fs.cpSync`, a synchronous `readdirSync` walk -- blocks the loop for the same reason. A `node_modules`-sized tree (tens of thousands of files) is enough to stall a process long enough to trip a watchdog or miss a heartbeat.
- Easy blind spot precisely because the surrounding code correctly uses the async pattern (spawn / an async shell-exec wrapper) for the expensive step, then reaches for the synchronous convenience function for a "small" cleanup in the same file -- inconsistency, not a deliberate tradeoff, causes it.
- Fix: shell out to a recursive delete/copy command via the project's existing async spawn wrapper instead of `rmSync`/`cpSync` for anything that might touch a large directory (build artifacts, `node_modules`, cache dirs).
- Verification habit: when reviewing/writing code that runs in-process (not forked) inside a long-lived server, grep touched files for `Sync(` combined with `recursive` -- every hit is a candidate, regardless of whether execSync itself appears anywhere.

## Turbopack / Next.js Stale-Chunk Error Recovery

- After a deploy, users with cached old JS chunks hit `ChunkLoadError` or "Module factory is not available" in production.
- `error.tsx`'s `reset()` only re-renders — it does not flush stale chunk references.
- Fix: detect chunk errors in `error.tsx` (`error.name === "ChunkLoadError"` or message matches `/Module factory is not available/i`). On first detection, set `sessionStorage.setItem('__chunk_reload', '1')` then `window.location.reload()`. Guard: if the key is already set, clear it and fall through to normal error UI + Sentry capture to prevent infinite reload loops.
- Use `sessionStorage` (not `localStorage`): survives the single reload but clears on tab close, so the guard never blocks a future session.

## pnpm-workspace.yaml `allowBuilds` Placeholder Value Recurs Even With A Warning Comment Present

- Adding a new dependency that pulls in a native/postinstall-script package can make pnpm auto-insert a literal placeholder string (e.g. `"set this to true or false"`) into `pnpm-workspace.yaml`'s `allowBuilds` map instead of a real boolean — this breaks `pnpm install` outright with a cryptic `ERR_PNPM_IGNORED_BUILDS`-adjacent error, not an obvious "bad config" message.
- An inline comment in the file warning about this exact trap from a prior incident did **not** prevent recurrence when a _different_ new dependency triggered it later — a comment is not a gate.
- Fix/verification habit: after adding any dependency with native bindings or build scripts, run `grep -n "allowBuilds" -A20 pnpm-workspace.yaml` and confirm every value is a literal `true`/`false`, not a string, before running `pnpm install`. Consider scripting this as a pre-install check rather than relying on manual review.

## Bleeding-Edge AI SDK Package: Pin To Current Major, Not The Version First Installed

- Early 0.x releases of fast-moving AI/agent-framework packages (e.g. `@mastra/core` at its Jan-2026 launch, `0.8.3`) can target an older model-provider interface generation (e.g. AI SDK's `LanguageModelV1`) while current-era provider packages (e.g. `ai-sdk-provider-claude-code`) target a newer one (`LanguageModelV4`/AI SDK v5+). Installing "whatever version" or an old lockfile entry silently produces a type/interface mismatch between the framework and the provider, not an install failure.
- Fix: when wiring a fast-moving AI framework to a model-provider adapter, explicitly pin the framework to its current major/minor (check its own release notes/changelog for the AI SDK interface generation it targets) rather than accepting whatever a stale lockfile or first `pnpm add` pulls in.
- Related config-shape trap: `Agent` constructor configs in these frameworks may require both an `id` and a `name` field even when the API/docs make `name` look sufficient — a missing required field here fails at construction time, not at a call site, so check the constructor's actual required-fields list rather than assuming the one field you've seen used.

## TypeScript Heterogeneous Generic Registry: Annotate Per-Entry, Not On The Array

- Building a registry/catalog (report definitions, plugin manifests, form-field configs, etc.) where each entry is internally consistent under its own generic `Row` type (its column-renderer and data-loader functions agree with each other), but the registry itself needs to hold ALL entries together, hits a real TypeScript limitation: an array cannot be typed as "list of differently-parameterized generics" directly.
- Symptom: adding an explicit `: SomeGeneric<Row>[]`-shaped annotation on the whole array widens every literal to the unparameterized/`unknown` form BEFORE that literal's own inner functions get checked — so each entry's column/render functions get typed as accepting `unknown` instead of their own specific row shape, producing real type errors inside otherwise-correct entries.
- Fix: define a small identity-erasure helper, e.g. `function define<Row>(def: SomeGeneric<Row>): SomeGeneric<unknown> { return def as SomeGeneric<unknown> }`. Wrap each entry's construction with `define<SpecificRowType>({...})` so the literal is checked with full contextual typing for its own inner functions, then store only the erased (`SomeGeneric<unknown>`) results in the plain array.
- Safety condition for the erasure: consuming code must only ever call one entry's own load/columns/render functions together — never mix one entry's row data into another entry's column function. The erasure is sound only under "each entry is used self-consistently," not under any cross-entry mixing.

## Monolith-Page Replacement: Enumerate Existing Coverage Before Building The New Structure

- When replacing a monolithic hand-rolled page/module with a new architecture (e.g. a registry-driven system replacing a single large page), a clean typecheck and passing new unit tests do NOT prove the replacement is complete — they only prove the new code is internally correct.
- Concretely bit twice in the same replacement: (1) existing e2e specs testing sections of the OLD page can cover behaviors that don't map cleanly onto the new architecture (including homegrown, non-catalog features never meant to be dropped) — found only by grepping the old route path across the e2e test directory, and only done AFTER typecheck/build had already passed clean; (2) a display/formatting helper migrated from the old page to the new one silently handled only a subset of an enum's cases (e.g. 4 of 6 event types), rendering a placeholder for the rest in both the UI and any export derived from the same function — caught only because one existing e2e test happened to assert on a missing case.
- Fix / sequencing: before starting a monolith-page replacement, (a) grep the e2e/test directory for every existing spec touching the old route/page and enumerate what each one actually covers, and (b) for any "render every case of an enum" function being migrated, diff its case list explicitly against the original function's case list side by side. Do both BEFORE building the new structure, not as a post-hoc scramble after typecheck/tests already pass — a passing build only validates the code you wrote, not the coverage you were supposed to preserve.

## Playwright `waitForURL` Timeout On First Navigation After Cold `next dev` Start

- A specific, subtler variant of "dev server takes a while to start": `page.waitForURL()`'s default timeout (15s) can fire on the FIRST navigation after a fresh `next dev` start when several routes need to compile just-in-time in sequence — even though a page snapshot at the timeout moment proves the navigation (and often the data load) already succeeded. The `load` event, not the URL change, is what's lagging past the timeout; the test isn't actually stuck.
- Distinguish this from a real regression: check whether the page snapshot at failure time already shows the target URL and expected content — if so, this is compile-time lag, not a broken navigation.
- Fix: retry with a longer explicit timeout (`page.waitForURL(url, { timeout: 60000 })`) rather than debugging the navigation logic; this is expected on a cold server and typically doesn't recur once routes are warm.

## CSV Export Needs A UTF-8 BOM For Non-ASCII Headers To Render Correctly In Excel On Windows

- Excel on Windows guesses a plain CSV's encoding from OS locale rather than assuming UTF-8. A CSV with non-ASCII headers/values (Vietnamese diacritics, CJK, etc.) and no BOM mojibakes when opened in Excel — exactly the failure mode most likely to hit a non-English-primary audience opening the file on a typical Windows PC.
- Fix: prefix the emitted CSV content with the UTF-8 BOM (`﻿`) before the header row. Narrow, cheap, and easy to forget on any export feature for a non-English-primary audience.

## Next.js: A Type-Only Import From A `server-only` Module Silently Becomes A Value Import, Breaking The Client Bundle

- A `"use client"` component that imports only TYPES from a shared lib module compiles and typechecks fine even when that module has a transitive `import "server-only"` dependency (e.g. via a helper that also calls `createAdminClient`) — type-only imports are erased at compile time, so `tsc --noEmit` sees nothing wrong.
- The break happens later, when an unrelated edit adds a genuine VALUE import (a plain function, not just its type) from that same module into the client component. Now the whole module — including its `server-only` dependency — gets dragged into the client bundle. Next.js fails the build/request with `You're importing a component that needs "server-only"`, and because this only shows up in real bundling, `tsc --noEmit` and mocked unit tests both stay green; only an actual dev-server request or e2e run against the page surfaces it (a Playwright test on that route times out or the page 500s).
- Fix: extract the pure, dependency-free value(s) the client side needs into their own small module with no `server-only` import anywhere in its chain (re-export it from the original server-ish module for existing server call sites, so those don't need to change). Don't try to tree-shake or lazy-import around the boundary — a clean split is the only fix that survives the next value-import someone adds later.
- Detection: before trusting a client/server module-boundary change as done, run the real e2e suite (or at minimum a dev-server request against the touched route) — this class of bug is invisible to typecheck and to any test that mocks the shared module.
