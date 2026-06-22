---
name: feature-subscription-billing
description: FEATURE SKILL - Build subscription/membership billing flows with hosted checkouts, plan upgrades/downgrades, scheduled plan changes, and webhook reconciliation. Use for paid memberships, tiered plans, recurring billing UX, and provider-agnostic copy. Trigger phrases - subscription billing, paid membership, plan upgrade downgrade, hosted checkout, polar stripe sepay integration, schedule plan change, recurring payment.
---

# Subscription Billing — Feature Skill

Cross-provider patterns for shipping paid memberships and recurring billing on JAMstack / Supabase / edge-function stacks.

## Lifecycle Completeness Baseline

For subscription/membership entities, do not stop at checkout + status update. Define action coverage for:

- create/activate
- read/list/export
- update plan/payment settings
- suspend/reactivate
- revoke/cancel
- archive/restore
- soft delete/hard delete policy (if required by product/compliance)

For each action, define role gate, confirmation policy, reversibility, and audit requirement.

## Core principles

1. **Provider names are internal, payment methods are user-facing.**
   - UI copy: "Thẻ tín dụng / ghi nợ" / "card", "Chuyển khoản ngân hàng" / "bank transfer", "Ví điện tử" / "e-wallet".
   - Code/DB: `payment_provider` enum (`polar | stripe | sepay | vnpay | momo`) + `payment_method` enum (`card | bank_transfer | wallet`).
   - Lets you swap providers (e.g. Polar → Stripe for international cards) without touching user-visible strings.
2. **Never mutate the provider state synchronously on a downgrade click.** Schedule it; let the renewal cycle execute it.
3. **Every DB schedule needs an executor.** Pending columns are metadata only — a worker must apply them at the scheduled time.
4. **Webhooks are the source of truth for subscription state**, not the checkout success redirect. Always reconcile via webhook.

## Data model (minimum)

```sql
-- Plans catalog
plans (
  id text primary key,           -- 'free', 'basic_monthly', 'pro_monthly', 'pro_annual'
  provider text not null,        -- 'polar' | 'stripe' | 'sepay' | ...
  provider_product_id text,      -- ID at provider (Polar product ID, Stripe price ID)
  amount_vnd int not null,       -- normalized currency for ranking
  interval text not null,        -- 'month' | 'year' | 'one_time'
  active boolean default true
);

-- Per-user subscription
subscriptions (
  user_id uuid primary key references auth.users(id),
  plan_id text references plans(id),
  provider text not null,
  provider_subscription_id text, -- subscription/customer ref at provider
  status text not null,          -- 'active' | 'past_due' | 'cancelled' | 'expired'
  current_period_start timestamptz,
  current_period_end timestamptz,
  pending_plan_id text references plans(id),    -- scheduled change
  pending_plan_starts_at timestamptz,           -- usually = current_period_end
  cancel_at_period_end boolean default false,
  updated_at timestamptz default now()
);
```

## Plan-change RPC pattern (Supabase, SECURITY DEFINER)

```sql
create or replace function schedule_plan_change(target_plan_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_sub subscriptions%rowtype;
  v_target plans%rowtype;
  v_current plans%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'code', 'unauthorized');
  end if;

  select * into v_target from plans where id = target_plan_id and active;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'target_plan_not_found');
  end if;

  select * into v_sub from subscriptions where user_id = v_user;
  if not found or v_sub.status <> 'active' then
    return jsonb_build_object('ok', false, 'code', 'no_active_subscription');
  end if;

  if v_sub.plan_id = v_target.id then
    return jsonb_build_object('ok', false, 'code', 'already_on_target_plan');
  end if;

  select * into v_current from plans where id = v_sub.plan_id;
  if v_target.amount_vnd >= v_current.amount_vnd then
    return jsonb_build_object('ok', false, 'code', 'not_a_downgrade');
  end if;

  if v_target.provider <> v_sub.provider then
    return jsonb_build_object('ok', false, 'code', 'cross_provider_downgrade_unsupported');
  end if;

  update subscriptions
     set pending_plan_id = v_target.id,
         pending_plan_starts_at = v_sub.current_period_end,
         updated_at = now()
   where user_id = v_user;

  return jsonb_build_object('ok', true, 'starts_at', v_sub.current_period_end);
end $$;

create or replace function cancel_pending_plan_change()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update subscriptions
     set pending_plan_id = null,
         pending_plan_starts_at = null,
         updated_at = now()
   where user_id = auth.uid();
  return jsonb_build_object('ok', true);
end $$;
```

