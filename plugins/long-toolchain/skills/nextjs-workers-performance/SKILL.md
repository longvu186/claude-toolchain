---
name: nextjs-workers-performance
description: "Server-side latency playbook for Next.js App Router on Cloudflare Workers (OpenNext) with Supabase — slow navigations, slow tabs/steps, query waterfalls, Durable Object/cache placement, cold starts, CPU limits. Measure-first: geography, per-call cost, chain depth, dedupe, then UI feedback. Trigger phrases: navigation is slow, tabs slow, page takes seconds, nav latency, query waterfall, parallelize queries, cold start, Workers CPU limit, exceededCpu 503, placement, Durable Object latency, use cache slow, prefetch storm, skeleton doesn't show."
---

# Next.js + OpenNext + Cloudflare Workers + Supabase — performance playbook

Distilled from the Tobuso nav-latency program (2026-09-23 → 09-28): Data tab 1,500 ms+ → ~360 ms,
event list 5 → 2 query rounds, click feedback 0 → ~100 ms. Every rule below was measured, and several
"obvious" fixes turned out wrong — the **Traps** section is the most valuable part.
Tooling (tail parsing, depth computation, workerd profiling, DO location queries): `references/measurement-toolkit.md`.

## Order of attack (cheapest, biggest first)

1. **Geography.** Where does the Worker run vs. the database? A Worker running near the _visitor_ (SIN/HKG
   for Vietnam) talking to a DB in Canada pays 150–950 ms _per query_. Fix: `placement.region`
   (e.g. `"aws:ca-central-1"`) in wrangler — it is **non-inheritable**, set it on every env. Verify with
   Cloudflare GraphQL `workersInvocationsAdaptive { dimensions { coloCode } }`, not by assuming.
