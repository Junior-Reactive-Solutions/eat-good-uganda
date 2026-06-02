import { type JSX } from 'react'

export interface MetricCardProps {
  title: string
  value: string | number
  suffix?: string
  prefix?: string
  icon?: React.ReactNode
  trend?: {
    direction: 'up' | 'down'
    percentage: number
    period?: string
  }
  loading?: boolean
  error?: string
  onClick?: () => void
  className?: string
  layout?: 'vertical' | 'horizontal'
  isCurrency?: boolean
}

/**
 * Format a number value for display
 * Handles comma-separated formatting and optional currency formatting
 */
function formatValue(value: number, isCurrency = false): string {
  if (isCurrency) {
    // Convert cents to dollars and format: 125000000 → "$1,250,000"
    const dollars = value / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(dollars)
  }
  // Format numbers: 5840 → "5,840"
  return new Intl.NumberFormat('en-US').format(value)
}

export function MetricCard({
  title,
  value,
  suffix,
  prefix,
  icon,
  trend,
  loading = false,
  error,
  onClick,
  className = '',
  layout = 'vertical',
  isCurrency = false,
}: MetricCardProps): JSX.Element {
  const isPositive = trend?.direction === 'up'
  const trendColor = isPositive ? 'text-platform-success' : 'text-platform-error'
  const trendBgColor = isPositive ? 'bg-platform-success/10' : 'bg-platform-error/10'

  const verticalLayout = layout === 'vertical'

  // Format value if it's a number
  const displayValue =
    typeof value === 'number' ? formatValue(value, isCurrency) : value

  // Generate aria-label for accessibility
  const ariaLabel = `${title}: ${displayValue}`

  return (
    <div
      className={`rounded-lg border border-platform-border bg-platform-surface p-6 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-platform-border-hover' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClick()
              }
            }
          : undefined
      }
    >
      <div
        className={`flex ${verticalLayout ? 'flex-col' : 'flex-row items-start justify-between'} gap-4`}
      >
        {/* Left section */}
        <div className={`flex-1 ${verticalLayout ? '' : 'flex flex-col'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-platform-fg-muted">{title}</p>
            {icon && !verticalLayout && <div className="text-platform-fg-muted ml-2">{icon}</div>}
          </div>

          {/* Value display */}
          {loading ? (
            <div className="h-8 w-24 bg-platform-border rounded animate-pulse" />
          ) : error ? (
            <p className="text-platform-error text-sm">{error}</p>
          ) : (
            <p className="text-3xl font-bold text-platform-fg mb-2 break-words">
              {prefix && <span className="text-lg">{prefix}</span>}
              {displayValue}
              {suffix && <span className="text-lg">{suffix}</span>}
            </p>
          )}

          {/* Trend indicator */}
          {trend && !loading && !error && (
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${trendBgColor} ${trendColor}`}
            >
              {isPositive ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M12 5.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L13 7.414V15a1 1 0 11-2 0V7.414L9.707 9.707a1 1 0 01-1.414-1.414l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M12 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L11 12.586V5a1 1 0 112 0v7.586l2.293-2.293a1 1 0 011.414 1.414l-4 4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>{trend.percentage}%</span>
              {trend.period && (
                <span className="text-xs text-platform-fg-muted ml-1">{trend.period}</span>
              )}
            </div>
          )}
        </div>

        {/* Right section - Icon for vertical layout */}
        {icon && verticalLayout && <div className="text-xl text-platform-fg-muted">{icon}</div>}
      </div>
    </div>
  )
}
