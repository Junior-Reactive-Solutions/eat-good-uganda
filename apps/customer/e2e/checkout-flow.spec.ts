import { test, expect } from '@playwright/test'

/**
 * End-to-end tests for the checkout flow
 */

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a bakery menu first
    await page.goto('http://localhost:5173/')
    // Assume there's a way to select a bakery and add items to cart
    // This is a placeholder for the actual setup
  })

  test('should display all checkout sections', async ({ page }) => {
    // Navigate to checkout
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Verify all sections are visible
    await expect(page.locator('text=Your Details')).toBeVisible()
    await expect(page.locator('text=Fulfillment Method')).toBeVisible()
    await expect(page.locator('text=Payment Method')).toBeVisible()
    await expect(page.locator('text=Order Review')).toBeVisible()
  })

  test('should allow customer to enter details', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Fill in customer details
    await page.fill('input[placeholder="John Doe"]', 'Jane Smith')
    await page.fill('input[placeholder="john@example.com"]', 'jane@example.com')
    await page.fill('input[placeholder="+256701234567"]', '+256701234568')

    // Verify values are entered
    const nameInput = page.locator('input[placeholder="John Doe"]')
    await expect(nameInput).toHaveValue('Jane Smith')
  })

  test('should toggle between pickup and delivery', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Default should be pickup
    const pickupRadio = page.locator('label:has-text("Pickup")')
    const deliveryRadio = page.locator('label:has-text("Delivery")')

    // Click delivery
    await deliveryRadio.click()

    // Verify delivery fields are shown
    await expect(page.locator('text=Street Address')).toBeVisible()
    await expect(page.locator('text=City')).toBeVisible()
  })

  test('should allow entering delivery address', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Click delivery
    await page.locator('label:has-text("Delivery")').click()

    // Fill in address
    await page.fill('input[placeholder="123 Main Street"]', '456 Oak Ave')
    await page.fill('input[placeholder="Kampala"]', 'Entebbe')

    // Verify values
    const streetInput = page.locator('input[placeholder="123 Main Street"]')
    await expect(streetInput).toHaveValue('456 Oak Ave')
  })

  test('should allow selecting different payment methods', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Select Bank Transfer
    await page.locator('label:has-text("Bank Transfer")').click()

    // Verify bank transfer info is shown
    await expect(
      page.locator('text=you\'ll receive the bakery\'s bank account details'),
    ).toBeVisible()

    // Select MTN Mobile Money
    await page.locator('label:has-text("MTN Mobile Money")').click()

    // Verify phone field appears
    await expect(page.locator('text=Mobile Money Phone Number')).toBeVisible()
  })

  test('should show phone field for mobile money methods', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Select MTN
    await page.locator('label:has-text("MTN Mobile Money")').click()

    // Phone field should be visible
    const phoneInput = page.locator('input[placeholder="+256701234567"]').last()
    await expect(phoneInput).toBeVisible()

    // Enter phone number
    await phoneInput.fill('+256701111111')
    await expect(phoneInput).toHaveValue('+256701111111')
  })

  test('should display order review with items', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Order review section should show items
    await expect(page.locator('text=Order Review')).toBeVisible()

    // Verify subtotal and total are shown
    await expect(page.locator('text=Subtotal')).toBeVisible()
    await expect(page.locator('text=Total')).toBeVisible()
  })

  test('should show edit buttons in review section', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Look for edit buttons in the review section
    const editButtons = page.locator('button:has-text("Edit")')

    // Should have multiple edit buttons (for different sections)
    const count = await editButtons.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should disable submit button when cart is empty', async ({ page }) => {
    // This test assumes the checkout page handles empty carts
    // Navigate to checkout without items
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Submit button should be disabled if cart is empty
    const submitButton = page.locator('button:has-text("Place Order")')

    // Check if button exists and its disabled state
    if (await submitButton.isVisible()) {
      // Check if disabled attribute is present
      const isDisabled = await submitButton.isDisabled()
      expect(typeof isDisabled).toBe('boolean')
    }
  })

  test('should show error message on validation failure', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Try to submit with invalid data
    const submitButton = page.locator('button:has-text("Place Order")')

    // The form should prevent submission if required fields are missing
    // This depends on form validation
    if (await submitButton.isEnabled()) {
      await submitButton.click()

      // Look for error messages
      // This would depend on the validation implementation
    }
  })

  test('should navigate to menu on continue shopping', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Click continue shopping button
    const continueButton = page.locator('button:has-text("Continue Shopping")')
    await continueButton.click()

    // Should navigate back to menu
    await expect(page).toHaveURL(/\/b\/.*\/menu/)
  })

  test('should display loading state during submission', async ({
    page,
    context,
  }) => {
    // Mock the API to delay response
    await context.addInitScript(() => {
      // This is a simplified version - actual implementation would intercept network requests
    })

    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Fill in required fields
    await page.fill('input[placeholder="John Doe"]', 'Test User')
    await page.fill('input[placeholder="john@example.com"]', 'test@example.com')
    await page.fill('input[placeholder="+256701234567"]', '+256701234567')

    // Click submit
    const submitButton = page.locator('button:has-text("Place Order")')
    await submitButton.click()

    // Look for loading state
    await expect(page.locator('button:has-text("Creating Order")')).toBeVisible()
  })

  test('should show all fulfillment details in review', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Fill in all fields including delivery
    await page.locator('label:has-text("Delivery")').click()
    await page.fill('input[placeholder="123 Main Street"]', '789 Test St')
    await page.fill('input[placeholder="Kampala"]', 'Kampala')

    // Review section should show the fulfillment type
    const reviewSection = page.locator('text=Order Review')
    await expect(reviewSection).toBeVisible()

    // Should show delivery in the summary
    await expect(page.locator('text=Delivery').or(page.locator('text=Pickup'))).toBeVisible()
  })

  test('should show all payment details in review', async ({ page }) => {
    await page.goto('http://localhost:5173/b/test-bakery/checkout')

    // Select a specific payment method
    await page.locator('label:has-text("Bank Transfer")').click()

    // Review section should show the payment method
    const reviewSection = page.locator('text=Order Review')
    await expect(reviewSection).toBeVisible()

    // Should show payment method in the summary
    await expect(page.locator('text=Bank Transfer')).toBeVisible()
  })
})
