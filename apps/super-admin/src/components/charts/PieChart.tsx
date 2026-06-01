import { type JSX } from 'react'

import { ChartSkeleton } from './ChartSkeleton'

export interface PieChartData {
  label: string
  value: number
  color?: string
}

export interface PieChartProps {
  data: PieChartData[]
  width?: number
  height?: number
  title?: string
  showLegend?: boolean
  showValues?: boolean
  showPercentages?: boolean
  isLoading?: boolean
}

const DEFAULT_COLORS = [
  'var(--chart-primary)',
  'var(--chart-secondary)',
  'var(--chart-tertiary)',
  'var(--chart-quaternary)',
  'var(--chart-quinary)',
  'var(--chart-senary)',
  'var(--chart-septenary)',
  'var(--chart-octonary)',
]

export function PieChart({
  data,
  width = 400,
  height = 300,
  title,
  showLegend = true,
  showValues = false,
  showPercentages = true,
  isLoading = false,
}: PieChartProps): JSX.Element {
  if (isLoading) {
    return <ChartSkeleton width={width} height={height} showLegend={showLegend} />
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-platform-fg-muted">No data available</p>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-platform-fg-muted">No data available</p>
      </div>
    )
  }

  const centerX = width / 2
  const centerY = (height - (showLegend ? 80 : 0)) / 2
  const radius = Math.min(centerX, centerY) * 0.8

  // Calculate pie slices
  let currentAngle = -Math.PI / 2
  const slices = data.map((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    const midAngle = (startAngle + endAngle) / 2

    const x1 = centerX + radius * Math.cos(startAngle)
    const y1 = centerY + radius * Math.sin(startAngle)
    const x2 = centerX + radius * Math.cos(endAngle)
    const y2 = centerY + radius * Math.sin(endAngle)

    const largeArc = sliceAngle > Math.PI ? 1 : 0

    const labelX = centerX + radius * 0.65 * Math.cos(midAngle)
    const labelY = centerY + radius * 0.65 * Math.sin(midAngle)

    const percentage = ((item.value / total) * 100).toFixed(1)

    currentAngle = endAngle

    return {
      label: item.label,
      value: item.value,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      x1,
      y1,
      x2,
      y2,
      largeArc,
      labelX,
      labelY,
      percentage,
    }
  })

  const chartHeight = showLegend ? height - 80 : height
  const chartDescription = title
    ? `${title} with ${String(data.length)} segments totaling ${String(total)}`
    : `Pie chart with ${String(data.length)} segments totaling ${String(total)}`

  return (
    <div className="flex flex-col items-start gap-4">
      {title && <h3 className="text-lg font-semibold text-platform-fg">{title}</h3>}
      <div className="flex flex-col lg:flex-row items-center gap-4" style={{ width }}>
        <svg
          width={width}
          height={chartHeight}
          className="border border-platform-border rounded"
          role="img"
          aria-label={chartDescription}
        >
          {/* Pie slices */}
          {slices.map((slice, index) => (
            <g key={`slice-${String(index)}`}>
              <path
                d={`M ${String(centerX)} ${String(centerY)} L ${String(slice.x1)} ${String(slice.y1)} A ${String(radius)} ${String(radius)} 0 ${String(slice.largeArc)} 1 ${String(slice.x2)} ${String(slice.y2)} Z`}
                fill={slice.color}
                stroke="white"
                strokeWidth={2}
                className="hover:opacity-80 transition-opacity"
                role="presentation"
              >
                <title>
                  {slice.label}: {slice.percentage}%
                </title>
              </path>
              {/* Value and percentage labels */}
              {(showValues || showPercentages) && (
                <text
                  x={String(slice.labelX)}
                  y={String(slice.labelY)}
                  textAnchor="middle"
                  dy="0.3em"
                  className="text-xs font-semibold text-white pointer-events-none"
                >
                  {showPercentages && `${slice.percentage}%`}
                  {showValues && showPercentages && ' '}
                  {showValues && `(${String(slice.value)})`}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-col lg:flex-row flex-wrap gap-3 justify-center w-full">
            {slices.map((slice, index) => (
              <div
                key={`legend-${String(index)}`}
                className="flex items-center gap-2"
                role="presentation"
              >
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: slice.color }}
                  role="presentation"
                />
                <span className="text-sm text-platform-fg">{slice.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
