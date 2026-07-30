# System Component Manifest — Next.js + shadcn + Supabase

The concrete "build these first" starter kit. Each shared component **bakes in** the quality rules from
`baseline-app-quality`, `design-intelligence`, and `ux-patterns` so that **page code physically cannot
reproduce the common defects.** That is the enforcement mechanism: rules in prose get skipped; rules baked
into the component everyone must use do not.

> **Rule of adoption:** page files _compose_ these; they do not restyle or re-implement them. If a page
> needs a raw `<table>`, a bare create form, a `position:fixed` modal, or a `window.confirm`, that is a
> defect — the system component is missing or being bypassed.

Each entry: **Layer · Wraps · Contract it guarantees · Key API.** Code recipes live in `ui/ux-patterns`;
this manifest is the inventory + contracts, not a re-paste of the code.

## Layout / shell

### `AppShell` — layout

- **Wraps:** shadcn `SidebarProvider` + `SidebarInset`.
- **Guarantees:** viewport-bound (`h-dvh`), sticky topbar, sidebar and main scroll independently
  (`min-h-0`/`min-w-0` chain), body is never the scroll owner. One shell wraps every authenticated route.
- **API:** `{ sidebar, toolbar, children }`.

### `AppSidebar` — organism

- **Wraps:** shadcn `Sidebar` family.
- **Guarantees:** nav list scrolls internally (`SidebarContent overflow-y-auto`), never lengthens the page;
  grouped nav with labels; active item via `aria-current`; collapses to sheet/drawer below `lg`; secondary
  - destructive (sign-out) items separated in footer.
- **API:** `{ groups, secondaryItems, signOutItem }`. Links default `prefetch={false}`, prefetch on intent.

### `PageHeader` — pattern

- **Guarantees:** consistent title/description placement and a right-aligned **primary action slot** across
  every route (one container width + gutters). The create CTA lives here, not inline in the page body.
- **API:** `{ title, description?, action?, breadcrumbs? }`.

## Data display

### `DataTable` — pattern

- **Wraps:** shadcn `Table` + `@tanstack/react-table`.
- **Guarantees:** bounded scroll container with **sticky header inside it**; right-aligned `tabular-nums`
  numeric columns; row actions in a trailing `RowActions` menu; optional bulk-select bar; built-in
  `loading` (skeleton rows) / `empty` (CTA) / `error` (retry) states; sort/filter persisted; row mutations
  keep the table mounted. Pagination or virtualization for large sets.
- **API:** `{ columns, data, state: {loading,error}, onSort, pagination, selection?, rowActions? }`.

### `FilterToolbar` — pattern

- **Guarantees:** search + filters + bulk actions sit _above_ the table in one toolbar, not stuffed into rows.

### `StatusBadge` — molecule

- **Guarantees:** status via semantic token **+ icon/text** (never color alone); one consistent mapping app-wide.

### `EmptyState` — pattern

- **Guarantees:** icon + title + description + primary CTA; distinguishes first-run vs filtered-empty.

## Create / edit / confirm

### `FormDialog` / `FormSheet` — pattern

- **Wraps:** shadcn `Dialog` / `Sheet`.
- **Guarantees:** the dialog contract (focus trap, `Esc`, focus return, scroll lock); **unsaved-change
  confirm on close**; sticky footer with actions while body scrolls; submit button shows loading and blocks
  double-submit; background list stays mounted. `Dialog` for short forms, `Sheet` for long/contextual.
  Long/multi-step records use a dedicated route instead.
- **API:** `{ open, onOpenChange, title, description?, children, footer, dirty }`.

### `ConfirmDialog` — pattern

- **Wraps:** shadcn `AlertDialog`. Replaces `window.confirm` everywhere.
- **Guarantees:** title states consequence; destructive-styled confirm button uses the real verb; cancel is
  the escape default. Friction scales: `variant="default" | "destructive" | "typed"` (typed = must type the
  object name for catastrophic actions). Pairs with toast + undo for reversible actions.
- **API:** `{ trigger, title, description, confirmLabel, variant, onConfirm, typedConfirmValue? }`.

## Controls / inputs

### `Button` — primitive (shadcn + `cva`)

- **Guarantees:** fixed size set (`sm|md|lg`), variant hierarchy (`primary|secondary|outline|ghost|
destructive|link`), built-in **loading** (spinner, width preserved) and **disabled** (`not-allowed`
  cursor) states, icon+label alignment, `:focus-visible` ring, `cursor-pointer`. One primary per view is a
  usage rule. Using a raw `<button>`/clickable `<div>` is a defect — no free states/cursor/focus.

### `FormField` (Label + control + error) — molecule

- **Wraps:** shadcn `Form` + react-hook-form + Zod.
- **Guarantees:** visible label (never placeholder-as-label), `label→input` and `field→field` spacing from
  the scale, inline error at the field with `aria-invalid`/`aria-describedby`, focus-to-first-error on submit.

### `MoneyInput` / `NumberInput` — molecule

- **Wraps:** `react-number-format`.
- **Guarantees:** formatted display (thousands separators, explicit currency/locale) while storing a numeric
  value; right-aligned `tabular-nums` in summaries.

## Feedback

### `Toaster` + `toast` — app-level

- **Wraps:** `sonner`. Mounted once in `AppShell`.
- **Guarantees:** transient success/error via toast (not inline alert blocks); error toasts state recovery;
  reversible actions include an **Undo** action; `aria-live`.

### Skeletons — primitives

- **Guarantees:** per-component skeletons (`TableSkeleton`, `StatsSkeleton`, …) that match real content
  dimensions — the fallbacks for render-first Suspense boundaries and `loading.tsx`.

## Data & mutation layer (not components, but part of the system)

- **`server/queries/*`** — Server-Component/route-handler reads via the Supabase server client; select only
  needed columns; joined reads (no N+1); paginated. Return clean domain models (DTO boundary rule).
- **`features/*/actions.ts`** — server actions for mutations; narrow `revalidatePath`/`revalidateTag`; never
  full-page refetch.
- **`use<Entity>` client hooks** — wrap optimistic updates (`useOptimistic` + `useTransition`) so the UI
  updates before the server confirms.

## Render-first route template (ties in `frontend-performance-guidelines`)

Every data route follows this so the shell paints instantly and data streams:

```tsx
// app/(dashboard)/<entity>/page.tsx — Server Component, NO top-level await
export default function Page() {
  return (
    <PageShell title="…" action={<NewThingButton />}>
      {" "}
      {/* paints immediately */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <ThingsTable />
      </Suspense>
    </PageShell>
  );
}
// + app/(dashboard)/<entity>/loading.tsx for the route-level instant skeleton
```

## Build order (adoption path)

1. `AppShell` + `AppSidebar` + `PageHeader` + `Toaster` — the frame, once.
2. `Button` + `FormField` + `MoneyInput` + skeleton primitives — the control vocabulary.
3. `DataTable` + `FilterToolbar` + `RowActions` + `EmptyState` + `StatusBadge` — the data surface.
4. `FormDialog`/`FormSheet` + `ConfirmDialog` — the write surface.
5. Server queries + server actions + optimistic hooks — the data/mutation layer.
6. Storybook stories for each (default/hover/focus/disabled/loading/empty/error/dark) — prevents drift.

Once these exist, building a CRUD screen is composition: `PageHeader` CTA → `FormDialog`, `DataTable` with
`RowActions` → `ConfirmDialog`, mutations via server action + optimistic hook. The defects become
structurally impossible, not just discouraged.
