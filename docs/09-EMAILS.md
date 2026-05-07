# 09 — Emails

## Provider

[Resend](https://resend.com). Single integration. No fallback provider — if Resend goes down, emails queue in our `email_log` table and retry on a schedule. This is acceptable for MVP.

## Sender identity

- **From:** `no-reply@eatgooduganda.com` (customer-facing)
- **From:** `orders@eatgooduganda.com` (bakery-facing)
- **Reply-To:** `support@eatgooduganda.com`

DNS: SPF, DKIM (via Resend), DMARC (p=quarantine at launch, tighten later).

## Email catalogue (customer-facing)

| Trigger                         | Template                          | Key data                                         |
| ------------------------------- | --------------------------------- | ------------------------------------------------ |
| Customer signup                 | `customer-verify-email`           | Verification link with 24h token                 |
| Password reset request          | `customer-password-reset`         | Reset link with 30min token                      |
| Password changed                | `customer-password-changed`       | No link; just confirmation + security notice     |
| Order placed (awaiting payment) | `customer-order-placed`           | Order number, items, total, payment instructions |
| Order confirmed (paid)          | `customer-order-confirmed`        | Order number, ETA, bakery contact                |
| Order status updated            | `customer-order-status`           | Current status, bakery note                      |
| Order ready for pickup          | `customer-order-ready-pickup`     | Pickup address, hours                            |
| Order out for delivery          | `customer-order-out-for-delivery` | Delivery driver/notes if applicable              |
| Order delivered                 | `customer-order-delivered`        | Receipt, review prompt (future)                  |
| Order cancelled                 | `customer-order-cancelled`        | Reason, refund instructions                      |
| New message from bakery         | `customer-order-message`          | Excerpt, link to order thread                    |

## Email catalogue (bakery-facing)

| Trigger                                         | Template                 | Key data                            |
| ----------------------------------------------- | ------------------------ | ----------------------------------- |
| Bakery signup                                   | `bakery-verify-email`    | Verification link for the owner     |
| Bakery approved                                 | `bakery-approved`        | Welcome + first-run guide           |
| Bakery application rejected                     | `bakery-rejected`        | Reason, appeal instructions         |
| Staff invite                                    | `bakery-staff-invite`    | Acceptance link, role               |
| New order                                       | `bakery-new-order`       | Order details, link to bakery admin |
| Customer bank transfer proof uploaded           | `bakery-bank-proof`      | Amount, proof image link            |
| Order cancelled by customer                     | `bakery-order-cancelled` | Order number, reason                |
| Weekly sales digest (Sunday 9am Africa/Kampala) | `bakery-weekly-digest`   | Orders count, revenue, top products |

## Email catalogue (platform-facing)

| Trigger                     | Template               | Key data                                    |
| --------------------------- | ---------------------- | ------------------------------------------- |
| New bakery pending approval | `admin-bakery-pending` | Bakery name, owner, application link        |
| Super-admin invite          | `admin-invite`         | Acceptance link, expiring in 48h            |
| Daily operational summary   | `admin-daily-summary`  | New signups, orders, errors, stuck payments |

## Templates

Templates live in `packages/shared/email-templates/`. Each template has:

- `*.html` — full HTML version
- `*.txt` — plain text version (for clients that prefer text)
- `*.schema.ts` — Zod schema for the data context, imported by both the API and tests

All templates use [MJML](https://mjml.io) compiled to HTML at build time — not at runtime. We ship pre-compiled HTML with `{{mustache}}` placeholders.

Styling: inline styles, table-based layout, safe fonts only, max 600px width, light theme only (dark-mode-aware emails are a v2 concern).

Branding: Eat Good Uganda logo + bakery logo (when applicable) side by side on order-related emails, so customers always know which bakery an email is about.

## Sending discipline

- **Never silently retry a send.** Every failed send is logged to `email_log` with `status='failed'` and a reason. The retry job picks up failed rows.
- **Never loop on send failure.** Max 3 retries with exponential backoff; after that, manual intervention.
- **Never send the same email twice.** Each email has an idempotency key = `<event_type>:<entity_id>:<recipient>`. The `email_log` enforces uniqueness.
- **Never send to an unverified email address** (except for the verification email itself).

## Unsubscribe

- Customer marketing emails (weekly digest, promotions — future) have a one-click unsubscribe link.
- Transactional emails (order confirmations, password resets) **do not** have an unsubscribe link; these are essential to the service and exempted under Uganda's Data Protection and Privacy Act, 2019 as lawful processing necessary for contract performance.
- The difference is documented on the `/privacy` page.

## Logging

`email_log` table captures every send:

```sql
CREATE TABLE email_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id         uuid,                     -- nullable; platform-originated emails have none
  recipient_email   citext NOT NULL,
  template_name     text NOT NULL,
  idempotency_key   text NOT NULL UNIQUE,
  status            text NOT NULL CHECK (status IN ('queued','sent','failed','bounced')),
  resend_id         text,                     -- the Resend message id
  attempt_count     integer NOT NULL DEFAULT 0,
  last_error        text,
  sent_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

## What we never include in an email

- Passwords (even in "your new password is X" reset messages — we always send a _link_)
- Full order payment details (last-4 masking not required but we include only what the customer already knows)
- Another customer's data (obvious but worth stating)
- Another bakery's data (same)
- Raw database IDs in user-facing copy (use `order_number`, not `order.id`)
