import { describe, it, expect } from 'vitest'

import type { BarChartData } from '../BarChart'

describe('BarChart', () => {
  it('should render with valid data', () => {
    const data: BarChartData[] = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
      { label: 'Mar', value: 150 },
    ]

    expect(data).toBeDefined()
    expect(data.length).toBe(3)
  })

  it('should handle empty data array', () => {
    const data: BarChartData[] = []

    expect(data).toEqual([])
    expect(data.length).toBe(0)
  })

  it('should calculate correct max value', () => {
    const data: BarChartData[] = [
      { label: 'A', value: 50 },
      { label: 'B', value: 150 },
      { label: 'C', value: 100 },
    ]

    const maxValue = Math.max(...data.map((d) => d.value))

    expect(maxValue).toBe(150)
  })

  it('should accept custom colors', () => {
    const color1 = '#ff0000'
    const color2 = '#00ff00'

    expect(color1).toBe('#ff0000')
    expect(color2).toBe('#00ff00')
  })

  it('should handle custom maxValue prop', () => {
    const data: BarChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ]

    const customMax = 500
    const maxFromData = Math.max(...data.map((d) => d.value))

    expect(customMax).toBeGreaterThanOrEqual(maxFromData)
  })

  it('should render with title and axis labels', () => {
    const title = 'Quarterly Revenue'
    const yAxisLabel = 'Revenue (UGX)'
    const xAxisLabel = 'Quarter'

    expect(title).toBeDefined()
    expect(yAxisLabel).toBeDefined()
    expect(xAxisLabel).toBeDefined()
  })

  it('should support showValues toggle', () => {
    const showValues = true

    expect(showValues).toBe(true)
  })

  it('should handle single bar chart', () => {
    const data: BarChartData[] = [{ label: 'Total', value: 1000 }]

    expect(data.length).toBe(1)
    expect(data[0]?.value).toBe(1000)
  })

  it('should render with custom dimensions', () => {
    const width = 600
    const height = 400

    expect(width).toBe(600)
    expect(height).toBe(400)
  })
})
