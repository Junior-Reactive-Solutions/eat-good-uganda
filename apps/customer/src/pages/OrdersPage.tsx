import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader heading="My orders" />
      <EmptyState heading="No orders yet" body="When you place an order it will appear here." />
    </div>
  )
}
