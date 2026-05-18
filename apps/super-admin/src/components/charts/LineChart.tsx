import { type JSX } from 'react'

export interface LineChartData {
  label: string
  value: number
}

export interface LineChartProps {
  data: LineChartData[]
  width?: number
  height?: number
  title?: string
  yAxisLabel?: string
  xAxisLabel?: string
  showPoints?: boolean
  showValues?: boolean
  lineColor?: string
  maxValue?: number
}

export function LineChart({
  data,
  width = 400,
  height = 300,
  title,
  yAxisLabel,
  xAxisLabel,
  showPoints = true,
  showValues = false,
  lineColor = '#3b82f6',
  maxValue,
}: LineChartProps): JSX.Element {
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

  // Calculate points
  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth
    const y = height - padding.bottom - (item.value / calculatedMaxValue) * chartHeight
    return { ...item, x, y }
  })

  // Create path data
  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toString()} ${p.y.toString()}`)
    .join(' ')

  return (
    <div className="flex flex-col items-start gap-4">
      {title && <h3 className="text-lg font-semibold text-platform-fg">{title}</h3>}
      <svg width={width} height={height} className="border border-platform-border rounded">
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

        {/* Grid lines and Y-axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, idx) => {
          const y = height - padding.bottom - tick * chartHeight
          const value = Math.round(calculatedMaxValue * tick)
          return (
            <g key={`y-tick-${String(idx)}`}>
              <line
                x1={String(padding.left)}
                y1={String(y)}
                x2={String(width - padding.right)}
                y2={String(y)}
                stroke="currentColor"
                className="text-platform-border"
                strokeWidth={1}
                opacity={0.1}
              />
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

        {/* Line path */}
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          className="hover:stroke-opacity-80 transition-opacity"
        />

        {/* Area under line (light fill) */}
        <path
          d={`${pathData} L ${String(points[points.length - 1]?.x || padding.left + chartWidth)} ${String(height - padding.bottom)} L ${String(padding.left)} ${String(height - padding.bottom)} Z`}
          fill={lineColor}
          opacity={0.05}
        />

        {/* Points */}
        {showPoints &&
          points.map((point, index) => (
            <g key={`point-${String(index)}`}>
              <circle
                cx={String(point.x)}
                cy={String(point.y)}
                r={4}
                fill={lineColor}
                className="hover:r-5 transition-all"
              />
              {showValues && (
                <text
                  x={String(point.x)}
                  y={String(point.y - 10)}
                  textAnchor="middle"
                  className="text-xs font-semibold text-platform-fg"
                >
                  {String(point.value)}
                </text>
              )}
            </g>
          ))}

        {/* X-axis labels */}
        {points.map((point, index) => {
          // Show every other label if too many points
          const shouldShow = data.length <= 6 || index % Math.ceil(data.length / 6) === 0
          return shouldShow ? (
            <text
              key={`x-label-${String(index)}`}
              x={String(point.x)}
              y={String(height - padding.bottom + 20)}
              textAnchor="middle"
              className="text-xs text-platform-fg-muted"
            >
              {point.label}
            </text>
          ) : (
            <g key={`x-label-${String(index)}`} />
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
