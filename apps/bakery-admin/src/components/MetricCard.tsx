import { Card } from './Card'

interface MetricCardProps {
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down'
    percentage: number
  }
  icon?: React.ReactNode
  subtitle?: string
}

export function MetricCard({ label, value, trend, icon, subtitle }: MetricCardProps) {
  return (
    <Card className="rounded-lg border border-platform-border bg-platform-surface p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-platform-fg-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-platform-fg">{value}</p>
          {subtitle && <p className="text-xs text-platform-fg-muted mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-platform-fg-muted">{icon}</div>}
      </div>

      {trend && (
        <div className="flex items-center gap-1">
          <span
            className={`text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
          </span>
          <span className="text-sm text-platform-fg-muted">vs last month</span>
        </div>
      )}
    </Card>
  )
}
