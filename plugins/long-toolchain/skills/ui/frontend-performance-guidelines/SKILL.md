---
name: frontend-performance-guidelines
description: "WORKFLOW SKILL - Performance-first rules for app shells, route transitions, data loading, and CRUD mutation UX. Use for slow navigation, API fan-out, reload-heavy CRUD, prefetch abuse, and spinner-heavy admin pages. Trigger phrases: slow navigation, performance optimization, page transition slow, too many API calls, prefetch issue, CRUD reload, loading state, background refresh."
argument-hint: "Describe the route or feature, current fetching and mutation pattern, stack, and where latency or jank is visible."
---

# Frontend Performance Guidelines

Use this skill when the problem is not just raw rendering speed, but the full interaction model: navigation, route-data fan-out, background refresh behavior, CRUD mutation scope, and user feedback during async work.

## Primary Goal

Keep the interface responsive without hiding stale data or breaking user context.

The performance target is not "show fewer spinners". The target is:

1. feedback within 100ms for direct user actions
2. route transitions that reach first useful content quickly
3. no page teardown for row-level or dialog-level mutations
4. no blind API fan-out during initial load or eager prefetch
5. preserved scroll, selection, open overlays, and input drafts during background refresh

## Non-Negotiable Rules

- Treat navigation chunk prefetch and data prefetch as different decisions.
- Dense app-shell navigation must not eagerly prefetch every route when route entry triggers server work or client queries.
- First route load fetches only data needed for the visible view.
- Hidden tabs, collapsed sections, closed dialogs, and inactive subviews must not fetch by default.
- Keep separate state for `initialLoading`, `backgroundRefreshing`, and `isMutating`; never collapse them into one page-wide loading boolean.
- Row-level mutations patch the affected row or invalidate the narrowest cache key possible.
- Create/edit flows in dialogs or sheets must keep the list and scroll container mounted.
- Success feedback for transient operations belongs in toast, inline row state, or compact status text, not full-page alert dumps.
- Background refresh must preserve scroll position, row expansion, selection, active tab, and local draft state.
- If one route needs many related datasets, prefer server aggregation or a narrower page contract over client fan-out.

## Navigation And Prefetch

### Route Prefetch Policy

- In dense sidebars, top nav, and data-heavy dashboards, default Next.js `Link` to `prefetch={false}`.
- Re-enable prefetch on user intent: `onMouseEnter`, `onFocus`, or other strong next-step signals.
- Prefetch only the next likely destination, not the entire menu.
- Never prefetch routes that trigger expensive data loading just because the links are visible in the shell.
- Do not prefetch hidden, permission-gated, or low-probability routes by default.

### Next.js Shell Pattern

```tsx
<Link
  href={href}
  prefetch={false}
  onMouseEnter={() => router.prefetch(href)}
  onFocus={() => router.prefetch(href)}
>
  {label}
</Link>
```

### What Counts As A Failure

- Hovering the sidebar triggers a burst of API calls.
- Initial page render starts loading data for sibling tabs the user has not opened.
- Navigating to a list page also loads edit-form metadata, export data, and analytics summaries before the first table paint.

## Data Loading Model

### Critical Path First

Split route data into three layers:

1. critical above-the-fold data needed for first useful paint
2. secondary visible data that can stream or hydrate after the shell stabilizes
3. hidden or deferred data for inactive panels, dialogs, inspectors, and advanced actions

### Query Budget Rules

- Keep route-entry queries intentional and enumerable.
- Collapse obviously related reads behind one server endpoint when the UI always needs them together.
- Parallelize independent critical reads, but do not parallelize optional reads into the critical path.
- Gate every query by visibility, activation, role, or explicit user action when possible.
- Prefer cursor or incremental pagination over giant first-page payloads.

### State Model

Use distinct async states:

- `initialLoading`: first mount or first navigation into the surface
- `backgroundRefreshing`: non-blocking sync after content is already visible
- `isMutating`: in-flight create, update, delete, archive, restore, or action-specific request
- `isPendingNavigation`: route transition in progress

These states must drive different UI responses.

## Mutation And Refresh Rules

### Narrowest-Impact Refresh

After a mutation:

- update the affected record locally when the response contains the new canonical values
- otherwise invalidate the smallest cache slice that owns the changed entity
- only refetch the whole page when the mutation genuinely changes page-wide totals, permissions, or layout-critical aggregates

### CRUD Surface Behavior

- Opening create/edit must not replace the entire page with a loading state.
- Submitting a dialog or sheet keeps the background list mounted.
- Use button-level loading plus optional row-level pending state.
- If a refresh follows submit, keep it in background unless correctness requires a hard block.
- Preserve current sort, filters, pagination, selection, and scroll after mutation.

### Preferred Flow

1. user opens dialog or sheet
2. submit button enters loading state
3. mutation resolves
4. patch row or invalidate the narrow cache key
5. show toast or compact success signal
6. close overlay when appropriate
7. background refresh only if needed for reconciliation

## Feedback Surface Decision Tree

- Field validation issue: inline error near the field
- Dialog or form submission failure: inline form error summary plus field errors when relevant
- Row-level success or generic create/update success: toast
- Long-running background job: persistent status region, badge, or progress surface
- Page-wide blocking outage or permission issue: banner or dedicated error state

Do not use inline alert blocks for every successful mutation. They consume layout space, push content downward, and train users to ignore feedback.

## Lists, Tables, And Detail Views

- Keep the table scroll container mounted while filters or row mutations refresh.
- Sticky headers must stay inside the same scroll container as the rows.
- Virtualize only when row count or cell complexity justifies it; do not add virtualization as a reflex.
- Detail pages should fetch only the active section and defer secondary tabs.
- Large inspectors or side panels should lazy-load their heavy content on open.

## Background Refresh Rules

Background refresh is correct only if the visible surface remains usable.

Use background refresh when:

- content is already visible
- the user is browsing, filtering, paging, or editing nearby state
- the refresh is a sync or reconciliation step

Do not block the whole page during background refresh. Prefer subtle progress signals such as:

- button spinner
- row skeleton replacement only for the affected row
- toolbar progress text
- small pending badge

## Instrumentation And Verification

Before declaring the surface improved, verify:

1. route transition no longer triggers unnecessary API fan-out
2. sidebar or shell hover does not cause hidden prefetch bursts
3. inactive tabs and dialogs do not fetch before activation
4. row-level mutation does not reset scroll or table state
5. transient success feedback no longer reflows the page
6. first useful content appears before secondary data settles

Check with:

- browser network waterfall
- React or framework profiler when available
- query devtools if the stack has them
- simple before/after route timing notes in the spec or validation log

## Anti-Patterns

- Blanket eager prefetch across the entire app shell
- Fetching all dashboard widgets before the primary table or form becomes usable
- A single `isLoading` flag that tears down the full page for refresh, save, and navigation
- Refetching every list, summary, and counter after updating one row
- Inline success alerts that push the table below the fold after every mutation
- Closing and remounting the page shell just to show a mutation spinner
- Triggering queries for tabs, accordions, drawers, or dialogs the user has not opened

## Output Contract

When invoked, return:

1. Current failure pattern.
2. Required performance model changes for navigation, loading, and mutation scope.
3. The smallest cache or refresh strategy that preserves correctness.
4. Feedback-surface changes needed to avoid page reflow and context loss.
5. A verification checklist for network, transition, and mutation behavior.
