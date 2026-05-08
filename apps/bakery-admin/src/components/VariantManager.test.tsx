import type { ProductVariant } from '@eatgood/shared'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { VariantManager } from './VariantManager'

// Sample variants for testing
const mockVariant1: ProductVariant = {
  id: 'var-1',
  product_id: 'prod-1',
  bakery_id: 'bakery-1',
  name: 'Small',
  price_minor: 1500000, // 15,000 UGX
  sku: 'SKU-001',
  sort_order: 1,
  is_available: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
}

const mockVariant2: ProductVariant = {
  id: 'var-2',
  product_id: 'prod-1',
  bakery_id: 'bakery-1',
  name: 'Medium',
  price_minor: 2000000, // 20,000 UGX
  sku: 'SKU-002',
  sort_order: 2,
  is_available: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
}

const mockVariant3: ProductVariant = {
  id: 'var-3',
  product_id: 'prod-1',
  bakery_id: 'bakery-1',
  name: 'Large',
  price_minor: 2500000, // 25,000 UGX
  sku: null, // No SKU
  sort_order: 3,
  is_available: false,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
}

const mockVariantOutOfOrder: ProductVariant = {
  id: 'var-4',
  product_id: 'prod-1',
  bakery_id: 'bakery-1',
  name: 'Extra Large',
  price_minor: 3000000, // 30,000 UGX
  sku: 'SKU-004',
  sort_order: 0, // Lower sort order
  is_available: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
}

