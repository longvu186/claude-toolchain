---
name: feature-admin-dashboard
description: "FEATURE SKILL - Build admin/staff dashboards with role-gated navigation, lifecycle-complete data operations, and operational safeguards. Use for admin layout, permission checks, moderation flows, analytics cards, and staff tooling UX. Trigger phrases: build admin, admin panel, role-based dashboard, moderation UI, staff tools."
argument-hint: "Describe target roles, admin modules, required operations (CRUD/moderation/analytics/lifecycle actions), and scroll/layout constraints."
---

# Feature Skill: Admin Dashboard

Reusable feature playbook for secure, scalable admin panels.

## Feature Scope

- Admin/staff navigation and role-gated sections.
- Operational modules: content, users, moderation, analytics.
- Lifecycle-complete operations per entity (`deactivate`, `block`, `archive`, `soft_delete`, `hard_delete`, `restore`).
- High-density list/kanban/calendar views where applicable.
- Safe destructive actions and confirmation dialogs.

## Sidebar Layout Pattern (preferred over top-tab-bar)

For dark-branded admin consoles, use a fixed 240px sidebar instead of a horizontal tab bar:

- Fixed sidebar with branded dark background; main content area `bg-gray-50`.
- Nav items grouped into labeled sections; active item `bg-<brand>/15 text-white`.
- Sidebar footer: lang toggle + sign-out.
- Mobile: hamburger button + overlay drawer (not a permanent sidebar at mobile widths).
- Do NOT add a redundant `<h1>` page title inside tab/panel content when the sidebar already provides section context.
- For list-heavy panels, use `space-y-4` as the outer wrapper — not `mx-auto max-w-6xl px-4 py-12` (that pattern is for public pages).

Reference implementation: `/root/projects/thepenlab.vn/src/app/(admin-portal)/layout.tsx`

## Stat Card Design (Overview / Dashboard panels)

Preferred anatomy for admin KPI cards:

- Small label above the value (`text-xs text-gray-500 uppercase tracking-widest`).
- Large tabular numeric value with tone-colored text (`text-2xl font-bold tabular-nums`).
- Colored icon chip with tone-based background: success=emerald, warning=amber, danger=red, info=blue, accent=violet, neutral=gray.
- Optional trend arrow + helper text below value.
- Group related cards under section labels: `text-[11px] font-semibold uppercase tracking-widest text-gray-400`.

Reference component: `/root/projects/thepenlab.vn/src/components/admin/AdminStatCard.tsx`

## Preferred Build Pattern

1. Define role access matrix by route/module/action.
2. Load `common-feature-research` if the dashboard contains standard CRUD/list/chart/form surfaces.
3. Implement shared admin layout with stable navigation and explicit scroll ownership (prefer sidebar over top-tab-bar — see above).
4. Keep page-level containment for complex views; keep shared layout generally scrollable.
5. Implement module-level filters/search/sort/pagination.
6. Put primary create/import/export actions in the page header or table toolbar; default create/edit flows to dialog or sheet patterns.
7. Default scoped filters to the authenticated user context first (for example branch/team), then allow explicit widening to global scope.
8. Add guardrails for destructive actions and audit-friendly logs.
9. Apply the lifecycle matrix from `entity-lifecycle-operations` for every managed entity.

## Common Pitfalls

- Over-constraining shared layout (`overflow-hidden`) and breaking non-target pages.
- Permission checks in UI only, without backend enforcement.
- Click-outside overlays blocking persistent sidebars.
- Inconsistent column/filter behavior between desktop and mobile.
- Sidebars that grow with page content instead of staying viewport-bound and internally scrollable.
- Tables that stretch the page instead of owning a sticky, internal scroll region.
- Permanently open create forms above list pages when a dialog/sheet flow is the standard UX.
- Defaulting dashboards to global/unscoped data on first load, which reduces immediate relevance and increases misread risk.
- Shipping entity management with CRUD only and forgetting deactivate/block/archive/delete/restore operations.

## Lifecycle Coverage Baseline

For each admin-managed entity, explicitly map:

- create/read/update/list/search/export
- deactivate/reactivate
- block/unblock
- archive/restore
- soft delete/restore
- hard delete/purge

If any action is intentionally unsupported, document the reason in the module spec.

## Advanced Patterns

### Role-Specific Content Override

- When privileged roles (e.g., verified artist) can override user-generated content (e.g., annotations), always show a confirmation dialog before destructive override.
- Use visual differentiation (dual-color system) to distinguish content by role (e.g., blue for artists, red for staff).
- Show enhanced author cards with role badges for privileged content.

