import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BarChart } from './BarChart'

describe('BarChart', () => {
  const mockData = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 150 },
    { label: 'Mar', value: 200 },
  ]

  it('renders title correctly', () => {
    render(<BarChart data={mockData} title="Monthly Sales" />)

    expect(screen.getByText('Monthly Sales')).toBeInTheDocument()
  })

  it('shows bar for each data point', () => {
    const { container } = render(
      <BarChart data={mockData} title="Monthly Sales" />
    )

    const rects = container.querySelectorAll('rect')
    // Should have 3 bars (one for each data point)
    expect(rects.length).toBeGreaterThanOrEqual(3)
  })

  it('displays labels for each bar', () => {
    render(<BarChart data={mockData} title="Monthly Sales" />)

    expect(screen.getByText('Jan')).toBeInTheDocument()
    expect(screen.getByText('Feb')).toBeInTheDocument()
    expect(screen.getByText('Mar')).toBeInTheDocument()
  })

  it('shows "No data" message when data is empty', () => {
    render(<BarChart data={[]} title="Monthly Sales" />)

    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('renders SVG with correct viewBox', () => {
    const { container } = render(
      <BarChart data={mockData} title="Monthly Sales" />
    )

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 180 300')
  })

  it('uses custom color when provided', () => {
    const { container } = render(
      <BarChart data={mockData} title="Monthly Sales" color="#ff0000" />
    )

    const rects = container.querySelectorAll('rect')
    // First rect should be a bar with custom color
    expect(rects[0]).toHaveAttribute('fill', '#ff0000')
  })

  it('uses default color when not provided', () => {
    const { container } = render(
      <BarChart data={mockData} title="Monthly Sales" />
    )

    const rects = container.querySelectorAll('rect')
    // First rect should be a bar with default color
    expect(rects[0]).toHaveAttribute('fill', '#3b82f6')
  })

  it('uses custom height when provided', () => {
    const { container } = render(
      <BarChart data={mockData} title="Monthly Sales" height={400} />
    )

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('height', '400')
  })

  it('uses default height when not provided', () => {
    const { container } = render(
      <BarChart data={mockData} title="Monthly Sales" />
    )

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('height', '300')
  })

  it('displays values above bars', () => {
    render(<BarChart data={mockData} title="Monthly Sales" />)

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('scales bar heights proportionally to values', () => {
    const { container } = render(
      <BarChart data={mockData} title="Monthly Sales" height={300} />
    )

    const rects = container.querySelectorAll('rect')
    const firstBar = rects[0]!
    const secondBar = rects[1]!

    // Second bar should be taller (150 > 100)
    const firstHeight = parseFloat(firstBar.getAttribute('height') || '0')
    const secondHeight = parseFloat(secondBar.getAttribute('height') || '0')

    expect(secondHeight).toBeGreaterThan(firstHeight)
  })

  it('renders with proper styling container', () => {
    const { container } = render(
      <BarChart data={mockData} title="Monthly Sales" />
    )

    const wrapper = container.querySelector('.rounded-lg')
    expect(wrapper).toHaveClass('border-platform-border')
    expect(wrapper).toHaveClass('bg-platform-surface')
    expect(wrapper).toHaveClass('p-6')
  })

  it('handles single data point', () => {
    render(
      <BarChart
        data={[{ label: 'Single', value: 100 }]}
        title="Single Data"
      />
    )

    expect(screen.getByText('Single')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('handles large data values correctly', () => {
    const largeData = [
      { label: 'Q1', value: 10000 },
      { label: 'Q2', value: 15000 },
      { label: 'Q3', value: 20000 },
    ]

    render(<BarChart data={largeData} title="Quarterly Revenue" />)

    expect(screen.getByText('10000')).toBeInTheDocument()
    expect(screen.getByText('15000')).toBeInTheDocument()
    expect(screen.getByText('20000')).toBeInTheDocument()
  })
})