Standard error codes (return as `code` in the JSONB response — do NOT raise):
`unauthorized`, `target_plan_not_found`, `no_active_subscription`, `already_on_target_plan`, `not_a_downgrade`, `cross_provider_downgrade_unsupported`.

Upgrades typically go through immediate prorated checkout — keep that path separate from `schedule_plan_change`.

## Renewal-time executor (the half people forget)

Pending columns are metadata only. Without an executor, the user is overcharged at renewal and their plan never changes.

Pick ONE of these execution strategies and verify it end-to-end before shipping:

- **Provider renewal webhook.** When the provider sends `subscription.updated` / `invoice.paid` for a new period, check `pending_plan_id` and call the provider's "change subscription" API to swap product, then clear pending fields and update `plan_id`.
- **Cron worker (every 5–15 min).** Query `subscriptions where pending_plan_starts_at <= now() and pending_plan_id is not null`, call provider API per row, clear on success.
- **Just-in-time on next user action.** Lower reliability (won't fire if user is inactive) — only acceptable if the plan is gated by user-driven entry points.

Verification checklist before shipping any downgrade flow:
- [ ] Manually advance a test subscription's `current_period_end` to the past, trigger the executor, confirm the provider API call succeeded and `plan_id` updated.
- [ ] Trigger the renewal webhook for a subscription with `pending_plan_id` set; confirm provider product changed.
- [ ] Confirm `cancel_pending_plan_change` works mid-cycle and the user keeps current plan.

## Polar (polar.sh) — Hosted Checkout

- `POST /v1/checkouts` request body accepts top-level `customer_email` to prefill the hosted form. Always pass the authenticated Supabase session email — users don't retype it, and Polar's customer record auto-matches the app account on first purchase.
- Pass `metadata: { app_user_id: <auth.uid> }` so the webhook reconciles `customer.id` ↔ `auth.users.id` even before email-based matching resolves.
- Webhook is source of truth: do NOT mark a subscription active from the success redirect; wait for `subscription.created` / `subscription.active` webhook events.
- Verify webhook signatures using Polar's signing secret; handle replay idempotency by deduping on event ID.

## Sepay (Vietnam bank-transfer / static QR)

See `tech-pitfalls.md` "SePay" section for canonical pitfalls. Highlights:
- Per-order Virtual Account API is BIDV-only — for other banks use static QR + webhook code-matching.
- Webhook auth header is `Authorization: Apikey <token>` (not `Bearer`).
- Banks strip non-alphanumeric chars from transfer memos. Generate codes as `${prefix}${ts}${rand}` (alphanumeric only) and normalize incoming text via `.replace(/[^A-Z0-9]/g, "")` before matching.
- Always provide a modal with copy buttons for bank name, account number, account holder, exact amount, exact memo, and a prominent "transfer EXACT amount and EXACT memo" warning.

## Cross-provider downgrades

Reject at the RPC layer. Cross-provider switches require:
1. Cancel current subscription at end of period (no immediate refund).
2. Send user back through hosted checkout for the target provider.
3. New subscription starts at next billing date.

There is no clean in-place downgrade across providers. Treat as a deliberate UX flow with explicit copy ("Plan thay đổi này yêu cầu hủy gói hiện tại và đăng ký lại"), not as a one-click action.

## Off-platform onboarding stage machine (Circle / Discord / Slack memberships)

When the paid product unlocks access to a third-party community (Circle, Discord, Slack, Telegram), payment success is **not** the end of the journey — the user still needs to receive and accept a community invite. Model this as an explicit state machine on the subscription row.

```sql
create type onboarding_stage as enum (
  'pending_payment',      -- checkout started, no successful charge yet
  'paid_invite_pending',  -- payment confirmed, invite not yet dispatched
  'invite_sent',          -- invite email/link dispatched (admin or automated)
  'invite_accepted'       -- user joined the off-platform community
);

alter table subscriptions add column onboarding_stage onboarding_stage default 'pending_payment';
alter table subscriptions add column invite_sent_at timestamptz;
alter table subscriptions add column invite_accepted_at timestamptz;
```

Driven by:
- **Webhook**: `subscription.active` → `paid_invite_pending`.
- **Admin RPC** `mark_invite_sent` (or automation when the third-party API supports it) → `invite_sent`.
- **Admin RPC or third-party callback** `mark_invite_accepted` → `invite_accepted`.

Surface in two places:
1. **Admin overview RPC** returns `onboarding_stage` per member so staff can spot stuck users (paid >24h, no invite sent).
2. **User-facing post-payment guide** reads `onboarding_stage` and renders the next concrete step ("Check your inbox for the Circle invite", "Click the link to join", "You're in — here's what to do next"). Without this, users assume they're done after payment and never join the community → high refund/churn rate.

Always pair with a comp-grant admin RPC that can move a user to any stage instantly for QA/support.

## Lifecycle reliability add-ons (reminders + external status sync)

- Keep reminder orchestration in one server helper (reset queued jobs + enqueue timeline), and call it from every paid activation path: provider webhooks and admin actions (`comp_activate`, `mark_order_paid`).
- Add a one-fetch external-membership reconciliation endpoint for admin/support use: fetch remote members once, match by stable identity (email/member id), patch local onboarding state, and support `dryRun` previews.
- For Circle reminder campaigns, prefer bulk sends via `POST /api/admin/v2/messages` with `user_emails` arrays, then persist batch outcome in reminder-job logs for deterministic retries.
- For manual-transfer proration upgrades, persist `proration` + `keep_cycle=true` on order metadata and preserve current period boundaries when activation is confirmed.
- Enforce plan-level payment-method policy in both backend and checkout UI; backend-only rejects still leave confusing/invalid CTAs in stale UI builds.

## Anti-patterns

- ❌ Triggering the real provider sandbox to test billing flows. Sandboxes still create provider-side records, race with webhooks, and pollute analytics. Use admin RPCs (comp grant + state-advance helpers like `force_cancel`, `mark_invite_sent`, `mark_invite_accepted`, `extend_period`, `revoke_comp`) for all QA. Reserve sandbox for final pre-launch smoke test only.
- ❌ Charging immediately on a downgrade click ("you'll get refunded the difference") — refund logic is a maintenance hellhole.
- ❌ Cancelling immediately on downgrade ("we'll re-subscribe you to the cheaper plan") — leaves a service gap and double-charges if upgrade was prorated.
- ❌ Showing "Polar" or "Stripe" in user-facing buttons or invoices — users don't know what those are.
- ❌ Trusting the checkout success redirect for subscription state — users navigate away, redirects fail, payments fail post-redirect. Always reconcile via webhook.
- ❌ Storing pending plan changes without an executor — silent failure, user overcharged at renewal.
- ❌ Allowing cross-provider plan changes through the same RPC — too many edge cases, refund mismatches, double-charging.

## Validation checklist

- [ ] All user-facing copy describes payment *method*, not provider name (grep for `polar`, `stripe`, `sepay` in `src/` outside lib/types).
- [ ] `schedule_plan_change` RPC returns one of the 6 standard error codes for every failure path.
- [ ] Renewal executor exists and has been tested end-to-end with a forced-expired subscription.
- [ ] Webhook handler is idempotent (event ID dedup) and signature-verified.
- [ ] Hosted checkout call passes verified session email + app_user_id metadata.
- [ ] Cross-provider downgrades return `cross_provider_downgrade_unsupported`.
- [ ] User can cancel a pending plan change before it executes.
- [ ] Suspend/reactivate and revoke/cancel flows are explicitly implemented and tested.
- [ ] Lifecycle action policy includes archive/restore and delete handling where required.
- [ ] High-risk billing/admin actions are audit-logged with actor/action/target/timestamp.

## Cross-links

- `tech-pitfalls.md` → "SePay", "Polar", "Subscription Billing Patterns", "Webhook Idempotency With Supabase + Pages Functions", "Service-Role vs User-Token Write Boundaries"
- `feature-auth-system` for session/email passing into checkout
- `feature-admin-dashboard` for subscription moderation/refund tooling
- `entity-lifecycle-operations` for lifecycle action coverage standards
- `role-based-access-control` for role-action matrix design
- `audit-logging-patterns` for billing/admin mutation audit trails