2. **Per-call cost, measured from the Worker.** Log each Supabase fetch with a label + start offset + ms
   (a staging-only fetch wrapper). curl from your VPS is not the Worker's path. Self-hosted stacks behind
   Cloudflare Access + tunnel cost ≥60 ms/call; Supabase Cloud (itself behind Cloudflare, origin in the
   AWS region) is ~12 ms warm from the same metro. Workers VPC/private tunnel is impossible for a SaaS DB
   (you can't run cloudflared in their network) — and unnecessary once placed.
3. **Chain depth.** Compute the longest dependent chain from per-query start/end offsets (a query starts
   after the previous ended). Don't trust a logged "serialDepth" — ours reported 1 for 5–6-round chains.
4. **Dedupe.** Count identical queries in one render. Duplicates = a broken `cache()` key (see Traps).
5. **Streaming.** Anything not needed for first paint (modal/sheet options, staff-only panels) goes behind
   `<Suspense>` or loads lazily on open.
6. **Click feedback.** Highlight + skeleton at click time (see Traps: `useSearchParams`).
7. **CPU / cold start** last — usually framework init you can't remove.

## Parallelization patterns that are safe

- **Start RLS-scoped reads before the access gate, render only after it.** If a read needs only an id the
  URL already gives you and the client is RLS-scoped (not service-role), kick it off in the same
  `Promise.all` as the header read; check access before using the result. Keep it serial when a prior
  step mutates what it reads (e.g. confirming a Stripe checkout session first).
- **Preload `cache()` loaders** by calling them unawaited early (`void loader(id)` or `.catch(() => {})`
  so a never-awaited rejection isn't unhandled); later callers with the same args share the promise.
- **Replace per-row catalog chains with the `"use cache"` resolver per distinct key**: one tenant read to
  get each row's key (e.g. `(entity_type, jurisdiction_id)`), then `Promise.all` over distinct keys of a
  cached, tenant-free resolver. 4 serial trips → 1 + cache hits.
- **Independent awaits in sibling code** (agent list + worklist) → one `Promise.all`.
- Cross-schema PostgREST embedding doesn't work, so a parts→links→fields chain across schemas is
  inherent; don't burn time trying to collapse it without an RPC.
- Workers allow only ~6 simultaneous outbound connections per request — 18 queries where 6 would do
  queue in waves and _look_ like serial rounds. Dedupe before blaming dependencies.

## Traps (each cost real time)

- **React `cache()` keys on argument identity.** A factory returning a fresh client-bundle object per
  call (`getXServerClients = async () => ({ a: await …, b: await … })`) makes every `cache()` loader that
  takes the bundle miss — the event page ran every field query 3×. Wrap bundle factories in `cache()`
  too. `cache()` degrades to a plain call outside a render (server actions), so it's safe there.
- **`useSearchParams()` moves at COMMIT, not click.** App Router navigations are transitions; the URL and
  the hook update only after the RSC response. "Compare useSearchParams to the rendered value" never
  detects pending. Record the target in `<Link onNavigate={() => markPending(href)}>` (client-side navs
  only) into a `useSyncExternalStore` store; clear when a _different_ committed URL is seen (not on
  mount); add a failsafe timeout. Unit tests passed while the feature did nothing — verify with a
  screenshot ~60 ms after the click.
- **searchParams-only navigations never show `loading.tsx`** (same segment stays mounted). Tabs/steps
  need their own skeleton swap (above).
- **`router.replace` to fix up `?step=` re-requests the route** (a second RSC on every open). Use
  `window.history.replaceState(window.history.state, "", href)` — the App Router picks it up.
- **Prefetch storms.** Default viewport prefetch on dynamic routes renders full pages (with DB queries):
  a 14-step wizard sidebar prefetched ~28 renders per click; dashboard cards became links → hundreds of
  prefetches. Use `prefetch={false}` + hover/focus intent prefetch.
- **Durable Objects never move.** OpenNext's DO-sharded tag cache creates shards with no `locationHint`
  (unless regional replication), so shards live where the Worker _first_ touched them — ours were still
  in SIN (230 ms/call) after placement moved the Worker to Montreal. Check
  `durableObjectsInvocationsAdaptiveGroups { coloCode objectId wallTimeP50 }`. Fix by addressing shards
  under new names with `locationHint` (override the stub factory; assert the method exists in a test so
  an upgrade can't silently unpin). Do NOT use OpenNext `regionalReplication` for a placed Worker: it
  picks the region from `cf.continent` = the visitor's continent. Renaming shards is safe because
  OpenNext cache keys include the build ID.
- **Location hints are not residency.** DO/R2/KV jurisdictions are only `eu`/`us`/`fedramp`; `enam`
  landed in EWR/ORD (US). If data must stay in a country with no jurisdiction, keep only public config in
  `"use cache"` and guard it with a test (see Data residency).
- **Workers Free 10 ms CPU** kills an isolate only when it's over _consistently_ — your own probe loops of
  heavy pages trip it (503 `exceededCpu`) and look like a regression; it recovers after idle. A test spec
  that walks a wizard IS a probe loop. Paid removes the cap (30 s). Space probes, mix page types.
- **Cold start is mostly framework.** OpenNext imports the Next handler lazily on the first request, so
  `wrangler check startup` shows ~40 ms and the 600–1,000 ms lands in request 1. Eager import only moved
  ~86 ms. App-owned costs were small (zod schema construction ~66 ms, Supabase client ~37 ms).
- **Bundle size ≠ CPU.** The esbuild metafile said "Stripe/zod are big"; the profile said Stripe cost
  5 ms. `babel-plugin-react-compiler` hits in the output folder were pnpm path strings, not bundled code.
  Profile before stripping anything.
- **Profiling lenses.** Node `next start --cpu-prof` is the wrong lens (Next's edge sandbox for middleware
  - undici TLS dominate). Profile real workerd via `wrangler dev --inspector-port` (the inspector
    websocket needs an `Origin` header). Local workerd counts some I/O waits (e.g. `Response.json()`) as CPU.
    Wrangler re-bundles and reformats — attribute samples via the source map's _columns_ into the minified
    handler, then to esbuild `__commonJS({"path"` markers; text matching mis-attributes.
- **Middleware token refresh.** A probe reusing a stale cookie forces a refresh round trip every request;
  real browsers store the rotated cookie. Don't count it as page cost.

## Measurement hygiene

- Verify the page content before trusting a timing (a fast 404/stale snapshot looks great).
- Staging end-to-end timings swing ±100 ms run to run — compare server-side per-query metrics from a log
  capture of the same crawl before/after, not single curl totals.
- With streaming, total time includes the streamed tail; report TTFB and total separately.
- `wrangler tail --format json` emits multi-line JSON (decode with `raw_decode`), and IDs are REDACTED.
- A PostgREST schema listed in config but dropped in the DB makes reads fail/empty on every stack —
  rule it out when "everything got slow/empty" after a migration.

## Data residency (when a country has no Cloudflare jurisdiction)

- Worker compute: `placement.region` in-country → execution in-country for fetch requests (cron triggers
  aren't placed; keep cron handlers as thin forwarders to a placed self-call).
- `"use cache"` persists to R2 + the DO tag cache — out-of-country. Allowed only for public config read
  with the anon client. Add a test that fails on any new `"use cache"` / `unstable_cache` /
  `force-cache` / ISR and on a missing placement (Tobuso: `lib/platform/data-residency.test.ts`).
- Edge TLS terminates at the visitor's nearest colo unless Regional Services (Enterprise) is bought.
- Ask the owner which data the rule covers — Tobuso's ruling was _customer data only_, which made the US
  caches acceptable and removed a costly re-architecture.

## Related

- `tech-pitfalls` → "URL-Driven Server Component Re-Fetch Anti-Pattern" (generic state-strategy matrix).
- `workers-best-practices`, `wrangler`, `durable-objects`, `web-perf` (client-side Core Web Vitals).
