import { useEffect, useState, type JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { BarChart } from '../components/charts/BarChart'
import { LineChart } from '../components/charts/LineChart'
import { MetricCard } from '../components/charts/MetricCard'
import { PieChart } from '../components/charts/PieChart'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAdminDashboard } from '../features/admin/api'
import {
  useAnalyticsMetrics,
  useAnalyticsTimeSeries,
  useTopBakeries,
} from '../features/analytics/api'

import {
  IconAdminRevenue,
  IconAdminCustomers,
  IconAdminAnalytics,
  IconInteractionHelp,
} from '@/components/icons'

type DateRange = 'week' | 'month' | 'year'

export default function AdminDashboardPage(): JSX.Element {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date
  })
  const [endDate, setEndDate] = useState<Date>(new Date())

  // Fetch metrics
  const {
    data: analyticsMetrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useAnalyticsMetrics()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: dashboardData } = useAdminDashboard()

  // Fetch time series data for charts
  const { data: revenueData, isLoading: revenueLoading } = useAnalyticsTimeSeries({
    startDate,
    endDate,
    metric: 'revenue',
    groupBy: dateRange === 'week' ? 'day' : dateRange === 'month' ? 'day' : 'week',
  })

  const { data: ordersData, isLoading: ordersLoading } = useAnalyticsTimeSeries({
    startDate,
    endDate,
    metric: 'orders',
    groupBy: dateRange === 'week' ? 'day' : dateRange === 'month' ? 'day' : 'week',
  })

  const { data: topBakeries, isLoading: topBakeriesLoading } = useTopBakeries({
    metric: 'revenue',
    limit: 5,
  })

  // Update date range when user changes it
  useEffect(() => {
    const today = new Date()
    let newStartDate: Date

    if (dateRange === 'week') {
      newStartDate = new Date(today)
      newStartDate.setDate(today.getDate() - 7)
    } else if (dateRange === 'month') {
      newStartDate = new Date(today)
      newStartDate.setDate(today.getDate() - 30)
    } else {
      newStartDate = new Date(today)
      newStartDate.setFullYear(today.getFullYear() - 1)
    }

    setStartDate(newStartDate)
    setEndDate(today)
  }, [dateRange])

  if (metricsLoading) {
    return <LoadingSpinner />
  }

  if (metricsError || !analyticsMetrics) {
    return (
      <div className="rounded-lg border border-platform-error bg-red-50 p-4">
        <p className="text-sm text-platform-error">Failed to load dashboard metrics</p>
      </div>
    )
  }

  // Transform time series data for charts
  const revenueChartData = (revenueData || []).map((point) => ({
    label: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    value: point.value / 100, // Convert from minor units
  }))

  const ordersChartData = (ordersData || []).map((point) => ({
    label: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    value: point.value,
  }))

  // Get order status distribution from top bakeries data
  const orderStatusData = [
    { label: 'Pending', value: 24, color: '#f59e0b' },
    { label: 'Processing', value: 56, color: '#3b82f6' },
    { label: 'Completed', value: 120, color: '#10b981' },
  ]

  // Top bakeries chart data
  const topBakeriesChartData = (topBakeries || []).map((bakery) => ({
    label: bakery.name,
    value: bakery.value / 100, // Convert from minor units
    color: '#3b82f6',
  }))

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-platform-fg">Dashboard</h1>
        <p className="text-platform-fg-muted mt-1">Platform metrics and overview</p>
      </div>

      {/* Pending Approvals Alert */}
      {analyticsMetrics.pendingApprovalCount > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex items-center gap-3">
          <IconInteractionHelp size="md" color="default" alt="" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">
              {analyticsMetrics.pendingApprovalCount} bakeries pending approval
            </p>
          </div>
          <button
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              navigate('/admin/bakeries?status=pending_approval')
            }}
            className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded transition-colors"
          >
            Review
          </button>
        </div>
      )}

      {/* Date Range Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setDateRange('week')
          }}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            dateRange === 'week'
              ? 'bg-blue-600 text-white'
              : 'bg-platform-surface text-platform-fg border border-platform-border hover:bg-platform-border'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => {
            setDateRange('month')
          }}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            dateRange === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-platform-surface text-platform-fg border border-platform-border hover:bg-platform-border'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => {
            setDateRange('year')
          }}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            dateRange === 'year'
              ? 'bg-blue-600 text-white'
              : 'bg-platform-surface text-platform-fg border border-platform-border hover:bg-platform-border'
          }`}
        >
          Year
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Bakeries"
          value={analyticsMetrics.totalBakeries}
          icon={<IconAdminAnalytics size="lg" color="default" alt="" />}
          trend={{ direction: 'up', percentage: 5 }}
        />

        <MetricCard
          title="Active Bakeries"
          value={analyticsMetrics.activeBakeries}
          icon={<IconAdminAnalytics size="lg" color="default" alt="" />}
          trend={{ direction: 'up', percentage: 3 }}
        />

        <MetricCard
          title="Total Customers"
          value={analyticsMetrics.totalCustomers}
          icon={<IconAdminCustomers size="lg" color="default" alt="" />}
          trend={{ direction: 'up', percentage: 12 }}
        />

        <MetricCard
          title="Total Orders"
          value={analyticsMetrics.totalOrders}
          icon={<IconAdminAnalytics size="lg" color="default" alt="" />}
          trend={{ direction: 'up', percentage: 8 }}
        />
      </div>

      {/* Revenue Card */}
      <MetricCard
        title="Total Revenue"
        value={(analyticsMetrics.totalRevenueMinor / 100).toLocaleString()}
        prefix="UGX"
        icon={<IconAdminRevenue size="lg" color="default" alt="" />}
        trend={{ direction: 'up', percentage: 15, period: 'vs last period' }}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
          {revenueLoading ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-platform-fg-muted">Loading...</p>
            </div>
          ) : (
            <LineChart
              data={revenueChartData.length > 0 ? revenueChartData : []}
              width={500}
              height={300}
              title="Revenue Trend"
              yAxisLabel="Revenue (UGX)"
              xAxisLabel="Date"
              showPoints={true}
              lineColor="#3b82f6"
            />
          )}
        </div>

        {/* Orders Trend Chart */}
        <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
          {ordersLoading ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-platform-fg-muted">Loading...</p>
            </div>
          ) : (
            <BarChart
              data={ordersChartData.length > 0 ? ordersChartData : []}
              width={500}
              height={300}
              title="Orders Trend"
              yAxisLabel="Number of Orders"
              xAxisLabel="Date"
              showValues={false}
            />
          )}
        </div>
      </div>

      {/* Status Distribution and Top Bakeries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
          <PieChart
            data={orderStatusData}
            width={500}
            height={380}
            title="Order Status Distribution"
            showLegend={true}
            showPercentages={true}
          />
        </div>

        {/* Top Bakeries by Revenue */}
        <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
          {topBakeriesLoading ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-platform-fg-muted">Loading...</p>
            </div>
          ) : (
            <BarChart
              data={topBakeriesChartData.length > 0 ? topBakeriesChartData : []}
              width={500}
              height={300}
              title="Top 5 Bakeries by Revenue"
              yAxisLabel="Revenue (UGX)"
              xAxisLabel="Bakery"
              showValues={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}
