---
name: baseline-app-quality
description: "**WORKFLOW SKILL** - The cross-cutting, stack-neutral quality baseline every app should inherit regardless of feature: design-system theming, maintainable structure, complete UX states, security/data defaults, performance, accessibility, i18n, and app-shell/interaction patterns (sidebar/nav, tables, create-via-dialog, confirmation flows). Use when: starting a new app or surface, reviewing quality bar, defining 'definition of done' for any UI, deciding non-functional defaults, fixing recurring UI/UX defects (un-scrolling sidebars, raw tables, inline create forms, missing confirm dialogs), or porting a platform's implicit standard (e.g. Lovable) into your own stack. Trigger phrases: quality baseline, definition of done, non-functional defaults, design tokens discipline, app quality bar, what every app should have, semantic tokens, port lovable standard, sidebar scrolling, table design, modal vs inline form, confirmation dialog pattern, ui patterns, interaction patterns, admin dashboard layout, pointer cursor, hover/focus states, spacing scale, typography scale, button sizes, inconsistent fonts, page shell consistency, visual polish, basic ui mistakes, ui fundamentals."
argument-hint: "Describe the app/surface, target stack (Next.js/Vue/etc.), and whether this is new build, review, or extending an existing baseline."
---

# Baseline App Quality

The non-functional quality floor that should hold for **every** app surface, in any stack.

This is the **cross-cutting** axis. `common-feature-research` covers per-feature baselines (auth, tables,
charts…); this skill covers the dimensions that apply regardless of which feature you build. Use both:
research the feature, then hold it to this floor.

## Purpose

Capture the implicit "every app gets this for free" standard that good app-generators (Lovable, v0) bake
in — decoupled from any one framework — so it transfers to Vue, React, or anything else.

**The standard is dimensions + principles, never a template.** Do not copy a generator's React/shadcn code.
Copy its _intent_; implement with the host stack's idioms.

## Stack-Neutral Convention

Each rule is a principle. Where the mechanism differs by stack, the rule names the principle and you map it:

