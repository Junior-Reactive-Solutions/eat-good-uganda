/**
 * Bank Transfer payment provider.
 *
 * Bank transfers are handled manually. The customer receives bank details
 * and a reference code. The order waits in `pending_payment` until the
 * bakery confirms receipt of the transfer.
 */

export interface BankTransferPaymentInput {
  orderId: string
  amountMinor: number
  currencyCode: string
}

export interface BankTransferPaymentResult {
  paymentId: string
  status: 'awaiting_proof'
  bankDetails: {
    accountName: string
    accountNumber: string
    bankName: string
    branchCode?: string
    swiftCode?: string
  }
  referenceCode: string
  instructions: string
}

/**
 * Initiate a bank transfer payment.
 *
 * The customer receives bank account details and a unique reference code.
 * They transfer the exact amount with this reference in the memo/description.
 * The bakery confirms the receipt manually or via automated reconciliation.
 */
export function initiateBankTransferPayment(
  input: BankTransferPaymentInput,
  paymentId: string,
): BankTransferPaymentResult {
  // Reference code: payment ID + order hash for easy matching
  const referenceCode = `EGU-${paymentId.slice(0, 8).toUpperCase()}`

  // In production, these would come from bakery-specific bank details
  // For MVP, we use platform-level account
  const bankDetails = {
    accountName: 'Eat Good Uganda Ltd',
    accountNumber: '1234567890', // Placeholder
    bankName: 'Stanbic Bank Uganda',
    branchCode: 'KAMPALA',
    swiftCode: 'SBICUGKA',
  }

  const amountDisplay = (input.amountMinor / 100).toLocaleString('en-UG', {
    style: 'currency',
    currency: input.currencyCode,
  })

  const instructions =
    `Transfer ${amountDisplay} to the account below with reference: ${referenceCode}\n\n` +
    `Account Name: ${bankDetails.accountName}\n` +
    `Account Number: ${bankDetails.accountNumber}\n` +
    `Bank: ${bankDetails.bankName}\n` +
    `Branch: ${bankDetails.branchCode}\n\n` +
    `IMPORTANT: Include reference ${referenceCode} in the payment memo.\n` +
    `Your order will be confirmed once we receive the transfer.`

  return {
    paymentId,
    status: 'awaiting_proof',
    bankDetails,
    referenceCode,
    instructions,
  }
}

/**
 * Validate bank transfer availability.
 * Bank transfers are always available.
 */
export function validateBankTransferAvailable(): { available: true } {
  return { available: true }
}
