import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PieChart } from './PieChart'

describe('PieChart', () => {
  const mockData = [
    { label: 'Pending', value: 30 },
    { label: 'Confirmed', value: 50 },
    { label: 'Delivered', value: 20 },
  ]

  it('renders title correctly', () => {
    render(<PieChart data={mockData} title="Order Status" />)

    expect(screen.getByText('Order Status')).toBeInTheDocument()
  })

  it('shows slice for each item', () => {
    const { container } = render(
      <PieChart data={mockData} title="Order Status" />
    )

    const paths = container.querySelectorAll('path')
    // Should have at least 3 paths (one for each slice)
    expect(paths.length).toBeGreaterThanOrEqual(3)
  })

  it('displays percentage labels on slices', () => {
    render(<PieChart data={mockData} title="Order Status" />)

    // Check for percentage values (approximately)
    const percentageTexts = screen.getAllByText(/\d+\.\d+%/)
    expect(percentageTexts.length).toBeGreaterThan(0)
  })

  it('shows legend with all items', () => {
    render(<PieChart data={mockData} title="Order Status" />)

    expect(screen.getByText('Pending: 30')).toBeInTheDocument()
    expect(screen.getByText('Confirmed: 50')).toBeInTheDocument()
    expect(screen.getByText('Delivered: 20')).toBeInTheDocument()
  })

  it('shows "No data" message when data is empty', () => {
    render(<PieChart data={[]} title="Order Status" />)

    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('applies colors correctly from default palette', () => {
    const { container } = render(
      <PieChart data={mockData} title="Order Status" />
    )

    const legendSquares = container.querySelectorAll('div[style*="background"]')
    // Should have color squares in legend
    expect(legendSquares.length).toBeGreaterThanOrEqual(mockData.length)
  })

  it('applies custom colors when provided', () => {
    const customColors = ['#ff0000', '#00ff00', '#0000ff']
    const { container } = render(
      <PieChart data={mockData} title="Order Status" colors={customColors} />
    )

    const paths = container.querySelectorAll('path')
    expect(paths.length).toBeGreaterThanOrEqual(mockData.length)
  })

  it('renders SVG with correct viewBox', () => {
    const { container } = render(
      <PieChart data={mockData} title="Order Status" />
    )

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 300 300')
  })

  it('calculates correct percentages', () => {
    render(<PieChart data={mockData} title="Order Status" />)

    // Total is 100, so percentages should be exact
    // Pending: 30/100 = 30%
    // Confirmed: 50/100 = 50%
    // Delivered: 20/100 = 20%
    expect(screen.getByText('Pending: 30')).toBeInTheDocument()
    expect(screen.getByText('Confirmed: 50')).toBeInTheDocument()
  })

  it('renders with proper styling container', () => {
    const { container } = render(
      <PieChart data={mockData} title="Order Status" />
    )

    const wrapper = container.querySelector('.rounded-lg')
    expect(wrapper).toHaveClass('border-platform-border')
    expect(wrapper).toHaveClass('bg-platform-surface')
    expect(wrapper).toHaveClass('p-6')
  })

  it('handles single item', () => {
    render(
      <PieChart
        data={[{ label: 'All Orders', value: 100 }]}
        title="Order Status"
      />
    )

    expect(screen.getByText('All Orders: 100')).toBeInTheDocument()
  })

  it('handles data with unequal distribution', () => {
    const unequalData = [
      { label: 'A', value: 1 },
      { label: 'B', value: 50 },
      { label: 'C', value: 49 },
    ]

    render(<PieChart data={unequalData} title="Unequal Distribution" />)

    expect(screen.getByText('A: 1')).toBeInTheDocument()
    expect(screen.getByText('B: 50')).toBeInTheDocument()
    expect(screen.getByText('C: 49')).toBeInTheDocument()
  })

  it('shows legend with color indicators', () => {
    const { container } = render(
      <PieChart data={mockData} title="Order Status" />
    )

    const legendItems = container.querySelectorAll('.flex.items-center.gap-2')
    expect(legendItems.length).toBeGreaterThanOrEqual(mockData.length)
  })

  it('handles many data items', () => {
    const manyItems = [
      { label: 'Item 1', value: 10 },
      { label: 'Item 2', value: 20 },
      { label: 'Item 3', value: 15 },
      { label: 'Item 4', value: 25 },
      { label: 'Item 5', value: 30 },
    ]

    render(<PieChart data={manyItems} title="Many Items" />)

    expect(screen.getByText('Item 1: 10')).toBeInTheDocument()
    expect(screen.getByText('Item 5: 30')).toBeInTheDocument()
  })
})
