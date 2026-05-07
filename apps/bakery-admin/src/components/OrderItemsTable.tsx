import type { BakeryOrderDetailResponse } from '../features/orders/api'

interface OrderItemsTableProps {
  items: BakeryOrderDetailResponse['items']
}

function formatPrice(minor: number): string {
  return `UGX ${(minor / 100).toLocaleString('en-US')}`
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-platform-border bg-white p-6 text-center">
        <p className="text-platform-fg-muted">No items in this order</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-platform-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-platform-accent border-b border-platform-border">
            <th className="text-left px-4 py-3 font-semibold text-platform-fg">Product</th>
            <th className="text-center px-4 py-3 font-semibold text-platform-fg">Qty</th>
            <th className="text-right px-4 py-3 font-semibold text-platform-fg">Unit Price</th>
            <th className="text-right px-4 py-3 font-semibold text-platform-fg">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-platform-border">
          {items.map((item, idx) => (
            <tr key={idx} className="hover:bg-platform-accent/50">
              <td className="px-4 py-3">
                <div className="font-medium text-platform-fg">{item.product_name}</div>
                {item.variant_name && (
                  <div className="text-xs text-platform-fg-muted">{item.variant_name}</div>
                )}
              </td>
              <td className="text-center px-4 py-3 text-platform-fg">{item.quantity}</td>
              <td className="text-right px-4 py-3 text-platform-fg">
                {formatPrice(item.unit_price_minor)}
              </td>
              <td className="text-right px-4 py-3 font-medium text-platform-fg">
                {formatPrice(item.line_total_minor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
