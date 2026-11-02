import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  /** Primary action button rendered flush-right of the title block */
  primaryAction?: ReactNode
}

export function PageHeader({ title, subtitle, primaryAction }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-platform-fg">{title}</h1>
        {subtitle && <p className="text-sm text-platform-fg-muted mt-0.5">{subtitle}</p>}
      </div>
      {primaryAction && <div className="shrink-0">{primaryAction}</div>}
    </div>
  )
}
