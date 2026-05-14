interface BakeryStatusBadgeProps {
  status: 'pending_approval' | 'active' | 'suspended' | 'archived'
  approvedAt?: string | null
  className?: string
}

export function BakeryStatusBadge({ status, approvedAt, className = '' }: BakeryStatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending Approval'
      case 'active':
        return 'Active'
      case 'suspended':
        return 'Suspended'
      case 'archived':
        return 'Archived'
      default:
        return status
    }
  }

  const styles = getStatusStyles(status)
  const label = getStatusLabel(status)

  return (
    <div className={className}>
      <span
        role="status"
        aria-label={`Status: ${label}`}
        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${styles}`}
      >
        {label}
      </span>
      {status === 'active' && approvedAt && (
        <p className="mt-1 text-xs text-platform-fg-muted">
          Approved {new Date(approvedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
