# 07 — Payments

## The operating model

The platform does **not** collect money on behalf of bakeries in v1. Each bakery operates its own merchant accounts with MTN MoMo and/or Airtel Money, and the platform calls those APIs on the bakery's behalf using credentials the bakery provides during onboarding. Funds settle directly into the bakery's wallet.

This is a deliberate choice with legal, operational, and trust implications:

- **Legal.** Holding customer funds on behalf of third parties would make Eat Good Uganda a payment service provider, which requires Bank of Uganda authorisation under the National Payment Systems Act, 2020 and the Financial Institutions Act. MVP is explicitly out of scope for that.
- **Operational.** We do not want to run a reconciliation, payout, or dispute operation in MVP. Bakeries already have their own wallets; we use them.
- **Trust.** Customers paying see the money go to the bakery's registered merchant name, not to a platform account. Reduces confusion.

The tradeoff is that each bakery must separately register with MTN (for MoMo) and Airtel (for Airtel Money) to get their own API credentials. We document this on the bakery onboarding flow and provide step-by-step guidance.

## Payment methods supported in v1

| Method           | Implementation                                          | Status on launch |
| ---------------- | ------------------------------------------------------- | ---------------- |
| Cash on Delivery | Internal only — no external API                         | ✅ core flow     |
| Bank Transfer    | Internal flow with proof upload + bakery manual confirm | ✅ core flow     |
| MTN Mobile Money | Collections API (per-bakery credentials)                | ✅ core flow     |
| Airtel Money     | Collection API (per-bakery credentials)                 | ✅ core flow     |
| Card             | Out of scope for v1                                     | 🔴 v2+           |

Each bakery enables or disables methods independently. The customer sees at checkout only the methods their chosen bakery has enabled.

## Credential storage (per-bakery)

Credentials are stored encrypted in `bakery_payment_credentials`. Encryption is AES-256-GCM with:

- **Key:** `CREDENTIALS_ENCRYPTION_KEY` environment variable — 32 bytes, base64-encoded
- **Nonce:** 12 random bytes per record, stored alongside the ciphertext in `config_nonce`
- **AAD:** the string `eatgood:bakery:{bakery_id}:{provider}` — binds the ciphertext to its row
- **Plaintext:** JSON blob with provider-specific fields

Example plaintext for MoMo:

```json
{
  "subscription_key": "abc123...",
  "user_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "api_key": "yyy...",
  "target_environment": "production",
  "collection_primary_key": "pk_..."
}
```

Example plaintext for Airtel:

```json
{
  "client_id": "...",
  "client_secret": "...",
  "target_environment": "production"
}
```

Example plaintext for bank transfer:

```json
{
  "account_name": "Sweet Cravings Ltd",
  "account_number": "1234567890",
  "bank_name": "Stanbic Bank Uganda",
  "branch": "Kampala Road",
  "swift_code": "SBICUGKX"
}
```

Decryption happens in the API at the moment of making a provider call, and the plaintext is never logged, never stored in memory beyond the call, and never sent to the frontend.

If `CREDENTIALS_ENCRYPTION_KEY` is rotated, all credentials must be re-encrypted (migration script provided in `packages/db/scripts/rotate-credentials-key.ts`).

## MTN Mobile Money integration

### Endpoints (reference — confirm against current docs at `https://momodeveloper.mtn.com` before implementing)

- **Portal:** `https://momodeveloper.mtn.com/`
- **Sandbox base:** `https://sandbox.momodeveloper.mtn.com/`
- **Production base:** resolved from bakery's `target_environment` + subscription key — MTN provides the production endpoints after the merchant completes KYC with the bakery's MoMo relationship manager.

### Auth flow

1. **One-time setup (sandbox):** we create an API User on behalf of the bakery.
   ```
   POST {base}/v1_0/apiuser
   Headers: X-Reference-Id: <uuid>, Ocp-Apim-Subscription-Key: <subKey>
   Body: { "providerCallbackHost": "eatgood-api.onrender.com" }
   ```
