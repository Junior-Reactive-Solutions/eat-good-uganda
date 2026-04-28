# 09 — Payment Integration Rules

See `docs/07-PAYMENTS.md` for the architecture. This file is the working checklist.

## The architectural non-negotiables

- **Credentials are per-bakery.** The platform never uses its own merchant account to collect on behalf of bakeries in v1.
- **Credentials are encrypted at rest** with AES-256-GCM, per-row nonce.
- **Credentials are never returned to the frontend.** The bakery admin UI displays obfuscated values only (`"ak***-***-89e"`).
- **Credentials are decrypted transiently** — in memory for the duration of a provider call, then discarded.

## Storing credentials (during bakery onboarding)

```ts
// apps/api/src/services/payment/credentials.ts
export async function saveBakeryPaymentCredentials(
  db: Database,
  bakeryId: string,
  provider: 'mtn_momo' | 'airtel_money' | 'bank_transfer',
  plaintext: object
) {
  const nonce = randomBytes(12)
  const aad = Buffer.from(`eatgood:bakery:${bakeryId}:${provider}`)
  const ciphertext = aesGcmEncrypt(
    Buffer.from(process.env.CREDENTIALS_ENCRYPTION_KEY!, 'base64'),
    nonce,
    Buffer.from(JSON.stringify(plaintext), 'utf8'),
    aad
  )
  await upsertBakeryPaymentCredential(db, {
    bakeryId, provider,
    encryptedConfig: ciphertext,
    configNonce: nonce,
  })
  // Do not log `plaintext` at any level. Do not include in the audit log payload.
  await auditLog.record({
    actor_type: 'bakery_user',
    bakery_id: bakeryId,
    action: 'payment_credentials.updated',
    target_type: 'bakery_payment_credential',
    payload: { provider, has_config: true },    // no values
  })
}
```

## Using credentials (on payment initiation)

```ts
async function callWithBakeryCredentials(
  db: Database,
  bakeryId: string,
  provider: 'mtn_momo' | 'airtel_money',
  fn: (creds: ProviderCreds) => Promise<T>
): Promise<T> {
  const creds = await loadAndDecryptCredentials(db, bakeryId, provider)
  try {
    return await fn(creds)
  } finally {
    // Help the GC; especially important for sensitive buffers.
    zeroObject(creds)
  }
}
```

The function returns the call result; the credentials are cleared. No caller holds a reference.

## Token caching

- Bearer tokens returned by MoMo and Airtel are cached per `(bakery_id, provider)` for `expires_in - 60 seconds`.
- Cached in an in-process LRU (no Redis at MVP). Invalidated on process restart.
- Never logged, never serialised to the audit log, never returned to the frontend.

## Webhooks

- Idempotent: looking up the payment row by `provider_reference` is the idempotency key.
- HMAC-verified where the provider supports it. Where the provider does not (MTN MoMo does not sign webhooks), we cross-verify by calling `GET /requesttopay/{referenceId}` before trusting any state transition.
- Respond 200 within 3 seconds regardless of internal processing result.

## Status transitions

The only legitimate transitions on `payments.status`:

```
initiated → pending → paid
initiated → pending → failed
initiated → awaiting_proof → awaiting_confirmation → paid
initiated → awaiting_proof → awaiting_confirmation → failed
initiated → pending_cod → paid    (when order status → delivered)
any → cancelled                   (via admin or customer cancellation of the order)
paid → refunded                   (manual, admin only)
```

Enforced in code via `assertValidTransition(from, to)`. Attempted illegal transitions throw and log an audit entry.

## Amount validation

At every stage:
- Client-submitted amounts are **re-derived** from the order total on the server. Never echoed back.
- Webhook-reported amounts are compared to the order total. Mismatch → `payment.status = failed` with reason `amount_mismatch`, and a high-severity audit log entry.

## Idempotency

- Every payment initiation accepts an `Idempotency-Key` header (UUID).
- Stored on the payment row.
- Repeated initiation with the same key returns the same response without side effects.
- Required on client for retries.

## Refunds

- Out of scope for MVP via code. Super-admins flip `payment.status = 'refunded'` manually after confirming the bakery has refunded the customer out-of-band.
- v2 will automate refunds via provider refund APIs (MoMo Disbursements, Airtel payouts).

## Bank transfer specifics

- Bakery bank details are decrypted and returned to the customer exactly once — at the moment of choosing bank transfer at checkout. Stored in browser session for the checkout session only.
- Proof upload uses a Cloudinary signed preset. Filename: `bank-proof/{order_id}/{timestamp}.{ext}`.
- Proof URL stored on `payments.bank_proof_url`.
- Bakery manually confirms via PATCH `/v1/bakery/orders/:id/payment/confirm-bank`.

## COD specifics

- Zero external calls.
- Order created with `payments.status = 'pending_cod'`.
- Bakery marks the order `delivered`; a DB trigger flips the payment to `paid` with `paid_at = now()`.

## Sandbox vs production

- Each bakery's `target_environment` is either `sandbox` or `production`, stored on `bakery_payment_credentials`.
- The API uses the appropriate base URL and `X-Target-Environment` header.
- During bakery onboarding, a test initiation against sandbox is required before flipping `is_enabled = true`.

## Logging rules

- Log only:
  - The event (`payment.initiated`, `payment.webhook_received`, `payment.status_changed`)
  - The `payment.id`, `order.id`, `bakery_id`
  - The status
  - A truncated provider reference (first 8 chars)
- Never log:
  - Full request bodies to/from providers
  - Customer phone numbers (except at debug level)
  - Credentials or tokens
  - The webhook payload (stored on the `payments.webhook_payload` column, not in logs)

## Error handling rules

- Provider returns 4xx: classify as `failed` with a specific reason code. Do not retry.
- Provider returns 5xx or times out: mark as `pending`, schedule reconciliation.
- Network error before any response: mark as `pending`, schedule reconciliation.
- Our reconciliation job is the single source of truth for resolving ambiguous outcomes.

## Testing payments

- All tests use provider sandboxes or mocked HTTP.
- Never hit production MoMo or Airtel in any automated test.
- Sandbox credentials are platform-level (in `.env`) for testing; per-bakery credential flows are tested with mocked providers.
- E2E payment test uses MoMo sandbox and Airtel staging, with test phone numbers provided in their docs.

## References

- `docs/07-PAYMENTS.md` — full architecture
- MTN MoMo developer portal: `https://momodeveloper.mtn.com/`
- Airtel Africa developer portal: `https://developers.airtel.africa`
