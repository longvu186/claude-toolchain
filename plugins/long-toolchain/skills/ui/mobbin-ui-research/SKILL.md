---
name: mobbin-ui-research
description: "**WORKFLOW SKILL** — Use Mobbin MCP to gather real product screens for UI inspiration, whole-app cloning, and screen-to-feature mapping. Use when: finding inspiration from existing apps, cloning a whole app UI/UX, collecting reference screens by flow, building a screen inventory, building a feature map, comparing competitor patterns, or choosing the strongest reference set before implementation. Trigger phrases: use Mobbin, fetch screens, find app inspiration, inspiration board, clone this app, clone whole app UI, rebuild this kind of app, screen mapping, feature mapping, reference screens, competitor UI research."
argument-hint: "Describe the product category, platform (web or iOS), the flows you need, and any specific apps or competitors to bias toward."
---

# Mobbin UI Research

Use Mobbin as the first research surface when the user wants inspiration or to rebuild the feel of a whole product, but does not have one exact canonical design file or URL to copy from.

## Core Rule

Mobbin is for harvesting real, production-grade patterns and organizing them into a reusable map.

- Use it before generic screenshot hunting.
- Use it before inventing flows from scratch.
- Do not treat it as permission to copy branded assets verbatim.
- Do not let reference screens silently override the local design system for repeated headers, footers, cards, toolbars, buttons, or section shells.

Study structure, hierarchy, screen flow, component patterns, and state coverage. Do not reproduce proprietary logos, illustrations, copy, or trademarks unless the user owns them or supplies them directly.

## When To Use

- New product builds that need proven UI/UX references
- Requests to `clone the UI/UX` of an app category
- Competitor-inspired redesigns
- Whole-app rebuilds that need more than one reference screen
- Screen inventory and feature mapping before implementation
- Flow-specific research such as onboarding, dashboard, detail, checkout, settings, profile, notifications, or empty states

## Inputs To Clarify

Capture these up front:

1. Platform: `web` or `ios`
2. Product category: fintech, CRM, project management, social, marketplace, etc.
3. Flow list: onboarding, auth, dashboard, detail, search, checkout, settings, profile, billing, etc.
4. Any named apps to bias toward or avoid
5. Whether the goal is inspiration, loose cloning, or close rebuild of a category pattern

## Search Workflow

### Phase 1 — Build The Search Plan

Create one broad query and then one query per core flow.

Example query set for a project-management web app:

- `project management app overview`
- `project management onboarding`
- `project management dashboard`
- `project management task detail`
- `project management settings`

Example query set for a mobile finance app:

- `finance app onboarding`
- `finance app home dashboard`
- `finance app transaction detail`
- `finance app budgeting`
- `finance app settings`

### Phase 2 — Search Mobbin In Small Batches

Use `mcp_mobbin_search_screens` with these defaults unless the task strongly suggests otherwise:

- `mode: deep` for intent-heavy discovery
- `limit: 6-12` per query to avoid context waste
- `platform: web` for websites and SaaS dashboards
- `platform: ios` for native/mobile-app inspiration

Use `fast` mode only when you already know the query is narrow and you need a quick first pass.

### Phase 3 — Dedupe And Expand Deliberately

After each pass:

1. Record the returned `screen id`, `app name`, `platform`, and `mobbin_url`.
2. Remove obvious duplicates and re-run with `exclude_screen_ids`.
3. Keep only the strongest screens for each flow step.
4. Expand only where coverage is weak.

Target coverage for whole-app clone work:

- 2-4 strong screens per major flow
- 15-25 screens total for a first serious pass
- at least one example for empty/error/setup/settings states if those flows matter

## Output Artifacts

Before implementation, produce these artifacts in `docs/ui/` when the workspace has a docs lane, or inline in the response when it does not:

1. `mobbin-screen-map.md`
   - columns: target flow, flow step, Mobbin screen id, app, why selected, Mobbin URL
2. `feature-map.md`
   - columns: target feature/page, reference screens, reusable pattern, implementation notes
3. `implementation-guide.md`
   - component priorities, layout rules, state coverage, and recommended primitives

## Mapping Rules

For each selected screen, extract:

- primary purpose of the screen
- layout pattern: split view, stacked cards, sidebar shell, bottom nav, tab shell, wizard, etc.
- component patterns: table, filters, KPI cards, timeline, sheet, tabs, form sections, CTA hierarchy
- important states: loading, empty, validation, locked, success, destructive confirm
- likely primitive mapping in the target stack

Turn that into a target-side map:

| Target surface | Reference screens | Why this reference | Planned implementation |
|---|---|---|---|
| Dashboard | App A home, App B analytics | Best card density + filter model | shell + KPI cards + chart filters |
| Settings | App C account, App D billing | Best sectioning + save states | tabs + form sections + sticky action bar |

Also mark which repeated surfaces should become shared-system outputs in the target codebase:

- shared layout shell
- shared page header or toolbar pattern
- shared card or section wrapper
- shared empty/loading/error state pattern
- token or variant updates required for parity without page-local duplication

## Decision Rules

- If the user provides one exact canonical app or design file, that source outranks Mobbin.
- If the user wants category inspiration or a hybrid reference set, Mobbin comes first.
- If Mobbin finds only partial coverage, supplement with the user's exact source or a live URL token pass.
- If the user asks for a close rebuild, keep references consistent by selecting a small set of apps instead of mixing too many design languages.

## Handoff To Implementation

Once the screen set and feature map are stable:

1. Choose the strongest exact source for token extraction.
2. Load `ui-builder` for implementation planning.
3. Load `component-architecture` if the target stack has reusable primitives or a design system.
4. Preserve the feature map through build and parity review.

## Constraints

- Do not search Mobbin with broad limits first; large screen dumps waste context and slow decision-making.
- Do not mix unrelated apps just because the visuals look attractive; keep the reference set coherent by product model and flow.
- Do not copy proprietary brand assets or exact copy from reference apps into deliverables.
- Do not move into code until the screen inventory and feature map are explicit.
- Do not respond to a good reference set by re-styling recurring surfaces page by page; map recurring structure into shared patterns first.

## Output Format

- **Search summary**: platform, query set, total screens reviewed, apps represented
- **Screen inventory**: compact table with ids, apps, flows, and selected/rejected status
- **Feature map**: target feature -> chosen screens -> implementation pattern
- **Implementation handoff**: top layout decisions, component priorities, and missing-state checklist