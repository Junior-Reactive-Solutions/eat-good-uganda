import { useParams } from 'react-router-dom'

export default function OrderDetailPage() {
  const { id } = useParams()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Order {id}</h1>
      <p className="text-platform-fg-muted mb-8">Order details and management</p>

      <div className="bg-white rounded-lg border border-platform-border p-12 text-center">
        <p className="text-platform-fg-muted">Order detail coming in Phase 2...</p>
      </div>
    </div>
  )
}
