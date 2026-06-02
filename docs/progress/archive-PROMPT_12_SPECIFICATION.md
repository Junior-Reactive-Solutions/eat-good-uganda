# Prompt 12: Payment Integration — MTN Mobile Money (MoMo)

**Project Context:** Eat Good Uganda Super Admin Portal  
**Status:** Ready for Implementation  
**Priority:** CRITICAL (blocking end-to-end customer transactions)  
**Estimated Effort:** 8-12 hours (subagent-driven with reviews)  

---

## Executive Summary

This prompt implements the complete MTN Mobile Money Collections flow for the Eat Good Uganda platform. Customers can pay for orders using MoMo, credentials are stored encrypted per-bakery, payments are initiated and polled for status, webhooks handle provider callbacks, and a reconciliation job handles timeouts.

**Background:** The original Prompt 11 was planned for MoMo payments but was repurposed to implement the Super Admin Dashboard (Phases 1-5). This prompt restores the critical payment functionality that was deferred.

---

## Current State

### What Exists ✅
- `packages/db/migrations/0009_payments.sql` — `payments` table schema
- `packages/db/migrations/0010_payment_credentials.sql` — `bakery_payment_credentials` table
- `packages/db/src/queries/payments.ts` — Database query functions for payments CRUD
- `apps/api/src/routes/bakery/payment-credentials.ts` — Credential management API
- `docs/07-PAYMENTS.md` — Complete payment architecture documentation
- `instructions/09-payment-integration-rules.md` — Security & integration rules

### What's Missing ❌
- MoMo provider client implementation
- Credential encryption/decryption service
- Payment initiation endpoint (`POST /v1/customer/orders/:id/pay`)
- Payment status polling endpoint (`GET /v1/customer/orders/:id/payment-status`)
- MoMo webhook receiver (`POST /v1/webhooks/mtn-momo`)
- Reconciliation job for pending payments
- Bakery admin test payment button
- Customer checkout MoMo payment UI integration

---

## Requirements & Constraints

### Read Before Starting
1. `docs/07-PAYMENTS.md` — Complete payment architecture
2. `instructions/09-payment-integration-rules.md` — Security & validation rules
3. `instructions/04-security-rules.md` — Credential handling & encryption
4. Current MoMo API docs at `https://momodeveloper.mtn.com/api-documentation`

### Key Constraints
- **Per-bakery credentials:** Each bakery manages their own MoMo merchant account
- **Encryption:** All credentials encrypted with AES-256-GCM using `CREDENTIALS_ENCRYPTION_KEY`
- **No plaintext logging:** Credentials never logged, stored in memory only during API calls
- **Idempotency:** All payment operations must be idempotent
- **Multi-tenant:** All queries must include `bakery_id` filter
- **Error handling:** Comprehensive error messages without exposing credentials
- **Webhook security:** Cross-verify webhook data with provider API before updating state

---

## Deliverables

### 1. Credential Encryption Service

**File:** `apps/api/src/lib/crypto.ts`

Implement AES-256-GCM encryption:

```typescript
export interface EncryptionResult {
  ciphertext: string // base64
  nonce: string // base64
}

export interface DecryptionInput {
  ciphertext: string // base64
  nonce: string // base64
  aad: string // associated authenticated data
}

export async function aesGcmEncrypt(
  plaintext: string,
  aad: string,
): Promise<EncryptionResult>
// - Generate 12-byte random nonce
// - Use CREDENTIALS_ENCRYPTION_KEY from env
// - Return base64-encoded ciphertext and nonce

export async function aesGcmDecrypt(
  ciphertext: string,
  nonce: string,
  aad: string,
): Promise<string>
// - Decode base64 inputs
// - Decrypt using CREDENTIALS_ENCRYPTION_KEY
// - Verify authentication tag
// - Throw on verification failure

export function validateEncryptionKey(): void
// - Verify CREDENTIALS_ENCRYPTION_KEY is set
// - Verify it's 32 bytes (256 bits) when base64-decoded
// - Throw if missing or invalid
// - Call on app startup
```

