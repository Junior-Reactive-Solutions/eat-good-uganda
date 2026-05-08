import type { ProductVariant } from '@eatgood/shared'

interface VariantManagerProps {
  variants: ProductVariant[]
  isLoading?: boolean
}

export function VariantManager({ variants, isLoading = false }: VariantManagerProps) {
  // Sort variants by sort_order ascending
  const sortedVariants = [...variants].sort((a, b) => a.sort_order - b.sort_order)

  if (isLoading) {
    return (
      <div className="rounded-lg border border-platform-border bg-platform-surface p-4">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-platform-bg rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (variants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-platform-border bg-platform-surface p-8 text-center">
        <p className="text-sm text-platform-fg-muted">
          No variants yet. Variants will appear here once they are created.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-platform-border bg-platform-surface overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-platform-border bg-platform-bg">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-platform-fg">Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-platform-fg">
              Price (UGX)
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-platform-fg">SKU</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-platform-fg">
              Sort Order
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-platform-fg">
              Available
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-platform-border">
          {sortedVariants.map((variant) => (
            <tr key={variant.id} className="hover:bg-platform-bg/50 transition-colors">
              <td className="px-4 py-3 text-sm text-platform-fg font-medium">{variant.name}</td>
              <td className="px-4 py-3 text-sm text-platform-fg">
                {new Intl.NumberFormat('en-UG', {
                  style: 'currency',
                  currency: 'UGX',
                  minimumFractionDigits: 0,
                }).format(variant.price_minor / 100)}
              </td>
              <td className="px-4 py-3 text-sm text-platform-fg-muted">{variant.sku || 'N/A'}</td>
              <td className="px-4 py-3 text-sm text-platform-fg-muted">{variant.sort_order}</td>
              <td className="px-4 py-3">
                {variant.is_available ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    Unavailable
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
