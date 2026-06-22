---
name: frontend-layout-pitfalls
description: "WORKFLOW SKILL - Prevent recurring frontend layout regressions in dashboard/admin UIs. Use for overflow traps, sticky headers, click-outside overlays, flex fragment issues, and contrast/readability regressions. Trigger phrases: page not scrollable, sidebar unclickable, sticky header broken, flex min-h-0 issue, low contrast selected state."
argument-hint: "Describe the affected layout, expected behavior, and where scrolling/clicking/contrast breaks."
---

# Frontend Layout Pitfalls

Playbook for high-frequency UI regressions in React + Tailwind admin and content dashboards.

## Failure Patterns

### 1) Shared layout scroll lock

- Anti-pattern: `overflow-hidden` or hard viewport constraints on shared layout containers.
- Impact: Entire sections become non-scrollable.
- Fix: Keep shared layout scrollable; apply viewport containment only at page-level wrappers.

### 1b) Sidebar stretches with content instead of the viewport

- Symptom: Sidebar height grows with the page, footer drifts, or long tables pull the sidebar taller than the screen.
- Cause: Sidebar and content live in the same unconstrained document flow without a viewport-height shell.
- Fix:
  - Split app shell into viewport-height sidebar pane plus `min-h-0` content pane.
  - Keep sidebar scrolling inside the sidebar content region.
  - On mobile, switch to overlay/off-canvas behavior rather than squeezing the desktop sidebar into the content width.

### 2) Flex child not shrinking

- Symptom: Intended inner area does not scroll; whole page scrolls.
- Cause: Missing `min-h-0` or missing real flex parent.
- Fix:
  - Use real DOM wrapper (`div`) not fragment for flex parents.
  - Add `min-h-0` to flex children meant to shrink.
  - Put `overflow-auto` only on the intended scroll area.

### 3) Click-outside overlay blocks app chrome

- Anti-pattern: `fixed inset-0` invisible overlay for outside-click.
- Impact: Sidebar/header become unclickable.
- Fix: `useRef` + document `mousedown`/`pointerdown` handler.

### 4) Sticky table header not truly sticky

- Requirements:
  - Header inside the same scroll container.
  - `sticky top-0 z-*` plus explicit solid background color.

### 4b) Dense table hijacks page scroll

- Symptom: The entire document scrolls, header disappears, or the table widens past the viewport.
- Cause: Missing dedicated overflow wrapper or missing `min-h-0` on parent panes.
- Fix:
  - Wrap dense tables in a container that owns both `overflow-x-auto` and `overflow-y-auto`.
  - Put sticky headers inside that same container.
  - Keep toolbars and create buttons above the table, not inside the scroll body.

### 5) Selection/readability contrast failure

- Anti-pattern: translucent same-hue background + text.
- Fix: solid high-contrast background with clear text color.
- For labels over gradients/illustrations (for example top-rank badges/podium labels), prefer an opaque contrast chip behind text instead of relying on text-shadow-only readability.

### 6) Nested route metadata asset issues

- Rule: metadata icon paths should be absolute (`/asset.png`).

### 7) Logout navigation leaves stale auth view state (SPA)

- Symptom: After logout, login screen misses elements (for example keep-login checkbox) or becomes non-scrollable.
- Anti-pattern: Internal SPA navigation immediately after sign-out in low-code workflow runtimes.
- Fix: Use hard redirect (`window.location.href = ...`) for logout return-to-login transitions when stale auth component state appears.

### 8) Drag-and-drop on touch devices

- Anti-pattern: Relying solely on native HTML5 drag API for reorderable lists.
- Impact: Touch devices cannot drag; taps may be blocked by drag listeners.
- Fix:
  - Provide explicit up/down reorder buttons as touch fallback.
  - Detect touch via `matchMedia('(pointer: coarse)')` or pointer event type.
  - Use dedicated drag handle elements instead of making entire items draggable.
- Bonus pitfall: Heavy drag/pointer event handling can block SPA route transitions. Force hard navigation (`window.location.assign`) for internal links on pages with complex drag interactions if soft-navigation stalls.

### 9) CRUD page starts with a permanently open form

- Symptom: Create forms consume vertical space above the list, tables are pushed below the fold, and the page feels like two competing workflows.
- Anti-pattern: Defaulting to always-visible inline create forms for standard admin/data management pages.
- Fix:
  - Put the primary create action in the page header or table toolbar.
  - Open the form in a `Dialog` on desktop or `Sheet` on mobile.
  - Reserve inline forms for simple filters/search bars or true split-pane editing workflows.

### 10) Currency input stores raw digits with no formatted affordance

- Symptom: Users type `1000000` into a money field with no separators, symbol, or locale hint.
- Anti-pattern: Plain number input for currency when formatted entry is expected.
- Fix:
  - Use a formatting library such as `react-number-format`.
  - Keep canonical numeric values in state while formatting the input display.
  - Mirror formatted currency in table cells and summaries via `Intl.NumberFormat`.