**Tests:**
- Encrypt/decrypt roundtrip (plaintext matches after decrypt)
- AAD validation (wrong AAD fails decryption)
- Missing key throws
- Invalid base64 throws
- Wrong key fails decryption

---

### 2. Payment Credentials Service

**File:** `apps/api/src/services/payment/credentials.ts`

```typescript
export interface BakeryMomoCredentials {
  subscription_key: string
  user_id: string
  api_key: string
  target_environment: 'sandbox' | 'production'
  collection_primary_key?: string
}

export async function saveBakeryMomoCredentials(
  db: Database,
  bakeryId: string,
  credentials: BakeryMomoCredentials,
): Promise<void>
// - Serialize credentials to JSON
// - Encrypt using aesGcmEncrypt()
// - AAD = `eatgood:bakery:${bakeryId}:mtn_momo`
// - Upsert into bakery_payment_credentials table
// - On error: return user-friendly message (no credential details)

export async function loadBakeryMomoCredentials(
  db: Database,
  bakeryId: string,
): Promise<BakeryMomoCredentials | null>
// - Query bakery_payment_credentials for mtn_momo method
// - If not found: return null
// - If found: decrypt using stored nonce
// - AAD = `eatgood:bakery:${bakeryId}:mtn_momo`
// - Parse JSON and validate shape
// - Return plaintext credentials
// - Caller responsible for discarding plaintext after use

export interface PaymentMethodSummary {
  method: 'mtn_momo' | 'airtel_money' | 'bank_transfer'
  is_enabled: boolean
  target_environment: 'sandbox' | 'production'
  hint?: string // e.g., last 4 digits of user_id (obfuscated, no plaintext)
}

export async function listBakeryPaymentMethods(
  db: Database,
  bakeryId: string,
): Promise<PaymentMethodSummary[]>
// - Query bakery_payment_credentials
// - Return summaries WITHOUT plaintext
// - For MoMo: include target_environment and obfuscated user_id hint
```

**Tests:**
- Save and load credentials (roundtrip)
- Decrypt with wrong AAD fails
- Load non-existent credentials returns null
- List methods shows enabled/disabled status
- No plaintext in responses
- Encryption key validation

---

### 3. MoMo Client

**File:** `apps/api/src/services/payment/providers/momo.ts`

```typescript
interface MomoTokenResponse {
  access_token: string
  expires_in: number
}

interface MomoRequestToPayInput {
  amount: string // e.g., "10000"
  currency: 'UGX' // | other if added later
  externalId: string // order ID or payment ID
  payerMsisdn: string // e.g., "+256700000000"
  payerMessage: string
  payeeNote: string
}

interface MomoPaymentStatus {
  status: 'success' | 'failed' | 'pending'
  financialTransactionId?: string // settled ID
  reason?: string // failure reason
}

export class MomoClient {
  private creds: BakeryMomoCredentials
  private tokenCache: Map<string, { token: string; expiresAt: number }>

  constructor(creds: BakeryMomoCredentials) {
    this.creds = creds
    this.tokenCache = new Map()
  }

  async getToken(): Promise<string>
  // - Check token cache for this bakery
  // - If cached and not expiring in <60s: return cached token
  // - POST to MoMo token endpoint using subscription_key + api_key
  // - Cache token with expiry
  // - On error: throw MomoTokenError with non-credential message

  async requestToPay(
    providerReference: string,
    input: MomoRequestToPayInput,
  ): Promise<void>
  // - Get token via getToken()
  // - POST to /collection/v1_0/requesttopay
  // - Headers: X-Reference-Id: providerReference
  // - Body: amount, currency, externalId, payer, payee info
  // - Expect 202 Accepted
  // - On error: throw MomoPaymentError
  // - On success: no return (caller updates DB)

  async getRequestStatus(
    providerReference: string,
  ): Promise<MomoPaymentStatus>
  // - Get token via getToken()
  // - GET /collection/v1_0/requesttopay/{referenceId}
  // - Parse response: look for transaction state
  // - Map MoMo response to our { status, financialTransactionId?, reason? }
  // - Return status
  // - On error: throw MomoStatusError

  private getBaseUrl(): string
  // - If target_environment === 'sandbox': return sandbox URL
  // - If target_environment === 'production': return production URL
  // - Throw if unknown
}

// Custom error classes for type-safe error handling
export class MomoTokenError extends Error {}
export class MomoPaymentError extends Error {}
export class MomoStatusError extends Error {}
```

