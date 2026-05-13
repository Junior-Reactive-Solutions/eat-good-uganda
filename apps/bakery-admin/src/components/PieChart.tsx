interface PieChartProps {
  data: Array<{
    label: string
    value: number
  }>
  title: string
  colors?: string[]
}

export function PieChart({
  data,
  title,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
}: PieChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-platform-border bg-platform-surface p-6 flex items-center justify-center h-96">
        <p className="text-sm text-platform-fg-muted">No data available</p>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Calculate pie slices
  let currentAngle = -Math.PI / 2
  const slices = data.map((item) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    currentAngle = endAngle

    const startX = 150 + 120 * Math.cos(startAngle)
    const startY = 150 + 120 * Math.sin(startAngle)
    const endX = 150 + 120 * Math.cos(endAngle)
    const endY = 150 + 120 * Math.sin(endAngle)

    const largeArc = sliceAngle > Math.PI ? '1' : '0'
    const startXStr = startX.toString()
    const startYStr = startY.toString()
    const endXStr = endX.toString()
    const endYStr = endY.toString()

    return {
      path: `M 150 150 L ${startXStr} ${startYStr} A 120 120 0 ${largeArc} 1 ${endXStr} ${endYStr} Z`,
      midAngle: startAngle + sliceAngle / 2,
      percentage: ((item.value / total) * 100).toFixed(1),
      item,
    }
  })

  return (
    <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
      <h3 className="text-lg font-semibold text-platform-fg mb-4">
        {title}
      </h3>

      <div className="flex gap-8">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {slices.map((slice, index) => {
            const textXNum = 150 + 80 * Math.cos(slice.midAngle)
            const textYNum = 150 + 80 * Math.sin(slice.midAngle)
            const textX = textXNum.toString()
            const textY = textYNum.toString()
            return (
              <g key={`slice-${index}`}>
                <path
                  d={slice.path}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="white"
                >
                  {slice.percentage}
                  %
                </text>
              </g>
            )
          })}
        </svg>

        <div className="flex flex-col gap-2 justify-center">
          {slices.map((slice, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-platform-fg">
                {slice.item.label}: {slice.item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
