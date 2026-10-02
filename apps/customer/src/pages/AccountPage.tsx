import { Link } from 'react-router-dom'

import {
  IconNavigationOrders,
  IconNavigationProfile,
  IconNavigationSettings,
  IconDeliveryLocation,
  IconInteractionClock,
  IconAdminApproved,
  IconAdminRejected,
} from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { PageMeta } from '../components/PageMeta'
import { useMe } from '../features/auth/hooks'
import { useCustomerOrders } from '../features/orders/api'

import type { IconProps } from '@/types/icon'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for collection',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

function formatUGX(minor: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(minor / 100)
}

type QuickLink = {
  to: string
  icon: React.FC<Omit<IconProps, 'children'>>
  label: string
  description: string
}

const QUICK_LINKS: QuickLink[] = [
  {
    to: '/account/profile',
    icon: IconNavigationProfile,
    label: 'Profile',
    description: 'Name, email and phone',
  },
  {
    to: '/account/orders',
    icon: IconNavigationOrders,
    label: 'Orders',
    description: 'Your order history',
  },
  {
    to: '/account/addresses',
    icon: IconDeliveryLocation,
    label: 'Addresses',
    description: 'Saved delivery addresses',
  },
  {
    to: '/account/settings',
    icon: IconNavigationSettings,
    label: 'Settings',
    description: 'Notifications and preferences',
  },
]

export default function AccountPage() {
  const { data: me } = useMe()
  const { data: recentOrders } = useCustomerOrders({ pageSize: 1 })
  const latestOrder = recentOrders?.items[0]

  const firstName = me?.full_name ? me.full_name.split(' ')[0] : undefined
  const greeting = firstName ? `Hi, ${firstName}` : 'My account'

  return (
    <div className="flex flex-col gap-8">
      <PageMeta title="My account" noIndex />
      <PageHeader heading={greeting} {...(me?.email ? { subheading: me.email } : {})} />

      {/* Quick-action grid */}
      <nav aria-label="Account sections">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map(({ to, icon: Icon, label, description }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex flex-col gap-2 rounded-xl border border-platform-border bg-platform-surface p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platform-primary focus-visible:ring-offset-2"
              >
                <Icon size="md" color="primary" alt="" />
                <span className="text-sm font-semibold text-platform-fg">{label}</span>
                <span className="text-xs text-platform-fg-muted">{description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Latest order peek */}
      {latestOrder && (
        <section aria-labelledby="recent-order-heading">
          <h2
            id="recent-order-heading"
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-platform-fg-muted"
          >
            Most recent order
          </h2>
          <Link
            to={`/account/orders/${latestOrder.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-platform-border bg-platform-surface p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platform-primary focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              {latestOrder.status === 'delivered' ? (
                <IconAdminApproved size="sm" color="success" alt="" />
              ) : latestOrder.status === 'cancelled' || latestOrder.status === 'refunded' ? (
                <IconAdminRejected size="sm" color="error" alt="" />
              ) : (
                <IconInteractionClock size="sm" color="default" alt="" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-platform-fg truncate">
                  Order {latestOrder.order_number}
                </p>
                <p className="text-xs text-platform-fg-muted">
                  {STATUS_LABELS[latestOrder.status] ?? latestOrder.status}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold text-platform-fg">
              {formatUGX(latestOrder.total_minor)}
            </span>
          </Link>
        </section>
      )}
    </div>
  )
}
