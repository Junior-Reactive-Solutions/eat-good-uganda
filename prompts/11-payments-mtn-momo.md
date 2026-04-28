# Prompt 11 — Payments: MTN MoMo

## Context

Checkout creates orders in `pending_payment` (prompt 08). Bakery admin has a Payments page with UI for MoMo credentials (prompt 09). Time to wire the real integration.

Read before starting, carefully:
- `docs/07-PAYMENTS.md`
- `instructions/09-payment-integration-rules.md`
- `instructions/04-security-rules.md`

**Before coding, re-verify the MoMo API endpoints and request shapes against `https://momodeveloper.mtn.com/api-documentation`. Note any deltas from `docs/07-PAYMENTS.md` in `docs/17-DECISIONS_LOG.md`.**

## Goal

Implement the full MTN Mobile Money Collections flow: credential encryption, provider-call abstraction, request-to-pay, status polling, webhook receipt, reconciliation job. Per-bakery credentials.

## Deliverables

### Credential encryption

`apps/api/src/lib/crypto.ts`:
- `aesGcmEncrypt(key, nonce, plaintext, aad) → ciphertext`
- `aesGcmDecrypt(key, nonce, ciphertext, aad) → plaintext`
- Reads `CREDENTIALS_ENCRYPTION_KEY` from env (base64, 32 bytes).
- Refuses to start if key is absent or malformed.

`apps/api/src/services/payment/credentials.ts`:
- `saveBakeryPaymentCredentials(db, bakery_id, provider, plaintext)` — encrypts + upserts.
- `loadBakeryCredentials(db, bakery_id, provider) → decrypted plaintext` — decrypts for one call. Caller is responsible for discarding.
- `listBakeryPaymentMethods(db, bakery_id) → summaries (NO plaintext, only obfuscated hints)`.

### Provider abstraction

`apps/api/src/services/payment/providers/momo.ts`:

```ts
interface MomoCreds {
  subscription_key: string
  user_id: string
  api_key: string
  target_environment: 'sandbox' | 'mtnuganda'
}

class MomoClient {
  constructor(creds: MomoCreds)
  async getToken(): Promise<{ access_token, expires_in }>
  async requestToPay(ref: string, input: { amount, currency, externalId, payerMsisdn, payerMessage, payeeNote }): Promise<void>
  async getRequestStatus(ref: string): Promise<{ status, financialTransactionId?, reason? }>
}
```

Token cached per-bakery in an in-process LRU, invalidated on `expires_in - 60` seconds.

### Payment service

`apps/api/src/services/payment/initiate.ts`:

```ts
async function initiateMomoPayment(db, order, bakery_id, payerMsisdn, idempotencyKey) {
  // 1. Idempotency check
  // 2. Load + decrypt bakery MoMo credentials
  // 3. Build MomoClient
  // 4. Insert payment row with status='initiated', method='mtn_momo', provider_reference=newUuid
  // 5. Call client.requestToPay(providerRef, ...)
  // 6. On 202: update payment status='pending', return { paymentId, pollUrl }
  // 7. On error: update payment status='failed' with reason, return { paymentId, error }
}
```

`apps/api/src/services/payment/status.ts`:
- `checkPaymentStatus(db, paymentId)` — idempotent status refresh. For MoMo/Airtel, calls the provider; updates the payment row; returns the current state.

### Route

- `POST /v1/customer/orders/:id/pay` — dispatches based on `body.method`. For MoMo: takes `{ method: 'mtn_momo', phone }`. Returns `{ payment_id, poll_url }`.
- `GET /v1/customer/orders/:id/payment-status` — polling endpoint used by the frontend.

### Webhook

- `POST /v1/webhooks/mtn-momo`:
  1. Parse body.
  2. Look up payment by `provider_reference` (from body or `X-Reference-Id`).
  3. Verify the bakery_id matches.
  4. Cross-verify by calling `client.getRequestStatus(ref)` (the webhook body alone is insufficient).
  5. Update payment.status and, if `paid`, order.status to `confirmed`.
  6. Record webhook delivery in `webhook_deliveries` for forensics.
  7. Respond 200 within 3 seconds regardless.

### Reconciliation job

`apps/api/src/jobs/reconcilePendingPayments.ts`:
- Runs every 15 minutes via node-cron.
- Finds `payments.status='pending'` older than 30 minutes and method in (mtn_momo, airtel_money).
- For each: calls provider status. Resolves to `paid` or `failed` or leaves `pending` one more cycle.
- After 2 hours still pending: marks `failed` with `reason='provider_timeout'`.

### Bakery admin — Test Payment button

The "Test" button on the Payments page:
- `POST /v1/bakery/payment-methods/mtn-momo/test`:
  - Requires `is_enabled=true` and credentials set.
  - Initiates a UGX 100 sandbox request-to-pay to a known test MSISDN (`256780000000` for MoMo sandbox).
  - Polls status for 30 seconds.
  - Updates `last_verified_at` on success.

### Customer frontend — pay page

`/b/:slug/checkout/pay/:orderId`:
- Reads order.
- Shows the selected payment method.
- For MoMo: shows "Sending request to +256..." then polls `/payment-status` every 3 seconds.
- On success: redirect to `/account/orders/:id` with success banner.
- On failure: inline error + "Try a different method" option.

### Tests

- Unit: encryption round-trips.
- Unit: MomoClient with mocked HTTP (nock) for token, requestToPay, getRequestStatus.
- Integration: `/orders/:id/pay` success flow with mocked provider.
- Integration: failure handling.
- Integration: idempotency (same key twice returns same response, one payment row).
- Integration: amount mismatch between webhook body and order total → failed + audit.
- Cross-tenant: a bakery A session cannot initiate a payment on a bakery B order; a bakery A webhook receipt for a bakery B reference is rejected.
- E2E: customer places COD? No, MoMo: end-to-end using MoMo sandbox credentials in the `.env`.

## Constraints

- Never log credential plaintext, token, or full request/response bodies.
- Every external HTTP call has timeout (10 seconds) and one retry with exponential backoff.
- Provider reference (X-Reference-Id) is a fresh UUID per initiation; never reused.
- The payment row is inserted BEFORE calling the provider. If the provider call fails, we have a failed payment row for audit.

## Acceptance checklist

- [ ] End-to-end MoMo flow works against sandbox.
- [ ] Webhook cross-verifies with getRequestStatus.
- [ ] Reconciliation job resolves stuck payments.
- [ ] Encryption/decryption round-trips; plaintext never logged.
- [ ] Bakery admin Test button succeeds against sandbox.
- [ ] All tests pass.
