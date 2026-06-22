---
name: design-intelligence
description: "**REFERENCE SKILL** — UI/UX design intelligence rules, pre-delivery checklists, and quality standards. Nielsen-first guidelines covering accessibility, interaction design, performance, style, layout, typography, animation, forms, navigation, security/trust UX, maintainability, and data visualization. Use when: reviewing UI for quality, planning new page/component design, checking accessibility compliance, selecting styles/colors/typography for a product, auditing UX before delivery, choosing chart types, implementing dark mode, or making any design decision. Trigger phrases: UI review, UX audit, usability heuristic audit, accessibility check, design rules, style guide, color contrast, animation timing, form UX, navigation patterns, chart type, responsive layout, dark mode, design system."
argument-hint: "Name the design concern (e.g., 'accessibility audit', 'animation timing', 'form UX review', 'pre-delivery checklist')."
---

# UI/UX Design Intelligence

Priority-ordered design rules for web and mobile applications. Follow priority 1→10 when deciding which rules to enforce first. Sourced from Apple HIG, Material Design, WCAG, and Core Web Vitals standards.

## Default Build Assumption

For React + Tailwind work, treat [ui.shadcn.com](https://ui.shadcn.com/) as the default component foundation.

- Start from shadcn/ui primitives for dialogs, sheets, dropdown menus, tables, forms, toasts, tabs, navigation menus, and sidebars before inventing custom markup.
- Extend shadcn components with project tokens and composition patterns instead of rebuilding baseline accessibility and interaction behavior from scratch.
- If a requested pattern does not exist in shadcn/ui, compose it from existing shadcn primitives first; only author fully custom components when composition is clearly insufficient.
- When auditing generated UI, missing shadcn-grade behaviors count as a quality failure even if the static layout looks correct.

## System-First Consistency Gate

Before approving a UI direction or implementation:

- Check whether repeated surfaces such as headers, footers, cards, toolbars, buttons, empty states, and section shells are being treated as shared-system concerns.
- Prefer fixing recurring visual rules in tokens, shared variants, wrapper patterns, or layout shells instead of tolerating page-by-page restyling.
- Consider page-local duplication of spacing, typography, color, border, radius, shadow, and interaction rules to be a consistency defect, not a stylistic preference.
- When auditing a page, ask whether the page is composing the design system or silently bypassing it.

## Foundational Heuristics

Use Nielsen's 10 Usability Heuristics as the top-level audit frame before applying the detailed rule sections below.

| Heuristic | What Must Be True In The UI |
|---|---|
| 1. Visibility of system status | Async actions show loading, success, failure, and completion states immediately. |
| 2. Match between system and real world | Labels, actions, and errors use domain language instead of implementation jargon. |
| 3. User control and freedom | Users can cancel, undo, back out, or recover from risky flows. |
| 4. Consistency and standards | Similar actions and components behave the same across the product. |
| 5. Error prevention | Destructive and irreversible actions require safeguards before execution. |
| 6. Recognition rather than recall | Navigation, labels, helper text, and defaults reduce memory burden. |
| 7. Flexibility and efficiency of use | Keyboard support, bulk actions, shortcuts, and progressive disclosure exist where useful. |
| 8. Aesthetic and minimalist design | Screens emphasize the primary action and avoid clutter or decorative noise. |
| 9. Help users recognize, diagnose, and recover from errors | Errors explain what happened, what the user can do next, and preserve recoverable state. |
| 10. Help and documentation | Complex workflows expose inline guidance, tooltips, help text, or linked docs. |

## Interaction Completeness Gate

Before calling any UI implementation "done", verify all of the following:

- Every interactive element has default, hover, focus, active, disabled, and loading states when those states apply.
- Repeated headers, footers, cards, toolbars, and section shells are implemented through shared patterns or shared variants rather than page-specific reinvention.
- Every async action shows immediate progress feedback, then a success toast/banner or a recoverable error state.
- Async list and detail mutations preserve visible context; page-wide teardown spinners after row-level actions are a quality failure.
- Every destructive action uses a confirmation dialog or equivalent safeguard before execution.
- Field-level errors stay near the field; operation-level outcomes use toast, banner, dialog, or status region instead of raw inline text dumps.
- Transient operation outcomes use toast or compact status text; inline alert blocks are reserved for persistent or blocking conditions.
- Long-running or destructive flows provide cancel, undo, retry, or restore paths where technically possible.
- Sidebars remain sticky when intended, group large nav sets, and scroll internally instead of expanding the page indefinitely.
- Data tables own their own scroll region when height or width exceeds the viewport; the page must not become the only scroll container for dense data.
- Overlays, sheets, and menus do not block persistent app chrome with invisible full-screen click traps.
- Empty, loading, success, timeout, and error states exist for every critical feature path.
- Keyboard focus order, `Escape`, and screen-reader announcements remain coherent across dialogs, menus, and toasts.

## Rule Categories by Priority

| Priority | Category | Impact | Key Checks | Anti-Patterns |
|----------|----------|--------|-------------|---------------|
| 1 | Accessibility | CRITICAL | Contrast 4.5:1, alt text, keyboard nav, aria-labels | Removing focus rings, icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | Min 44×44px, 8px+ spacing, loading feedback | Reliance on hover only, instant state changes (0ms) |
| 3 | Performance | HIGH | WebP/AVIF, lazy loading, reserve space (CLS < 0.1) | Layout thrashing, cumulative layout shift |
| 4 | Style Selection | HIGH | Match product type, consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic, emoji as icons |
| 5 | Layout & Responsive | HIGH | Mobile-first breakpoints, viewport meta, no horizontal scroll | Fixed px widths, disable zoom |
| 6 | Typography & Color | MEDIUM | Base 16px, line-height 1.5, semantic color tokens | Text < 12px body, gray-on-gray, raw hex in components |
| 7 | Animation | MEDIUM | Duration 150–300ms, motion conveys meaning, spatial continuity | Decorative-only animation, animating width/height, no reduced-motion |
| 8 | Forms & Feedback | MEDIUM | Visible labels, error near field, helper text, progressive disclosure | Placeholder-only labels, errors only at top |
| 9 | Navigation | HIGH | Predictable back, bottom nav ≤5, deep linking | Overloaded nav, broken back behavior |
| 10 | Charts & Data | LOW | Legends, tooltips, accessible colors | Relying on color alone to convey meaning |

---

## 1. Accessibility (CRITICAL)

- **color-contrast** — Minimum 4.5:1 for normal text; 3:1 for large text
- **focus-states** — Visible focus rings 2–4px on interactive elements
- **alt-text** — Descriptive alt text for meaningful images
- **aria-labels** — aria-label for icon-only buttons; accessibilityLabel in native
- **keyboard-nav** — Tab order matches visual order; full keyboard support
- **form-labels** — Use `<label>` with `for` attribute
- **skip-links** — Skip to main content for keyboard users
- **heading-hierarchy** — Sequential h1→h6, no level skip
- **color-not-only** — Don't convey info by color alone (add icon/text)
- **dynamic-type** — Support system text scaling; avoid truncation as text grows
- **reduced-motion** — Respect `prefers-reduced-motion`; reduce/disable animations when requested
- **voiceover-sr** — Meaningful accessibilityLabel/accessibilityHint; logical reading order
- **escape-routes** — Provide cancel/back in modals and multi-step flows
- **keyboard-shortcuts** — Preserve system and a11y shortcuts; offer keyboard alternatives for drag-and-drop

## 2. Touch & Interaction (CRITICAL)

- **touch-target-size** — Min 44×44pt (Apple) / 48×48dp (Material); extend hit area beyond visual bounds if needed
- **touch-spacing** — Minimum 8px/8dp gap between touch targets
- **hover-vs-tap** — Use click/tap for primary interactions; don't rely on hover alone
- **loading-buttons** — Disable button during async operations; show spinner or progress
- **error-feedback** — Clear error messages near problem
- **cursor-pointer** — Add cursor-pointer to clickable elements (web)
- **gesture-conflicts** — Avoid horizontal swipe on main content; prefer vertical scroll
- **tap-delay** — Use `touch-action: manipulation` to reduce 300ms delay (web)
- **standard-gestures** — Use platform standard gestures consistently; don't redefine
- **system-gestures** — Don't block system gestures (Control Center, back swipe, etc.)
- **press-feedback** — Visual feedback on press (ripple/highlight; MD state layers)
- **haptic-feedback** — Use haptic for confirmations; avoid overuse
- **gesture-alternative** — Always provide visible controls for critical actions; don't rely on gesture-only
- **safe-area-awareness** — Keep primary touch targets away from notch, Dynamic Island, gesture bar, screen edges
- **no-precision-required** — Avoid requiring pixel-perfect taps on small icons or thin edges
- **swipe-clarity** — Swipe actions must show clear affordance or hint
- **drag-threshold** — Use movement threshold before starting drag to avoid accidental drags

## 3. Performance (HIGH)

- **image-optimization** — Use WebP/AVIF, responsive images (srcset/sizes), lazy load non-critical assets
- **image-dimension** — Declare width/height or use aspect-ratio to prevent layout shift (CLS)
- **font-loading** — Use `font-display: swap/optional` to avoid invisible text (FOIT)
- **font-preload** — Preload only critical fonts; avoid overusing preload on every variant
- **critical-css** — Prioritize above-the-fold CSS (inline critical CSS or early-loaded stylesheet)
- **lazy-loading** — Lazy load non-hero components via dynamic import / route-level splitting
- **bundle-splitting** — Split code by route/feature (React Suspense / Next.js dynamic)
- **third-party-scripts** — Load third-party scripts async/defer; audit and remove unnecessary ones
- **reduce-reflows** — Avoid frequent layout reads/writes; batch DOM reads then writes
- **content-jumping** — Reserve space for async content to avoid layout jumps (CLS)
- **virtualize-lists** — Virtualize lists with 50+ items for memory and scroll performance
- **main-thread-budget** — Keep per-frame work under ~16ms for 60fps; move heavy tasks off main thread
- **progressive-loading** — Use skeleton screens / shimmer instead of long blocking spinners for >1s operations
- **input-latency** — Keep input latency under ~100ms for taps/scrolls
- **tap-feedback-speed** — Provide visual feedback within 100ms of tap
- **debounce-throttle** — Use debounce/throttle for high-frequency events (scroll, resize, input)
- **offline-support** — Provide offline state messaging and basic fallback (PWA / mobile)
- **network-fallback** — Offer degraded modes for slow networks (lower-res images, fewer animations)
- **prefetch-discipline** — Dense shell navigation must not trigger blind route-data fan-out; use intent-based prefetch for expensive routes
- **query-gating** — Hidden tabs, dialogs, drawers, and secondary panels do not fetch until visible or explicitly activated
- **mutation-scope** — Row-level CRUD updates the affected data slice first; full-page reloads require a correctness reason, not convenience
- **background-refresh-preservation** — Non-blocking refresh preserves scroll, filters, selection, active tab, and local draft state

## 4. Style Selection (HIGH)

- **style-match** — Match style to product type and industry
- **consistency** — Use same style across all pages
- **no-emoji-icons** — Use SVG icons (Heroicons, Lucide), not emojis
- **color-palette-from-product** — Choose palette from product/industry context
- **effects-match-style** — Shadows, blur, radius aligned with chosen style (glass / flat / clay etc.)
- **platform-adaptive** — Respect platform idioms (iOS HIG vs Material): navigation, controls, typography, motion
- **state-clarity** — Make hover/pressed/disabled states visually distinct while staying on-style
- **elevation-consistent** — Use consistent elevation/shadow scale for cards, sheets, modals
- **dark-mode-pairing** — Design light/dark variants together to keep brand, contrast, and style consistent
- **icon-style-consistent** — Use one icon set/visual language (stroke width, corner radius) across the product
- **system-controls** — Prefer native/system controls over fully custom ones; only customize when branding requires
- **blur-purpose** — Use blur to indicate background dismissal (modals, sheets), not as decoration
- **primary-action** — Each screen should have only one primary CTA; secondary actions visually subordinate

## 5. Layout & Responsive (HIGH)

- **viewport-meta** — `width=device-width initial-scale=1` (never disable zoom)
- **mobile-first** — Design mobile-first, then scale up to tablet and desktop
- **breakpoint-consistency** — Use systematic breakpoints (375 / 768 / 1024 / 1440)
- **readable-font-size** — Minimum 16px body text on mobile (avoids iOS auto-zoom)
- **line-length-control** — Mobile 35–60 chars per line; desktop 60–75 chars
- **horizontal-scroll** — No horizontal scroll on mobile; ensure content fits viewport width
- **spacing-scale** — Use 4pt/8dp incremental spacing system (Material Design)
- **touch-density** — Component spacing comfortable for touch: not cramped, not causing mis-taps
- **container-width** — Consistent max-width on desktop (max-w-6xl / 7xl)
- **z-index-management** — Define layered z-index scale (e.g. 0 / 10 / 20 / 40 / 100 / 1000)
- **fixed-element-offset** — Fixed navbar/bottom bar must reserve safe padding for underlying content
- **scroll-behavior** — Avoid nested scroll regions that interfere with main scroll
- **viewport-units** — Prefer `min-h-dvh` over `100vh` on mobile
- **orientation-support** — Keep layout readable and operable in landscape mode
- **content-priority** — Show core content first on mobile; fold or hide secondary content
- **visual-hierarchy** — Establish hierarchy via size, spacing, contrast — not color alone

## 6. Typography & Color (MEDIUM)

- **line-height** — Use 1.5–1.75 for body text
- **line-length** — Limit to 65–75 characters per line
- **font-pairing** — Match heading/body font personalities
- **font-scale** — Consistent type scale (e.g. 12 14 16 18 24 32)
- **contrast-readability** — Darker text on light backgrounds (e.g. slate-900 on white)
- **text-styles-system** — Use platform type system: iOS Dynamic Type styles / Material type roles
- **weight-hierarchy** — Bold headings (600–700), Regular body (400), Medium labels (500)
- **color-semantic** — Define semantic color tokens (primary, secondary, error, surface, on-surface) not raw hex
- **color-dark-mode** — Dark mode uses desaturated / lighter tonal variants, not inverted colors; test contrast separately
- **color-accessible-pairs** — Foreground/background pairs must meet 4.5:1 (AA) or 7:1 (AAA)
- **color-not-decorative-only** — Functional color (error red, success green) must include icon/text
- **truncation-strategy** — Prefer wrapping over truncation; when truncating use ellipsis + tooltip/expand
- **letter-spacing** — Respect default letter-spacing per platform; avoid tight tracking on body text
- **number-tabular** — Use tabular/monospaced figures for data columns, prices, and timers
- **whitespace-balance** — Use whitespace intentionally to group related items and separate sections
- **native-script-preservation** — Preserve locale-specific diacritics and script marks in all user-facing text; ASCII fallbacks such as `Tieng Viet`, `Ngon ngu`, or `Dat mon` are release-blocking defects
- **translation-naturalness** — Prefer idiomatic local phrasing over literal machine translation or English calques
- **locale-consistency** — Keep terminology, casing, and language choice consistent across nav, buttons, placeholders, statuses, and errors
- **high-salience-proofread** — Proofread headers, tabs, CTA labels, placeholders, summaries, badges, and validation copy in rendered context before release

## 7. Animation (MEDIUM)

- **duration-timing** — Use 150–300ms for micro-interactions; complex transitions ≤400ms; avoid >500ms
- **transform-performance** — Use transform/opacity only; avoid animating width/height/top/left
- **loading-states** — Show skeleton or progress indicator when loading exceeds 300ms
- **excessive-motion** — Animate 1–2 key elements per view max
- **easing** — Use ease-out for entering, ease-in for exiting; avoid linear for UI transitions
- **motion-meaning** — Every animation must express a cause-effect relationship, not just be decorative
- **state-transition** — State changes (hover/active/expanded/collapsed/modal) should animate smoothly, not snap
- **continuity** — Page/screen transitions should maintain spatial continuity (shared element, directional slide)
- **parallax-subtle** — Use parallax sparingly; must respect reduced-motion
- **spring-physics** — Prefer spring/physics-based curves over linear or cubic-bezier for natural feel
- **exit-faster-than-enter** — Exit animations shorter than enter (~60–70% of enter duration)
- **stagger-sequence** — Stagger list/grid item entrance by 30–50ms per item
- **shared-element-transition** — Use shared element / hero transitions for visual continuity between screens
- **interruptible** — Animations must be interruptible; user tap/gesture cancels in-progress animation
- **no-blocking-animation** — Never block user input during an animation; UI must stay interactive
- **fade-crossfade** — Use crossfade for content replacement within the same container
- **scale-feedback** — Subtle scale (0.95–1.05) on press for tappable cards/buttons
- **gesture-feedback** — Drag, swipe, and pinch must provide real-time visual response tracking the finger
- **hierarchy-motion** — Translate/scale direction to express hierarchy: enter from below = deeper, exit upward = back
- **motion-consistency** — Unify duration/easing tokens globally; all animations share same rhythm
- **opacity-threshold** — Fading elements should not linger below opacity 0.2
- **modal-motion** — Modals/sheets animate from their trigger source (scale+fade or slide-in)
- **navigation-direction** — Forward navigation animates left/up; backward animates right/down
- **layout-shift-avoid** — Animations must not cause layout reflow or CLS; use transform for position changes

## 8. Forms & Feedback (MEDIUM)

- **input-labels** — Visible label per input (not placeholder-only)
- **error-placement** — Show error below the related field
- **submit-feedback** — Loading then success/error state on submit
- **required-indicators** — Mark required fields (e.g. asterisk)
- **empty-states** — Helpful message and action when no content
- **toast-dismiss** — Auto-dismiss toasts in 3–5s
- **confirmation-dialogs** — Confirm before destructive actions
- **input-helper-text** — Persistent helper text below complex inputs, not just placeholder
- **disabled-states** — Disabled elements use reduced opacity (0.38–0.5) + cursor change + semantic attribute
- **progressive-disclosure** — Reveal complex options progressively; don't overwhelm upfront
- **inline-validation** — Validate on blur (not keystroke); show error only after user finishes input
- **input-type-keyboard** — Use semantic input types (email, tel, number) to trigger correct mobile keyboard
- **password-toggle** — Provide show/hide toggle for password fields
- **autofill-support** — Use autocomplete / textContentType attributes for system autofill
- **undo-support** — Allow undo for destructive or bulk actions (e.g. "Undo delete" toast)
- **success-feedback** — Confirm completed actions with brief visual feedback (checkmark, toast, color flash)
- **error-recovery** — Error messages must include clear recovery path (retry, edit, help link)
- **multi-step-progress** — Multi-step flows show step indicator or progress bar; allow back navigation
- **form-autosave** — Long forms should auto-save drafts to prevent data loss
- **sheet-dismiss-confirm** — Confirm before dismissing sheet/modal with unsaved changes
- **error-clarity** — Error messages must state cause + how to fix (not just "Invalid input")
- **field-grouping** — Group related fields logically (fieldset/legend or visual grouping)
- **read-only-distinction** — Read-only state visually and semantically different from disabled
- **focus-management** — After submit error, auto-focus the first invalid field
- **error-summary** — For multiple errors, show summary at top with anchor links to each field
- **touch-friendly-input** — Mobile input height ≥44px for touch target requirements
- **destructive-emphasis** — Destructive actions use semantic danger color (red) and are visually separated
- **toast-accessibility** — Toasts must not steal focus; use `aria-live="polite"`
- **aria-live-errors** — Form errors use aria-live region or `role="alert"` for screen readers
- **contrast-feedback** — Error and success state colors must meet 4.5:1 contrast
- **timeout-feedback** — Request timeout must show clear feedback with retry option

## 9. Navigation (HIGH)

- **bottom-nav-limit** — Bottom navigation max 5 items; use labels with icons
- **drawer-usage** — Use drawer/sidebar for secondary navigation, not primary actions
- **back-behavior** — Back navigation must be predictable and consistent; preserve scroll/state
- **deep-linking** — All key screens must be reachable via deep link / URL
- **shell-prefetch-budget** — Dense app-shell menus should not eagerly prefetch every visible destination when route entry triggers heavy data loading
- **stateful-return** — Returning from detail/edit flows should preserve list filters, pagination, selection, and scroll when feasible
- **tab-bar-ios** — iOS: use bottom Tab Bar for top-level navigation
- **top-app-bar-android** — Android: use Top App Bar with navigation icon
- **nav-label-icon** — Navigation items must have both icon and text label
- **nav-state-active** — Current location visually highlighted in navigation
- **nav-hierarchy** — Primary nav (tabs/bottom bar) vs secondary nav (drawer/settings) clearly separated
- **modal-escape** — Modals/sheets must offer clear close/dismiss affordance; swipe-down to dismiss on mobile
- **search-accessible** — Search easily reachable (top bar or tab); provide recent/suggested queries
- **breadcrumb-web** — Web: use breadcrumbs for 3+ level deep hierarchies
- **state-preservation** — Navigating back restores previous scroll position, filter state, and input
- **gesture-nav-support** — Support system gesture navigation without conflict
- **tab-badge** — Use badges on nav items sparingly; clear after user visits
- **overflow-menu** — When actions exceed available space, use overflow/more menu
- **bottom-nav-top-level** — Bottom nav is for top-level screens only; never nest sub-navigation
- **adaptive-navigation** — Large screens (≥1024px) prefer sidebar; small screens use bottom/top nav
- **back-stack-integrity** — Never silently reset the navigation stack or unexpectedly jump to home
- **navigation-consistency** — Navigation placement stays the same across all pages
- **avoid-mixed-patterns** — Don't mix Tab + Sidebar + Bottom Nav at the same hierarchy level
- **modal-vs-navigation** — Modals must not be used for primary navigation flows
- **focus-on-route-change** — After page transition, move focus to main content for screen readers
- **persistent-nav** — Core navigation reachable from deep pages; don't hide entirely in sub-flows
- **destructive-nav-separation** — Dangerous actions (delete account, logout) visually and spatially separated
- **empty-nav-state** — When nav destination is unavailable, explain why instead of silently hiding

## 10. Charts & Data (LOW)

- **chart-type** — Match chart to data type (trend → line, comparison → bar, proportion → pie/donut)
- **color-guidance** — Accessible color palettes; avoid red/green only pairs (colorblind)
- **data-table** — Provide table alternative for accessibility; charts alone are not screen-reader friendly
- **pattern-texture** — Supplement color with patterns/textures so data is distinguishable without color
- **legend-visible** — Always show legend; position near the chart
- **tooltip-on-interact** — Tooltips/data labels on hover (web) or tap (mobile) showing exact values
- **axis-labels** — Label axes with units and readable scale
- **responsive-chart** — Charts must reflow or simplify on small screens
- **empty-data-state** — Show meaningful empty state when no data exists, not blank chart
- **loading-chart** — Use skeleton placeholder while chart data loads
- **animation-optional** — Chart entrance animations must respect prefers-reduced-motion
- **large-dataset** — For 1000+ data points, aggregate or sample; provide drill-down for detail
- **number-formatting** — Locale-aware formatting for numbers, dates, currencies
- **touch-target-chart** — Interactive chart elements must have ≥44pt tap area
- **no-pie-overuse** — Avoid pie/donut for >5 categories; switch to bar chart
- **contrast-data** — Data lines/bars vs background ≥3:1; data text labels ≥4.5:1
- **legend-interactive** — Legends should be clickable to toggle series visibility
- **direct-labeling** — For small datasets, label values directly on the chart
- **tooltip-keyboard** — Tooltip content must be keyboard-reachable
- **sortable-table** — Data tables support sorting with aria-sort
- **axis-readability** — Axis ticks not cramped; auto-skip on small screens
- **data-density** — Limit info density per chart to avoid cognitive overload; split into multiple charts
- **trend-emphasis** — Emphasize data trends over decoration; avoid heavy gradients/shadows
- **gridline-subtle** — Grid lines low-contrast (e.g. gray-200)
- **focusable-elements** — Interactive chart elements keyboard-navigable
- **screen-reader-summary** — Text summary or aria-label describing chart's key insight
- **error-state-chart** — Data load failure shows error with retry, not broken chart
- **export-option** — For data-heavy products, offer CSV/image export
- **drill-down-consistency** — Drill-down interactions maintain clear back-path and breadcrumb
- **time-scale-clarity** — Time series charts clearly label time granularity and allow switching

## 11. Security & Trust UX (HIGH)

- **destructive-confirmation** — Use confirmation dialogs for delete, purge, archive, revoke, logout, and permission-changing actions
- **safe-defaults** — Default to the safer option in irreversible or privileged flows
- **permission-clarity** — Explain role limits, lock reasons, and access restrictions instead of silently disabling paths
- **privacy-context** — Show why sensitive fields are requested and how the data will be used
- **session-visibility** — Surface saving, syncing, expiration, and re-auth requirements before users lose work
- **trust-copy** — Use direct, plain-language security and privacy copy; avoid vague legalistic phrasing in critical moments
- **credential-feedback** — Password and MFA flows explain requirements up front and provide recovery actions
- **sensitive-action-separation** — Visually separate dangerous or high-privilege actions from normal page actions
- **audit-signal** — Privileged actions should expose actor, timestamp, or change summary when the product has operational/admin context
- **phishing-resistance** — Confirm destination, account, or environment before external redirects, billing changes, or credential resets
- **masked-sensitive-data** — Mask secrets, tokens, and payment details by default with explicit reveal intent
- **retry-with-context** — Payment, auth, and permission failures must explain whether retrying is safe or whether support/re-auth is required

## 12. Maintainability & Design-System Governance (HIGH)

- **system-first** — Fix recurring UI issues in the system or pattern layer before applying one-off page patches
- **pattern-reuse** — Prefer shared design-system or feature patterns over ad-hoc local clones
- **shadcn-first** — For React + Tailwind stacks, begin from shadcn/ui primitives and composition patterns before custom component invention
- **component-isolation** — Components should have one primary responsibility: primitive, pattern, feature, or page composition
- **story-state-coverage** — Every reusable component should have isolated stories/examples for default, hover, focus, disabled, loading, empty, error, and dark-mode states as applicable
- **public-api-boundaries** — Non-trivial modules expose stable entry points; consumers should not deep-import volatile internals
- **import-direction** — Shared layers never import from feature or page layers; dependency direction stays predictable
- **dto-boundaries** — Map server DTOs to domain/UI models before they reach presentation components
- **naming-reveals-role** — Name components and functions by responsibility, not generic placeholders like `Wrapper`, `Manager`, or `handleThing`
- **promotion-threshold** — Keep helpers local until they are truly cross-domain; don't dump unstable logic into global `utils`
- **governed-change** — New patterns, modifications, and deprecations should follow a documented decision path instead of silent drift
- **docs-parity** — Pattern docs, stories, and production components must stay in sync; stale pattern docs are a product-quality defect
- **context-agnostic-patterns** — Name reusable patterns by structure and role so they survive reuse across screens and products
- **contextual-examples** — Even reusable patterns need usage examples showing where they fit and when not to use them

---

## Design System Token Architecture

### Three-Layer Structure

```
Primitive (raw values)  →  Semantic (purpose aliases)  →  Component (component-specific)
```

**Example:**
```css
/* Primitive */  --color-blue-600: #2563EB;
/* Semantic */   --color-primary: var(--color-blue-600);
/* Component */  --button-bg: var(--color-primary);
```

**Rules:**
1. Never use raw hex in components — always reference tokens
2. Semantic layer enables theme switching (light/dark)
3. Component tokens enable per-component customization
4. Use HSL format for opacity control
5. Document every token's purpose

### Hierarchical Design System (MASTER + Overrides)

For multi-page projects, use a hierarchical design system:
- `MASTER.md` — Global source of truth with all design rules
- `pages/{page-name}.md` — Page-specific deviations from master

**Retrieval**: When building a specific page, first check `pages/{page-name}.md`. If exists, its rules override the master. If not, use master exclusively.

---

## Common Rules for Professional UI

### Icons & Visual Elements

| Rule | Standard | Avoid |
|------|----------|-------|
| No emoji as icons | Use vector SVG icons (Heroicons, Lucide) | Emojis (🎨 🚀 ⚙️) for navigation/system controls |
| Vector-only assets | SVG or platform vector icons that scale cleanly | Raster PNG icons that blur or pixelate |
| Stable interaction states | Color, opacity, or elevation transitions | Layout-shifting transforms that move surrounding content |
| Correct brand logos | Official brand assets with correct proportions | Guessing paths, recoloring, modifying proportions |
| Consistent icon sizing | Design tokens (icon-sm, icon-md=24pt, icon-lg) | Mixing arbitrary values randomly |
| Stroke consistency | Same stroke width within same visual layer | Mixing thick and thin styles |
| Filled vs outline | One style per hierarchy level | Mixing filled and outline at same level |
| Touch target minimum | 44×44pt interactive area (use hitSlop if smaller) | Small icons without expanded tap area |
| Icon alignment | Align to text baseline with consistent padding | Misaligned or inconsistent spacing |
| Icon contrast | WCAG: 4.5:1 small, 3:1 larger UI glyphs | Low-contrast icons blending into background |

### Interaction Quality

| Rule | Do | Don't |
|------|----|----- |
| Tap feedback | Clear pressed feedback (ripple/opacity/elevation) within 80–150ms | No visual response on tap |
| Animation timing | Micro-interactions 150–300ms with platform-native easing | Instant transitions or slow >500ms |
| Accessibility focus | Screen reader focus order matches visual order | Unlabeled controls or confusing traversal |
| Disabled state | Disabled semantics + reduced emphasis + no tap action | Controls that look tappable but do nothing |
| Touch target | ≥44×44pt (iOS) / ≥48×48dp (Android), expand hit area | Tiny tap targets without padding |
| Gesture conflicts | One primary gesture per region, no nested conflicts | Overlapping gestures causing accidents |
| Semantic controls | Native interactive primitives with proper a11y roles | Generic containers without semantics |

### Light/Dark Mode Contrast

| Rule | Do | Don't |
|------|----|----- |
| Surface readability | Cards clearly separated from background | Overly transparent surfaces |
| Text contrast (light) | Body text ≥4.5:1 against light surfaces | Low-contrast gray body text |
| Text contrast (dark) | Primary ≥4.5:1, secondary ≥3:1 on dark surfaces | Text blending into background |
| Border visibility | Separators visible in both themes | Borders disappearing in one mode |
| State contrast parity | Pressed/focused/disabled equally distinguishable in both themes | States defined for one theme only |
| Token-driven theming | Semantic tokens mapped per theme | Hardcoded per-screen hex values |
| Scrim legibility | Modal scrim 40–60% black for foreground isolation | Weak scrim with competing background |

### Layout & Spacing

| Rule | Do | Don't |
|------|----|----- |
| Safe-area compliance | Respect top/bottom safe areas for fixed UI | Placing UI under notch/status bar |
| System bar clearance | Spacing for status/navigation bars + gesture indicator | Tappable content colliding with OS chrome |
| Consistent content width | Predictable width per device class | Mixing arbitrary widths between screens |
| 8dp spacing rhythm | 4/8dp spacing system for padding/gaps | Random spacing with no rhythm |
| Readable text measure | Avoid edge-to-edge paragraphs on tablets | Full-width long text |
| Section spacing hierarchy | Clear vertical rhythm tiers (16/24/32/48) | Similar UI levels with inconsistent spacing |
| Adaptive gutters | Increase horizontal insets on larger widths | Same narrow gutter on all sizes |
| Scroll + fixed coexistence | Bottom/top content insets for lists behind bars | Content obscured by sticky headers/footers |

---

## Banner Size Quick Reference

| Platform | Type | Size (px) | Aspect |
|----------|------|-----------|--------|
| Facebook | Cover | 820 × 312 | ~2.6:1 |
| Twitter/X | Header | 1500 × 500 | 3:1 |
| LinkedIn | Personal | 1584 × 396 | 4:1 |
| YouTube | Channel art | 2560 × 1440 | 16:9 |
| Instagram | Story | 1080 × 1920 | 9:16 |
| Instagram | Post | 1080 × 1080 | 1:1 |
| Google Ads | Med Rectangle | 300 × 250 | 6:5 |
| Google Ads | Leaderboard | 728 × 90 | 8:1 |
| Website | Hero | 1920 × 600–1080 | ~3:1 |

**Banner design rules:** Safe zones (critical content in central 70–80%), one CTA per banner (bottom-right, min 44px height), max 2 fonts (min 16px body, ≥32px headline), text under 20% for ads (Meta penalizes).

---

## Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons — SVG only
- [ ] Icons from consistent icon family and style
- [ ] Official brand assets with correct proportions
- [ ] Pressed-state visuals don't shift layout
- [ ] Semantic theme tokens used consistently (no ad-hoc hardcoded colors)

### Localization & Copy
- [ ] All localized strings preserve native script and diacritics; no ASCII fallback text ships in the UI
- [ ] Navigation, CTA labels, placeholders, statuses, and error messages use idiomatic phrasing for the target locale
- [ ] Terminology and language choice stay consistent across the screen; no accidental mixed-language controls

### Interaction
- [ ] All tappable elements provide clear pressed feedback
- [ ] Touch targets ≥44×44pt (iOS) / ≥48×48dp (Android)
- [ ] Micro-interaction timing 150–300ms with native easing
- [ ] Disabled states visually clear and non-interactive
- [ ] Screen reader focus order matches visual order
- [ ] No nested/conflicting gesture interactions

### Light/Dark Mode
- [ ] Primary text contrast ≥4.5:1 in both modes
- [ ] Secondary text contrast ≥3:1 in both modes
- [ ] Borders/dividers and interaction states distinguishable in both
- [ ] Modal scrim 40–60% black for foreground legibility
- [ ] Both themes tested before delivery

### Layout
- [ ] Safe areas respected for headers, tab bars, CTA bars
- [ ] Scroll content not hidden behind fixed/sticky bars
- [ ] Verified on small phone (375px), large phone, and tablet (portrait + landscape)
- [ ] Horizontal insets/gutters adapt by device size and orientation
- [ ] 4/8dp spacing rhythm maintained across all levels
- [ ] Long-form text readable on larger devices

### Accessibility
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Color is not the only indicator
- [ ] Reduced motion and dynamic text size supported without layout breakage
- [ ] Accessibility traits/roles/states announced correctly
- [ ] Contrast ratio verified in both light and dark modes

### Interaction Completeness
- [ ] Each important component has default, hover, focus, active, disabled, and loading states as applicable
- [ ] Async actions show loading and success/error feedback using the right surface (toast, banner, dialog, status region)
- [ ] Destructive actions use confirmation before execution and offer undo/restore where appropriate
- [ ] Empty, loading, timeout, success, and error states exist for critical feature paths
- [ ] Sidebars and tables own their intended scroll behavior instead of leaking scroll to the page

### Security & Trust
- [ ] Sensitive or destructive actions are visually separated and explained in plain language
- [ ] Permission restrictions and locked states explain why the user cannot proceed
- [ ] Auth, billing, or credential flows show requirements and recovery options before failure
- [ ] Secrets and sensitive fields are masked by default with explicit reveal intent

### Maintainability
- [ ] Reusable UI is built from shared system patterns before custom variants are introduced
- [ ] Reusable components have isolated stories/examples for their key states
- [ ] Module boundaries and import direction remain predictable; no deep imports into volatile internals
- [ ] Server DTOs are mapped before presentation layers consume them
- [ ] Fixes to recurring UI issues are applied at the pattern/system layer when feasible

### Performance
- [ ] Images optimized (WebP/AVIF), dimensions declared, lazy loaded below fold
- [ ] Fonts use display:swap, only critical fonts preloaded
- [ ] No cumulative layout shift from async content
- [ ] Lists with 50+ items virtualized
- [ ] Skeleton screens for >1s loading operations
