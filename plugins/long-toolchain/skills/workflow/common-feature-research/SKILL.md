---
name: common-feature-research
description: "**WORKFLOW SKILL** - Research and harden common product features before implementation. Use when: auth, admin dashboards, CRUD management, charts, tables, forms, currency inputs, file upload, search/filter, notifications, date/time, onboarding, and other commodity app features. Trigger phrases: common feature, industry standard, best practice, use a library, admin CRUD, auth hardening, currency input, chart library, table UX, form UX."
argument-hint: "Describe the feature slice, target users, existing stack, and what the app already has locally."
---

# Common Feature Research

Use this skill when the requested feature is common enough that the product should inherit mature industry patterns instead of a thin custom implementation.

## Purpose

Prevent low-value reinvention.

Before coding a common feature, do three things:

1. Research the current implementation baseline.
2. Prefer proven libraries and reference patterns over bespoke primitives.
3. Expand the feature to the minimum standard behavior users already expect.

## Trigger Test

Load this skill when the answer to either question is yes:

- Would users expect this feature to behave similarly across many modern apps?
- Is there already a mature React/JavaScript library or reference implementation for this?

Typical surfaces:

- authentication, password reset, login/signup, MFA, protected routes
- admin dashboards, CRUD consoles, moderation tools, data-heavy list pages
- forms, validation, field arrays, destructive confirmations, toasts
- tables, search, filters, pagination, bulk actions, row actions
- currency, amount, percentage, phone, masked, or formatted inputs
- charts, analytics cards, dashboards, reports
- file upload, media pickers, date/time pickers, command palettes, notifications

## Research Order

1. Read local canonical docs, repo memory, and existing skills first.
2. Check what the project already uses. Reuse that library or pattern when it is viable.
3. If the feature is still underspecified, do a quick current-reference pass:
   - normative source when one exists
   - serious library docs
   - serious reference implementation or established repo
4. If live research is unavailable, widen the baseline by structured brainstorming from known standards rather than implementing the minimum request literally.
5. For data-heavy navigation, CRUD, dashboard, or app-shell work, load `ui/frontend-performance-guidelines` before choosing fetch, prefetch, and mutation-refresh behavior.

## Library-First Decision Rule

Default to an existing library when it solves a standard problem cleanly and the project stack supports it.

Common defaults:

- forms: `react-hook-form` + Zod
- toasts: `sonner`
- tables: `@tanstack/react-table` + project table primitives
- currency/amount inputs: `react-number-format`
- charts: a mature charting library already present in the project; if none exists, prefer established React chart libraries such as `recharts` or `@nivo/*` over custom SVG chart code for standard analytics
- admin/data frameworks: if the project already uses an admin/data framework or registry layer, extend it before building a parallel CRUD stack

Do not add a new library if the project already has a capable equivalent or if the feature is genuinely trivial.

## Baseline Expectations By Feature Type

### Auth

- generic auth error messages for login, recovery, and registration when enumeration risk exists
- login throttling or rate limiting, plus optional CAPTCHA/step-up only after failed attempts when appropriate
- session handling, logout, recovery, and sensitive-action re-auth coverage
- input validation and normalization, but never destructive password truncation
- logging for failures, lockouts, resets, and sensitive transitions
- seeded non-production accounts for critical roles and restricted states when automated coverage depends on auth
- first-party automation bootstrap for OAuth-heavy apps: API login, session bootstrap, or Playwright `storageState`
- quick-login or test-account UI only in local and preview or staging while unpublished, and removed after publish

### Admin / CRUD

- explicit role and permission matrix
- lifecycle actions beyond CRUD when relevant: archive, restore, deactivate, block, revoke, delete
- list toolbar with search, filters, and bulk actions
- primary create action in page header or toolbar, opening dialog/sheet by default
- confirmation and auditability for destructive actions

### Navigation, Loading, And Mutation Performance

