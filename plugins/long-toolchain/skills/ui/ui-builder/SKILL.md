---
name: ui-builder
description: "**WORKFLOW SKILL** — Build pixel-perfect UI from a design screenshot, reference URL, design tokens, or Mobbin screen set. Use when: implementing UI from a design, translating screenshots to code, extracting exact styles from a design, capturing and comparing screenshots to find visual differences, iterating toward design parity, building exact CSS/HTML/components from a reference image, applying design tokens to a project, collecting UI inspiration, cloning a whole app UI/UX, building a screen map, building a feature map, building premium landing pages, and orchestrating media-rich frontend sections. Trigger phrases: build UI from design, implement this design, match this screenshot, extract styles from image, compare UI screenshots, visual diff, pixel-perfect, design to code, screenshot to code, style extraction, parity iteration, extract design tokens, apply design system, use Mobbin, fetch screens, clone this app, inspiration board, screen mapping, feature mapping, premium frontend, cinematic landing page."
argument-hint: "Provide a design screenshot, reference URL, design token file, or describe the UI to build. Optionally provide a second screenshot for comparison."
portability: adapt-port
source-skill: MiniMax-AI/skills/skills/frontend-dev (merged lane)
overlap-gate:
  existing-skill: ui/ui-builder
  overlap-score: 81
  decision: merge-upgrade
---

# UI Builder

Build pixel-perfect UI implementations using **shadcn/ui as the default component foundation** and **Tailwind CSS** for tokens, theming, and composition. Prefer **machine-readable design tokens** over screenshot analysis for precision, and prefer composing from existing shadcn primitives over writing bespoke component shells from scratch.

When a project already has local styling docs, tokens, or component rules, those local surfaces outrank external inspiration for fonts, colors, shadows, radius, and interaction styling. Use Mobbin and other reference apps primarily for layout, hierarchy, feature coverage, and page structure unless the user explicitly asks to clone the external visual language.

## Framework-First Rule

For React + Tailwind work:

1. Start from existing `@/components/ui/*` shadcn primitives when they exist.
2. Compose new patterns from those primitives before building custom DOM/CSS wrappers.
3. Use custom Tailwind markup only when the project is not using shadcn/ui or the required pattern clearly cannot be composed from the installed primitives.
4. Treat confirmation dialogs, toasts, dropdowns, tables, sheets, tabs, forms, and sidebars as shadcn-first surfaces.

## System-First Consistency Rule

Before writing page-local JSX or Tailwind classes:

1. Audit the existing token layer, shared component variants, and layout shells.
2. Treat repeated surfaces such as headers, footers, page-title rows, buttons, cards, empty states, filter bars, form sections, and CTA blocks as shared-system concerns.
3. If the same visual rule appears twice, or is likely to recur across pages, promote it immediately into a token, variant, wrapper pattern, or shared layout shell.
4. Let page files own composition, data wiring, and truly unique layout moments; let the shared layer own spacing scale, typography scale, color roles, radius, borders, shadows, and interaction states.
5. Do not solve consistency problems with per-page overrides on common surfaces when a shared variant or token change would solve the same issue once.

## Batch 3 Merge-Upgrade Lane: Frontend Studio

Portability tag: adapt-port.

Use this lane when the user requests a high-polish marketing or storytelling frontend where visual parity alone is not enough.

1. Define design + motion architecture before code (layout asymmetry, rhythm, reveal flow).
2. Plan asset strategy explicitly (local media only, no placeholder external URLs in deliverables).
3. Pair UI sections with conversion-oriented copy blocks when page intent is promotional.
4. Apply quality gates across responsiveness, loading states, and interaction feedback.

### Frontend Studio Safety and Fallback

- Never ship with placeholder image/video/audio URLs in final output.
- If requested media generation tools are unavailable, use deterministic local placeholders and mark pending assets.
- If animation libraries are missing or unstable, degrade to CSS-native motion while preserving narrative structure.
- If design intent is ambiguous, deliver a two-direction variant with explicit trade-offs instead of guessing silently.

