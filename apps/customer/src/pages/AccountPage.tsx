import { useMe } from '../features/auth/hooks'
import { PageHeader } from '../components/PageHeader'

export default function AccountPage() {
  const { data: me } = useMe()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader heading="My account" {...(me?.email ? { subheading: me.email } : {})} />
      <p className="text-sm text-platform-fg-muted">Account settings coming soon.</p>
    </div>
  )
}
