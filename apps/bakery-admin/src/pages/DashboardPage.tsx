import { useBakery } from '../contexts/bakery'

export default function DashboardPage() {
  const { bakeryId } = useBakery()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-platform-fg-muted mb-8">Welcome to your bakery admin dashboard</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-platform-border p-6">
          <div className="text-sm text-platform-fg-muted mb-1">Total Orders</div>
          <div className="text-3xl font-bold">—</div>
        </div>
        <div className="bg-white rounded-lg border border-platform-border p-6">
          <div className="text-sm text-platform-fg-muted mb-1">Total Revenue</div>
          <div className="text-3xl font-bold">—</div>
        </div>
        <div className="bg-white rounded-lg border border-platform-border p-6">
          <div className="text-sm text-platform-fg-muted mb-1">Active Products</div>
          <div className="text-3xl font-bold">—</div>
        </div>
        <div className="bg-white rounded-lg border border-platform-border p-6">
          <div className="text-sm text-platform-fg-muted mb-1">Pending Orders</div>
          <div className="text-3xl font-bold">—</div>
        </div>
      </div>

      <div className="mt-8 text-sm text-platform-fg-muted">
        <p>
          Bakery ID: <code className="bg-platform-accent px-2 py-1 rounded">{bakeryId}</code>
        </p>
        <p className="mt-2">Metrics and analytics coming in Phase 4...</p>
      </div>
    </div>
  )
}