## When to Use

- Applying design tokens from an extracted design system to code
- Gathering product-quality inspiration from real apps before building a new product UI
- Translating a design screenshot or mockup into working Tailwind/HTML/JSX/TSX code
- Extracting exact colors, typography, spacing, borders, shadows from a reference URL or image
- Building a component or page that must match a specific visual design
- Comparing two screenshots (desired vs. current) to produce an actionable diff report
- Iterating on an implementation to close visual gaps against a reference
- Cloning or rebuilding an existing UI from screenshots or a Mobbin-selected screen set

## Procedure

Follow these phases in order. Each phase has decision points — skip sections that don't apply.

### Phase 0: Token-First Path (Preferred)

**Goal**: Use machine-readable design specs instead of unreliable screenshot analysis.

#### Step 0.0 — Mobbin Screen Harvest For Inspiration And Whole-App Cloning

If the user wants inspiration, competitor references, or to clone a whole app/category rather than match one exact screen, load `mobbin-ui-research` first and collect a representative screen set before touching implementation.

Use Mobbin when:
1. The user wants to build a new product in an established category.
2. The user says `clone the UI/UX`, `find inspiration`, `rebuild this kind of app`, or asks for a screen/feature map.
3. You need multiple real screens across a flow, not a single hero screenshot.

Expected outputs before code:
- screen inventory with Mobbin ids, apps, flows, and reasons for selection
- feature map linking target pages/features to reference screens
- implementation guide listing reusable patterns and chosen primitives

Style-precedence rule:
- If the local project already has a design system or styling instructions, keep that local visual language.
- Mobbin references should drive placement, information hierarchy, and feature completeness by default, not a silent restyling of the product.

Once the screen set is stable, continue with exact token extraction from the strongest chosen reference or the user-owned source.

#### Step 0.1 — Check for Existing Tokens

Before analyzing screenshots, check if the project already has design tokens:
1. Look for `.github/instructions/design-tokens.instructions.md`
2. Look for `design-tokens.json` or `*.tokens.json` in the project
3. Look for a `tailwind.config.*` with extended theme values
4. Check if Storybook is configured (component catalog available)
5. Check for shadcn/ui installation: `components.json`, `src/components/ui/*`, or `@/components/ui/*`

**If tokens exist → skip to Phase 2 (Code Generation) using those tokens as the spec.**

**If shadcn/ui exists → treat those primitives as the implementation baseline in Phase 2.**

#### Step 0.2 — Extract Tokens from Design File (Pencil MCP)

If a `.pen` design file is available (from pencil.dev), extract tokens using Pencil MCP tools:

1. **`get_editor_state`** — list all pages/screens in the design file
2. **`get_variables`** — extract all design variables (color tokens with exact hex values, spacing, typography)
3. **`batch_get`** at depth 2 with `resolveVariables: true` — get full component specs with resolved token values
4. **`get_screenshot`** — capture visual reference for each screen to validate intent

This gives exact machine-readable tokens (no screenshot estimation needed). Map variable names to Tailwind tokens:
- Design variable `duo-green: #58CC02` → CSS `--color-duo-green: #58CC02` → classes `bg-duo-green`, `text-duo-green`
- Design variable `duo-border: #E5E5E5` → CSS `--color-duo-border: #E5E5E5`

**After extraction → proceed to Phase 2 using the design file tokens.**

#### Step 0.3 — Extract Tokens from Live URL (Dembrandt)

If given a URL and no tokens exist, extract them programmatically using Dembrandt:

```bash
# Install globally (one-time)
npm install -g dembrandt

# Extract from a URL
npx dembrandt <url> --json-only --save-output

# For comprehensive extraction
npx dembrandt <url> --pages 5 --dark-mode --save-output --dtcg
```

