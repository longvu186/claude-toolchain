---
name: ux-patterns
description: "**REFERENCE SKILL** — Canonical shadcn-first UX patterns for common UI elements. Use when: building forms, navigation, tables, modals, confirmations, toasts, loading states, empty states, error boundaries. Provides exact component recipes, not just guidelines. Trigger phrases: form validation pattern, confirm dialog pattern, toast pattern, table pattern, empty state, loading skeleton, error state, navigation pattern, dropdown pattern, command palette."
argument-hint: "Name the UX pattern needed (e.g., 'form validation', 'data table', 'modal dialog')."
---

# UX Patterns Library

Canonical implementations for common UI patterns. For React + Tailwind stacks, `ui.shadcn.com` is the default component foundation and these patterns should be composed from shadcn/ui primitives before custom markup is introduced.

## Framework Baseline

- Start from shadcn/ui for dialog, alert-dialog, dropdown-menu, table, tabs, sidebar, form, input, button, and toast-adjacent primitives.
- Use raw Tailwind only to theme, compose, or extend those primitives, not to reimplement accessibility-critical behavior from scratch.
- Prefer one reusable wrapper around shadcn primitives over repeated ad-hoc page implementations.
- A static layout is not enough: confirmation, toast feedback, hover/focus/active/disabled/loading states, sticky behavior, and scroll ownership are part of the pattern contract.

## System-First Pattern Rule

- Repeated surfaces such as headers, footers, page-title rows, buttons, cards, empty states, filter bars, form sections, and section shells belong in shared wrappers, variants, or layout shells.
- If a pattern appears twice, or is likely to recur, promote it into the system layer before adding a third page-local copy.
- Page files should primarily compose these patterns, not restyle them independently with new class stacks.
- Treat repeated page-local spacing, typography, color, border, radius, shadow, and interaction tweaks as a signal that the shared pattern is underspecified.

## Library-First Defaults

- Use `react-hook-form` with Zod for non-trivial forms; do not hand-roll complex validation state for common CRUD forms.
- Use `@tanstack/react-table` with shadcn `Table` wrappers for dense admin/data tables; do not ship bespoke sortable/filterable tables when the requirement matches standard grid behavior.
- Use `sonner` for app-level toast feedback instead of page-local notification systems.
- Use `react-number-format` for currency and amount inputs that require formatted display while preserving numeric values.
- Use `Dialog` for focused create/edit flows on desktop and `Sheet` for narrow/mobile-first create/edit flows before defaulting to permanently visible inline forms.
- Use existing chart libraries for charts and analytics surfaces; do not author custom chart primitives when the requirement is a standard line/bar/area/pie visualization.
- In route-heavy Next.js app shells, prefer intent-based prefetch over blanket eager prefetch when links trigger data work.
- For CRUD surfaces, pair toast feedback with targeted cache updates or narrow invalidation instead of page-level alert banners and full-surface reloads.
- Interactive controls must expose pointer, hover, focus, disabled, and loading states. A clickable surface without a visible interactive affordance is incomplete.
- Promote page-title rows, card sections, filter toolbars, and empty states into reusable wrappers when they repeat across pages.

## Pattern: Form Validation & Error States

### Structure

```tsx
<form className="space-y-6" noValidate onSubmit={handleSubmit}>
  {/* Field group */}
  <div className="space-y-2">
    <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
      Email
    </label>
    <input
      id="email"
      type="email"
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors",
        "placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-offset-0",
        error
          ? "border-red-500 focus:ring-red-500/20"
          : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20",
        "dark:bg-slate-900 dark:border-slate-700"
      )}
      aria-invalid={!!error}
      aria-describedby={error ? "email-error" : undefined}
    />
    {error && (
      <p id="email-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    )}
  </div>

  {/* Submit */}
  <button
    type="submit"
    disabled={isSubmitting}
    className={cn(
      "w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm",
      "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "transition-colors"
    )}
  >
    {isSubmitting ? "Saving..." : "Save"}
  </button>
</form>
```

