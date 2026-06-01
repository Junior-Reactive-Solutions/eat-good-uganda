import { type JSX } from 'react'

import { ChartSkeleton } from './ChartSkeleton'

export interface BarChartData {
  label: string
  value: number
  color?: string
}

export interface BarChartProps {
  data: BarChartData[]
  width?: number
  height?: number
  title?: string
  yAxisLabel?: string
  xAxisLabel?: string
  showValues?: boolean
  maxValue?: number
  isLoading?: boolean
}

export function BarChart({
  data,
  width = 400,
  height = 300,
  title,
  yAxisLabel,
  xAxisLabel,
  showValues = true,
  maxValue,
  isLoading = false,
}: BarChartProps): JSX.Element {
  if (isLoading) {
    return <ChartSkeleton width={width} height={height} />
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-platform-fg-muted">No data available</p>
      </div>
    )
  }

  const calculatedMaxValue = maxValue || Math.max(...data.map((d) => d.value))
  const padding = { top: 40, right: 20, bottom: 60, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const barWidth = chartWidth / data.length
  const barPadding = barWidth * 0.1
  const actualBarWidth = barWidth - barPadding * 2

  const chartDescription = title
    ? `${title} showing ${String(data.length)} bars with values from 0 to ${String(calculatedMaxValue)}`
    : `Bar chart showing ${String(data.length)} bars with values from 0 to ${String(calculatedMaxValue)}`

  return (
    <div className="flex flex-col items-start gap-4">
      {title && <h3 className="text-lg font-semibold text-platform-fg">{title}</h3>}
      <svg
        width={width}
        height={height}
        className="border border-platform-border rounded"
        role="img"
        aria-label={chartDescription}
      >
        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="currentColor"
          className="text-platform-border"
          strokeWidth={1}
        />

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="currentColor"
          className="text-platform-border"
          strokeWidth={1}
        />

        {/* Y-axis ticks and labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, idx) => {
          const y = height - padding.bottom - tick * chartHeight
          const value = Math.round(calculatedMaxValue * tick)
          return (
            <g key={`y-tick-${String(idx)}`}>
              <line
                x1={String(padding.left - 5)}
                y1={String(y)}
                x2={String(padding.left)}
                y2={String(y)}
                stroke="currentColor"
                className="text-platform-border"
                strokeWidth={1}
              />
              <text
                x={String(padding.left - 10)}
                y={String(y)}
                textAnchor="end"
                dy="0.3em"
                className="text-xs text-platform-fg-muted"
              >
                {String(value)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.value / calculatedMaxValue) * chartHeight
          const x = padding.left + index * barWidth + barPadding
          const y = height - padding.bottom - barHeight

          return (
            <g key={`bar-${String(index)}`}>
              <rect
                x={String(x)}
                y={String(y)}
                width={String(actualBarWidth)}
                height={String(barHeight)}
                fill={item.color || 'var(--chart-primary)'}
                className="hover:opacity-80 transition-opacity"
                role="presentation"
              />
              <title>
                {item.label}: {item.value}
              </title>
              {showValues && (
                <text
                  x={String(x + actualBarWidth / 2)}
                  y={String(y - 5)}
                  textAnchor="middle"
                  className="text-xs font-semibold text-platform-fg"
                >
                  {String(item.value)}
                </text>
              )}
            </g>
          )
        })}

        {/* X-axis labels */}
        {data.map((item, index) => {
          const x = padding.left + index * barWidth + barWidth / 2

          return (
            <text
              key={`x-label-${String(index)}`}
              x={String(x)}
              y={String(height - padding.bottom + 20)}
              textAnchor="middle"
              className="text-xs text-platform-fg-muted"
            >
              {item.label}
            </text>
          )
        })}

        {/* Y-axis label */}
        {yAxisLabel && (
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${String(height / 2)})`}
            className="text-xs text-platform-fg-muted"
          >
            {yAxisLabel}
          </text>
        )}

        {/* X-axis label */}
        {xAxisLabel && (
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-xs text-platform-fg-muted"
          >
            {xAxisLabel}
          </text>
        )}
      </svg>
    </div>
  )
}