Then use the extract-design-tokens script to generate Tailwind config and instructions:

```bash
node ~/.claude/scripts/extract-design-tokens.js <url> --output ./design-tokens-output --pages 3
```

This produces:
- `tokens.json` — raw extracted tokens
- `tailwind-extend.js` — values to merge into `tailwind.config.js`
- `design-tokens.instructions.md` — copy to `.github/instructions/`

**After extraction → proceed to Phase 2 using the generated tokens.**

#### Step 0.4 — When to Fall Back to Screenshot Analysis

Use screenshot-based analysis (Phase 1) ONLY when:
- The reference is a static image/mockup with no live URL
- The live URL requires authentication you don't have
- Dembrandt extraction fails (some sites block automated access)
- Mobbin is not the right source because the user already provided one exact canonical app or design
- The user explicitly asks for screenshot-based analysis

### Phase 1: Design Intake & Analysis (Fallback)

**Goal**: Extract every measurable visual property from the reference design. Use only when Phase 0 (token extraction) is not possible.

#### Step 1.1 — Acquire the Reference

- If given a **URL**: first try Phase 0.2 (token extraction). If that fails, capture screenshots at standard breakpoints using [capture script](./scripts/capture-screenshots.js)
- If given an **image file**: use it directly as the reference
- If the request is **inspiration-led or whole-app clone work**: use Step 0.0 first to build the reference set with Mobbin, then select the exact screens or apps you will implement against
- If given a **description only**: ask for a screenshot or sketch before proceeding

#### Step 1.2 — Decompose the Layout

Analyze the reference image systematically, top-to-bottom, left-to-right:

1. **Document structure**: Identify the page skeleton — header, nav, hero, content areas, sidebar, footer
2. **Grid system**: Determine columns, gaps, max-width, centering strategy
3. **Section stacking**: Map vertical sections and their approximate heights/paddings
4. **Nesting depth**: Trace the component tree (e.g., header → nav → logo + menu-items + CTA button)

See [design-analysis.md](./references/design-analysis.md) for the full decomposition methodology.

#### Step 1.3 — Extract Design Tokens

For each visual property, estimate values from the screenshot and **map to the nearest Tailwind default**:

| Category | What to Extract | Tailwind Mapping |
|----------|----------------|------------------|
| **Colors** | Background, text, borders, accents, hover states, shadows | Map to Tailwind palette (`blue-500`, `slate-700`) or define custom in `tailwind.config` |
| **Typography** | Font family, sizes, weights, line heights, letter spacing | `text-sm`, `text-base`, `text-xl`, `font-medium`, `leading-relaxed` |
| **Spacing** | Margins, paddings, gaps — establish a base unit | `p-4`, `mx-auto`, `gap-6`, `space-y-8` |
| **Borders** | Width, style, color, border-radius | `border`, `border-gray-200`, `rounded-lg`, `rounded-full` |
| **Shadows** | box-shadow values | `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl` |
| **Sizing** | Widths, heights, min/max constraints, aspect ratios | `w-full`, `max-w-7xl`, `h-16`, `aspect-video` |
| **Effects** | Opacity, backdrop-filter, gradients, transitions | `opacity-80`, `backdrop-blur-md`, `bg-gradient-to-r`, `transition-colors` |

#### Step 1.4 — Identify Interactive States

Note elements that likely have hover, focus, active, disabled, loading, or error states. Map to Tailwind state variants:

| State | Tailwind Prefix | Example |
|-------|----------------|---------|
| Hover | `hover:` | `hover:bg-blue-600` |
| Focus | `focus:` | `focus:ring-2 focus:ring-blue-500` |
| Active | `active:` | `active:scale-95` |
| Disabled | `disabled:` | `disabled:opacity-50 disabled:cursor-not-allowed` |
| Group hover | `group-hover:` | `group-hover:text-blue-600` |
| Dark mode | `dark:` | `dark:bg-slate-900 dark:text-white` |

