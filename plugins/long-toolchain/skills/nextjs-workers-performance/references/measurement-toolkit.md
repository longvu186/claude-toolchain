# Measurement toolkit (Next.js + OpenNext + Workers + Supabase)

Scripts in `scripts/` are the ones used on Tobuso (2026-09-23 → 09-28). They carry Tobuso hostnames,
entity ids and paths — adapt the constants, keep the method. Secrets are read from the environment only
(run under `with-secrets -- …`); none are embedded.

## 0. Prerequisite: per-query labels in the Worker log

A staging-only fetch wrapper around the Supabase client that records, per request, each call's label
(`METHOD /path`), start offset (`at`, ms relative to the render's origin) and duration (`ms`), emitted as
one `[query-metrics] {json}` console line per render. Without offsets you cannot compute chain depth.
(Tobuso: `lib/observability/query-metrics.ts` + `lib/supabase/server.ts` `describeRequest`.)

## 1. Survey every page: tail + crawl

```bash
# terminal-free, detached tail (multi-line JSON; IDs REDACTED)
setsid nohup with-secrets -- npx wrangler tail <worker-name> --format json > tail.jsonl 2>tail.err &
EXTRA="/path?tab=a,/path?tab=b" MAX=45 PER=2 with-secrets -- node scripts/crawl.mjs "Company User"
MAX=45 with-secrets -- node scripts/crawl.mjs "Admin"
python3 scripts/depth.py tail.jsonl            # true chain depth per route (excludes 0 ms cache hits)
python3 scripts/timeline.py tail.jsonl "regex" # per-request query timeline for chosen routes
python3 scripts/compare.py before.jsonl after.jsonl   # depth / count / query ms / server ms medians
```

- `crawl.mjs` logs in via the app's demo sign-in buttons, follows in-page links, caps samples per
  route shape (`PER`). `common.mjs` injects Cloudflare Access service-token headers via `page.route`.
- Stop the tail by PID after filtering by process NAME: `pgrep -f "wrangler[ ]tail"` also matches
  `tailscaled` on a Tailscale-SSH host (the session's argv contains the pattern). Only kill
  `infisical`/`npm`/`node` entries. Never `pkill -f`.
- `depth.py`: longest chain where query B starts at/after query A ended (+1 ms slack). The app's own
  logged `serialDepth` undercounted by up to 5×.
- Compare server-side metrics from the SAME crawl before/after; single curl totals are ±100 ms noise.

## 2. Keep-alive latency probes

- `scripts/ttfb.py N path…` — curl with a 0600 temp config holding cookie + Access headers (never on the
  command line — `ps` would show them), prints TTFB and total medians. Streaming pages: TTFB is the
  number that moves when you push work behind Suspense.
- Raw network floor: `curl -o /dev/null -w "%{time_appconnect} %{time_starttransfer}\n" URL URL URL…`
  (repeat the URL in one invocation → connection reuse shows the warm per-request cost).

## 3. Where things run (Cloudflare GraphQL, names only printed)

- `scripts/colo.py` — `workersInvocationsAdaptive` by `coloCode` per script: is the Worker actually
  placed? (Unplaced prod ran in MUC/CDG/NRT/SIN…; placed staging 1,475/1,479 in YUL.)
- `scripts/do-gql.py` — `durableObjectsInvocationsAdaptiveGroups` by `coloCode, objectId` with
  `wallTimeP50/P90`: a DO in a far colo shows wall ≈ round trip to the caller (SIN 230 ms vs EWR 14 ms).
- R2 bucket location: `GET /accounts/{id}/r2/buckets/{name}` → `location` (list endpoint omits it).

## 4. CPU profiling

- **Startup:** `wrangler check startup --env <env> [--args "<alt-entry.mjs>"] --outfile x.cpuprofile`
  (runs locally in workerd; no deploy). Test an eager-import variant by passing an alternate entry.
- **First request in real workerd:** run `wrangler dev --env <env> --port 8799 --inspector-port 9239
--env-file <0600 file>` (write the env-file with `umask 077`, `unlink` it after start; `rm -f` may be
  blocked by guard hooks), then `scripts/wd-prof.mjs path…` — connects to `ws://127.0.0.1:9239/ws`
  with `Origin: http://127.0.0.1` (required, else 400), wraps each request in Profiler.start/stop.
- **Attribution:** `scripts/wd-mods2.py profile.cpuprofile` maps samples through
  `.wrangler/tmp/dev-*/worker-entry.js.map` using segment COLUMNS into the minified
  `handler.mjs`, then to the nearest `__commonJS({"<path>"` / `__esm({"<path>"` marker. Text-matching
  reformatted code against original chunks gives wrong answers (it blamed Stripe for 111 ms; real: 5 ms).
- Caveats: local workerd counts some awaited I/O as CPU (`Response.json()` in auth-js); Node
  `--cpu-prof` measures Node-only machinery. Compare against Cloudflare analytics `cpuTime` quantiles for
  real warm costs (p50 ~8 ms here).
- Stop `wrangler dev` / servers by the PID owning the port (`ss -ltnp | grep :8799`), verify the name.

## 5. Screenshot validation of click feedback

Playwright: click a tab/step with `{ noWaitAfter: true }`, `waitForTimeout(60)`, read `aria-current` of
the clicked link + count skeleton blocks (`.animate-pulse`), screenshot; then settle and screenshot again.
Pick records whose state actually shows the surface (a paid event redirects to its tracker; an
incorporation whose resume step changed renders a different step — check the DB before calling a
query-count jump a regression).
