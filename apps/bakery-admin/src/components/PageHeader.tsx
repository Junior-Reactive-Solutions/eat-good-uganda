type Props = {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: Props) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-platform-fg">{title}</h1>
      {subtitle && <p className="text-platform-fg-muted mt-1">{subtitle}</p>}
    </div>
  )
}