2. **Generate API key:**
   ```
   POST {base}/v1_0/apiuser/{userId}/apikey
   Headers: Ocp-Apim-Subscription-Key: <subKey>
   Returns: { "apiKey": "..." }
   ```
3. **Production:** MTN provides `user_id` and `api_key` through the OVA merchant dashboard after KYC. Bakery pastes both into our onboarding form.

### Per-transaction: request to pay (Collections)

Runtime steps:

1. **Get a bearer token** (cached per-bakery for TTL reported by MTN, typically 1 hour):

   ```
   POST {base}/collection/token/
   Headers:
     Authorization: Basic base64(userId:apiKey)
     Ocp-Apim-Subscription-Key: <subKey>
   Returns: { access_token, expires_in, token_type: 'access_token' }
   ```

2. **Create a payment request** (asynchronous):

   ```
   POST {base}/collection/v1_0/requesttopay
   Headers:
     Authorization: Bearer <accessToken>
     X-Reference-Id: <uuid, our paymentReference>
     X-Target-Environment: sandbox | mtnuganda
     Ocp-Apim-Subscription-Key: <subKey>
     Content-Type: application/json
   Body:
     {
       "amount": "40000",
       "currency": "UGX",
       "externalId": "EGU-20260420-A7X3",
       "payer": {
         "partyIdType": "MSISDN",
         "partyId": "256780123456"
       },
       "payerMessage": "Sweet Cravings order",
       "payeeNote": "Order EGU-20260420-A7X3"
     }
   Response: 202 Accepted (empty body)
   ```

3. **Poll status** (we ALSO accept a webhook; polling is the reliable path because webhooks on free tiers sleep):
   ```
   GET {base}/collection/v1_0/requesttopay/{referenceId}
   Returns: { status: 'SUCCESSFUL' | 'FAILED' | 'PENDING', ... }
   ```

### Webhook

When MTN sends a callback, it hits `POST /v1/webhooks/mtn-momo`. We:

1. Look up the payment row by `provider_reference = X-Reference-Id`.
2. Verify the bakery_id matches the referenced payment.
3. Update status. Do not trust the webhook body alone — always follow up with a GET `/requesttopay/{referenceId}` to confirm.
4. Respond 200 within 3 seconds regardless.

## Airtel Money integration

### Endpoints (reference — confirm at `https://developers.airtel.africa` before implementing)

- **Portal:** `https://developers.airtel.africa`
- **Staging base:** `https://openapiuat.airtel.africa`
- **Production base:** `https://openapi.airtel.africa`

### Auth flow

1. Bakery registers on the Airtel Africa Developer Portal, creates an application, copies Client ID and Client Secret.
2. Bakery pastes these into our onboarding form.

### Per-transaction

1. **Get a bearer token** (cache per-bakery, TTL typically 2 hours):

   ```
   POST /auth/oauth2/token
   Body (form):
     client_id=<clientId>
     client_secret=<clientSecret>
     grant_type=client_credentials
   Returns: { access_token, expires_in }
   ```

2. **Create payment (USSD push to customer)**:

   ```
   POST /merchant/v1/payments/
   Headers:
     Authorization: Bearer <token>
     X-Country: UG
     X-Currency: UGX
     Content-Type: application/json
   Body:
     {
       "reference": "EGU-20260420-A7X3",
       "subscriber": { "country": "UG", "currency": "UGX", "msisdn": "780123456" },
       "transaction": { "amount": 40000, "country": "UG", "currency": "UGX", "id": "<our-txn-id-uuid>" }
     }
   Response: 200, body with status 'TS' (success-pending) or similar code
   ```

3. **Transaction enquiry**:
   ```
   GET /standard/v1/payments/{transactionId}
   Headers: Authorization: Bearer <token>, X-Country: UG, X-Currency: UGX
   ```

### Webhook

`POST /v1/webhooks/airtel-money`. Same defensive pattern: verify, re-check via enquiry API, respond 200.

## Bank transfer flow

Customer sees bakery's bank details at checkout. Customer initiates transfer externally, then uploads proof image. Bakery admin sees pending transfers with attached proofs and manually marks them paid.

