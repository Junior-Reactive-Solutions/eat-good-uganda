# Prompt 16 — Email Flows via Resend

## Context

Emails have been stubbed throughout the build. Now we wire Resend and enable real deliveries in staging / production.

Read before starting:
- `docs/09-EMAILS.md`

## Goal

Implement the email service, all templates, the queue + retry + idempotency logic, DKIM/SPF/DMARC configuration notes, and tests.

## Deliverables

### `apps/api/src/lib/email.ts`

- `sendEmail({ to, template, data, idempotencyKey, bakeryId? })` — looks up idempotency, compiles template, calls Resend, logs delivery.
- `retryFailedEmails()` — runs every 15 minutes via cron; picks failed rows from `email_log`, retries up to 3 times with exponential backoff.

### Templates

`packages/shared/email-templates/` — every template listed in `docs/09-EMAILS.md`. For each:
- `*.mjml` source — author-friendly format.
- Build step compiles MJML → HTML at `pnpm build` time; output checked in to `*.compiled.html`.
- `*.txt` plain-text version.
- `*.schema.ts` Zod schema for template data.

### Compile step

`packages/shared/email-templates/build.ts` — runs MJML compiler over all `*.mjml` files, writes `*.compiled.html`. Tested in CI: if someone edits a `.mjml` without regenerating the `.compiled.html`, the build fails.

### Template rendering

`renderEmail(templateName, data) → { subject, html, text }`:
- Loads `{templateName}.compiled.html` and `{templateName}.txt`.
- Substitutes Mustache placeholders.
- Subject is the first line of the `.txt` file, prefixed with `Subject: ` as a pragma.
- Returns rendered payload.

### Idempotency

Every send includes an idempotency key = `{event_type}:{entity_id}:{recipient}`. The unique constraint on `email_log.idempotency_key` prevents duplicate sends.

### Resend webhook (optional)

If Resend supports delivery webhooks, wire them to update `email_log.status` to `bounced`/`delivered`. Otherwise, rely on Resend's dashboard.

### Wire into existing flows

Replace every stubbed `TODO: send email` comment in earlier prompts with a real `sendEmail(...)` call. Affected flows:
- Customer signup verification
- Customer password reset
- Customer password changed
- Customer order placed / confirmed / status updates / delivered / cancelled
- Bakery signup verification
- Bakery approved / rejected
- Bakery new order alert
- Bakery bank proof uploaded
- Super-admin bakery-pending alert
- Super-admin invite

### Tests

- Unit: `renderEmail` substitutes correctly; handles missing data gracefully.
- Integration: `sendEmail` inserts into `email_log` and calls Resend with correct payload (Resend mocked via nock).
- Integration: duplicate idempotency key → skipped, not duplicate send.
- Integration: failed send recorded with status `failed`, retried by the cron.
- E2E: customer signs up, verification email shows up in the `email_log` table with status `sent`.

## Constraints

- No email send without an idempotency key.
- No email send to an unverified address except the verification email itself.
- Maximum 3 retries. Beyond that, mark `failed` permanently.
- Plain-text versions required for every template.

## Acceptance checklist

- [ ] All 20+ templates exist and compile.
- [ ] All stubbed email calls in prior prompts now invoke the real service.
- [ ] Resend API key loaded from env; missing = boot failure.
- [ ] DKIM/SPF/DMARC records documented in `docs/13-DEPLOYMENT.md` (update that doc if it's not there).
- [ ] Tests pass.
