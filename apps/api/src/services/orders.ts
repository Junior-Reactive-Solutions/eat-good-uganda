import crypto from 'crypto'

/**
 * Generate order number in format: EGU-YYYYMMDD-XXXX
 * Example: EGU-20260507-A3F7
 */
export function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`

  // Generate 4-character random hex (0-15 for each, 4 chars = 16^4 possibilities)
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 4)

  return `EGU-${dateStr}-${randomHex}`
}

/**
 * Generate a secure claim token for guest checkout
 * Returns a 32-byte hex string
 */
export function generateClaimToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash a claim token for secure storage
 * Use SHA-256 to store hashed version in database
 */
export function hashClaimToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Verify a claim token against its stored hash
 */
export function verifyClaimToken(token: string, hash: string): boolean {
  return hashClaimToken(token) === hash
}

/**
 * Validate that all items belong to the same bakery
 * Used in order creation to ensure cart items are from single bakery
 *
 * @param items Array of {productId, variantId, quantity}
 * @param bakeryId The expected bakery ID
 * @param productMap Map of productId -> {bakeryId, ...}
 * @returns True if valid, throws if invalid
 */
export function validateItemsBelongToBakery(
  items: Array<{ productId: string; variantId?: string }>,
  bakeryId: string,
  productMap: Map<string, { bakeryId: string }>,
): boolean {
  for (const item of items) {
    const product = productMap.get(item.productId)
    if (!product) {
      throw new Error(`Product ${item.productId} not found`)
    }
    if (product.bakeryId !== bakeryId) {
      throw new Error(
        `Product ${item.productId} belongs to different bakery (${product.bakeryId} vs ${bakeryId})`,
      )
    }
  }
  return true
}

/**
 * Calculate delivery fee based on distance and bakery settings
 * This is a placeholder - actual implementation depends on bakery configuration
 */
export function calculateDeliveryFee(
  distanceKm: number,
  bakeryDeliveryFeeMinor: number, // Base fee in minor units
  _bakeryDeliveryRadius: number, // Max delivery radius in km
): { feeMinor: number; isWithinRadius: boolean } {
  // In a real implementation, this would have tiered pricing based on distance
  // For MVP, return fixed fee if within radius
  const isWithinRadius = distanceKm <= _bakeryDeliveryRadius
  return {
    feeMinor: isWithinRadius ? bakeryDeliveryFeeMinor : 0,
    isWithinRadius,
  }
}
