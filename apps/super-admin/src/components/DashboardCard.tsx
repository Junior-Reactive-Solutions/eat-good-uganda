import { TrendingUp, TrendingDown } from 'lucide-react'

interface DashboardCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { direction: 'up' | 'down'; percentage: number }
  loading?: boolean
}

export function DashboardCard({ label, value, icon, trend, loading = false }: DashboardCardProps) {
  return (
    <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-platform-fg-muted mb-1">{label}</p>
          {loading ? (
            <div className="h-8 w-20 bg-platform-border rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-platform-fg">{value}</p>
          )}
        </div>
        {icon && <div className="text-platform-fg-muted">{icon}</div>}
      </div>

      {trend && (
        <div className="flex items-center gap-1">
          {trend.direction === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span
            className={`text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.percentage}%
          </span>
          <span className="text-sm text-platform-fg-muted">vs last month</span>
        </div>
      )}
    </div>
  )
}
