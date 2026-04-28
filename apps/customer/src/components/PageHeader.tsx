type Props = {
  heading: string
  subheading?: string
  actions?: React.ReactNode
}

export function PageHeader({ heading, subheading, actions }: Props) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-platform-fg">{heading}</h1>
        {subheading && <p className="mt-0.5 text-sm text-platform-fg-muted">{subheading}</p>}
      </div>
      {actions && <div className="mt-3 flex gap-2 sm:mt-0">{actions}</div>}
    </div>
  )
}
