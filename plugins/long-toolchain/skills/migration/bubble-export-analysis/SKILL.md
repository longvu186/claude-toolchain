---
name: bubble-export-analysis
description: "WORKFLOW SKILL - Reverse-engineer Bubble.io export files (.bubble) for migration. Use for data model extraction, option set/enum mapping, style metadata extraction, page/component structure discovery, CDN asset inventory, auth workaround analysis, and backend workflow mapping. Trigger phrases: Bubble export, .bubble file, Bubble data model, Bubble option sets, Bubble CDN assets, Bubble auth workaround, Bubble backend workflows, reverse engineer Bubble."
argument-hint: "Point to the .bubble export file and describe what you need to extract (data model, styles, assets, workflows, etc.)."
---

# Bubble Export Analysis

Reverse-engineer Bubble.io `.bubble` export files to extract data models, UI metadata, assets, and business logic for migration to modern stacks.

## When to Use

- Migrating a Bubble.io app to a custom codebase
- Extracting data model (tables, fields, relations) from a Bubble export
- Discovering option sets (enums) and their values
- Extracting style metadata (colors, fonts, radii, shadows) for design token creation
- Inventorying CDN-hosted assets (images, audio, decorations)
- Understanding auth workarounds (e.g., phone-to-fake-email patterns)
- Mapping backend workflows and triggers for reimplementation

## Bubble Export File Structure

A `.bubble` file is a JSON document containing the entire app definition:

### Top-Level Sections

| Section | Contains | Migration Use |
|---------|----------|---------------|
| `types` / `data_types` | Table definitions with fields, types, relations | → Database schema (Postgres, Supabase) |
| `option_sets` | Enum-like value sets with display names | → TypeScript enums, DB enum types |
| `pages` | Page definitions with element trees | → Route map, component inventory |
| `elements` / `page_elements` | UI element hierarchy per page | → Component structure, layout analysis |
| `styles` | Reusable style definitions | → Design tokens, CSS custom properties |
| `workflows` | Frontend event handlers per page | → Composables, store actions, event handlers |
| `backend_workflows` | Server-side workflows (API workflows, triggers) | → Edge functions, DB triggers, cron jobs |
| `settings` | App-level config (font, colors, default styles) | → Global theme config |
| `plugins` | Installed plugins and their config | → External integration inventory |

### Data Type Field Patterns

| Bubble Type | Maps To | Notes |
|-------------|---------|-------|
| `text` | `string` / `text` | Plain text |
| `number` | `number` / `integer` | Numeric |
| `yes / no` | `boolean` | Boolean |
| `date` | `timestamp` / `date` | Date/datetime |
| `image` | `string` (URL) | CDN-hosted image URL |
| `file` | `string` (URL) | CDN-hosted file URL |
| `geographic address` | `jsonb` / composite | Address data |
| `→ TypeName` | FK / foreign key | Relation to another type |
| `list of → TypeName` | Many-to-many / junction table | List relation |
| `option → SetName` | `enum` / `text` | Value from option set |

### Common Bubble Naming Conventions

- Field prefix `_` → internal/computed field (e.g., `_searchIndex`, `_currentUnit`)
- Field prefix `[temp]` → transient/session field, skip in schema migration
- Table suffix numbers → versioned tables (e.g., `level1` = Level, `dailystreak1` = Weekly, `dailystreak2` = Monthly)
- `Created By`, `Created Date`, `Modified Date` → auto-fields, map to `created_at`, `updated_at` + `created_by` FK

## Style Metadata Extraction

### Where to Find Styles

1. **Global settings** → default font family, font sizes, base colors
2. **Style definitions** → reusable named styles with full property sets
3. **Element-level overrides** → inline style properties on individual elements

### Extractable Properties

| Property | Bubble Path | Example Value |
|----------|------------|---------------|
| Font family | `font_face` / `--font_default` | `Nunito`, `Barlow` |
| Font size | `font_size` | `14` (px) |
| Font weight | `font_weight` | `400`, `700`, `800` |
| Background color | `background_color` / `bg_color` | `rgba(22,190,207,1)` |
| Text color | `font_color` | `rgba(52,64,84,1)` |
| Border radius | `border_roundness` / `roundness` | `12` (px) |
| Border width | `border_width` | `1` (px) |
| Border color | `border_color` | `rgba(208,213,221,1)` |
| Box shadow | `box_shadow` | `0 4px 6px rgba(0,0,0,0.07)` |
| Padding | `padding_top/right/bottom/left` | `16` (px) |

### Color Extraction Pattern

Bubble stores colors as `rgba(r,g,b,a)` strings. Convert to hex:

```
rgba(22,190,207,1) → #16BECE (brand-teal)
rgba(24,47,123,1)  → #182F7B (brand-navy)
rgba(230,160,0,1)  → #E6A000 (brand-gold)
```

Collect ALL unique rgba values, group by usage, map to design tokens.

## CDN Asset Discovery

### Bubble CDN URL Pattern

```
https://{hash}.cdn.bubble.io/f{timestamp}/{filename}
```

Example: `ccec2f321a66553d9c8354bf1816ddb9.cdn.bubble.io`

### Asset Inventory Procedure

1. Search export for `cdn.bubble.io` URLs
2. Categorize by file extension (`.png`, `.jpg`, `.svg`, `.mp3`)
3. Cross-reference with element `image` / `background_image` properties
4. Download assets needed for migration
5. Track in a manifest file (`docs/ui/missing-decorations.md`)

## Auth Workaround Patterns

### Phone-to-Email Workaround

Bubble lacks native phone auth. Common workaround:
- Store phone as synthetic email: `{phone}@{domain}` (e.g., `0916686247@beeschool.vn`)
- 4-digit PIN stored as password
- All Bubble auth APIs (reset, confirm) operate on synthetic email
- **Migration fix**: Use Supabase phone auth natively, no email workaround needed

### Privacy Rules → RLS Mapping

Bubble privacy rules map to Supabase RLS policies:
- "Everyone can view" → `SELECT` policy for `anon` and `authenticated`
- "User can edit own" → `UPDATE` policy with `auth.uid() = user_id`
- "Admin has full access" → policies checking `app_metadata->>'user_role' = 'admin'`

## Backend Workflow Mapping

| Bubble Concept | Modern Equivalent |
|----------------|-------------------|
| Backend workflow (API) | Supabase Edge Function |
| Scheduled workflow | Supabase pg_cron / Edge Function cron |
| Database trigger workflow | Postgres trigger + function |
| "Make changes to thing" | SQL UPDATE via RPC or direct query |
| "Create a new thing" | SQL INSERT |
| "Send email" | Edge Function → email API |
| Custom event | Frontend event handler / composable |

## Verification Checklist

- [ ] All data types enumerated and mapped to target schema
- [ ] All option sets mapped to enums or constants
- [ ] All font families and weights identified
- [ ] All unique colors extracted and mapped to tokens
- [ ] All border radii catalogued
- [ ] CDN assets inventoried and prioritized
- [ ] Auth flow documented with workaround patterns
- [ ] Backend workflows mapped to target implementation
- [ ] Privacy rules mapped to RLS policies

## Anti-Patterns

- Do NOT assume Bubble field names match logical names — check for numbered suffixes and `[temp]` prefixes.
- Do NOT skip `option_set` extraction — these define critical business logic enums.
- Do NOT ignore `_searchIndex` fields — they indicate admin search/filter requirements.
- Do NOT assume one-to-one page mapping — Bubble uses sub-views within pages (e.g., `AUTH_SUBPAGES` within a single `/auth` page).