| Principle          | Next.js + Tailwind (this user's default)                                             | Vue + Tailwind (secondary)                                  |
| ------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Design tokens      | CSS vars in `globals.css` + `tailwind.config`                                        | identical — CSS vars + Tailwind config                      |
| Component variants | shadcn/ui (Radix primitives) variant props / `cva`                                   | Vue variants / `reka-ui` (Radix Vue) / shadcn-vue + variant |
| Data access        | Server Components + server actions / route handlers; TanStack Query for client cache | Pinia stores / composables (never in components)            |
| Forms              | react-hook-form + Zod                                                                | `vee-validate`/composable + Zod                             |
| Server runtime     | Cloudflare Workers (edge) — keep server logic Worker-compatible                      | n/a                                                         |

When a rule says "design tokens" or "component variants," apply the _principle_ via the right column.
**Default to the Next.js column** unless the surface is explicitly Vue. The behavioral contracts (focus
trap, scroll, confirmation) come from **Radix primitives** under both shadcn/ui (React) and Reka UI (Vue) —
identical semantics, different binding.

## The Eight Dimensions

### 1. Design System, Theming & Visual Consistency (strongest transferable rule)

- **Never write raw/inline color styles in components.** No `text-white`, `bg-black`, hex literals in markup.
- **Semantic tokens for colors, gradients, fonts, radius, shadows.** Everything themes through one source
  (CSS vars + Tailwind config), so dark mode and rebrands are a token change, not a find-replace.
- **Everything comes off a scale, not an arbitrary value** — one spacing scale, one type scale, one radius
  scale, one shadow/elevation scale, a fixed control-size set. No `mt-[13px]`/`text-[15px]` one-offs.
- **Component variants live in the design system**, not as ad-hoc `className` overrides at call sites.
- **Affordance & state are non-optional:** `cursor: pointer` on every clickable (`not-allowed` on disabled);
  every interactive element ships hover + active + **visible `:focus-visible`** + disabled + loading states.
  Never `outline:none` with no replacement.
- **Visual rhythm:** deliberate, consistent spacing (incl. label→input, field→field, fields→submit gaps);
  hierarchy by weight/color not just size; height parity between adjacent inputs/buttons; one primary action
  per view; consistent casing, radius, and icon set.
- Contrast- and dark-mode-aware by default; verify both themes.
- Responsive by default — no fixed-width layouts that break on mobile.
- **This dimension is the part of Lovable's standard worth importing wholesale.** It is fully stack-neutral.
- **The exhaustive micro-rules** (cursors/affordance, spacing & type scales, control sizing, interactive-
  state matrix, borders/radius/shadow, icons, motion, page-shell consistency, formatting, z-index) are the
  canonical `ui/design-intelligence` skill (12 priority categories + pre-delivery checklist). Load that
  skill when building or reviewing any surface — this dimension is its definition-of-done summary, not a
  parallel copy.

### 2. Maintainable Structure

- Small, focused, reusable components — no monolithic files.
- Refactor proactively when a change reveals structural strain; prefer small verifiable changes over rewrites.
- **Strict scope:** build only what's asked; do not anticipate future needs or add speculative features.
- **No direct backend/data calls in components** — route through stores/composables/hooks.
- Consistent, non-conflicting file and component naming.

### 3. Complete UX States

Every async or interactive surface ships all of:

- `loading`, `error`, `empty`, and `success` states — not just the happy path.
- Forms: schema-backed validation, accessible error placement, disabled/loading/error/success states, and
  unsaved-change protection when editing in overlays.
- **Transient outcomes → toast / compact status. Persistent or blocking → inline alert.** Don't push content
  below the fold with an alert block for every success.
- **Destructive/privilege actions use a styled confirmation modal, never the native browser confirm.**

> Lovable's prompt only mandates toasts here; the rest of this dimension comes from `common-feature-research`
> and `feature-*` skills. This is a gap Lovable fills via scaffold/library defaults, not via stated rules.

### 4. Security / Data Defaults

- Validate and normalize at the trust boundary; never trust client input. Mirror critical validation server-side.
- **Row-level ownership/RLS on every table**; authorization runs server-side even when UI hides actions.
- **Secrets server-side only.** No secret in a client-public env var (`VITE_*`, `NEXT_PUBLIC_*`).
- Generic auth error messaging where enumeration is a risk; throttle/rate-limit auth endpoints.
- Audit sensitive and lifecycle transitions.

> Lovable's prompt is largely silent here — its security comes from the Supabase scaffold + a separate
> scanner. Source this dimension from OWASP ASVS and `feature-auth-system`, not from a generator's output.

### 5. Performance Baseline

- Route entry fetches only data for the visible view; inactive tabs/dialogs/panels stay idle until opened.
- Split async state into `initialLoading` / `backgroundRefreshing` / `isMutating`, not one page-wide boolean.
- Row-level mutations use optimistic patch or narrow cache invalidation — not refetch-all or full-page reload.
- Refresh preserves scroll, selection, filters, pagination, active tab, open overlay, and draft input.
- Lazy-load images; defer non-critical scripts.

### 6. Accessibility

- Semantic HTML; labels on inputs; visible focus states; keyboard navigability.
- Contrast meets WCAG AA in both themes; adequate tap-target size on touch.

### 7. Internationalization

- **Never hardcode user-facing text in markup** — route through i18n.
- Default to the user's required locale policy (this user: Vietnamese-first bilingual; preserve diacritics).
- Match the user's language in any generated copy.

### 8. App Shell & Interaction Patterns

The structural/behavioral layer agents most often get wrong. These are **layout and interaction
contracts**, not visual taste — the defects below are invisible in a static screenshot, so they slip
past visual review. The canonical detail lives in existing skills — load them when building or reviewing
admin / dashboard / data-heavy surfaces:

- **`ui/ux-patterns`** — shadcn code recipes for app shell, sidebar, tables, dialog/sheet create flows,
  confirmation, toasts, empty/loading states.
- **`ui/frontend-performance-guidelines`** — the navigation/data-loading/mutation performance model.
- **`ui/frontend-layout-pitfalls`** — overflow traps, sticky headers, scroll ownership, click-outside.

This dimension is their definition-of-done summary. The non-negotiable floor:

- **App shell is viewport-bound.** Sidebar and topbar are `sticky`/fixed and never grow the page; the
  sidebar's nav list scrolls _internally_ (`overflow-y-auto` on the list, not the page). Sidebar collapses
  to a drawer/sheet below the breakpoint. The main content column scrolls independently.
- **Tables live in a bounded scroll container** with a **sticky header**; the page does not grow
  unbounded with row count. Ship density, alignment (numbers right-aligned/tabular), per-row actions in a
  trailing column or menu, bulk-selection where relevant, and the full `loading / empty / error` set —
  never a raw `<table>` dump.
- **Create/edit is overlay-first, triggered from a header CTA → dialog (focused/short) or sheet
  (longer/contextual).** Do **not** drop a bare create form inline at the top or bottom of a list page by
  default. Reserve a full dedicated page only for genuinely long/multi-step records.
- **Overlays obey the dialog contract:** focus trap, `Esc` to close, focus returns to the trigger, body
  scroll locked, only one primary modal at a time. Use the platform's Dialog primitive (Radix /
  shadcn / Reka UI) — never a hand-rolled `position: fixed` div.
- **Destructive/privilege actions → AlertDialog-style confirm** (styled modal, never `window.confirm`);
  high-blast-radius actions require typed/explicit confirmation. Pair with optimistic UI + undo where safe.
- **Feedback routing:** transient success → toast; persistent/blocking → inline alert; field errors →
  inline at the field. (Reinforces Dimension 3.)