```
1. POST /v1/customer/orders/{id}/pay  { method: 'bank_transfer' }
   → Creates payment row, status='awaiting_proof'
   → Returns bakery's bank details (decrypted, one-shot)

2. POST /v1/customer/orders/{id}/payment/bank-proof  multipart/form-data
   → Uploads proof to Cloudinary, stores URL on payment row
   → Status → 'awaiting_confirmation'
   → Emails bakery

3. Bakery admin reviews, clicks Mark Paid:
   POST /v1/bakery/orders/{id}/payment/confirm-bank
   → Status → 'paid'
   → Order status → 'confirmed'
   → Emails customer
```

## Cash on delivery flow

Simplest flow. Customer selects COD at checkout; the order is placed immediately with payment status `pending_cod`. Nothing to verify. The order moves through the status machine normally. When the bakery marks the order `delivered`, the payment flips to `paid` automatically. This mirrors HAIQ's auto-paid-on-delivery pattern.

## State machine (payment.status)

```
initiated
   │
   ├──► pending             (MoMo/Airtel: awaiting customer PIN entry)
   │       │
   │       ├──► paid
   │       └──► failed
   │
   ├──► awaiting_proof      (bank transfer: customer needs to upload proof)
   │       │
   │       └──► awaiting_confirmation  (proof uploaded, bakery to verify)
   │              │
   │              ├──► paid
   │              └──► failed
   │
   ├──► pending_cod         (COD: waiting for order to be delivered)
   │       │
   │       └──► paid         (triggered by order status → delivered)
   │
   ├──► cancelled
   └──► refunded            (manual, super-admin or bakery-initiated)
```

## Idempotency

Every payment initiation carries an `Idempotency-Key` header. If the same key arrives twice (client retry), the API returns the original response without creating a duplicate payment row. Key is stored in `payments.external_reference` and used as a unique constraint alongside `bakery_id`.

## Reconciliation

A scheduled job (node-cron, every 15 minutes) looks for payments stuck in `pending` for more than 30 minutes. For each, it calls the provider's status endpoint and reconciles. If the provider also reports `pending`, we wait another hour then mark `failed` with a reason. This defends against missed webhooks.

Bakery admins have a "Stuck payments" panel showing any payment in `pending` for more than 5 minutes, so they can help customers troubleshoot in real time.

## What the customer sees

Checkout shows only the methods the current bakery has enabled. If a bakery has only COD enabled (e.g. during soft launch before they register with MTN/Airtel), the customer sees only COD. We never ghost-display a payment method the bakery cannot actually fulfil.

## What we never do

- Store plaintext credentials.
- Log payment request/response bodies (only status codes and summary metadata).
- Return a bakery's credentials to the frontend.
- Trust the amount field in a webhook — we always re-query.
- Let a customer pay an amount different from the order total (validated server-side).
- Allow a `paid` payment to transition to anything except `refunded`.

## Compliance notes

- PCI-DSS does not apply until we process cards. It will apply in v2.
- Data Protection and Privacy Act, 2019 (Uganda) applies: customer phone numbers used in payments are personal data, stored encrypted at rest via Postgres TDE (Neon-managed) and accessed via TLS.
- Anti-money laundering: transactions above threshold are flagged in the audit log; we rely on the telco providers' own AML for KYC on the payer.

## References

- MTN MoMo developer portal: `https://momodeveloper.mtn.com/`
- MTN MoMo API documentation: `https://momodeveloper.mtn.com/api-documentation`
- Airtel Africa developer portal: `https://developers.airtel.africa`
- National Payment Systems Act, 2020 (Uganda)
- Data Protection and Privacy Act, 2019 (Uganda)

**Implementation note:** API endpoints and request formats above are documented as of the last review of the provider portals. They change. Before starting the MoMo or Airtel prompt, the implementing developer (or AI) is required to re-verify endpoints and request shapes against the current provider documentation and note any deltas in `docs/17-DECISIONS_LOG.md`.
