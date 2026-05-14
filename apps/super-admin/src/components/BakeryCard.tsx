import { CheckCircle, PauseCircle, RotateCcw, Store } from 'lucide-react'

import type { BakeryListItem } from '../features/bakeries/api'

import { BakeryStatusBadge } from './BakeryStatusBadge'
import { Button } from './Button'

interface BakeryCardProps {
  bakery: BakeryListItem
  onViewDetails: () => void
  onApprove?: () => void
  onSuspend?: () => void
  onReactivate?: () => void
}

export function BakeryCard({
  bakery,
  onViewDetails,
  onApprove,
  onSuspend,
  onReactivate,
}: BakeryCardProps) {
  return (
    <div className="rounded-lg border border-platform-border bg-platform-surface p-4 transition-shadow hover:shadow-md">
      {/* Header with logo and basic info */}
      <div className="mb-4 flex gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          {bakery.logo_url ? (
            <img
              src={bakery.logo_url}
              alt={bakery.display_name}
              className="h-16 w-16 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = ''
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-platform-accent">
              <Store className="h-8 w-8 text-platform-fg-muted" />
            </div>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-platform-fg">{bakery.display_name}</h3>
          <p className="text-sm text-platform-fg-muted">@{bakery.slug}</p>
          <p className="text-sm text-platform-fg-muted">{bakery.city}</p>
          <p className="truncate text-sm text-platform-fg-muted">{bakery.email}</p>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          <BakeryStatusBadge status={bakery.status} approvedAt={bakery.approved_at} />
        </div>
      </div>

      {/* Contact info */}
      <div className="mb-4 flex gap-4 text-sm text-platform-fg-muted">
        <span>{bakery.phone}</span>
        {bakery.created_at && (
          <span>Created {new Date(bakery.created_at).toLocaleDateString()}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onViewDetails}>
          View Details
        </Button>

        {bakery.status === 'pending_approval' && onApprove && (
          <Button variant="primary" size="sm" onClick={onApprove} className="gap-1">
            <CheckCircle className="h-4 w-4" />
            Approve
          </Button>
        )}

        {bakery.status === 'active' && onSuspend && (
          <Button variant="danger" size="sm" onClick={onSuspend} className="gap-1">
            <PauseCircle className="h-4 w-4" />
            Suspend
          </Button>
        )}

        {bakery.status === 'suspended' && onReactivate && (
          <Button variant="secondary" size="sm" onClick={onReactivate} className="gap-1">
            <RotateCcw className="h-4 w-4" />
            Reactivate
          </Button>
        )}
      </div>
    </div>
  )
}
