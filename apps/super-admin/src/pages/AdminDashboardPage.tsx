import { DollarSign, Store, Users, ShoppingCart } from 'lucide-react'

import { DashboardCard } from '../components/DashboardCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAdminDashboard } from '../features/admin/api'

export default function AdminDashboardPage() {
  const { data: dashboardData, isLoading, error } = useAdminDashboard()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !dashboardData) {
    return (
      <div className="rounded-lg border border-platform-error bg-red-50 p-4">
        <p className="text-sm text-platform-error">Failed to load dashboard metrics</p>
      </div>
    )
  }

  const metrics = dashboardData.metrics
  const revenueChange =
    metrics.totalRevenuePreviousMonth > 0
      ? ((metrics.totalRevenueThisMonth - metrics.totalRevenuePreviousMonth) /
          metrics.totalRevenuePreviousMonth) *
        100
      : 0

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-platform-fg">Dashboard</h1>
        <p className="text-platform-fg-muted mt-1">Platform metrics and overview</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          label="Total Bakeries"
          value={metrics.totalBakeries}
          icon={<Store className="h-6 w-6" />}
          trend={{ direction: 'up', percentage: 5 }}
        />

        <DashboardCard
          label="Active Bakeries"
          value={metrics.totalActiveBakeries}
          icon={<Store className="h-6 w-6" />}
          trend={{ direction: 'up', percentage: 3 }}
        />

        <DashboardCard
          label="Total Customers"
          value={metrics.totalCustomers}
          icon={<Users className="h-6 w-6" />}
          trend={{ direction: 'up', percentage: 12 }}
        />

        <DashboardCard
          label="Orders (This Month)"
          value={metrics.totalOrdersThisMonth}
          icon={<ShoppingCart className="h-6 w-6" />}
          trend={{ direction: 'up', percentage: 8 }}
        />
      </div>

      {/* Revenue Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardCard
          label="Revenue (This Month)"
          value={`UGX ${(metrics.totalRevenueThisMonth / 100).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{
            direction: revenueChange >= 0 ? 'up' : 'down',
            percentage: Math.abs(Math.round(revenueChange)),
          }}
        />

        <DashboardCard
          label="Revenue (Previous Month)"
          value={`UGX ${(metrics.totalRevenuePreviousMonth / 100).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
        />
      </div>

      {/* Placeholder for future sections */}
      <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
        <h3 className="text-lg font-semibold text-platform-fg mb-4">Recent Activity</h3>
        <p className="text-sm text-platform-fg-muted">
          Additional charts, analytics, and activity logs will be added in future phases.
        </p>
      </div>
    </div>
  )
}