#### Step 1.5 — Record Tokens

Write extracted tokens to `.github/instructions/styling.instructions.md` using the established table format. Include both the raw value and the Tailwind class mapping. This file auto-applies to all CSS/TSX/JSX files via `applyTo`.

Also update `docs/ui/design-tokens.md` with the full extraction.

If extracted colors or spacing don't align with Tailwind defaults, extend in `tailwind.config.js`:

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
      },
      spacing: {
        '18': '4.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
};
```

### Phase 2: Code Generation

**Goal**: Produce the exact HTML structure and Tailwind classes that match the reference.

#### Step 2.1 — Choose the Right Approach

| Scenario | Approach |
|----------|----------|
| New component from scratch | Compose from shadcn primitives first; add Tailwind only for layout/tokens |
| Modifying existing component | Read existing code first, preserve shadcn composition where present |
| Full page layout | Start with the outer container, build inward section by section |
| Design system component | Check for existing tokens/variables and shared primitives, extend shared variants or wrapper patterns before duplicating |

For common feature surfaces, prefer proven libraries over bespoke implementations when they fit the stack:

- forms: `react-hook-form` + Zod
- data tables: `@tanstack/react-table`
- currency/amount fields: `react-number-format`
- charts: reuse the project's chart library; if none exists, prefer established React chart libraries over custom SVG chart code for standard analytics

#### Step 2.1b — Compose From Primitives Before Writing Custom Markup

When the stack includes shadcn/ui, use this decision order:

1. **Use an existing primitive directly** — `Button`, `Input`, `Textarea`, `Dialog`, `AlertDialog`, `DropdownMenu`, `Sheet`, `Tabs`, `Table`, `Sidebar`
2. **Create a wrapper pattern** — `ConfirmDialog`, `FilterToolbar`, `GroupedSidebar`, `DataTableShell`
3. **Create a custom component** only when the pattern cannot be expressed cleanly through composition

Do not rebuild baseline accessibility behaviors such as focus management, dismissal, keyboard navigation, and aria wiring when shadcn already provides them.

#### Step 2.2 — Build Structure First

Write semantic HTML/JSX structure before applying Tailwind classes:

1. Use semantic elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`
2. Insert shadcn primitives for interactive surfaces before layering utility classes
3. Apply descriptive `className` with Tailwind utilities for layout and token mapping
4. Include all text content from the design
5. Add placeholder `src` for images with proper `alt` text
6. Mark interactive elements with correct roles/types when not already handled by the primitive

#### Step 2.2a — Localized Copy Integrity

Treat non-English UI text as a parity-critical surface, not a cosmetic follow-up.

1. Preserve native script and diacritics exactly. For Vietnamese, `Tiếng Việt`, `Ngôn ngữ`, and `Đặt món`
  are correct; `Tieng Viet`, `Ngon ngu`, and `Dat mon` are defects.
2. Prefer idiomatic product phrasing over literal word-for-word translation. Match how native speakers label
  navigation, CTA text, placeholders, and status badges in real products.
3. Keep one terminology and casing system per locale across the whole screen. Do not mix English and
  Vietnamese labels on the same surface unless the product explicitly does so.
4. Before finalizing, proofread high-salience copy in rendered context: headers, tabs, buttons, placeholders,
  badges, summaries, and error messages.

#### Step 2.3 — Apply Tailwind Classes

Apply utilities in this logical order for readability:

```
Layout → Positioning → Box Model → Spacing → Sizing → Typography → Colors → Borders → Effects → Interactivity → Responsive → State Variants
```

**Detailed class ordering within a className:**

