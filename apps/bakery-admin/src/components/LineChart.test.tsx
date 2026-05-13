import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LineChart } from './LineChart'

describe('LineChart', () => {
  const mockData = [
    { label: 'Week 1', value: 100 },
    { label: 'Week 2', value: 150 },
    { label: 'Week 3', value: 120 },
    { label: 'Week 4', value: 200 },
  ]

  it('renders title correctly', () => {
    render(<LineChart data={mockData} title="Weekly Revenue" />)

    expect(screen.getByText('Weekly Revenue')).toBeInTheDocument()
  })

  it('shows line connecting all points', () => {
    const { container } = render(
      <LineChart data={mockData} title="Weekly Revenue" />
    )

    const polylines = container.querySelectorAll('polyline')
    expect(polylines.length).toBeGreaterThan(0)
  })

  it('displays labels for each point', () => {
    render(<LineChart data={mockData} title="Weekly Revenue" />)

    expect(screen.getByText('Week 1')).toBeInTheDocument()
    expect(screen.getByText('Week 2')).toBeInTheDocument()
    expect(screen.getByText('Week 3')).toBeInTheDocument()
    expect(screen.getByText('Week 4')).toBeInTheDocument()
  })

  it('shows "No data" message when data is empty', () => {
    render(<LineChart data={[]} title="Weekly Revenue" />)

    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('renders grid lines for reference', () => {
    const { container } = render(
      <LineChart data={mockData} title="Weekly Revenue" />
    )

    const lines = container.querySelectorAll('line')
    // Should have at least 5 grid lines (0, 0.25, 0.5, 0.75, 1)
    expect(lines.length).toBeGreaterThanOrEqual(5)
  })

  it('renders data points as circles', () => {
    const { container } = render(
      <LineChart data={mockData} title="Weekly Revenue" />
    )

    const circles = container.querySelectorAll('circle')
    // Should have circles for each data point
    expect(circles.length).toBe(mockData.length)
  })

  it('uses custom color when provided', () => {
    const { container } = render(
      <LineChart data={mockData} title="Weekly Revenue" color="#ff0000" />
    )

    const polyline = container.querySelector('polyline')
    expect(polyline).toHaveAttribute('stroke', '#ff0000')
  })

  it('uses default color when not provided', () => {
    const { container } = render(
      <LineChart data={mockData} title="Weekly Revenue" />
    )

    const polyline = container.querySelector('polyline')
    expect(polyline).toHaveAttribute('stroke', '#10b981')
  })

  it('uses custom height when provided', () => {
    const { container } = render(
      <LineChart data={mockData} title="Weekly Revenue" height={400} />
    )

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('height', '400')
  })

  it('uses default height when not provided', () => {
    const { container } = render(
      <LineChart data={mockData} title="Weekly Revenue" />
    )

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('height', '300')
  })

  it('positions points correctly on the line', () => {
    const { container } = render(
      <LineChart data={mockData} title="Weekly Revenue" />
    )

    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(4)

    // First and last circles should be at correct positions
    const firstCircle = circles[0]
    const lastCircle = circles[3]

    expect(firstCircle).toHaveAttribute('r', '4')
    expect(lastCircle).toHaveAttribute('r', '4')
  })

  it('renders with proper styling container', () => {
    const { container } = render(
      <LineChart data={mockData} title="Weekly Revenue" />
    )

    const wrapper = container.querySelector('.rounded-lg')
    expect(wrapper).toHaveClass('border-platform-border')
    expect(wrapper).toHaveClass('bg-platform-surface')
    expect(wrapper).toHaveClass('p-6')
  })

  it('handles single data point', () => {
    const { container } = render(
      <LineChart
        data={[{ label: 'Day 1', value: 100 }]}
        title="Daily Revenue"
      />
    )

    expect(screen.getByText('Day 1')).toBeInTheDocument()
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(1)
  })

  it('handles data with varying values', () => {
    const varyingData = [
      { label: 'Low', value: 10 },
      { label: 'High', value: 1000 },
      { label: 'Medium', value: 500 },
    ]

    render(<LineChart data={varyingData} title="Variable Data" />)

    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('handles data with zero values', () => {
    const zeroData = [
      { label: 'Day 1', value: 100 },
      { label: 'Day 2', value: 0 },
      { label: 'Day 3', value: 50 },
    ]

    const { container } = render(
      <LineChart data={zeroData} title="With Zeros" />
    )

    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('Day 2')).toBeInTheDocument()
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(3)
  })
})