### View Mode Consolidation

- When multiple views exist for the same data (list, kanban, calendar), merge into a single page with toggle switches instead of separate routes.
- Use icon toggles in the page header for compact switching.
- Keep filters visible and synced across view modes.

### Single-Endpoint RPC Dispatch Map

- When an admin console needs many small operations against the same resource (force_cancel, extend_period, mark_invite_sent, revoke_comp, resend_payment, etc.), do NOT spin up one edge endpoint per action. That multiplies auth checks, CORS handlers, and deploy surface area.
- Pattern: one endpoint (e.g. `POST /api/admin-membership-action`) with a single staff-auth gate, dispatching via a static map:
  ```ts
  const RPC_BY_ACTION: Record<
    string,
    { rpcName: string; argsBuilder: (p: any) => Record<string, unknown> }
  > = {
    force_cancel: {
      rpcName: "admin_force_cancel_membership",
      argsBuilder: (p) => ({ p_user_id: p.userId, p_reason: p.reason }),
    },
    extend_period: {
      rpcName: "admin_extend_membership_period",
      argsBuilder: (p) => ({ p_user_id: p.userId, p_days: p.days }),
    },
    mark_invite_sent: {
      rpcName: "admin_mark_invite_sent",
      argsBuilder: (p) => ({ p_user_id: p.userId }),
    },
    // ...
  };
  const entry = RPC_BY_ACTION[body.action];
  if (!entry) return errorResponse(400, "unknown_action");
  const { data, error } = await supabase.rpc(
    entry.rpcName,
    entry.argsBuilder(body.payload),
  );
  ```
- Each RPC remains a `SECURITY DEFINER` function that re-checks staff role server-side (defense in depth). The endpoint just routes.
- Easy to extend: add a new admin action by adding one map entry + one RPC, no new route, no new auth wiring.

## ConfirmationModal Client Component Pattern (Next.js App Router)

For destructive admin actions in Next.js App Router, the canonical pattern is a self-contained `"use client"` component — never `window.confirm`:

```tsx
"use client";
import { useState } from "react";

export function DeleteFooModal({
  fooId,
  fooName,
}: {
  fooId: string;
  fooName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ color: "#c0392b" }}>
        Delete
      </button>
      {open && (
        <div
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 50,
          }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              maxWidth: 400,
              margin: "10vh auto",
            }}
          >
            <h2>Confirm Delete</h2>
            <p>
              Delete <strong>{fooName}</strong>? This cannot be undone.
            </p>
            <form action={deleteFooAction}>
              <input type="hidden" name="fooId" value={fooId} />
              <button type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                style={{ background: "#c0392b", color: "#fff" }}
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

Key points:

- `"use client"` owns open/closed state; the form wraps a server action so no client fetch is needed.
- Hidden inputs carry identifiers into the server action — no URL params or JS payload needed.
- Overlay click outside closes the modal (`e.target === e.currentTarget` guard).
- Confirm button color `#c0392b` (red) is the project standard for destructive actions.
- This replaces `window.confirm` per the global preference; native dialog bypasses product UX and confirmation text.

## Validation Checklist

- Role access map enforced in both UI and backend paths.
- All destructive actions require confirmation.
- Lifecycle actions are implemented or intentionally documented as unsupported.
- Backend role checks exist for every lifecycle mutation path.
- Restore paths are tested, not only destructive paths.
- Audit logs capture actor, action, target, and timestamp for admin mutations.
- Sidebars, inspectors, and complex views preserve expected scroll behavior.
- Dense tables have internal scroll, sticky headers, and toolbar actions that remain usable at typical laptop heights.
- Create/edit flows use dialog or sheet overlays by default unless the spec explicitly calls for split-pane editing.
- Filters and pagination are deterministic and stateful.
- Analytics summaries match raw data queries.

## Works With Technical Skills

- `frontend-layout-pitfalls`: scroll ownership, sticky headers, click-outside robustness.
- `supabase-operations`: role/RLS enforcement and privileged operations.
- `quality-manager`: regression tests for role gates and high-risk admin actions.
- `entity-lifecycle-operations`: lifecycle matrix and destructive-action policy.
- `role-based-access-control`: role x action matrix design.
- `audit-logging-patterns`: admin mutation evidence trail.
- `feature-user-moderation-and-appeals`: moderation-specific flows and appeals.

## Output Contract

When invoked, provide:

1. Admin module map and route/role matrix.
2. Interaction safety checklist.
3. Layout/scroll risk assessment.
4. Validation and test strategy.
