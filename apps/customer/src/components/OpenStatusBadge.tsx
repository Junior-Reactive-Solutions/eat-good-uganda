import type { OpenStatusResult } from '../features/bakery/api'

interface Props {
  status: OpenStatusResult
}

export function OpenStatusBadge({ status }: Props) {
  if (status.status === 'open') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
        Open now
        {status.closes_at_local && (
          <span className="font-normal text-green-600"> · closes {status.closes_at_local}</span>
        )}
      </span>
    )
  }

  if (status.status === 'opens_soon') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        Opens soon
        {status.opens_at_local && (
          <span className="font-normal text-amber-600"> · at {status.opens_at_local}</span>
        )}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-platform-accent px-2.5 py-0.5 text-sm font-medium text-platform-fg-muted ring-1 ring-inset ring-platform-border">
      <span className="h-1.5 w-1.5 rounded-full bg-platform-fg-muted" aria-hidden="true" />
      Closed
      {status.opens_at_local && (
        <span className="font-normal"> · opens {status.opens_at_local}</span>
      )}
    </span>
  )
}
