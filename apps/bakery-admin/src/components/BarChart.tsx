interface BarChartProps {
  data: Array<{
    label: string
    value: number
  }>
  title: string
  height?: number
  color?: string
}

export function BarChart({
  data,
  title,
  height = 300,
  color = '#3b82f6',
}: BarChartProps) {
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

  return (
    <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
      <h3 className="text-lg font-semibold text-platform-fg mb-4">
        {title}
      </h3>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${(data.length * 60).toString()} ${(height).toString()}`}
        className="overflow-x-auto"
      >
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 60)
          const barHeightStr = barHeight.toString()
          const xNum = index * 60 + 10
          const yNum = height - barHeight - 40
          const labelXNum = index * 60 + 30
          const labelYNum = height - 10
          const valueYNum = height - barHeight - 45
          const x = xNum.toString()
          const y = yNum.toString()
          const labelX = labelXNum.toString()
          const labelY = labelYNum.toString()
          const valueY = valueYNum.toString()

          return (
            <g key={`bar-${index}`}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width="40"
                height={barHeightStr}
                fill={color}
                rx="4"
              />
              {/* Label */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize="12"
                fill="#666"
              >
                {item.label}
              </text>
              {/* Value */}
              <text
                x={labelX}
                y={valueY}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#333"
              >
                {item.value.toString()}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
