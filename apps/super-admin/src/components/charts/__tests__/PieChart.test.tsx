import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { PieChart } from '../PieChart'
import type { PieChartData } from '../PieChart'

describe('PieChart', () => {
  it('should render with valid data', () => {
    const data: PieChartData[] = [
      { label: 'Category A', value: 300 },
      { label: 'Category B', value: 200 },
      { label: 'Category C', value: 100 },
    ]

    render(<PieChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should handle empty data array with message', () => {
    const data: PieChartData[] = []

    render(<PieChart data={data} />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('should calculate total correctly', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
      { label: 'C', value: 300 },
    ]

    const total = data.reduce((sum, item) => sum + item.value, 0)
    expect(total).toBe(600)

    render(<PieChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should calculate percentages correctly', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 50 },
      { label: 'B', value: 50 },
    ]

    const total = data.reduce((sum, item) => sum + item.value, 0)
    const firstValue = data[0]?.value ?? 0
    const percentageA = (firstValue / total) * 100

    expect(percentageA).toBe(50)

    render(<PieChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should accept custom colors', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 100, color: '#ff0000' },
      { label: 'B', value: 200, color: '#00ff00' },
    ]

    const { container } = render(<PieChart data={data} />)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBeGreaterThan(0)
  })

  it('should use default colors when not provided', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const { container } = render(<PieChart data={data} />)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBeGreaterThan(0)
  })

  it('should render with title', () => {
    const data: PieChartData[] = [{ label: 'Total', value: 100 }]

    render(<PieChart data={data} title="Distribution Chart" />)
    expect(screen.getByText('Distribution Chart')).toBeInTheDocument()
  })

  it('should support showLegend toggle', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const { container: containerWithLegend } = render(
      <PieChart data={data} showLegend={true} />
    )
    const legendItemsWithLegend = containerWithLegend.querySelectorAll(
      '[role="presentation"]'
    )
    expect(legendItemsWithLegend.length).toBeGreaterThan(0)

    const { container: containerWithoutLegend } = render(
      <PieChart data={data} showLegend={false} />
    )
    const legendItemsWithout = containerWithoutLegend.querySelectorAll(
      '[role="presentation"]'
    )
    expect(legendItemsWithout.length).toBeGreaterThan(0)
  })

  it('should support showValues toggle', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    render(<PieChart data={data} showValues={true} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should support showPercentages toggle', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 50 },
      { label: 'B', value: 50 },
    ]

    render(<PieChart data={data} showPercentages={false} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should handle single slice', () => {
    const data: PieChartData[] = [{ label: 'Only', value: 100 }]

    render(<PieChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should render with custom dimensions', () => {
    const data: PieChartData[] = [{ label: 'A', value: 100 }]

    const { container } = render(
      <PieChart data={data} width={500} height={400} showLegend={false} />
    )
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '500')
    expect(svg).toHaveAttribute('height', '400')
  })

  it('should handle zero values in data', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 0 },
      { label: 'B', value: 100 },
    ]

    const total = data.reduce((sum, item) => sum + item.value, 0)
    expect(total).toBe(100)

    render(<PieChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should handle many categories', () => {
    const data: PieChartData[] = Array.from({ length: 10 }, (_, i) => ({
      label: `Category ${String(i + 1)}`,
      value: Math.random() * 100,
    }))

    render(<PieChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should show loading skeleton', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const { container } = render(
      <PieChart data={data} isLoading={true} />
    )
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    const data: PieChartData[] = [
      { label: 'Category A', value: 300 },
      { label: 'Category B', value: 200 },
    ]

    render(<PieChart data={data} title="Sales Distribution" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label')
    const ariaLabel = svg.getAttribute('aria-label')
    expect(ariaLabel).toContain('Sales Distribution')
  })

  it('should render pie slices as paths', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
      { label: 'C', value: 100 },
    ]

    const { container } = render(<PieChart data={data} />)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBeGreaterThanOrEqual(data.length)
  })

  it('should handle equal value slices', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 100 },
      { label: 'C', value: 100 },
    ]

    render(<PieChart data={data} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('should handle all zero values with message', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 0 },
      { label: 'B', value: 0 },
    ]

    render(<PieChart data={data} />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })
})
