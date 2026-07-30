---
name: component-architecture
description: "**WORKFLOW SKILL** — Build maintainable UI systems with clear component boundaries, Storybook-first isolation, shadcn/ui primitives, Atomic Design vocabulary, and Feature-Sliced module discipline. Use when: designing component architecture, splitting large components, introducing a design system, reviewing frontend maintainability, planning Storybook coverage, or deciding where UI/state/effects belong. Trigger phrases: component architecture, component isolation, Storybook setup, design system architecture, atomic design, feature-sliced frontend, maintainable UI, clean frontend boundaries."
argument-hint: "Describe the component/system boundary problem, current stack, and whether you need architecture guidance, a refactor plan, or review criteria."
---

# Component Architecture

Use this skill when UI quality depends on maintainability, not only appearance. The goal is a component system that is easy to reason about, easy to test, and hard to rot.

## Default Stack Assumption

For React + Tailwind projects:

- Use shadcn/ui as the primitive layer.
- Use Tailwind for layout, tokens, and controlled extension of those primitives.
- Use Storybook or an equivalent isolated component catalog as the source of truth for reusable UI states.
- Prefer Feature-Sliced boundaries for growing product codebases.

## System-First Reuse Rule

Before accepting page-local JSX or Tailwind as the answer, ask whether the surface is actually a shared-system concern.

- Repeated surfaces such as headers, footers, page-title rows, buttons, cards, toolbars, empty states, form sections, and section shells should be owned by primitives, pattern wrappers, shared variants, or layout shells.
- If the same visual rule appears twice, or is likely to recur across pages, move it into tokens, a shared variant, or a wrapper component immediately.
- Page-composition files should mostly assemble existing system pieces, not restyle common surfaces independently.
- Treat page-local duplication of shared spacing, typography, color, border, radius, shadow, and interaction rules as an architecture smell.

## Responsibility Layers

Use these layers consistently. A component should normally belong to one of them.

| Layer            | Responsibility                                                        | Typical Examples                                                 |
| ---------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Primitive        | Generic, reusable, accessibility-critical UI building blocks          | `Button`, `Input`, `Dialog`, `Table`, `Sidebar`                  |
| Pattern          | Reusable composition of primitives with one clear interaction purpose | `ConfirmDialog`, `FilterToolbar`, `EmptyState`, `DataTableShell` |
| Feature UI       | UI tied to one business action or domain flow                         | `InviteMemberForm`, `ArchiveProjectDialog`                       |
| Page Composition | Screen assembly, routing composition, view-specific orchestration     | `ProjectSettingsPage`, `BillingOverviewPage`                     |

If a file spans multiple layers, split it.

## Atomic Design, Used Carefully

Atomic Design is useful as a vocabulary for UI reuse:

- **Atoms** map well to shadcn primitives and token-driven basics.
- **Molecules** map to small reusable patterns such as field rows, card headers, and action clusters.
- **Organisms** map to richer sections such as sidebars, filter panels, dashboards, and composed forms.

Do not use Atomic Design alone to structure business logic. It helps with UI composition, but it is too weak by itself for domain ownership and feature boundaries.

## Feature-Sliced Boundaries

For larger apps, prefer predictable dependency direction:

```text
app -> pages -> widgets -> features -> entities -> shared
```

Practical interpretation:

- `shared/ui` contains primitives and low-level patterns.
- `entities/*` owns domain models and UI tied to a business entity.
- `features/*` owns user actions and flows.
- `pages/*` composes features and widgets; it should not become a god-layer.

Rules:

- Lower layers must not import higher layers.
- Consumers import from slice public APIs, not deep internals.
- Keep helpers local until reuse is proven; `shared/utils` is a high bar.

## Storybook-First Isolation

Every reusable UI component or pattern should have isolated stories for its key states.

Minimum story matrix when applicable:

- default
- hover or active visual example
- focus-visible
- disabled
- loading
- empty
- error
- destructive variant
- dark mode

