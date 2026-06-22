---
name: tech-pitfalls
description: "REFERENCE SKILL - Cross-project failure patterns with symptom-to-fix mappings. Covers database migrations, testing false confidence, error swallowing, and verification methodology. Trigger phrases: column does not exist, migration not applied, test passed but prod broken, error swallowed, works in test fails in prod."
argument-hint: "Describe the symptom (error message, unexpected behaviour) and the stack layer (DB, backend, test, deploy)."
---

# Tech Pitfalls

Cross-project failure patterns. Each entry has a clear symptom, root cause, and fix in under 5 steps.

## Database / Migrations

### Migration-in-repo does not mean migration-in-prod

- **Symptom:** Runtime error `42703 column does not exist` (Postgres) or equivalent; feature was code-reviewed and merged; migration file exists in the repo.
- **Root cause:** Migration runner is manual (or not wired into the deploy pipeline). The file was committed and reviewed but never applied to the production database.
- **Fix:**
  1. Verify applied state: `SELECT column_name FROM information_schema.columns WHERE table_name = 'your_table'` against prod.
  2. Apply the missing migration manually if safe; otherwise gate the feature behind a runtime column-existence check until the migration is applied.
  3. Wire migrations into the deploy pipeline (e.g., a pre-deploy script or startup assertion) so this cannot recur silently.
- **Prevention:** Before marking a DB-column-gated feature as done, confirm the column exists in prod — not just in the repo.

## Testing

### Component-isolation tests create false confidence

- **Symptom:** A standalone "send test" or unit test confirms the component works (e.g., SMTP credentials valid, function returns correct value), but the integrated feature fails in production.
- **Root cause:** The isolated test bypasses the real execution path — it skips DB idempotency checks, platform lifecycle constraints, auth middleware, or environment variable resolution that only apply in the integrated path.
- **Examples observed:** A transport-only email test proved credentials but bypassed serverless freeze behaviour and idempotency columns; both failure modes were invisible until production exercise.
- **Fix:**
  1. Treat component-isolation tests as credential/logic checks only — not as end-to-end proof.
  2. Verify the real integrated path against prod-like data before declaring a feature working.
  3. For email/webhook/payment side-effects, the only reliable test is triggering the actual API route with a real (or staging) payload and confirming the downstream effect (delivery, DB state change, third-party receipt).
- **Rule:** "The test passed" does not mean "the feature works in prod." Always exercise the integrated path.

## Error Handling

### Swallowed errors hide production failures

- **Symptom:** A form or API endpoint returns success; the user sees no error; a critical side-effect (email, payment record, audit log) silently failed. The only evidence is a `console.error` line buried in logs.
- **Root cause:** `.catch(console.error)` on a critical side-effect makes a hard runtime error invisible to the caller and to monitoring.
- **Fix:**
  1. For critical side-effects, record failures explicitly: write an `error` column to the DB, emit a structured log event with severity `error`, or surface a visible status to the operator.
  2. Return or rethrow errors from side-effects when the caller needs to know (e.g., don't return HTTP 200 if the email failed and the caller should retry).
  3. Use alerting (Sentry, log-based alerts) on `error`-level events for any side-effect that has no retry mechanism.
- **Rule:** `.catch(console.error)` is acceptable only for truly optional side-effects. For anything the product depends on (delivery, payment, audit), surface the failure.

## Verification Methodology

### Code-tracing is not runtime verification

- **Symptom:** Code review confirms the logic is correct; the feature is declared done; it fails in prod because an env var is missing, a migration was not applied, or a platform lifecycle constraint was not exercised.
- **Root cause:** Reading code proves intent, not runtime state. Environment variables, applied migrations, and platform behaviour (e.g., serverless freeze) are invisible to static analysis.
- **Fix:** "Verify before claiming done" must include all three layers:
  1. **Logic layer** — code review / static analysis (necessary but not sufficient).
  2. **Environment layer** — confirm env vars present in target environment; confirm DB schema matches code expectations.
  3. **Runtime layer** — exercise the integrated path end-to-end against the target environment; confirm the downstream effect (not just an HTTP 200).
- **Shortcut heuristic:** If a feature touches email, payments, DB schema changes, or auth, do not mark it done without a prod-environment smoke test.
