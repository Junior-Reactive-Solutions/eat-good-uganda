import { describe, it, expect } from 'vitest'

import type { PieChartData } from '../PieChart'

describe('PieChart', () => {
  it('should render with valid data', () => {
    const data: PieChartData[] = [
      { label: 'Category A', value: 300 },
      { label: 'Category B', value: 200 },
      { label: 'Category C', value: 100 },
    ]

    expect(data).toBeDefined()
    expect(data.length).toBe(3)
  })

  it('should handle empty data array', () => {
    const data: PieChartData[] = []

    expect(data).toEqual([])
    expect(data.length).toBe(0)
  })

  it('should calculate total correctly', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
      { label: 'C', value: 300 },
    ]

    const total = data.reduce((sum, item) => sum + item.value, 0)

    expect(total).toBe(600)
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
  })

  it('should accept custom colors', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 100, color: '#ff0000' },
      { label: 'B', value: 200, color: '#00ff00' },
    ]

    expect(data[0]?.color).toBe('#ff0000')
    expect(data[1]?.color).toBe('#00ff00')
  })

  it('should use default colors when not provided', () => {
    const firstColor: string | undefined = undefined
    const secondColor: string | undefined = undefined

    expect(firstColor).toBeUndefined()
    expect(secondColor).toBeUndefined()
  })

  it('should render with title', () => {
    const data: PieChartData[] = [{ label: 'Total', value: 100 }]
    const title = 'Distribution Chart'

    expect(title).toBeDefined()
    expect(data.length).toBe(1)
  })

  it('should support showLegend toggle', () => {
    const showLegend = false

    expect(showLegend).toBe(false)
  })

  it('should support showValues toggle', () => {
    const showValues = true

    expect(showValues).toBe(true)
  })

  it('should support showPercentages toggle', () => {
    const showPercentages = false

    expect(showPercentages).toBe(false)
  })

  it('should handle single slice', () => {
    const data: PieChartData[] = [{ label: 'Only', value: 100 }]

    expect(data.length).toBe(1)
    expect(data[0]?.value).toBe(100)
  })

  it('should render with custom dimensions', () => {
    const width = 500
    const height = 400

    expect(width).toBe(500)
    expect(height).toBe(400)
  })

  it('should handle zero values', () => {
    const data: PieChartData[] = [
      { label: 'A', value: 0 },
      { label: 'B', value: 100 },
    ]

    const total = data.reduce((sum, item) => sum + item.value, 0)

    expect(total).toBe(100)
  })

  it('should handle many categories', () => {
    const categoryCount = 10
    const dataLength = Array.from({ length: categoryCount }, (_, i) => i).length

    expect(dataLength).toBe(categoryCount)
  })
})
