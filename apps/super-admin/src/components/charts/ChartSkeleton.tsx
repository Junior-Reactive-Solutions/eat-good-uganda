import { type JSX } from 'react'

export interface ChartSkeletonProps {
  width?: number
  height?: number
  showLegend?: boolean
}

export function ChartSkeleton({
  width = 400,
  height = 300,
  showLegend = false,
}: ChartSkeletonProps): JSX.Element {
  const totalHeight = showLegend ? height + 80 : height

  return (
    <div className="flex flex-col items-start gap-4" style={{ width }}>
      {/* Title skeleton */}
      <div className="h-6 w-32 rounded bg-platform-border/50 animate-pulse" />

      {/* Chart skeleton */}
      <div
        className="w-full rounded border border-platform-border bg-platform-surface"
        style={{ height: totalHeight }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded bg-platform-border/50 animate-pulse" />
            <div className="h-3 w-24 rounded bg-platform-border/50 animate-pulse" />
            <div className="h-3 w-24 rounded bg-platform-border/50 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Legend skeleton */}
      {showLegend && (
        <div className="flex w-full flex-wrap gap-3 justify-center">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-platform-border/50 animate-pulse" />
              <div className="h-4 w-16 rounded bg-platform-border/50 animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
