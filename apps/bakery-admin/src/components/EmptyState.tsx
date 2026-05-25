import { IconAdminInventory } from './icons'

type Props = {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-platform-border bg-platform-accent/30 px-6 py-12 text-center">
      <div className="flex justify-center mb-4">
        {icon || <IconAdminInventory size="lg" color="default" alt="" />}
      </div>
      <h3 className="text-lg font-semibold text-platform-fg mb-2">{title}</h3>
      <p className="text-sm text-platform-fg-muted mb-6">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}
