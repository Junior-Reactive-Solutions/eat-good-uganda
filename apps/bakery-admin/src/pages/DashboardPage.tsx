import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react'

import { BarChart } from '../components/BarChart'
import { LineChart } from '../components/LineChart'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { MetricCard } from '../components/MetricCard'
import { PageHeader } from '../components/PageHeader'
import { PieChart } from '../components/PieChart'
import { useBakeryMetrics } from '../features/metrics/api'

export default function DashboardPage() {
  const { data: metrics, isLoading, error } = useBakeryMetrics()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="View your bakery metrics" />
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="View your bakery metrics" />
        <div className="rounded-lg border border-platform-error bg-red-50 p-4">
          <p className="text-sm text-platform-error">
            {error instanceof Error ? error.message : 'Failed to load metrics'}
          </p>
        </div>
      </div>
    )
  }

  // Format currency
  const formatCurrency = (minor: number) =>
    new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(minor / 100)

  // Prepare chart data
  const statusChartData = metrics.ordersByStatus.map((item) => ({
    label: item.status
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    value: item.count,
  }))

  const productChartData = metrics.topProducts.slice(0, 5).map((item) => {
    const label =
      item.productName.length > 15
        ? `${item.productName.slice(0, 15)}...`
        : item.productName
    return {
      label,
      value: item.unitsSold,
    }
  })

  const revenueChartData = metrics.revenueByDay.map((item) => ({
    label: new Date(item.date).toLocaleDateString('en-UG', {
      month: 'short',
      day: 'numeric',
    }),
    value: item.revenueMinor / 100,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle="View your bakery metrics and performance"
      />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Sales"
          value={formatCurrency(metrics.totalSalesMinor)}
          icon={<DollarSign className="h-6 w-6" />}
          subtitle="Current month"
        />

        <MetricCard
          label="Total Orders"
          value={metrics.totalOrdersCount}
          icon={<ShoppingCart className="h-6 w-6" />}
          subtitle="Current month"
        />

        <MetricCard
          label="Top Product"
          value={
            metrics.topProducts.length > 0
              ? metrics.topProducts[0].productName
              : 'N/A'
          }
          icon={<Package className="h-6 w-6" />}
          subtitle={
            metrics.topProducts.length > 0
              ? `${metrics.topProducts[0].unitsSold.toString()} sold`
              : 'No data'
          }
        />

        <MetricCard
          label="Revenue Trend"
          value={`${metrics.revenueByDay.length.toString()} days`}
          icon={<TrendingUp className="h-6 w-6" />}
          subtitle="Tracked this month"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Day */}
        <div>
          <LineChart
            data={revenueChartData}
            title="Revenue Trend"
            color="#10b981"
          />
        </div>

        {/* Orders by Status */}
        <div>
          <PieChart
            data={statusChartData}
            title="Orders by Status"
          />
        </div>

        {/* Top Products */}
        <div className="lg:col-span-2">
          <BarChart
            data={productChartData}
            title="Top 5 Products by Units Sold"
            color="#3b82f6"
          />
        </div>
      </div>

      {/* Top Products Table */}
      {metrics.topProducts.length > 0 && (
        <div className="rounded-lg border border-platform-border bg-platform-surface overflow-hidden">
          <div className="p-6 border-b border-platform-border">
            <h3 className="text-lg font-semibold text-platform-fg">
              Top Products
            </h3>
          </div>

          <table className="w-full">
            <thead className="bg-platform-bg border-b border-platform-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-platform-fg">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-platform-fg">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-platform-fg">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-platform-border">
              {metrics.topProducts.map((product) => (
                <tr
                  key={product.productId}
                  className="hover:bg-platform-bg/50 transition-colors"
                >
                  <td className="px-6 py-3 text-sm text-platform-fg font-medium">
                    {product.productName}
                  </td>
                  <td className="px-6 py-3 text-sm text-platform-fg">
                    {product.unitsSold}
                  </td>
                  <td className="px-6 py-3 text-sm text-platform-fg font-semibold">
                    {formatCurrency(product.totalRevenueMinor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
