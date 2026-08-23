---
name: webpack-spa-mining
description: "WORKFLOW SKILL - Statically mine a vendor SPA's public webpack bundle (route table, permission enums, i18n vocabulary) before ever logging in, to clone its IA/UX vocabulary into a new app without copying proprietary code. Use when cloning a Vue/React vendor SaaS's admin UX, migrating off a vendor tool, or reverse-engineering an undocumented frontend's screen/permission structure. Trigger phrases: clone vendor UI, migrate off SaaS, webpack bundle mining, vue SPA reverse engineering, i18n key mining, vendor route table."
argument-hint: "Name the vendor SPA's public bundle URL(s) or entry HTML, and what you need extracted (routes, permissions, i18n vocabulary, screen structure)."
---

# Webpack SPA Mining

Extract a vendor SPA's information architecture and vocabulary from its **public, unauthenticated
webpack bundle** — no login required for this phase, and it never touches the vendor's compiled
JS/CSS/asset files as redistributable output (mine facts out of them, don't ship the files themselves).

## When to Use

- Cloning a vendor SaaS's admin UX/vocabulary into your own app (migration/replacement project)
- Recovering a route table, permission-resource enum, or screen taxonomy with no docs available
- Extracting bilingual/multilingual copy from an app before running any live authenticated crawl

## Order of Operations (static-first)

1. **Static bundle mining first, authenticated crawl second (or never).** The route table,
   permission-resource enum, and often per-screen structure are statically present in the shipped
   webpack bundle. Don't reach for a login/crawl until static mining is exhausted — it's unauthenticated,
   repeatable, and carries no session-eviction risk to a live account.
2. **Locate the runtime/manifest chunk** (commonly `runtime.js` or similar). It contains a
   `{"chunk-id":"hash"}` object literal mapping every lazy-loaded chunk id to its content hash — this is
   the enumeration key for fetching every route/screen chunk unauthenticated. If the app does CSS
   code-splitting, expect **two** such maps (one JS-hash map, one CSS-hash map); distinguish them by
   reading the ~40 characters of source immediately after each object literal for a `.js` vs `.css`
   suffix reference, not by guessing from position/order.
3. **Fetch and parse every enumerated chunk with a real parser (acorn or equivalent), never regex.**
   A naive JS regex with `.{0,N}` bounded-context captures against a minified bundle (frequently a
   single multi-MB-long line) can catastrophically backtrack and hang the process. AST-parse or use
   index-based string slicing instead.
4. **Check for a self-describing i18n key grammar before assuming a live UI crawl is required.**
   Some frameworks (observed: Vue2 + vue-i18n) ship i18n keys with an embedded screen/role grammar, e.g.
   `SCREEN_NAME--TABLE_COLUMN_HEADER_FIELD`, `SCREEN_NAME--FILTER_BY_X_INPUT_PLACEHOLDER`,
   `SCREEN_NAME--SOME_TAB_TITLE`. If present, every string classifies into column/filter/tab/action/
   validation-message/empty-state buckets purely from the key shape — no UI interaction needed.
5. **Classify locale dictionaries by content, not by tracing minified variable assignment chains.**
   When locale dicts are built via a minified chain like `X={vi:a,en:b,ko:c,zh:d}`, don't try to
   statically resolve which variable is which language — classify each string block directly by its own
   script/diacritic signature (Vietnamese diacritics vs CJK/Hangul Unicode ranges vs plain ASCII). Far
   simpler and avoids misattribution.
6. **Escalate to an authenticated, write-guarded crawl only for what static mining can't give you**
   (live data shapes, interaction sequences, screens gated behind permission checks with no static
   route). Scope any authenticated crawl to read-only actions on the operator's own tenant/account, and
   get an explicit go/no-go from the user before it begins (session-eviction risk to a live business).

## Anti-Patterns

- Do NOT run bounded-context regex (`.{0,N}`) against a single-line minified bundle — use acorn/AST or
  index slicing.
- Do NOT assume one hash-map means one chunk type; check for a parallel CSS hash-map on
  CSS-code-splitting builds.
- Do NOT try to resolve minified variable names to classify locale blocks — classify by string content.
- Do NOT skip checking for a self-describing i18n key grammar before defaulting to a UI crawl.
- Do NOT trust a static AST-based route-to-title anchoring heuristic when a "list" and "detail" view
  share matching/near-matching resolved title strings — it can pick the wrong sibling route. Cross-check
  against one real authenticated crawl of the rendered navigation before treating the statically-inferred
  path as user-facing fact; prefer the empirically-observed path when the two disagree.
- Do NOT redistribute the vendor's actual compiled JS/CSS/asset files as output — extract facts
  (route names, field labels, taxonomy, enums) into your own docs/code, not vendor file copies.

## Cross-Links

- `migration/bubble-export-analysis` — same "mine a shipped artifact for data model/vocabulary before
  reimplementing" shape, for Bubble.io exports instead of webpack bundles.
- `migration/ui-replication-parity` — once IA/vocabulary is mined, this skill covers the visual parity
  workflow for the rebuild itself.
- `tech-pitfalls` → "Playwright `page.evaluate()` Under tsx: `__name is not defined`" — relevant once
  mining escalates to an authenticated Playwright crawl.