### Rules

- Error messages: `text-sm text-red-600 dark:text-red-400`, always with `role="alert"`
- Invalid inputs: `border-red-500`, valid: `border-slate-300`
- Labels: `text-sm font-medium text-slate-700`
- Field spacing: `space-y-2` within field, `space-y-6` between fields
- Always use `aria-invalid` and `aria-describedby` for accessibility

---

## Pattern: Async Mutation Feedback & Targeted Refresh

```tsx
async function handleSave(values: FormValues) {
  setIsSubmitting(true)
  setFormError(null)

  try {
    const updatedRecord = await updateRecord(values)
    patchRecordInList(updatedRecord)
    toast.success("Changes saved")
    onOpenChange(false)
    startTransition(() => refreshVisibleSlice())
  } catch (error) {
    setFormError(getFormErrorMessage(error))
  } finally {
    setIsSubmitting(false)
  }
}
```

### Rules

- Keep `isSubmitting`, `backgroundRefreshing`, and `initialLoading` separate; one boolean for all async work is a broken UX model.
- A create/edit dialog or sheet must keep the background list mounted while submit is running.
- Prefer patching the affected row or invalidating the narrowest cache key over refetching the whole page.
- Preserve scroll, filters, pagination, selection, active tab, and draft state after mutation whenever possible.
- Use toast for transient success; use inline field errors or compact form-level errors for submit failures.
- Reserve banners or full-width alerts for persistent blocking conditions such as permission loss, system outage, or destructive warning context.
- Do not replace the whole page with a loading gate after a row-level mutation.

---

## Pattern: Navigation & Active States

### Grouped Sticky Sidebar Navigation (shadcn/ui)

```tsx
"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ groups, secondaryItems, signOutItem }) {
  return (
    <Sidebar className="top-0 h-dvh border-r">
      <SidebarHeader className="border-b px-2 py-3">
        <div className="px-2 text-sm font-semibold">Console</div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton isActive={item.isActive} tooltip={item.label}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          {secondaryItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton>
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-red-600 hover:text-red-700">
              <signOutItem.icon className="size-4" />
              <span>{signOutItem.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
```

### Tab Navigation

```tsx
<div className="border-b border-slate-200 dark:border-slate-700">
  <nav className="flex gap-0 -mb-px" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={cn(
          "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
          activeTab === tab.id
            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
        )}
      >
        {tab.label}
      </button>
    ))}
  </nav>
</div>
```

### Rules

- Sidebar container must be viewport-height (`h-dvh`) and the scrolling region must live inside `SidebarContent`
- Group large navigation sets under explicit labels; do not ship a single unstructured nav list when item count is high
- Active sidebar items need a solid selected state, not hover-only styling
- Overflow belongs to the sidebar content region, not the page or the full document
- Secondary/support items belong in a distinct group or footer; destructive account actions stay visually separated
- Use mobile sheet/drawer behavior for small screens rather than shrinking a dense desktop sidebar indefinitely
- In Next.js or similar route-prefetching shells, disable blanket eager prefetch for dense nav when route entry triggers expensive data work; prefetch on intent instead.
- Keep shell-level navigation chrome consistent across pages; do not restyle recurring sidebars or top bars page by page

---

## Pattern: App Shell Layout

```tsx
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppShell({ sidebar, toolbar, children }: AppShellProps) {
  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset className="flex h-dvh min-w-0 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="md:hidden" />
          <div className="min-w-0 flex-1">{toolbar}</div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### Rules

- Desktop sidebar stays fixed or inset against the viewport; it must not stretch with page content height
- Mobile sidebar uses off-canvas or sheet behavior and overlays the content instead of compressing the main surface
- `SidebarContent` owns sidebar scrolling; the main content pane owns content scrolling; the document body should not be the accidental shared scroll owner
- Apply `min-h-0` and `min-w-0` on the content chain so tables, editors, and inspectors can shrink and scroll correctly
- Sticky app chrome belongs to the shell header; sticky table headers belong inside the table scroll container, not the page header
- Do not use invisible full-screen click-capture overlays for desktop sidebar dismissal; rely on the sidebar primitive state and document-level outside-click handling where needed
- Treat the app shell as the owner of recurring page header spacing and chrome; individual pages should plug into it instead of redefining it

### Tab Navigation

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
    {tabs.map((tab) => (
      <TabsTrigger
        key={tab.id}
        value={tab.id}
        className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary"
      >
        {tab.label}
      </TabsTrigger>
    ))}
  </TabsList>
</Tabs>
```