```tsx
<div className={[
  // 1. Layout
  'flex flex-col items-center justify-between',
  // 2. Positioning
  'relative z-10',
  // 3. Sizing
  'w-full max-w-7xl h-16',
  // 4. Spacing
  'px-6 py-4 gap-4',
  // 5. Typography
  'text-base font-medium leading-relaxed tracking-tight',
  // 6. Colors
  'bg-white text-slate-900',
  // 7. Borders & Radius
  'border border-slate-200 rounded-xl',
  // 8. Shadows & Effects
  'shadow-md backdrop-blur-sm',
  // 9. Transitions
  'transition-colors duration-200',
  // 10. States
  'hover:bg-slate-50 hover:shadow-lg',
  'focus:outline-none focus:ring-2 focus:ring-blue-500',
  // 11. Responsive overrides
  'md:flex-row md:px-8 lg:px-12',
  // 12. Dark mode
  'dark:bg-slate-900 dark:text-white dark:border-slate-700',
].join(' ')} />
```

#### Step 2.4 — Common Tailwind Layout Patterns

| Design Pattern | Tailwind Implementation |
|---------------|------------------------|
| Centered container | `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` |
| Sticky nav | `sticky top-0 z-50 bg-white/80 backdrop-blur-md` |
| Card grid | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` |
| Hero overlay | `relative bg-cover bg-center` + child `absolute inset-0 bg-black/50` |
| Pill button | `rounded-full px-6 py-2 font-medium` |
| Glass effect | `backdrop-blur-lg bg-white/10 border border-white/20` |
| Gradient text | `bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent` |
| Flex center | `flex items-center justify-center` |
| Sidebar layout | `flex` + `w-64 shrink-0` + `flex-1 min-w-0` |
| Responsive hide | `hidden md:block` or `md:hidden` |
| Truncate text | `truncate` or `line-clamp-2` |
| Aspect ratio | `aspect-video` or `aspect-square` |
| Divide lines | `divide-y divide-slate-200` |

#### Step 2.5 — Responsive Implementation (Mobile-First)

Tailwind is mobile-first. Build the base for the smallest screen, then layer up:

```tsx
<div className="
  flex flex-col gap-4 p-4          {/* Mobile: stack, small padding */}
  sm:p-6                            {/* 640px: more padding */}
  md:flex-row md:gap-6 md:p-8      {/* 768px: side-by-side */}
  lg:gap-8 lg:p-12                  {/* 1024px: more space */}
  xl:max-w-7xl xl:mx-auto           {/* 1280px: constrained width */}
">
```

Standard breakpoints (Tailwind defaults):
- `sm:` → 640px
- `md:` → 768px
- `lg:` → 1024px
- `xl:` → 1280px
- `2xl:` → 1536px

#### Step 2.5b — Responsive Control-Swap Pattern

When a desktop control is too dense for mobile, do not force the same interaction pattern across breakpoints.

Preferred pattern:
1. Keep one shared state/value model.
2. Render the simplest usable control on mobile (for example `select`, bottom sheet, or compact listbox).
3. Render the richer control on desktop (for example segmented pills, tabs, or exposed filter chips).
4. Validate both breakpoints with screenshots because the control-type swap itself is parity-critical.

Examples:
- Mobile branch filter: dropdown or listbox.
- Desktop branch filter: segmented pills.
- Mobile section selector: select or sheet.
- Desktop section selector: exposed chips or tabs.

Do this whenever compressing the desktop version would create truncation, fragile wrapping, or unclear tap targets.

#### Step 2.6 — Precision Checklist

Before moving to comparison, verify:

- [ ] All text content matches the design exactly
- [ ] Font sizes and weights use correct Tailwind classes (`text-sm`, `font-semibold`, etc.)
- [ ] Colors match extracted values and use Tailwind classes or custom theme tokens
- [ ] Spacing follows extracted scale using Tailwind spacing utilities
- [ ] Border radius values match (`rounded-md`, `rounded-lg`, `rounded-xl`, etc.)
- [ ] Box shadows match (`shadow-sm`, `shadow-md`, `shadow-lg`, etc.)
- [ ] Element widths/heights are constrained correctly (`max-w-*`, `h-*`)
- [ ] Images have correct aspect ratios (`aspect-*` or explicit w/h)
- [ ] Hover/focus states are implemented with Tailwind variants
- [ ] Interactive surfaces use shadcn primitives when available instead of ad-hoc custom markup
- [ ] Destructive actions use confirmation dialogs instead of direct-fire buttons
- [ ] Async actions show loading plus success/error feedback using toast, banner, or status region
- [ ] Sidebar and table scroll ownership is explicit; dense content does not rely on page scroll alone
- [ ] Empty, loading, success, timeout, and error states exist for the critical flow
- [ ] Responsive breakpoints are applied mobile-first
- [ ] No raw CSS values used when a Tailwind utility exists

### Phase 3: Visual Comparison

**Goal**: Programmatically compare the built UI against the reference design.

#### Step 3.1 — Capture the Current Build

Use Playwright to screenshot the built UI at the same viewport as the reference:

```ts
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000');
await page.screenshot({
  path: 'screenshots/current/page.png',
  fullPage: true,
  animations: 'disabled',
  caret: 'hide',
  style: `
    [data-dynamic], .timestamp, .avatar { visibility: hidden !important; }
  `
});
await browser.close();
```

#### Step 3.2 — Run Pixel Comparison

Use the [compare script](./scripts/compare-screenshots.js) or Playwright's built-in assertion:

```ts
import { test, expect } from '@playwright/test';

