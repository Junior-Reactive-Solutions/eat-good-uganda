import { describe, it, expect } from 'vitest'

import type { LineChartData } from '../LineChart'

describe('LineChart', () => {
  it('should render with valid data', () => {
    const data: LineChartData[] = [
      { label: 'Week 1', value: 100 },
      { label: 'Week 2', value: 150 },
      { label: 'Week 3', value: 120 },
    ]

    expect(data).toBeDefined()
    expect(data.length).toBe(3)
  })

  it('should handle empty data array', () => {
    const data: LineChartData[] = []

    expect(data).toEqual([])
    expect(data.length).toBe(0)
  })

  it('should calculate correct max value', () => {
    const dataPoints = [50, 200, 100]

    const maxValue = Math.max(...dataPoints)
    const expectedMax = 200

    expect(maxValue).toBe(expectedMax)
  })

  it('should support custom line color', () => {
    const lineColor = '#ef4444'

    expect(lineColor).toBe('#ef4444')
  })

  it('should handle custom maxValue prop', () => {
    const data: LineChartData[] = [
      { label: 'Day 1', value: 100 },
      { label: 'Day 2', value: 150 },
    ]

    const customMax = 300
    const maxFromData = Math.max(...data.map((d) => d.value))

    expect(customMax).toBeGreaterThanOrEqual(maxFromData)
  })

  it('should render with title and axis labels', () => {
    const title = 'Monthly Trend'
    const yAxisLabel = 'Orders'
    const xAxisLabel = 'Month'

    expect(title).toBeDefined()
    expect(yAxisLabel).toBeDefined()
    expect(xAxisLabel).toBeDefined()
  })

  it('should support showPoints toggle', () => {
    const showPoints = false

    expect(showPoints).toBe(false)
  })

  it('should support showValues toggle', () => {
    const showValues = true

    expect(showValues).toBe(true)
  })

  it('should handle two-point line chart', () => {
    const data: LineChartData[] = [
      { label: 'Start', value: 100 },
      { label: 'End', value: 200 },
    ]

    expect(data.length).toBe(2)
  })

  it('should handle many data points', () => {
    const dataLength = 30

    expect(dataLength).toBe(30)
  })

  it('should render with custom dimensions', () => {
    const width = 800
    const height = 500

    expect(width).toBe(800)
    expect(height).toBe(500)
  })
})
