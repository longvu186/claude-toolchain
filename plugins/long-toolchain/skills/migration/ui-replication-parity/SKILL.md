---
name: ui-replication-parity
description: "WORKFLOW SKILL - Achieve visual parity when replicating a legacy app UI in a modern stack. Use for design token mapping from legacy to rebuild, screenshot-based parity audits, decoration asset gap analysis, color/font/layout mismatch diagnosis, parity scoring, and iterative fix workflows. Trigger phrases: UI parity, visual parity, design parity, legacy match, legacy comparison, replication audit, parity score, parity fix, decoration assets, color mismatch, font mismatch."
argument-hint: "Describe the legacy app and rebuilt app, the parity gap observed, or the specific visual property to match."
---

# UI Replication Parity

Systematic workflow for achieving visual parity between a legacy app (Bubble, Webflow, etc.) and a modern rebuild (Vue, React, etc.).

## When to Use

- Rebuilding a production app and need to match the original visual design
- Running parity audits between legacy and new UI
- Diagnosing and fixing color, font, layout, or decoration mismatches
- Managing decoration asset gaps between legacy and rebuild
- Scoring parity progress and prioritizing remaining work

## Core Principles

1. **Evidence over inspection**: Never claim parity by code inspection alone — always use screenshot comparison.
2. **Source priority**: When references conflict: live app > export file > PDF/spec.
3. **Token accuracy first**: Fix color tokens before component-level styling.
4. **Incremental scoring**: Track parity % per page per viewport to measure progress.

## Parity Audit Workflow

### Phase 1: Reference Extraction

1. Capture legacy app at canonical viewports (mobile 375px, desktop 1280px)
2. Extract design tokens from source (Bubble export, Figma, etc.)
3. Document all tokens in `docs/ui/design-tokens.md` with source annotation
4. Consolidate style rules in `docs/ui/styles.md`

### Phase 2: Capture Matrix

Create a systematic capture plan:

| Page | States | Viewports | Total Screenshots |
|------|--------|-----------|-------------------|
| Login | default, error | mobile, desktop | 4 |
| Dashboard | default, loading, empty | mobile, desktop | 6 |
| ... | ... | ... | ... |

Rules:
- Same viewport size and DPR for both legacy and rebuilt captures
- Same account state and test data
- Same waiting strategy (network idle + UI settled)
- Stable naming: `<app>-<route>-<state>-<viewport>.png`

### Phase 3: Token Comparison

Compare extracted legacy tokens against rebuild CSS:

| Token | Legacy Value | Rebuild Value | Match? |
|-------|-------------|---------------|--------|
| brand-teal | `#16BECE` | `#03B4C6` | NO — darker/more cyan |
| brand-navy | `#182F7B` | `#3A4D8F` | NO — lighter |
| font-heading | Barlow | (not loaded) | NO — missing |

Common mismatch patterns:
- **Color shifted**: Similar hue but wrong hex (e.g., `#03B4C6` vs `#16BECE`)
- **Color missing**: Token not defined in rebuild
- **Font missing**: Font family not imported
- **Weight missing**: Font loaded but specific weight not included
- **Radius mismatch**: Using framework defaults instead of legacy values

### Phase 4: Visual Comparison & Scoring

1. Run pixelmatch or similar tool on screenshot pairs
2. Generate diff overlay images
3. Score each page:
   - **P0** (Major): Structure broken, unusable contrast, missing critical elements
   - **P1** (Noticeable): Clearly visible color/layout/font drift
   - **P2** (Minor): Subtle spacing, radius, shadow differences
   - **P3** (Negligible): Sub-pixel differences

4. Compute parity percentage per page (inverse of diff %)

### Phase 5: Fix Prioritization

Fix order:
1. **Global tokens** (colors, fonts) — highest ROI, affects all pages
2. **Layout structure** (3-column, content cards, nav patterns)
3. **Component patterns** (buttons, cards, inputs, tabs)
4. **Decoration assets** (mascots, backgrounds, icons)
5. **Fine-tuning** (shadows, borders, transitions)

### Phase 6: Decoration Asset Management

Track all decorative assets in `docs/ui/missing-decorations.md`:

| ID | Asset | Source | Format | Dimensions | Used On | Status |
|----|-------|--------|--------|------------|---------|--------|
| DEC-001 | Bee mascot | Login screenshot | PNG | 200×200 | Login | MISSING |

Status values:
- **MISSING**: Not in repo, needs creation/export
- **DOWNLOADED**: Fetched from legacy CDN
- **INTEGRATED**: In repo and wired into component code
- **PLACEHOLDER**: Temporary replacement exists

Asset storage: `{app}/public/decorations/`
Naming: `legacy-<page>-<purpose>-<index>.<ext>`

## Common Migration Color Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Using framework default primary | Violet/blue instead of brand teal | Set `--color-primary` to legacy brand color |
| Lighter/desaturated variants | Colors feel washed out | Use exact rgba values from export |
| Missing accent colors | Gold, yellow, pink not defined | Add all brand colors from export |
| Generic gray instead of design gray | Text/border colors off | Define explicit text-primary, text-muted, border tokens |

## Common Layout Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Dark text on dark background | White text on navy when content should be on white card | Content renders inside WHITE card, not directly on dark bg |
| Missing content card wrapper | Content floats on page background | Add white rounded card with light-teal border |
| Wrong panel proportions | Sidebar/content ratios off | Match legacy pixel measurements |
| fullPage screenshots inflate diff | Comparison unreliable | Use viewport-sized captures for consistent comparison |

## Verification Checklist

- [ ] All color tokens match legacy values (±2 per RGB channel)
- [ ] All font families loaded with correct weights
- [ ] Screenshot matrix completed for all routes/states/viewports
- [ ] Pixelmatch diff < 15% for each page pair
- [ ] Missing decorations manifest documented and actionable
- [ ] Component patterns match legacy (buttons, cards, tabs, inputs)
- [ ] Desktop and mobile layouts structurally correct
- [ ] Active/hover/disabled states match legacy

## Output Artifacts

Per audit run, produce:
1. Updated `docs/ui/styles.md` with source-annotated tokens
2. Updated `docs/ui/design-tokens.md`
3. Updated `.github/instructions/styling.instructions.md`
4. Updated `docs/ui/missing-decorations.md`
5. Visual diff report at `docs/ui/parity-report.md`
6. Run log at `docs/ai/run-logs/<timestamp>-legacy-parity.md`

## Design File → Code Migration Workflow

When migrating from a legacy design to a new design system extracted from a design file (.pen, .fig, etc.):

### Migration Order (Critical)

Apply changes in this sequence to ensure consistency cascades correctly:

1. **Styling instructions** (`.github/instructions/styling.instructions.md`) — canonical token reference
2. **CSS theme tokens** (`main.css` `@theme` block) — makes utility classes available
3. **HTML font loading** (`index.html` Google Fonts link) — new typeface available
4. **Layout components** (nav bars, page shells) — structural foundation
5. **Page views** (each route's main view) — content styling
6. **Card/widget components** (reusable cards, lists) — shared component styling
7. **Documentation** (design-tokens.md, styles.md, context.md) — keep docs in sync

### Design File Extraction (Pencil MCP)

For `.pen` files from pencil.dev:

1. `get_editor_state` — enumerate all pages/screens
2. `get_variables` — extract exact color/spacing/typography tokens
3. `batch_get` at depth 2 with `resolveVariables: true` — full component specs
4. `get_screenshot` — visual reference per screen

Variables give exact machine-readable values — more reliable than screenshot estimation.

### Icon Library Migration

When switching icon sets (e.g., mingcute → lucide) with @iconify/vue:
- Import stays the same (`import { Icon } from '@iconify/vue'`)
- Only `icon=""` prop strings change
- Use `grep_search` for all `icon="` occurrences to find every instance
- Map old names to new names systematically before editing

### Post-Migration Checklist

- [ ] All pages render without errors
- [ ] `npm run build` (or `npx vite build`) passes
- [ ] Dev server runs and all routes load
- [ ] Styling instructions updated with new tokens
- [ ] Design tokens doc updated
- [ ] Experience log entry added
- [ ] Run log created