test('visual parity check', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveScreenshot('reference.png', {
    maxDiffPixels: 50,
    threshold: 0.2,
    animations: 'disabled',
    mask: [page.locator('[data-dynamic]')],
  });
});
```

#### Step 3.3 — Analyze the Diff

When comparison fails, Playwright generates three images: `*-actual.png`, `*-expected.png`, `*-diff.png`.

Classify each difference by severity:

| Severity | Pixel Diff | Action |
|----------|-----------|--------|
| **Exact match** | 0 | Done |
| **Sub-pixel** | < 0.5% | Acceptable — rendering engine variance |
| **Minor drift** | 0.5–2% | Review — likely font rendering or anti-aliasing |
| **Notable gap** | 2–5% | Fix — spacing, sizing, or color mismatch |
| **Major deviation** | > 5% | Fix urgently — layout or structural error |

See [comparison-guide.md](./references/comparison-guide.md) for full threshold and troubleshooting reference.

#### Step 3.4 — Targeted Fixes

For each notable or major difference:

1. Identify the **region** of the diff (which component)
2. Identify the **property** causing the diff (color? spacing? size? position?)
3. Make the **smallest Tailwind class change** that fixes it
4. Re-capture and re-compare

High-salience surfaces need extra weight in this pass:
- Dashboard stat cards and summary strips
- Progress/map entry surfaces
- Reward or transaction labels that expose domain language

If screenshots call out card colors, text suffixes, metric formatting, or compact identity strips on these surfaces, treat them as user-visible regressions rather than cosmetic follow-ups.

For whole-app clone requests, keep the baseline set anchored to the Mobbin-selected screen inventory or the user-supplied canonical source instead of mixing unrelated references during iteration.

### Phase 4: Live Style Extraction (When a URL is Available)

When the reference is a live webpage (not just a screenshot), extract computed styles directly using [extract-styles.js](./scripts/extract-styles.js).

After extraction, map computed values to Tailwind:

| Computed Value | Tailwind Class |
|---------------|---------------|
| `font-size: 14px` | `text-sm` |
| `font-size: 16px` | `text-base` |
| `font-size: 18px` | `text-lg` |
| `font-size: 20px` | `text-xl` |
| `font-size: 24px` | `text-2xl` |
| `font-weight: 400` | `font-normal` |
| `font-weight: 500` | `font-medium` |
| `font-weight: 600` | `font-semibold` |
| `font-weight: 700` | `font-bold` |
| `line-height: 1.25` | `leading-tight` |
| `line-height: 1.5` | `leading-normal` |
| `line-height: 1.75` | `leading-relaxed` |
| `padding: 16px` | `p-4` |
| `padding: 24px` | `p-6` |
| `gap: 16px` | `gap-4` |
| `gap: 24px` | `gap-6` |
| `border-radius: 8px` | `rounded-lg` |
| `border-radius: 12px` | `rounded-xl` |
| `border-radius: 9999px` | `rounded-full` |

See [css-extraction.md](./references/css-extraction.md) for full extraction patterns and Tailwind mapping tables.

For values that don't map to Tailwind defaults, use arbitrary values as a last resort:
```tsx
<div className="p-[13px] rounded-[7px] text-[15px]">
```
But prefer extending `tailwind.config.js` for repeated custom values.

### Phase 5: Iteration Loop

Repeat until parity is achieved:

```
┌─────────────┐
│ Build / Fix  │
└──────┬──────┘
       ▼