- dense shell navigation uses intent-based prefetch instead of blanket eager prefetch when routes trigger data work
- initial route load fetches only data required for the visible view; inactive tabs, dialogs, and advanced panels stay idle until opened
- async state is split into `initialLoading`, `backgroundRefreshing`, and `isMutating` rather than one page-wide loading boolean
- row-level CRUD prefers optimistic patching or narrow cache invalidation over full-page reloads or broad refetch-all patterns
- refresh behavior preserves scroll, selection, filters, pagination, active tab, open overlay, and draft inputs whenever correctness allows
- transient operation outcomes use toast or compact status text; inline alert blocks are reserved for persistent or blocking states

### Tables

- internal scroll ownership, sticky header, toolbar, empty/loading/error states
- sorting, filtering, pagination, row actions, and selection when the use case is data-heavy
- numeric formatting and right alignment for amounts and metrics

### Forms

- schema-backed validation and accessible error placement
- disabled/loading/success/error states
- unsaved-change protection when editing in overlays
- helper text and field grouping for anything non-trivial

### Currency / Amount Inputs

- formatted display while typing
- locale-aware summary formatting
- explicit currency symbol/code
- canonical numeric value stored separately from formatted display

### Charts

- use a chart library with accessible legends/tooltips and responsive behavior
- choose the simplest chart type that matches the data question
- do not build a custom chart primitive for standard line/bar/area/pie use cases

### UI References And Mobbin

- when using Mobbin or external references, treat them as sources for layout, hierarchy, and feature coverage first
- preserve the local project's tokens, typography, colors, shadows, and component rules unless the user explicitly asks to clone the external style language
- if local styling docs already exist, they outrank reference screens for visual styling decisions

### Design-System Documentation

- document more than colors and typography
- include component anatomy, spacing/gap rules, text sizes, color roles, radius, shadows, hover/focus/active/disabled/loading states, pointer affordances, and overlay behavior
- document usage rules, not just raw token values

### Testing And Journey Documentation Baseline

- document the primary, alternate, destructive, and recovery user journeys for the feature before calling the slice implementation-ready
- document the routes, RPCs, webhooks, or third-party contracts each critical journey touches when those surfaces exist
- identify which journeys belong in pre-merge smoke, blocking release regression, or exploratory or nightly coverage
- if the journey inventory is missing, treat that as a documentation gap that blocks robust E2E planning

## Pre-Code Output

Before coding, produce a compact research record:

```markdown
## Common Feature Research Record
- Feature slice: {what is being built}
- Existing local stack: {current relevant libraries/components/tokens}
- External references checked: {docs/repos/none}
- Library decision: {reuse existing / add library / stay custom}
- Expected baseline behaviors: {bulleted list}
- Journey inventory: {primary / alternate / destructive / recovery journeys}
- Contract surfaces: {routes / RPCs / webhooks / third-party APIs}
- Release regression tier: {pre-merge smoke / blocking release / nightly-exploratory}
- Performance model: {route-entry query budget / prefetch policy / mutation refresh scope / feedback surfaces}
- Explicit exclusions: {out of scope}
```

## Anti-Patterns

- Shipping a currency field as a raw number input when formatted entry is expected
- Building a custom chart for a standard dashboard metric view
- Defaulting a CRUD list page to a permanently open create form
- Letting shell navigation prefetch trigger route-entry API fan-out before user intent is clear
- Using a full-page loading gate or subpage reload after a row-level CRUD mutation
- Showing every successful mutation as an inline alert block that pushes dense content below the fold
- Letting sidebars and tables rely on document scroll instead of owning their scroll containers
- Copying Mobbin styling into a project that already has its own design system without being asked
- Shipping Google-only or OAuth-only auth with no non-production automation lane for role-based testing
- Treating "works on the happy path" as sufficient for auth or admin features

## Output Contract

When invoked, provide:

1. Common Feature Research Record.
2. Recommended library choice and why.
3. Minimum expected behaviors before implementation is considered complete.
4. UX/layout warnings for the chosen feature surface.