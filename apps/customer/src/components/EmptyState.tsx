type Props = {
  heading: string
  body?: string
  action?: React.ReactNode
}

export function EmptyState({ heading, body, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="text-4xl" aria-hidden="true">🍞</div>
      <h2 className="text-lg font-semibold text-platform-fg">{heading}</h2>
      {body && <p className="max-w-sm text-sm text-platform-fg-muted">{body}</p>}
      {action}
    </div>
  )
}
