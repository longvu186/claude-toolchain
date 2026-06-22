---
name: feature-transactional-email
description: "FEATURE SKILL - Design and implement transactional email automation for event/ticketing/payment flows. Use for registration confirmation, payment confirmation, ticket delivery, payment reminder, VietQR in email, Zoho SMTP via nodemailer, idempotent email sends, fire-and-forget email pattern, Vercel Cron reminder jobs, and email tracking columns. Trigger phrases: transactional email, email automation, ticket email, payment confirmation email, registration email, payment reminder cron, VietQR email, Zoho SMTP, nodemailer."
argument-hint: "Describe triggers (form submit, webhook, cron), email types needed, SMTP provider, and QR code requirements."
---

# Feature Skill: Transactional Email Automation

Reusable patterns for event/ticketing/payment transactional email flows, extracted from BSides Hanoi 2026.

## Feature Scope

- Registration confirmation email after form submission (with payment instructions + VietQR).
- Payment confirmation email after webhook match or manual reconciliation.
- Ticket delivery email with inline base64 QR code for check-in.
- Payment reminder email sent by cron to pending orders past a deadline.
- Idempotency: deduplicate sends across webhook replay and concurrent cron runs.
- Feature-flag graceful degradation: system works normally when SMTP is unconfigured.
- Email tracking columns on DB rows for audit and idempotency.

## Production status

Zoho SMTP confirmed working in production (BSides Hanoi 2026, 2026-06-07): 4 email types delivered via `smtp.zoho.com:587` STARTTLS. Credentials: `ZOHO_SMTP_USER=contact@bsideshanoi.net` + app password.

## SMTP Provider Decision

### Zoho SMTP (preferred for teams with an existing Zoho mailbox)

- Use SMTP (port 587, STARTTLS) with an app password, not the Zoho Mail REST API.
- Reason: the REST API requires domain-level API keys and a separate OAuth flow; SMTP with an app password reuses the existing mailbox, is simpler to configure, and is more portable.
- Nodemailer singleton transporter — create once per process, reuse across requests.
- Host: `smtp.zoho.com`, port 587, `secure: false` (STARTTLS).

```typescript
// lib/email/smtp.ts — singleton pattern
let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!cmsFeatureFlags.emailEnabled) return null;
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 587,
    secure: false,
    auth: { user: env.zohoSmtpUser!, pass: env.zohoSmtpPass! },
  });
  return _transporter;
}
```

### Feature flag

Gate the transporter on presence of both SMTP credentials:

```typescript
emailEnabled: Boolean(env.zohoSmtpUser && env.zohoSmtpPass);
```

When `emailEnabled` is false, `sendEmail()` logs a warning and returns silently — no throw, no broken form/webhook flows.

## VietQR in Email

Use `img.vietqr.io` CDN to embed a bank transfer QR image in email HTML. No package needed.

```typescript
function vietqrUrl(amountVnd: number, orderCode: string): string | null {
  if (!bankId || !account) return null;
  return (
    `https://img.vietqr.io/image/${bankId}-${account}-qr_only.png` +
    `?amount=${amountVnd}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(accountName)}`
  );
}
```

- `qr_only.png` renders just the QR matrix, suitable as a compact email image.
- Include orderCode as `addInfo` so the bank transfer memo auto-populates — critical for automated reconciliation with Sepay.
- Returns `null` when env vars are absent; template renders without the QR block.

## Ticket QR (Check-in)

Use `qrcode` npm package to generate a base64 PNG data URI from the ticket code. Embed inline in email HTML.

```typescript
const qrDataUrl = await QRCode.toDataURL(ticketCode, { width: 300, margin: 2 });
// <img src="${qrDataUrl}" ... />
```

- Inline data URI avoids a CDN dependency and is immediately visible in most email clients.
- Add a note: "one-time use only, do not share."

## Idempotency Pattern

Before sending any email, perform an atomic `UPDATE … WHERE … IS NULL RETURNING id`. If the row returns empty, the email was already sent — skip and return.

```sql
UPDATE cms_orders
SET registration_email_sent_at = now(), updated_at = now()
WHERE id = $1 AND registration_email_sent_at IS NULL
RETURNING id::text AS id
```

```typescript
const updated = await queryRows<{ id: string }>(sql, [orderId]);
if (updated.length === 0) return; // already sent
// proceed to send
```

- Safe against webhook replay, duplicate cron runs, and concurrent invocations.
- One column per email type: `registration_email_sent_at`, `payment_email_sent_at`, `reminder_email_sent_at` on `cms_orders`; `ticket_email_sent_at` on `cms_tickets`.

## Fire-and-Forget Pattern

Email sends in webhook handlers and form submission routes MUST NOT block the response. Use `.catch(console.error)` to let the side effect float freely.

```typescript
// In form submission handler — never await, never let email failure abort the response
sendRegistrationConfirmation(order).catch(console.error);

// In payment webhook — same rule
sendPaymentAndTicketEmails(matchedOrder.id).catch(console.error);
```

- The webhook or form route returns 200/success immediately.
- Email failures are logged but do not surface as HTTP errors to the caller.
- Combined with idempotency, a failed send on one webhook delivery will NOT be retried by the same mechanism — use the cron reminder as a backstop for critical paths.

## Email Types and Trigger Map

| Email                     | Trigger                                                             | Key content                             |
| ------------------------- | ------------------------------------------------------------------- | --------------------------------------- |
| Registration Confirmation | After `maybeCreateTicketOrder()` succeeds                           | Ticket type, amount, order code, VietQR |
| Payment Confirmation      | After `issueTicketsForOrder()` (Sepay webhook or manual match)      | Ticket type, amount paid                |
| Ticket Delivery           | Same trigger as above, per ticket row                               | Inline QR code for check-in             |
| Payment Reminder          | Hourly cron, pending orders > 24h, `reminder_email_sent_at IS NULL` | Same as registration confirmation       |

Emails 2 and 3 share a single trigger but are separate emails sent in sequence within `sendPaymentAndTicketEmails()`.

## Vercel Cron Reminder Pattern

```json
// vercel.json
{ "crons": [{ "path": "/api/cron/payment-reminder", "schedule": "0 * * * *" }] }
```

```typescript
// route.ts — always export runtime = "nodejs" for nodemailer
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!cmsEnv.cronSecret || auth !== `Bearer ${cmsEnv.cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  // query pending orders, call sendReminderEmail() per row
}
```

- Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically when `CRON_SECRET` is set.
- Guard: return 401 immediately if secret is missing or mismatched.
- `runtime = "nodejs"` is required — nodemailer does not work in the Edge runtime.
- Add `LIMIT 50` to the query to bound cron execution time.

## DB Migration Pattern

Add `_email_sent_at` timestamp columns to relevant tables in a dedicated migration:

```sql
-- migration: 20260607_0005_email_tracking.sql
ALTER TABLE cms_orders
  ADD COLUMN registration_email_sent_at TIMESTAMPTZ,
  ADD COLUMN payment_email_sent_at TIMESTAMPTZ,
  ADD COLUMN reminder_email_sent_at TIMESTAMPTZ;

ALTER TABLE cms_tickets
  ADD COLUMN ticket_email_sent_at TIMESTAMPTZ;
```

Columns are nullable; `IS NULL` check is the idempotency gate.

## Required Env Vars

| Var                   | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `ZOHO_SMTP_USER`      | Full Zoho mailbox address                                          |
| `ZOHO_SMTP_PASS`      | Zoho app password (not account password)                           |
| `EMAIL_FROM`          | Display name + address: `"BSides Hanoi <contact@bsideshanoi.net>"` |
| `CRON_SECRET`         | Random secret; Vercel injects as Bearer token on cron calls        |
| `VIETQR_BANK_ID`      | VietQR bank code (e.g. `MB`, `VCB`)                                |
| `VIETQR_ACCOUNT`      | Bank account number                                                |
| `VIETQR_ACCOUNT_NAME` | Account name for QR display                                        |

`EMAIL_FROM` and `VIETQR_*` have safe defaults; `ZOHO_SMTP_*` and `CRON_SECRET` are required for production.

## File Layout

```
lib/email/
  smtp.ts        — nodemailer singleton + sendEmail()
  templates.ts   — pure functions returning { subject, html } per email type
  send.ts        — high-level idempotent functions (DB guard + template + send)
app/api/cron/
  payment-reminder/route.ts  — Vercel Cron GET handler
```

Keep templates.ts pure (no DB, no SMTP). Keep send.ts as the only layer that reads DB state for idempotency.

## Smoke-testing email templates (no deploy needed)

Use a standalone `.mjs` script loaded with production env vars to send real emails locally:

```bash
# Pull production env vars first (must specify --environment=production)
vercel env pull .env.prod.web --environment=production --yes

# Run the smoke test against real SMTP
node --env-file=.env.prod.web scripts/test-emails.mjs
```

- `node --env-file` requires Node 20.6+; loads the file as a flat `KEY=VALUE` env without a shell.
- Plain `vercel env pull` (no `--environment` flag) pulls only `development`-scoped vars and will miss production-only secrets such as `ZOHO_SMTP_PASS`.
- The test script should import send functions directly and call each email type in sequence with a test order/ticket fixture.
- This pattern is faster and safer than deploying to staging just to verify a template change.

## Vercel CLI env var notes

- `vercel env add NAME production --value VALUE --yes` works non-interactively for production.
- Adding to `preview` environment non-interactively still prompts for a branch unless you omit the branch; use `--value VALUE --yes` together to suppress the value prompt, but be aware the branch prompt may still appear.
- For projects where only production matters (e.g. email config on BSides), skip adding `preview` env vars entirely.
- After adding vars, verify with `vercel env ls` to confirm they appear in the correct environment.

## Validation Checklist

- [ ] All send calls in webhook/form routes use `.catch(console.error)` — never `await` in the response path.
- [ ] Every send function has an atomic `UPDATE … WHERE … IS NULL RETURNING` guard.
- [ ] Cron route exports `runtime = "nodejs"`.
- [ ] Cron route validates `Authorization: Bearer` header; returns 401 on mismatch.
- [ ] `emailEnabled` feature flag tested with missing env vars — no throw, warning log only.
- [ ] VietQR URL returns `null` gracefully when bank vars absent; template renders without QR cell.
- [ ] DB migration applies `_email_sent_at` columns before first deploy.
- [ ] Inline ticket QR uses base64 data URI, not a hosted image URL.

## Pitfalls

- **nodemailer + Edge runtime**: nodemailer requires Node.js crypto/net APIs — always `export const runtime = "nodejs"` in any route that touches nodemailer directly.
- **Awaiting email in webhook**: a slow or failed SMTP call will cause webhook timeouts and trigger retry loops. Always fire-and-forget.
- **Missing `addInfo` in VietQR**: without the order code in the bank memo, Sepay cannot auto-match the transfer — defeats the purpose of the QR.
- **Concurrent cron runs**: without the atomic UPDATE guard, two overlapping cron executions send duplicate reminders. The idempotency pattern is mandatory.
- **Zoho app password vs account password**: Zoho rejects account passwords for SMTP after 2FA is on. Always generate a dedicated app password in Zoho security settings.

## Cross-links

- `feature-subscription-billing` — payment lifecycle, webhook reconciliation patterns, Sepay integration.
- `environment-quirks` — Vercel edge runtime limitations (use nodejs runtime for nodemailer).