> This dimension is the answer to "agents keep producing un-scrolling sidebars, raw tables, and inline
> create forms." The fix is **system-first**: bake these contracts into shared shell/table/dialog
> components so the correct behavior is the default, then enforce via the reference checklist at review.

## Importing a Platform's Implicit Standard (e.g. Lovable)

When asked to "extract" a generator's standard into this baseline:

1. **Get its stated intent, not its code.** Read the platform's published system prompt for _rules_; clone one
   bare scaffold for the _template invariants_. Code shows outcomes; the prompt shows priorities.
2. **Diff exports against the bare scaffold** before generalizing — otherwise you "discover" the starter
   template and mistake it for a quality standard.
3. **Treat generated business code as modal, not invariant.** It varies run-to-run; annotate extracted
   patterns with confidence ("present in 9/10 → enforce" vs "4/10 → don't assume").
4. **Strip stack specifics; keep the principle.** Map via the Stack-Neutral Convention table above.
5. **Fold findings into the eight dimensions** here — don't create a parallel "lovable-rules" doc.

## Anti-Patterns

- Hardcoded colors / inline style overrides instead of semantic tokens.
- Component variants pasted as call-site `className` soup.
- Shipping only the happy path (no loading/error/empty).
- Native `window.confirm` for destructive actions.
- Secrets in client-public env vars; authorization enforced only in the UI.
- Page-wide loading boolean; refetch-all after a single-row mutation; refresh that loses scroll/filters.
- Hardcoded user-facing strings bypassing i18n.
- Copying a generator's React/shadcn code verbatim into a Vue (or other) project instead of importing the principle.
- **Sidebar/nav that grows the page and never scrolls, or isn't sticky/collapsible** (app shell not viewport-bound).
- **Raw, unbounded `<table>` dumps** — no sticky header, no internal scroll, no density/alignment/row-action/empty-state treatment.
- **Bare create/edit forms dropped inline on a list page** instead of a header-CTA → dialog/sheet flow.
- **Hand-rolled `position: fixed` "modals"** missing focus trap / `Esc` / focus return / scroll lock, instead of a Dialog primitive.
- **Clickable `<div>`s with the default arrow cursor** (no `pointer`); `pointer` on non-interactive text (false affordance).
- **`outline:none` / removed focus rings** with no `:focus-visible` replacement — keyboard users lost.
- **Controls with no hover/active/disabled/loading states** — dead-feeling UI, double-submits.
- **Arbitrary one-off values** (`mt-[13px]`, `text-[15px]`) instead of the spacing/type scale; cramped layouts; button welded to the last input.
- **Mismatched control heights / radii / multiple loud primary buttons / mixed icon sets / inconsistent casing** on one screen.
- **Inconsistent page shell across routes** — each page inventing its own width, gutters, header placement, or card styling.
- **Raw/unformatted values** — literal `null`/`undefined`, un-grouped numbers, raw timestamps, "1 items", untruncated overflow, shipped lorem ipsum.

## Output Contract

When invoked, provide:

1. Which of the eight dimensions are in scope for this surface (and which are N/A, with reason).
2. The concrete baseline checklist for those dimensions, mapped to the target stack.
3. Any gaps where the current build falls below the floor, ranked by risk.
4. For "extract platform standard" requests: the dimension-by-dimension mapping with confidence annotations.

## Works With

**This skill is the cross-cutting floor / definition-of-done. The detailed UI/UX rules and code live in the
`ui/` skill family — load the relevant one rather than duplicating it here:**

- `ui/design-intelligence` — **the** master UI/UX rule catalog (12 priority categories: a11y, touch, perf,
  style, layout, typography, animation, forms, nav, charts, trust, maintainability) + pre-delivery
  checklist. This is Dimension 1's full detail. Load for any surface.
- `ui/ux-patterns` — canonical shadcn code recipes (forms, nav, tables, dialog/sheet, confirm, toast,
  skeleton, empty state). Dimension 8's full detail.
- `ui/frontend-performance-guidelines` — navigation / data-loading / mutation performance model
  (Dimension 5 + Dimension 8). The instant-navigation standard lives here.
- `ui/frontend-layout-pitfalls` — recurring layout regressions (overflow, sticky headers, scroll ownership).
- `ui/component-architecture` — component layers, system-first wrappers, the shared-component manifest.
- `common-feature-research` — per-feature baselines; pair with this cross-cutting floor.
- `ui-analyst` agent — screenshot-backed review gate; audit a built surface against these before deploy.
- `feature-admin-dashboard` — admin/staff dashboard layout, role-gated nav, lifecycle operations.
- `feature-auth-system`, `infrastructure/supabase-operations`, `role-based-access-control` — security/data dimension depth.
- `requirements-pack-enforcement` — source-backed definition-of-done gate.