Storybook is not optional garnish. It is how you prevent drift between design-system intent and product usage.

## Public API Discipline

Each non-trivial module should expose a stable entry point.

Example:

```ts
// features/archive-project/index.ts
export { ArchiveProjectDialog } from "./ui/archive-project-dialog";
export { useArchiveProject } from "./model/use-archive-project";
```

Do not force consumers to deep-import volatile internals such as `./ui/internal/footer-actions`.

## State And Effect Ownership

Keep state at the lowest common ancestor of all readers and writers.

- Local UI state stays close to the component: open/closed, selected tab, input draft
- Feature state belongs in the feature slice: submit lifecycle, filter params, optimistic updates
- Domain state belongs near entity/model layers, not scattered across pages

Effects should do one job:

- fetch data
- sync external systems
- track analytics
- react to state transitions

If one `useEffect` fetches, transforms, navigates, and tracks, split it.

## DTO Boundary Rule

Do not pass raw server DTOs deep into presentation components.

- Define DTO types near the API layer.
- Map them to domain/UI models near the boundary.
- Keep presentation components on clean domain-facing props.

This keeps JSX boring and makes refactors local.

## Naming Rules

- Names must reveal role or domain meaning: `ProjectStatusBadge`, `useInviteMember`, `BillingSummaryCard`
- Avoid vague catch-alls such as `Wrapper`, `Manager`, `Helper`, `Thing`, `handleStuff`
- Pattern components should be named by structure or interaction purpose, not screen location only

## Shadcn-First Pattern Rules

- Prefer wrapper patterns around shadcn primitives over hand-rolled clones
- Confirmation flows should wrap `AlertDialog`
- Menus should wrap `DropdownMenu`
- Dense data surfaces should wrap `Table`
- Navigation shells should wrap `Sidebar`, `Tabs`, `Sheet`, or `NavigationMenu`

If the component is custom, document why the primitive composition path was insufficient.

## Review Checklist

- Does the component have one clear responsibility?
- Does it belong in the current layer/slice?
- Is a reusable primitive or pattern being duplicated locally?
- Is page composition re-styling a surface that should live in a shared pattern, variant, or layout shell instead?
- Are state and effects located near where they change?
- Are public imports stable and shallow?
- Does Storybook cover the key visual and interaction states?
- Are destructive, loading, empty, error, and success states explicit?
- Are DTOs transformed before reaching presentation?

## Anti-Patterns

- God components with fetching, formatting, layout, and mutation logic mixed together
- `utils/` dumping grounds for unstable feature logic
- Deep imports into component internals across the app
- Raw DTOs threaded through presentational components
- Rebuilding basic dialog, menu, toast, or table behavior from scratch while shadcn exists
- Page-local rewrites of recurring headers, cards, toolbars, or section shells that should be fixed once in the shared layer
- Large UI rewrites without story coverage or a public API seam

## System Component Manifest

For a Next.js + shadcn + Supabase app, do not invent the shared set from scratch each time. The concrete
"build these first" manifest — `AppShell`, `AppSidebar`, `PageHeader`, `DataTable`, `FormDialog`/`FormSheet`,
`ConfirmDialog`, `Button`, `FormField`, `MoneyInput`, `Toaster`, `EmptyState`, skeletons — with the **contract
each one guarantees** (so page code cannot reproduce common UI/UX defects) and the render-first route
template, lives in **[references/system-component-manifest.md](references/system-component-manifest.md)**.
This is the enforcement layer: rules baked into a required component can't be skipped the way prose rules are.

## Adoption Path

Introduce this incrementally:

1. Enforce shadcn-first primitives for new UI work; stand up the System Component Manifest set first.
2. Add Storybook coverage for reusable patterns and failure-prone states.
3. Add slice public APIs and reduce deep imports.
4. Move one high-churn feature into clear boundaries before expanding further.
5. Fix recurring UI issues at the pattern/system layer rather than page by page.
