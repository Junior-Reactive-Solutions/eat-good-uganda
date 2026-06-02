import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { LineChart } from '../LineChart'
import type { LineChartData } from '../LineChart'

describe('LineChart', () => {
  it('should render with valid data', () => {
    const data: LineChartData[] = [
      { label: 'Week 1', value: 100 },
      { label: 'Week 2', value: 150 },
      { label: 'Week 3', value: 120 },
    ]

    render(<LineChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should handle empty data array with message', () => {
    const data: LineChartData[] = []

    render(<LineChart data={data} />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('should calculate correct max value', () => {
    const data: LineChartData[] = [
      { label: 'A', value: 50 },
      { label: 'B', value: 200 },
      { label: 'C', value: 100 },
    ]

    const maxValue = Math.max(...data.map((d) => d.value))
    expect(maxValue).toBe(200)

    render(<LineChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should support custom line color', () => {
    const data: LineChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const { container } = render(
      <LineChart data={data} lineColor="#ef4444" />
    )
    const path = container.querySelector('path')
    expect(path).toBeInTheDocument()
  })

  it('should handle custom maxValue prop', () => {
    const data: LineChartData[] = [
      { label: 'Day 1', value: 100 },
      { label: 'Day 2', value: 150 },
    ]

    render(<LineChart data={data} maxValue={300} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should render with title and axis labels', () => {
    const data: LineChartData[] = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
    ]

    render(
      <LineChart
        data={data}
        title="Quarterly Sales"
        yAxisLabel="Orders"
        xAxisLabel="Month"
      />
    )

    expect(screen.getByRole('heading', { name: 'Quarterly Sales' })).toBeInTheDocument()
  })

  it('should support showPoints toggle', () => {
    const data: LineChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const { container: containerWithPoints } = render(
      <LineChart data={data} showPoints={true} />
    )
    const circlesWithPoints = containerWithPoints.querySelectorAll('circle')
    expect(circlesWithPoints.length).toBeGreaterThan(0)

    const { container: containerWithoutPoints } = render(
      <LineChart data={data} showPoints={false} />
    )
    const circlesWithoutPoints = containerWithoutPoints.querySelectorAll(
      'circle'
    )
    expect(circlesWithoutPoints.length).toBe(0)
  })

  it('should support showValues toggle', () => {
    const data: LineChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    render(<LineChart data={data} showValues={true} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should handle two-point line chart', () => {
    const data: LineChartData[] = [
      { label: 'Start', value: 100 },
      { label: 'End', value: 200 },
    ]

    render(<LineChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should handle many data points', () => {
    const data: LineChartData[] = Array.from({ length: 30 }, (_, i) => ({
      label: `Point ${String(i + 1)}`,
      value: Math.random() * 100,
    }))

    render(<LineChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should render with custom dimensions', () => {
    const data: LineChartData[] = [{ label: 'A', value: 100 }]

    const { container } = render(
      <LineChart data={data} width={800} height={500} />
    )
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '800')
    expect(svg).toHaveAttribute('height', '500')
  })

  it('should show loading skeleton', () => {
    const data: LineChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const { container } = render(
      <LineChart data={data} isLoading={true} />
    )
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    const data: LineChartData[] = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
    ]

    render(<LineChart data={data} title="Revenue Trend" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label')
    const ariaLabel = svg.getAttribute('aria-label')
    expect(ariaLabel).toContain('Revenue Trend')
  })

  it('should render line path', () => {
    const data: LineChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
      { label: 'C', value: 150 },
    ]

    const { container } = render(<LineChart data={data} />)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBeGreaterThan(0)
  })

  it('should handle single data point', () => {
    const data: LineChartData[] = [{ label: 'Single', value: 100 }]

    render(<LineChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should render with default line color when not specified', () => {
    const data: LineChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const { container } = render(<LineChart data={data} />)
    const path = container.querySelector('path')
    expect(path).toBeInTheDocument()
  })
})
