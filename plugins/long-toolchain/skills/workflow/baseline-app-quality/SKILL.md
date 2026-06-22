---
name: baseline-app-quality
description: "**WORKFLOW SKILL** - The cross-cutting, stack-neutral quality baseline every app should inherit regardless of feature: design-system theming, maintainable structure, complete UX states, security/data defaults, performance, accessibility, and i18n. Use when: starting a new app or surface, reviewing quality bar, defining 'definition of done' for any UI, deciding non-functional defaults, or porting a platform's implicit standard (e.g. Lovable) into your own stack. Trigger phrases: quality baseline, definition of done, non-functional defaults, design tokens discipline, app quality bar, what every app should have, semantic tokens, port lovable standard."
argument-hint: "Describe the app/surface, target stack (Vue/React/etc.), and whether this is new build, review, or extending an existing baseline."
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

| Principle          | React/shadcn (e.g. Lovable export)          | Vue + Tailwind (this user's default)                       |
| ------------------ | ------------------------------------------- | ---------------------------------------------------------- |
| Design tokens      | CSS vars in `index.css` + `tailwind.config` | identical — CSS vars + Tailwind config                     |
| Component variants | shadcn variant props                        | Vue component variants / `reka-ui`/headless + variant prop |
| Data access        | hooks + TanStack Query                      | Pinia stores / composables (never in components)           |
| Forms              | react-hook-form + Zod                       | `vee-validate`/composable + Zod                            |

When a rule says "design tokens" or "component variants," apply the _principle_ via the right column.

## The Seven Dimensions

### 1. Design System / Theming (strongest transferable rule)

- **Never write raw/inline color styles in components.** No `text-white`, `bg-black`, hex literals in markup.
- **Semantic tokens for colors, gradients, fonts, radius, shadows.** Everything themes through one source
  (CSS vars + Tailwind config), so dark mode and rebrands are a token change, not a find-replace.
- **Component variants live in the design system**, not as ad-hoc `className` overrides at call sites.
- Contrast- and dark-mode-aware by default; verify both themes.
- Responsive by default — no fixed-width layouts that break on mobile.
- **This dimension is the part of Lovable's standard worth importing wholesale.** It is fully stack-neutral.

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

## Importing a Platform's Implicit Standard (e.g. Lovable)

When asked to "extract" a generator's standard into this baseline:

1. **Get its stated intent, not its code.** Read the platform's published system prompt for _rules_; clone one
   bare scaffold for the _template invariants_. Code shows outcomes; the prompt shows priorities.
2. **Diff exports against the bare scaffold** before generalizing — otherwise you "discover" the starter
   template and mistake it for a quality standard.
3. **Treat generated business code as modal, not invariant.** It varies run-to-run; annotate extracted
   patterns with confidence ("present in 9/10 → enforce" vs "4/10 → don't assume").
4. **Strip stack specifics; keep the principle.** Map via the Stack-Neutral Convention table above.
5. **Fold findings into the seven dimensions** here — don't create a parallel "lovable-rules" doc.

## Anti-Patterns

- Hardcoded colors / inline style overrides instead of semantic tokens.
- Component variants pasted as call-site `className` soup.
- Shipping only the happy path (no loading/error/empty).
- Native `window.confirm` for destructive actions.
- Secrets in client-public env vars; authorization enforced only in the UI.
- Page-wide loading boolean; refetch-all after a single-row mutation; refresh that loses scroll/filters.
- Hardcoded user-facing strings bypassing i18n.
- Copying a generator's React/shadcn code verbatim into a Vue (or other) project instead of importing the principle.

## Output Contract

When invoked, provide:

1. Which of the seven dimensions are in scope for this surface (and which are N/A, with reason).
2. The concrete baseline checklist for those dimensions, mapped to the target stack.
3. Any gaps where the current build falls below the floor, ranked by risk.
4. For "extract platform standard" requests: the dimension-by-dimension mapping with confidence annotations.

## Works With

- `common-feature-research` — per-feature baselines; pair with this cross-cutting floor.
- `ui/design-intelligence`, `ui/component-architecture`, `ui/ux-patterns` — deep design-system and component guidance.
- `ui/frontend-performance-guidelines` — detailed fetch/prefetch/mutation performance model.
- `feature-auth-system`, `infrastructure/supabase-operations`, `role-based-access-control` — security/data dimension depth.
- `requirements-pack-enforcement` — source-backed definition-of-done gate.
