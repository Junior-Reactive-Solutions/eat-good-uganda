# Prompt 13 — Payments: Bank Transfer and COD

## Context

MoMo and Airtel live (prompts 11–12). Two payment methods remain: Bank Transfer (with proof upload and manual bakery confirmation) and Cash on Delivery.

Read before starting:
- `docs/07-PAYMENTS.md` (bank-transfer flow, COD flow)
- `instructions/09-payment-integration-rules.md`

## Goal

Complete the set of supported payment methods.

## Deliverables

### Bank transfer

Backend:

- `POST /v1/customer/orders/:id/pay` with `{ method: 'bank_transfer' }`:
  - Creates a payment row with status `awaiting_proof`.
  - Decrypts the bakery's bank details and returns them in the response (one-shot — never cached client-side).
- `POST /v1/customer/orders/:id/payment/bank-proof`:
  - Cloudinary signed upload URL scoped to `bank-proofs/{order_id}/...`.
  - Client uploads; then:
- `POST /v1/customer/orders/:id/payment/bank-proof/confirm` with `{ url }`:
  - Validates URL matches the Cloudinary pattern.
  - Stores on `payments.bank_proof_url`.
  - Transitions status to `awaiting_confirmation`.
  - Emails bakery ("New bank transfer proof uploaded").
- `POST /v1/bakery/orders/:id/payment/confirm-bank`:
  - Bakery-only.
  - Transitions status `awaiting_confirmation` → `paid`.
  - Order status → `confirmed`.
  - Sends confirmation email to customer.
- `POST /v1/bakery/orders/:id/payment/reject-bank` with `{ reason }`:
  - Status → `failed`; reason stored.
  - Email customer with reason.

Customer frontend:

- Pay page for bank: shows bank details (account name, number, bank, branch, SWIFT). "I've made the transfer" button opens a file upload.
- Upload progress bar; on success, status page showing "Waiting for bakery to confirm".
- Customer can replace the proof (re-upload) until status is `paid` or `failed`.

Bakery admin:

- Order detail page shows proof image with "Confirm receipt" / "Reject" actions.

### Cash on Delivery

Backend:

- `POST /v1/customer/orders/:id/pay` with `{ method: 'cash_on_delivery' }`:
  - Creates a payment row with status `pending_cod`.
  - Order status remains `pending_payment` briefly, then auto-transitions to `confirmed` because for COD the "payment" happens later.
  - Actually: on COD initiation, mark order `confirmed` immediately so the bakery can start preparing. Payment is `pending_cod` until delivery.
- When bakery admin marks the order `delivered`, a DB trigger (or application-level service) flips the payment to `paid` with `paid_at = now()`. This mirrors HAIQ's auto-paid-on-delivery behaviour.

Customer frontend:

- Pay page for COD: simple confirmation "Your order is confirmed. Pay the bakery in cash when it arrives." → redirect to order detail.

Bakery admin:

- No special action needed. When the bakery marks `delivered`, COD auto-marks `paid`.

### Tests

- Integration: bank flow end-to-end.
- Integration: invalid Cloudinary URL rejected.
- Integration: bakery confirms → order confirmed → customer email.
- Integration: bakery rejects → order stays `pending_payment`; customer can retry.
- Integration: COD flow end-to-end.
- Integration: COD auto-pay-on-delivery trigger fires correctly.
- Cross-tenant: customer cannot upload a proof to another customer's order.

## Constraints

- Bank details returned to customer are the decrypted plaintext — used once at checkout. Not cached in TanStack Query with long staleness. Kept in sessionStorage for the duration of the checkout flow only.
- Proof image size limit 5 MB, JPEG/PNG/PDF.
- COD does not support scheduled payments (e.g. "pay by bank transfer later") — if the customer chooses COD, the order is confirmed immediately.

## Acceptance checklist

- [ ] Bank transfer E2E flow works: checkout → upload → bakery confirms → paid.
- [ ] COD flow works: checkout → order confirmed → bakery delivers → auto-paid.
- [ ] All four payment methods available and selectable at checkout.
- [ ] Customer sees a consistent pay experience regardless of method.
- [ ] Tenant isolation tests added for the new endpoints.