- Active tab: solid bottom-border state, never hover-only
- Active tab: colored bottom border `border-blue-600`, colored text
- Hover: subtle background shift, never the same as active
- Always include `aria-current="page"` for active links, `aria-selected` for tabs
- Icons: `h-5 w-5 shrink-0` in navigation items

---

## Pattern: Data Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<div className="overflow-hidden rounded-lg border">
  <div className="max-h-[calc(100dvh-16rem)] overflow-auto">
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Usage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell className="text-right tabular-nums">{row.usage}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
</div>
```

### Rules

- The table wrapper owns both horizontal and vertical overflow for dense datasets; do not let the document body become the only scroll container
- Sticky headers must live inside the same scrolling container as the rows
- Empty state belongs inside the table body with a full-width message row
- Use `tabular-nums` for numeric columns and explicit alignment for actions/metrics
- Pair dense tables with a toolbar for filters, search, and bulk actions instead of stuffing controls into each row
- Default create/import/export actions belong in the table toolbar or page header, not as always-open inline forms above the grid
- Row actions should use dropdown menus and escalate destructive mutations to confirmation dialogs
- If the table must support sorting, filtering, pagination, selection, or visibility toggles, default to `@tanstack/react-table` rather than bespoke local state
- Row-level mutations must keep the table mounted; loading belongs to the button, row, or compact status surface rather than the full page.
- Post-mutation refresh should preserve the current table state and only sync the affected slice unless correctness requires a broader reload.
- Transient success feedback belongs in toast or compact row status, not inline alert blocks above the grid.

---

## Pattern: Create / Edit Flow (Dialog Or Sheet)

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<div className="flex items-center justify-between gap-3">
  <div>
    <h1 className="text-xl font-semibold">Customers</h1>
    <p className="text-sm text-muted-foreground">Manage customer records and status changes.</p>
  </div>

  <Dialog>
    <DialogTrigger className={buttonVariants({ variant: "default" })}>
      New customer
    </DialogTrigger>
    <DialogContent className="max-h-[calc(100dvh-4rem)] overflow-hidden sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Create customer</DialogTitle>
        <DialogDescription>
          Add the core customer details now. You can edit metadata after creation.
        </DialogDescription>
      </DialogHeader>

      <div className="overflow-y-auto px-1 py-1">
        <CustomerForm />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit" form="customer-form">Create customer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>
```

### Rules

- For admin and CRUD screens, default to a page header CTA that opens a `Dialog` or `Sheet` for create/edit flows
- Use `Dialog` for short-to-medium forms on desktop and `Sheet` when the form is long, contextual, or primarily mobile
- Keep primary actions visible with a sticky or persistent footer when the form body scrolls
- Reserve permanently visible inline forms for simple search/filter bars or explicit split-pane workflows
- Unsaved changes require a confirm-on-close path when the user has modified the form

---

## Pattern: Currency / Amount Input