**Tests:**
- Token caching works (doesn't re-request within expiry)
- Token refresh on near-expiry
- requestToPay with valid credentials succeeds
- getRequestStatus returns correct status
- Invalid credentials fail with non-credential error message
- Network errors handled gracefully

---

### 4. Payment Initiation Service

**File:** `apps/api/src/services/payment/initiate.ts`

```typescript
export interface InitiateMomoPaymentInput {
  orderId: string
  bakeryId: string
  amountMinor: number
  currencyCode: string
  payerPhone: string // validated phone number
  idempotencyKey?: string // optional, for retry safety
}

export interface InitiateMomoPaymentResult {
  paymentId: string
  status: 'pending' | 'failed'
  pollUrl?: string
  error?: string
}

export async function initiateMomoPayment(
  db: Database,
  input: InitiateMomoPaymentInput,
): Promise<InitiateMomoPaymentResult>
// 1. Idempotency check: if idempotencyKey exists, check for duplicate payment
// 2. Load bakery and verify it exists
// 3. Load encrypted MoMo credentials for bakery
// 4. If credentials not configured: return { status: 'failed', error: 'MoMo not configured' }
// 5. Create MomoClient with decrypted credentials
// 6. Generate unique providerReference (UUID)
// 7. Insert payment row:
//    - status: 'initiated'
//    - method: 'mtn_momo'
//    - provider_reference: providerReference
//    - amount_minor, currency_code, payer_phone from input
// 8. Call client.requestToPay(providerReference, { amount, ... })
// 9. On 202 success:
//    - Update payment.status = 'pending'
//    - Return { paymentId, status: 'pending', pollUrl: `/v1/customer/orders/${orderId}/payment-status` }
// 10. On error:
//    - Update payment.status = 'failed', failure_reason = error.message
//    - Return { paymentId, status: 'failed', error: user-friendly message }
// 11. Ensure credentials plaintext is never logged
```

**Tests:**
- Payment initiated successfully (DB row created, status pending)
- Payment fails gracefully with user-friendly error
- Credentials not configured returns appropriate error
- Idempotency works (same idempotencyKey returns same paymentId)
- Invalid phone number format rejected
- Amount validation

---

### 5. Payment Status Service

**File:** `apps/api/src/services/payment/status.ts`

```typescript
export type PaymentStatusResult =
  | { status: 'pending' }
  | { status: 'paid'; financialTransactionId: string }
  | { status: 'failed'; reason: string }

export async function checkPaymentStatus(
  db: Database,
  bakeryId: string,
  paymentId: string,
): Promise<PaymentStatusResult>
// 1. Load payment from DB
// 2. If payment not found or bakery_id mismatch: throw 404
// 3. If payment.status !== 'pending': return cached status
// 4. Load MoMo credentials
// 5. Create MomoClient
// 6. Call client.getRequestStatus(payment.provider_reference)
// 7. Map MoMo status to our status
// 8. If status changed (pending→paid or pending→failed):
//    - Update payment.status in DB
//    - Set paid_at or failed_at timestamp
//    - If paid: also update order.status = 'confirmed'
// 9. Return current status
// 10. Ensure credentials never logged
```

**Tests:**
- Pending payment checked against provider
- Paid payment updates order status
- Failed payment sets failure_reason
- Already-resolved payment doesn't re-query provider
- Bakery isolation (can't check another bakery's payment)

---

### 6. Payment Endpoints

**File:** `apps/api/src/routes/customer/payments.ts` (NEW)

```typescript
// POST /v1/customer/orders/:orderId/pay
// Body: { method: 'mtn_momo', phone: '+256700000000', idempotencyKey?: string }
// Returns: { paymentId, status, pollUrl, error? }

// 1. Authenticate customer token
// 2. Load order by orderId
// 3. Verify customer owns order (bakery_id match)
// 4. Verify order status is 'pending' (can't pay settled orders)
// 5. Validate method === 'mtn_momo' (other methods added in future prompts)
// 6. Validate and normalize phone number
// 7. Call initiateMomoPayment()
// 8. Return result with appropriate status code (200 pending, 400 error)

// GET /v1/customer/orders/:orderId/payment-status
// Returns: { status: 'pending' | 'paid' | 'failed', reason?: string }

// 1. Authenticate customer token
// 2. Load order
// 3. Verify customer owns order
// 4. Load payment by order_id
// 5. If no payment: return 404
// 6. Call checkPaymentStatus()
// 7. Return status
```

**Validation (Zod schemas):**
```typescript
const InitiateMomoPaymentSchema = z.object({
  method: z.literal('mtn_momo'),
  phone: z.string().regex(/^\+256\d{9}$/, 'Invalid Uganda phone number'),
  idempotencyKey: z.string().uuid().optional(),
})
```

**Tests:**
- Initiate payment with valid phone succeeds
- Invalid phone rejected with 400
- Order not found returns 404
- Order already paid returns 400
- Concurrent payments with same idempotencyKey return same payment

---

### 7. Webhook Receiver

**File:** `apps/api/src/routes/webhooks/mtn-momo.ts` (NEW)

```typescript
// POST /v1/webhooks/mtn-momo
// MoMo sends callback when payment succeeds/fails

// 1. Extract referenceId from:
//    - Header: X-Reference-Id (preferred)
//    - Or body.referenceId (fallback)
// 2. If referenceId missing: log and respond 200 (MoMo retries)
// 3. Load payment by provider_reference = referenceId
// 4. If not found: log (bad reference) and respond 200
// 5. Extract bakery_id from payment
// 6. Load MoMo credentials for bakery
// 7. Create MomoClient
// 8. Cross-verify: call getRequestStatus(referenceId)
//    - Webhook body alone is insufficient; must verify with provider
// 9. Update payment.status based on provider response:
//    - If 'success': status='paid', paid_at=now, financialTransactionId from provider
//    - If 'failed': status='failed', failed_at=now, failure_reason from provider
// 10. If status='paid':
//     - Load order
//     - Update order.status = 'confirmed'
// 11. Record webhook delivery:
//     - Insert into webhook_deliveries table:
//       - provider: 'mtn_momo'
//       - payment_id
//       - webhook_payload: full MoMo body (for forensics)
//       - received_at: now
//       - processed_at: now
// 12. Return 200 within 3 seconds (must not timeout)

// Error handling:
// - All errors (DB, network, etc.) must return 200 to MoMo
// - Log errors for ops investigation
// - Never expose credential or internal errors to webhook caller
```

**Webhook table:** (if not exists)
```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50),
  payment_id UUID NOT NULL REFERENCES payments(id),
  webhook_payload JSONB,
  received_at TIMESTAMP DEFAULT now(),
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

**Tests:**
- Valid webhook updates payment status
- Invalid referenceId returns 200 silently
- Cross-verification prevents replay attacks
- Concurrent webhooks handled correctly
- Response time < 3 seconds

---

### 8. Reconciliation Job

**File:** `apps/api/src/jobs/reconcilePendingPayments.ts`

```typescript
export async function reconcilePendingPayments(db: Database): Promise<void>
// Runs every 15 minutes via node-cron
// Purpose: Check payment status for any stuck pending payments

// 1. Find all payments where:
//    - status = 'pending'
//    - method = 'mtn_momo'
//    - initiated_at < now - 30 minutes
// 2. For each payment:
//    - Try to get current status from MoMo via checkPaymentStatus()
//    - If resolved (paid/failed): update DB (already done by webhook, but be safe)
//    - If still pending: leave for next cycle
// 3. Find all payments where:
//    - status = 'pending'
//    - method = 'mtn_momo'
//    - initiated_at < now - 2 hours (30+ cycles = 7.5 hours)
// 4. For each of these:
//    - Update status = 'failed'
//    - Set failure_reason = 'reconciliation_timeout'
//    - Update failed_at = now
//    - (Assume MoMo will never respond after 2 hours)
// 5. Log summary: X resolved, Y still pending, Z failed due to timeout

// Startup:
// - In app.ts startup, register this job with node-cron
// - Schedule: every 15 minutes
// - Handle errors gracefully (log, don't crash)
```

**Tests:**
- Pending payment resolved by provider is updated
- Old pending payment marked failed after timeout
- Concurrent job runs don't double-process
- Job completes in reasonable time (no N+1 queries)

**Cron registration (app.ts):**
```typescript
import cron from 'node-cron'

// On app startup:
cron.schedule('*/15 * * * *', async () => {
  try {
    await reconcilePendingPayments(db)
  } catch (error) {
    logger.error('Reconciliation job failed', error)
  }
})
```

---

### 9. Bakery Admin — Test Payment Button

**File:** `apps/bakery-admin/src/pages/PaymentSetupPage.tsx` (UPDATE)

Update the existing PaymentSetupPage to add a "Test Payment" button when MoMo is configured:

```typescript
interface TestPaymentInput {
  method: 'mtn_momo'
  amount_minor: number // e.g., 1000 UGX = 10 cents
}

// Button behavior:
// 1. Show only if MoMo method is enabled
// 2. On click:
//    - Create test order (status='pending_payment', amount=1000 minor)
//    - Call POST /v1/customer/orders/{testOrderId}/pay
//    - Show "Payment initiated - check your phone" message
//    - Redirect to payment status page with 30-second polling
// 3. On success: Show "Payment received! ✓" and update credentials UI
// 4. On failure: Show error message with troubleshooting steps
```

---

### 10. Customer Checkout Integration

**File:** `apps/customer/src/components/CheckoutPaymentMethod.tsx` (UPDATE)

Update checkout to support MoMo:

```typescript
// When user selects 'mtn_momo':
// 1. Show phone number input (+256...)
// 2. On submit:
//    - Call POST /v1/customer/orders/{orderId}/pay with { method, phone }
//    - Show "Payment initiated - check your phone for prompt"
//    - Poll GET /v1/customer/orders/{orderId}/payment-status every 2 seconds
// 3. On payment received:
//    - Show "Payment confirmed! Your order is confirmed."
//    - Redirect to order confirmation page
// 4. On timeout (>5 minutes):
//    - Show "Payment timeout - please try again or contact support"
// 5. On failure:
//    - Show "Payment failed - {reason}"
```

---

## Testing Strategy

### Unit Tests
- Encryption/decryption roundtrip
- Credential saving and loading
- MoMo client token caching
- Payment status mapping

### Integration Tests
- Full payment flow: initiate → webhook → order confirmed
- Idempotency: same request twice = same result
- Reconciliation: timeout → failed
- Error handling: missing credentials, invalid phone, provider errors

### Contract Tests
- MoMo API shape matches current docs
- Webhook shape matches MoMo current docs

### Manual Testing
- End-to-end: customer checks out → pays via MoMo → order confirmed
- Bakery admin: test payment button works
- Error scenarios: network failure, timeout, invalid phone

---

## Database Migrations

**Already exist:**
- `0009_payments.sql` — payments table
- `0010_payment_credentials.sql` — bakery_payment_credentials table

**New:**
- `0011_webhook_deliveries.sql` — webhook_deliveries table (optional, for forensics)

---

## Environment Variables

**Required:**
```env
CREDENTIALS_ENCRYPTION_KEY=<base64-encoded 32-byte key>
```

**Optional (defaults to sandbox):**
```env
PAYMENT_RECONCILIATION_INTERVAL=900000 # 15 minutes in ms
PAYMENT_TIMEOUT_THRESHOLD=7200000 # 2 hours in ms
```

---

## Error Handling Strategy

### To Customer
- "Payment initiated - check your phone"
- "Payment failed - please try again"
- "MoMo not available for this bakery"
- "Invalid phone number"

### To Logs (never to customer)
- Full MoMo API errors with response bodies
- Credential-related errors (never plaintext, just "decryption failed")
- Network/timeout details

### Idempotency Keys
- Customer retries with same idempotencyKey → same payment
- Prevents duplicate charges

---

## Success Criteria

- [ ] All code committed with tests passing
- [ ] Customer can complete MoMo payment end-to-end
- [ ] Webhook updates payment status correctly
- [ ] Reconciliation job handles timeout payments
- [ ] Bakery admin can test MoMo configuration
- [ ] No credentials logged anywhere
- [ ] All validation per `instructions/09-payment-integration-rules.md`
- [ ] TypeScript strict mode: PASSING
- [ ] ESLint: 0 errors
- [ ] 50+ tests: PASSING

---

## Implementation Notes

### Architectural Decisions
1. **Token caching:** Reduces MoMo API calls, improves latency
2. **Webhook + polling:** Hybrid approach handles unreliable webhooks
3. **Reconciliation job:** Catch any stuck payments before customer escalates
4. **Per-bakery credentials:** Each bakery responsible for their own MoMo merchant account
5. **Credential encryption:** AES-256-GCM ensures credentials can't be accessed even if DB is compromised

### Security Considerations
1. **Encryption key rotation:** Script provided in `packages/db/scripts/rotate-credentials-key.ts`
2. **Webhook verification:** Cross-verify with provider before trusting webhook
3. **No plaintext storage:** Credentials always encrypted at rest
4. **Multi-tenant isolation:** All queries include bakery_id filter
5. **Idempotency:** Prevents accidental double-charging

---

## Related Documentation
- `docs/07-PAYMENTS.md` — Payment architecture (read first!)
- `instructions/09-payment-integration-rules.md` — Validation & security
- `instructions/04-security-rules.md` — Credential handling
- `prompts/12-payments-airtel-money.md` — Next payment method (after this)

---

## Execution Plan

**Recommended:** Use `superpowers:subagent-driven-development` with task breakdown:

1. **Crypto service** — Encryption/decryption (2 hours)
2. **Credentials service** — Load/save encrypted creds (1.5 hours)
3. **MoMo client** — Provider API abstraction (2 hours)
4. **Payment initiation** — Create payments, call provider (1.5 hours)
5. **Status checking** — Poll provider, update order (1 hour)
6. **Endpoints** — API routes for pay & status (1 hour)
7. **Webhook receiver** — Process provider callbacks (1.5 hours)
8. **Reconciliation job** — Handle stuck payments (1 hour)
9. **Bakery admin UI** — Test payment button (1 hour)
10. **Customer checkout** — MoMo payment integration (1 hour)
11. **Integration tests** — Full flow testing (1.5 hours)
12. **Final review & fixes** — Bug fixes, final polish (1 hour)

**Total:** 8-12 hours subagent execution + 2-3 hours review = 10-15 hours wall time

---

**Status:** READY FOR IMPLEMENTATION ✅

All prerequisites complete. No blocking issues. Ready to begin with subagent-driven development.
