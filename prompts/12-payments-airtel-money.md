# Prompt 12 — Payments: Airtel Money

## Context

MoMo flow is live (prompt 11). The payment service, credential encryption, webhook handling, and reconciliation plumbing are reusable. This prompt adds Airtel Money as a second provider.

Read before starting:
- `docs/07-PAYMENTS.md`
- `instructions/09-payment-integration-rules.md`

**Re-verify Airtel Africa endpoints against `https://developers.airtel.africa` before coding. Document any deltas in `docs/17-DECISIONS_LOG.md`.**

## Goal

Implement Airtel Money Collections: per-bakery credentials, client id/secret OAuth, USSD-push payment initiation, status enquiry, webhook receipt.

## Deliverables

### Provider abstraction

`apps/api/src/services/payment/providers/airtel.ts`:

```ts
interface AirtelCreds {
  client_id: string
  client_secret: string
  target_environment: 'staging' | 'production'
}

class AirtelClient {
  constructor(creds: AirtelCreds)
  async getToken(): Promise<{ access_token, expires_in }>
  async initiatePayment(input: { reference, msisdn, amount, transactionId }): Promise<{ status, message }>
  async getTransactionStatus(transactionId: string): Promise<{ status, message, airtelMoneyId? }>
}
```

Base URLs per `target_environment`. Country `UG`, currency `UGX` hard-coded in headers at MVP.

Token cached per-bakery; 2-hour TTL from response.

### Payment service additions

`initiateAirtelPayment(db, order, bakery_id, payerMsisdn, idempotencyKey)` — mirrors the MoMo flow but with Airtel client and the Airtel-specific payload structure per `docs/07-PAYMENTS.md`.

### Route

- `POST /v1/customer/orders/:id/pay` accepts `{ method: 'airtel_money', phone }`.

### Webhook

- `POST /v1/webhooks/airtel-money`:
  - Parse body.
  - Look up payment by the transactionId we supplied (stored on `payments.external_reference` for Airtel or `provider_reference` — pick one consistently and document).
  - Verify via `client.getTransactionStatus()`.
  - Update state accordingly.
  - Record in `webhook_deliveries`.
  - Respond 200 within 3 seconds.

### Reconciliation

Extend `reconcilePendingPayments` job to include Airtel payments. Same rules as MoMo (30 min → check; 2 hrs → fail).

### Bakery admin

- "Test" button for Airtel: initiates a staging UGX 100 to a known test MSISDN (check Airtel docs for the current test subscriber; note: Airtel's test credentials are less publicly documented than MoMo's — the bakery's own test number in staging is usually acceptable).

### Customer frontend

Pay page handles Airtel same as MoMo — different copy ("Airtel Money request sent to +256...") — same polling pattern.

### Tests

- Unit: AirtelClient with mocked HTTP.
- Integration: payment flow success / failure.
- Integration: idempotency.
- Integration: webhook cross-verification.
- Integration: amount mismatch rejection.
- Cross-tenant: enforced as in prompt 11.
- E2E: Airtel flow against staging.

## Constraints

- Phone number normalisation: Airtel expects just the subscriber number without country code (e.g. `780123456` for `+256780123456`). The normaliser in `@eatgood/shared` should produce both forms; the Airtel client takes the local form.
- Timeouts and retries same as MoMo.
- Never log creds or tokens.

## Acceptance checklist

- [ ] End-to-end Airtel flow works against staging.
- [ ] Webhook + reconciliation integrate cleanly with the existing framework.
- [ ] All tests pass.
- [ ] Bakery admin Test button for Airtel succeeds in staging.