```tsx
import { Controller } from "react-hook-form"
import { NumericFormat } from "react-number-format"

<Controller
  name="amount"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="amount">Amount</FieldLabel>
      <NumericFormat
        id="amount"
        customInput={Input}
        thousandSeparator
        decimalScale={0}
        allowNegative={false}
        prefix="$"
        value={field.value ?? ""}
        aria-invalid={fieldState.invalid}
        onValueChange={({ floatValue }) => field.onChange(floatValue ?? null)}
      />
      <FieldDescription>Displayed as currency while storing a numeric value.</FieldDescription>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

### Rules

- Currency and amount fields should format as users type; raw unformatted numeric entry is an inferior default for money UX
- Store canonical numeric values in form state and APIs; keep formatting as a display concern managed by the input library
- Use locale-aware display for summaries, tables, and previews via `Intl.NumberFormat`
- Show currency code or symbol explicitly; do not make users infer whether a field is VND, USD, or another currency
- Keep numeric columns right-aligned and `tabular-nums` in tables and summaries

---

## Pattern: Confirmation Dialog (shadcn/ui AlertDialog)

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger className={buttonVariants({ variant: "destructive" })}>
    Delete project
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this project?</AlertDialogTitle>
      <AlertDialogDescription>
        This removes project access for all collaborators. You can restore it from the archive for 30 days.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
        Delete project
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Rules

- Use `AlertDialog` for destructive or irreversible actions; reserve `Dialog` for rich editing flows and multi-field forms
- Title states the action plainly; description states impact, scope, and recovery path
- Safe action appears first, destructive action uses destructive styling and explicit verb copy
- Confirmation is required for delete, purge, revoke, archive, logout, permission changes, and high-impact bulk actions
- Follow destructive success with a toast/banner that confirms the result and offers undo/restore when possible

---

## Pattern: Toast / Notification

```tsx
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export function AppShell() {
  return <Toaster richColors closeButton position="top-right" />
}

toast.success("Changes saved.")
toast.error("Could not save changes. Check your connection and try again.")
toast("Project archived.", {
  action: {
    label: "Undo",
    onClick: restoreProject,
  },
})
```

### Rules

- Mount one app-level `Toaster`; do not create page-local bespoke toast systems
- Use toasts for operation-level outcomes, not field validation errors
- Success toasts can auto-dismiss; destructive undo flows should include an action button
- Error toasts must explain recovery, not just failure
- Inline text alone is insufficient for save/delete/archive success or failure in operational UIs

---

## Pattern: Loading Skeleton

```tsx
<div className="animate-pulse space-y-4">
  {/* Avatar + text block */}
  <div className="flex items-center gap-4">
    <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>

  {/* Content lines */}
  <div className="space-y-2">
    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
    <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
    <div className="h-4 w-4/6 rounded bg-slate-200 dark:bg-slate-700" />
  </div>
</div>
```

### Rules

- Container: `animate-pulse`
- Skeleton blocks: `bg-slate-200 dark:bg-slate-700 rounded`
- Match dimensions of the real content (same height, approximate width)
- Use fractional widths (`w-3/4`, `w-1/2`) for text lines — never uniform
- Same spacing as real content (`space-y-*`, `gap-*`)

---

## Pattern: Empty State

```tsx
<div className="flex flex-col items-center justify-center px-6 py-16 text-center">
  <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
    <InboxIcon className="h-8 w-8 text-slate-400" />
  </div>
  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
    No items yet
  </h3>
  <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
    Get started by creating your first item.
  </p>
  <button className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
    Create item
  </button>
</div>
```

### Rules

- Centered: `flex flex-col items-center justify-center text-center`
- Generous vertical padding: `py-16` minimum
- Icon: muted color in a circular background, `h-8 w-8`
- Title: `text-lg font-semibold`
- Description: `text-sm text-slate-500`, max-width for readability
- Primary CTA below description with `mt-6`

---

## Pattern: Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger className={buttonVariants({ variant: "outline" })}>
    Options
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>
        <EditIcon className="mr-2 size-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem className="text-red-600 focus:text-red-600">
        <TrashIcon className="mr-2 size-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

### Rules

- Use shadcn `DropdownMenu` primitives for focus management, dismissal, and keyboard behavior
- Keep destructive menu items visually distinct and consider escalating to `AlertDialog` when the action is irreversible
- Menus are for quick actions, not for long forms or deep navigation trees
- Do not build custom invisible overlays for click-outside handling around menus