describe('VariantManager', () => {
  it('renders variant table with headers', () => {
    render(<VariantManager variants={[mockVariant1]} />)

    const headers = screen.getAllByText('Name')
    expect(headers[0]).toBeInTheDocument()
    expect(screen.getByText('Price (UGX)')).toBeInTheDocument()
    expect(screen.getByText('SKU')).toBeInTheDocument()
    expect(screen.getByText('Sort Order')).toBeInTheDocument()
    const availableHeaders = screen.getAllByText('Available')
    // First "Available" is the header, second is the badge
    expect(availableHeaders.length).toBeGreaterThanOrEqual(1)
  })

  it('displays variants in sort_order ascending', () => {
    const variants = [mockVariant3, mockVariant1, mockVariantOutOfOrder, mockVariant2]
    render(<VariantManager variants={variants} />)

    const rows = screen.getAllByRole('row')
    // rows[0] is thead, rows[1] onwards are data rows
    expect(rows[1]).toHaveTextContent('Extra Large') // sort_order 0
    expect(rows[2]).toHaveTextContent('Small') // sort_order 1
    expect(rows[3]).toHaveTextContent('Medium') // sort_order 2
    expect(rows[4]).toHaveTextContent('Large') // sort_order 3
  })

  it('shows price formatted as UGX currency', () => {
    render(<VariantManager variants={[mockVariant1]} />)

    // 1500000 minor units = 15,000 UGX
    expect(screen.getByText(/15,000/)).toBeInTheDocument()
  })

  it('shows availability badge as green when available', () => {
    render(<VariantManager variants={[mockVariant1]} />)

    const availableBadges = screen.getAllByText('Available')
    // Get the badge (not the header)
    const availableBadge = availableBadges.find((el) => el.className.includes('bg-green-100'))
    expect(availableBadge).toBeInTheDocument()
    expect(availableBadge).toHaveClass('bg-green-100', 'text-green-700')
  })

  it('shows availability badge as gray when unavailable', () => {
    render(<VariantManager variants={[mockVariant3]} />)

    const unavailableBadge = screen.getByText('Unavailable')
    expect(unavailableBadge).toBeInTheDocument()
    expect(unavailableBadge).toHaveClass('bg-gray-100')
    expect(unavailableBadge).toHaveClass('text-gray-700')
  })

  it('shows empty state when variants array is empty', () => {
    render(<VariantManager variants={[]} />)

    expect(
      screen.getByText('No variants yet. Variants will appear here once they are created.'),
    ).toBeInTheDocument()
  })

  it('renders correct number of variant rows', () => {
    const variants = [mockVariant1, mockVariant2, mockVariant3]
    render(<VariantManager variants={variants} />)

    const rows = screen.getAllByRole('row')
    // rows[0] is thead, so data rows = total - 1
    expect(rows.length).toBe(variants.length + 1)
  })

  it('shows N/A for missing SKU', () => {
    render(<VariantManager variants={[mockVariant3]} />)

    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('shows actual SKU when provided', () => {
    render(<VariantManager variants={[mockVariant1]} />)

    expect(screen.getByText('SKU-001')).toBeInTheDocument()
  })

  it('renders sort_order as integer value', () => {
    render(<VariantManager variants={[mockVariant1]} />)

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows loading state with skeleton placeholders', () => {
    const { container } = render(<VariantManager variants={[]} isLoading={true} />)

    const skeletonRows = container.querySelectorAll('.animate-pulse')
    expect(skeletonRows.length).toBeGreaterThan(0)
  })

  it('does not show loading state when isLoading is false', () => {
    const { container } = render(<VariantManager variants={[mockVariant1]} isLoading={false} />)

    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBe(0)
  })

  it('has semantic table structure with thead and tbody', () => {
    const { container } = render(<VariantManager variants={[mockVariant1]} />)

    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('thead')).toBeInTheDocument()
    expect(container.querySelector('tbody')).toBeInTheDocument()
  })

  it('renders table rows with correct data cells', () => {
    render(<VariantManager variants={[mockVariant2]} />)

    // Check for variant name
    expect(screen.getByText('Medium')).toBeInTheDocument()
    // Check for formatted price
    expect(screen.getByText(/20,000/)).toBeInTheDocument()
    // Check for SKU
    expect(screen.getByText('SKU-002')).toBeInTheDocument()
    // Check for sort order
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('maintains sort order even when variants provided out of order', () => {
    const unorderedVariants = [mockVariant3, mockVariant1, mockVariant2]
    render(<VariantManager variants={unorderedVariants} />)

    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Small') // sort_order 1
    expect(rows[2]).toHaveTextContent('Medium') // sort_order 2
    expect(rows[3]).toHaveTextContent('Large') // sort_order 3
  })

  it('handles multiple unavailable variants', () => {
    const unavailableVariant2: ProductVariant = {
      ...mockVariant2,
      is_available: false,
    }

    render(<VariantManager variants={[mockVariant1, unavailableVariant2, mockVariant3]} />)

    const unavailableBadges = screen.getAllByText('Unavailable')
    // Filter to only badges (not headers) - badges have gray classes
    const unavailableBadgeElements = unavailableBadges.filter((el) =>
      el.className.includes('bg-gray'),
    )
    expect(unavailableBadgeElements.length).toBe(2)
  })

  it('formats different currency amounts correctly', () => {
    const smallPrice: ProductVariant = {
      ...mockVariant1,
      price_minor: 100000, // 1,000 UGX
    }

    const largePrice: ProductVariant = {
      ...mockVariant2,
      price_minor: 50000000, // 500,000 UGX
    }

    render(<VariantManager variants={[smallPrice, largePrice]} />)

    expect(screen.getByText(/1,000/)).toBeInTheDocument()
    expect(screen.getByText(/500,000/)).toBeInTheDocument()
  })

  it('displays table with rounded borders and proper styling', () => {
    const { container } = render(<VariantManager variants={[mockVariant1]} />)

    const tableContainer = container.querySelector('.rounded-lg.border')
    expect(tableContainer).toBeInTheDocument()
    expect(tableContainer).toHaveClass('bg-platform-surface')
  })

  it('shows header row with darker background', () => {
    const { container } = render(<VariantManager variants={[mockVariant1]} />)

    const thead = container.querySelector('thead')
    expect(thead).toHaveClass('bg-platform-bg')
  })

  it('displays row dividers between data rows', () => {
    const { container } = render(<VariantManager variants={[mockVariant1, mockVariant2]} />)

    const tbody = container.querySelector('tbody')
    expect(tbody).toHaveClass('divide-y')
  })

  it('renders all variant names correctly', () => {
    const variants = [mockVariant1, mockVariant2, mockVariant3]
    render(<VariantManager variants={variants} />)

    expect(screen.getByText('Small')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Large')).toBeInTheDocument()
  })

  it('handles variant with zero sort_order', () => {
    const zeroSortVariant: ProductVariant = {
      ...mockVariant1,
      sort_order: 0,
    }

    render(<VariantManager variants={[mockVariant1, zeroSortVariant]} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('shows empty state with dashed border styling', () => {
    const { container } = render(<VariantManager variants={[]} />)

    const emptyState = container.querySelector('.border-dashed')
    expect(emptyState).toBeInTheDocument()
  })

  it('applies hover effect to table rows', () => {
    const { container } = render(<VariantManager variants={[mockVariant1]} />)

    const tbody = container.querySelector('tbody')
    const firstDataRow = tbody?.querySelector('tr')
    expect(firstDataRow).toHaveClass('hover:bg-platform-bg/50')
  })
})
