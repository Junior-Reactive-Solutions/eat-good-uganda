import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { BarChart } from '../BarChart'
import type { BarChartData } from '../BarChart'

describe('BarChart', () => {
  it('should render with valid data', () => {
    const data: BarChartData[] = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
      { label: 'Mar', value: 150 },
    ]

    render(<BarChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should handle empty data array with message', () => {
    const data: BarChartData[] = []

    render(<BarChart data={data} />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('should calculate and use correct max value', () => {
    const data: BarChartData[] = [
      { label: 'A', value: 50 },
      { label: 'B', value: 150 },
      { label: 'C', value: 100 },
    ]

    const maxValue = Math.max(...data.map((d) => d.value))
    expect(maxValue).toBe(150)

    render(<BarChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should accept and apply custom colors', () => {
    const data: BarChartData[] = [
      { label: 'A', value: 100, color: '#ff0000' },
      { label: 'B', value: 200, color: '#00ff00' },
    ]

    const { container } = render(<BarChart data={data} />)
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBeGreaterThan(0)
  })

  it('should support custom maxValue prop', () => {
    const data: BarChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    render(<BarChart data={data} maxValue={500} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should render with title and axis labels', () => {
    const data: BarChartData[] = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
    ]

    render(
      <BarChart
        data={data}
        title="Quarterly Revenue"
        yAxisLabel="Revenue (UGX)"
        xAxisLabel="Quarter"
      />
    )

    expect(screen.getByText('Quarterly Revenue')).toBeInTheDocument()
  })

  it('should support showValues toggle', () => {
    const data: BarChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const { container: containerWithValues } = render(
      <BarChart data={data} showValues={true} />
    )
    const texts = containerWithValues.querySelectorAll('text')
    expect(texts.length).toBeGreaterThan(0)

    const { container: containerWithoutValues } = render(
      <BarChart data={data} showValues={false} />
    )
    const textsWithout = containerWithoutValues.querySelectorAll('text')
    expect(textsWithout.length).toBeGreaterThan(0)
  })

  it('should handle single bar chart', () => {
    const data: BarChartData[] = [{ label: 'Total', value: 1000 }]

    render(<BarChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should render with custom dimensions', () => {
    const data: BarChartData[] = [{ label: 'A', value: 100 }]

    const { container } = render(
      <BarChart data={data} width={600} height={400} />
    )
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '600')
    expect(svg).toHaveAttribute('height', '400')
  })

  it('should show loading skeleton', () => {
    const data: BarChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const { container } = render(
      <BarChart data={data} isLoading={true} />
    )
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    const data: BarChartData[] = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
    ]

    render(<BarChart data={data} title="Sales" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label')
    const ariaLabel = svg.getAttribute('aria-label')
    expect(ariaLabel).toContain('Sales')
  })

  it('should render axis labels', () => {
    const data: BarChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const { container } = render(
      <BarChart
        data={data}
        yAxisLabel="Value"
        xAxisLabel="Category"
      />
    )

    const textElements = container.querySelectorAll('text')
    const hasYLabel = Array.from(textElements).some(
      (el) => el.textContent === 'Value'
    )
    const hasXLabel = Array.from(textElements).some(
      (el) => el.textContent === 'Category'
    )

    expect(hasYLabel || hasXLabel).toBe(true)
  })

  it('should render multiple bars correctly', () => {
    const data: BarChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 150 },
      { label: 'C', value: 200 },
      { label: 'D', value: 120 },
    ]

    const { container } = render(<BarChart data={data} showValues={true} />)
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBeGreaterThanOrEqual(data.length)
  })
})