### 11) Page-local shell divergence on recurring surfaces

- Symptom: one page has its own header, card spacing, toolbar spacing, or section chrome that looks almost right but drifts from sibling pages.
- Anti-pattern: fixing recurring UI issues by adding page-specific class stacks to common surfaces instead of updating the shared shell, wrapper, or variant.
- Fix:
  - Identify the owning shared surface first: app shell, page header, card wrapper, section shell, toolbar, or empty-state pattern.
  - Move recurring spacing, typography, color, border, radius, shadow, and interaction rules into that shared layer.
  - Keep page-level classes for genuinely unique layout moments only.

### 12) Row-level mutation tears down the whole page

- Symptom: clicking save, archive, delete, or restore replaces the full page with a spinner or remounts the entire subpage.
- Anti-pattern: one shared `isLoading` flag controls initial load, refresh, and row-level mutations.
- Fix:
  - Split `initialLoading`, `backgroundRefreshing`, and `isMutating` states.
  - Keep the page shell, table, and current scroll container mounted during row-level work.
  - Show loading on the specific button, row, dialog, or compact status region instead of the full page.

### 13) Broad refetch resets scroll, filters, and selection

- Symptom: after editing one row, the table jumps to the top, filters reset, pagination changes, or selection disappears.
- Anti-pattern: calling a full list reload after every mutation regardless of scope.
- Fix:
  - Patch the returned record into local state when possible.
  - Otherwise invalidate the narrowest cache key or refetch only the affected slice.
  - Preserve current sort, filters, pagination, active tab, and row expansion unless the mutation truly invalidates them.

### 14) Inline success alerts reflow dense pages

- Symptom: every successful action inserts a new alert block above the list and pushes content below the fold.
- Anti-pattern: using page-inline alert components for transient success feedback.
- Fix:
  - Use toast for transient success and compact inline status only where the state belongs to a row or form.
  - Reserve banners and inline alert blocks for persistent warnings, permission changes, outages, or destructive context.

### 15) Shell prefetch triggers hidden API fan-out

- Symptom: hovering or landing on navigation triggers a burst of requests for routes the user has not chosen.
- Anti-pattern: blanket eager prefetch in dense sidebars or dashboards whose route entry runs data loaders.
- Fix:
  - Disable blanket eager prefetch on heavy route links.
  - Re-enable prefetch on intent such as hover, focus, or a strong next-step prediction.
  - Gate tab, drawer, dialog, and inspector queries by visibility.

## Learned Traits and Preferred Patterns

- Prefer page-level containment over shared-layout constraints for scroll/viewport control.
- Prefer explicit scroll ownership (one container per behavior) over mixed document+pane scrolling.
- Prefer event-listener click-outside patterns over full-screen overlays in persistent sidebar layouts.
- Prefer contrast-safe selection states with solid backgrounds and clear text foregrounds.
- Prefer header-toolbar CTA -> dialog/sheet flows over permanently open CRUD forms on list pages.
- Prefer formatted currency inputs over raw numeric entry for money fields.
- Prefer targeted cache updates and background refresh over full-page reloads after row-level CRUD.
- Prefer toast or compact status text over inline success alerts for transient outcomes.
- Prefer intent-based prefetch over blanket eager shell prefetch when routes trigger data work.
- Prefer fixing recurring headers, cards, toolbars, and section shells in shared wrappers or layout shells instead of patching page files one by one.

## Preferred Setup and Initiation

1. Map scroll ownership before changing classes.
2. Verify flex parent chain and `min-h-0` propagation.
3. Verify sticky context and background layering.
4. Verify light/dark contrast and interactive states.
5. Verify desktop and mobile behavior after layout changes.

## Tooling and Workflow Quirks

- Visual regressions can come from seemingly harmless shared-layout utility changes; treat shared containers as high risk.
- Fragments hide layout intent when debugging flexbox; use concrete wrappers when diagnosing sizing/overflow issues.
- If a UI fix affects multiple pages, validate unaffected pages before declaring completion.

## Debug Procedure

1. Identify which container currently scrolls (document vs inner pane).
2. Verify flex chain: real parent, `flex`, `min-h-0`, target `overflow-auto`.
3. Remove any full-screen overlay used for click-outside.
4. Validate sticky headers with explicit background and z-index.
5. Test contrast in light and dark modes.
6. Check whether create/edit should move into dialog/sheet instead of staying inline.
7. Check whether amount and currency fields need formatted entry/display instead of raw numbers.
8. Check whether the regression belongs in a shared shell or wrapper pattern before adding page-local classes.
9. Check whether mutation refresh scope is wider than the actual changed entity.
10. Check whether dense navigation is prefetching hidden data work before user intent.

## Output Contract

When invoked, return:

1. Broken pattern name.
2. Exact CSS/class-level correction.
3. Why this correction avoids regressions in sibling pages.
4. Manual verification checklist for desktop/mobile and light/dark.