┌──────────────┐
│   Capture    │
│  Screenshot  │
└──────┬───────┘
       ▼
┌──────────────┐
│   Compare    │──── Match? ──── Done ✓
│  vs. Design  │
└──────┬───────┘
       │ No match
       ▼
┌──────────────┐
│  Analyze     │
│  Diff Image  │
└──────┬───────┘
       │
       ▼
   Back to Build
```

Each iteration should:
1. Focus on the **largest visual deviation** first
2. Make **one category of fix at a time** (all spacing, then all colors, etc.)
3. Re-compare after each fix category
4. Log findings in the comparison report

## Constraints

- ALWAYS prefer token-based extraction (Phase 0) over screenshot analysis (Phase 1)
- ALWAYS use Mobbin before ad hoc screenshot hunting when the task is inspiration-led or asks for a whole-app clone
- ALWAYS use Tailwind utility classes as the primary styling approach
- ALWAYS use the project's design tokens from `design-tokens.instructions.md` or `styling.instructions.md` when they exist
- ALWAYS update the instructions file when extracting new tokens
- ALWAYS check the `ux-patterns` skill for canonical implementations before building common UI elements
- ALWAYS treat localized copy review as part of UI QA for navigation, CTA, placeholder, status, and error text
- NEVER use raw CSS when a Tailwind utility class exists for the same property
- NEVER hardcode colors, spacing, or typography values — record them as tokens first, then map to Tailwind
- NEVER invent new colors or spacing values when tokens are defined — map to the nearest token
- NEVER use arbitrary Tailwind values like `w-[347px]` when a standard class or defined token would work
- NEVER guess font families — extract from live page using Dembrandt, or identify from visual characteristics
- NEVER ASCII-normalize or strip diacritics from Vietnamese or other localized UI copy unless the user explicitly requests transliteration
- NEVER copy proprietary brand assets or exact product copy from Mobbin references into final deliverables unless the user owns them or explicitly provides them
- ALWAYS disable animations and hide carets when capturing comparison screenshots
- ALWAYS mask dynamic content (timestamps, ads, user data) during comparison
- Compare screenshots at the **same viewport size** — never compare across breakpoints
- Prefer extending `tailwind.config.js` over arbitrary Tailwind values `[...]` for repeated custom values
- Use `@apply` sparingly — only for extracting truly repeated utility patterns into component classes

## Output Format

After completing the workflow, provide:

1. **Tokens extracted**: Summary of colors, fonts, spacing values and their Tailwind mappings
2. **Files created/modified**: List of component files and any `tailwind.config.js` extensions
3. **Comparison results**: Pixel diff percentage and severity for each page/component
4. **Remaining gaps**: Any visual differences that couldn't be resolved and why
5. **Styling instructions updated**: Confirm tokens were written to `styling.instructions.md`
