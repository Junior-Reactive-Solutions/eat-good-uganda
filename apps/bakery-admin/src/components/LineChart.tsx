interface LineChartProps {
  data: Array<{
    label: string
    value: number
  }>
  title: string
  height?: number
  color?: string
}

export function LineChart({
  data,
  title,
  height = 300,
  color = '#10b981',
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="rounded-lg border border-platform-border bg-platform-surface p-6 flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-sm text-platform-fg-muted">No data available</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value))
  const padding = 50
  const width = Math.max(data.length * 60, 400)
  const chartHeight = height - padding * 2

  // Generate path points
  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * (width - padding * 2) + padding
      const y =
        height -
        (item.value / (maxValue || 1)) * chartHeight -
        padding
      return `${x.toString()},${y.toString()}`
    })
    .join(' ')

  return (
    <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
      <h3 className="text-lg font-semibold text-platform-fg mb-4">
        {title}
      </h3>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width.toString()} ${height.toString()}`}
        className="overflow-x-auto"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const gridYNum = height - ratio * chartHeight - padding
          const gridY = gridYNum.toString()
          const x1Str = padding.toString()
          const x2Str = (width - padding).toString()
          return (
            <line
              key={`grid-${i}`}
              x1={x1Str}
              y1={gridY}
              x2={x2Str}
              y2={gridY}
              stroke="#e5e7eb"
              strokeDasharray="5,5"
            />
          )
        })}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />

        {/* Points */}
        {data.map((item, index) => {
          const pointX = (index / (data.length - 1 || 1)) * (width - padding * 2) + padding
          const pointY =
            height -
            (item.value / (maxValue || 1)) * chartHeight -
            padding
          const pointXStr = pointX.toString()
          const pointYStr = pointY.toString()
          return (
            <circle
              key={`point-${index}`}
              cx={pointXStr}
              cy={pointYStr}
              r="4"
              fill={color}
            />
          )
        })}

        {/* Labels */}
        {data.map((item, index) => {
          const labelX = (index / (data.length - 1 || 1)) * (width - padding * 2) + padding
          const labelXStr = labelX.toString()
          const labelYStr = (height - 10).toString()
          return (
            <text
              key={`label-${index}`}
              x={labelXStr}
              y={labelYStr}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {item.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
