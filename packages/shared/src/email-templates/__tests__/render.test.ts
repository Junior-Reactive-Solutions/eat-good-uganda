import { describe, expect, it } from 'vitest'

import { renderEmail } from '../render'

describe('renderEmail', () => {
  it('substitutes all placeholders in subject, html, and text', () => {
    const result = renderEmail('customer-verify-email', {
      first_name: 'Alice',
      verification_link: 'https://example.com/verify/abc123',
    })

    expect(result.subject).toContain('Verify')
    expect(result.html).toContain('Alice')
    expect(result.html).toContain('https://example.com/verify/abc123')
    expect(result.text).toContain('Alice')
    expect(result.text).toContain('https://example.com/verify/abc123')
  })

  it('leaves no {{placeholder}} tokens in the output', () => {
    const result = renderEmail('customer-order-confirmed', {
      first_name: 'Bob',
      order_number: 'ORD-001',
      order_link: 'https://example.com/orders/1',
      bakery_name: 'Nice Bakes',
      eta: '30 minutes',
    })

    expect(result.subject).not.toMatch(/\{\{\w+\}\}/)
    expect(result.html).not.toMatch(/\{\{\w+\}\}/)
    expect(result.text).not.toMatch(/\{\{\w+\}\}/)
  })

  it('replaces missing optional placeholders with empty string', () => {
    const result = renderEmail('customer-order-status', {
      first_name: 'Carol',
      order_number: 'ORD-002',
      order_link: 'https://example.com/orders/2',
      bakery_name: 'Good Bakes',
      status_label: 'Being prepared',
      // bakery_note intentionally omitted
    })

    // {{bakery_note}} should be replaced with '' (not left as a literal token)
    expect(result.html).not.toContain('{{bakery_note}}')
    expect(result.text).not.toContain('{{bakery_note}}')
  })

  it('correctly substitutes numeric values', () => {
    const result = renderEmail('customer-password-reset', {
      first_name: 'Dave',
      reset_link: 'https://example.com/reset/xyz',
      expires_minutes: 30,
    })

    expect(result.subject).toContain('Reset')
    expect(result.html).toContain('30')
    expect(result.text).toContain('30')
  })

  it('produces valid HTML with DOCTYPE', () => {
    const result = renderEmail('bakery-approved', {
      owner_name: 'Eve',
      bakery_name: 'Sweet Stuff',
      dashboard_link: 'https://example.com/dashboard',
    })

    expect(result.html).toMatch(/^<!DOCTYPE html>/i)
    expect(result.html).toContain('<html')
    expect(result.html).toContain('</html>')
  })

  it('renders admin-bakery-pending with all required fields', () => {
    const result = renderEmail('admin-bakery-pending', {
      bakery_name: 'Sunrise Bakery',
      owner_name: 'Frank',
      owner_email: 'frank@example.com',
      application_link: 'https://admin.example.com/bakeries/123',
    })

    expect(result.subject).toContain('Sunrise Bakery')
    expect(result.html).toContain('frank@example.com')
    expect(result.text).toContain('frank@example.com')
  })

  it('handles null and undefined values as empty string', () => {
    const result = renderEmail('customer-order-cancelled', {
      first_name: 'Grace',
      order_number: 'ORD-003',
      order_link: 'https://example.com/orders/3',
      bakery_name: 'Best Bakes',
      reason: null,
      refund_note: undefined,
    })

    expect(result.html).not.toContain('{{reason}}')
    expect(result.html).not.toContain('{{refund_note}}')
  })

  it('includes bakery name and order number in customer-order-delivered', () => {
    const result = renderEmail('customer-order-delivered', {
      first_name: 'Hana',
      order_number: 'ORD-099',
      order_link: 'https://example.com/orders/99',
      bakery_name: 'The Oven',
      total_formatted: 'UGX 45,000',
    })

    expect(result.subject).toContain('ORD-099')
    expect(result.html).toContain('The Oven')
    expect(result.html).toContain('UGX 45,000')
  })
})
