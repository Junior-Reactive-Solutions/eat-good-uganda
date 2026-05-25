import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import logo from '../assets/brand/logo.svg'
import {
  IconNavigationProfile,
  IconNavigationOrders,
  IconNavigationFavorites,
  IconInteractionPhone,
} from '../components/icons'
import { useMe } from '../features/auth/hooks'
import { api } from '../lib/api'

type NavItem = {
  to: string
  label: string
  iconName: 'profile' | 'orders' | 'favorites'
  end: boolean
}

const navItems: NavItem[] = [
  { to: '/account', label: 'Profile', iconName: 'profile', end: true },
  { to: '/account/orders', label: 'Orders', iconName: 'orders', end: false },
  { to: '/account/favourites', label: 'Favourites', iconName: 'favorites', end: false },
]

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'profile':
      return IconNavigationProfile
    case 'orders':
      return IconNavigationOrders
    case 'favorites':
      return IconNavigationFavorites
    default:
      return IconNavigationProfile
  }
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-platform-accent text-platform-fg'
      : 'text-platform-fg-muted hover:bg-platform-accent hover:text-platform-fg',
  ].join(' ')

export function AccountLayout() {
  const { data: me } = useMe()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const logout = useMutation({
    mutationFn: () => api.post('/v1/customer/auth/logout'),
    onSuccess: () => {
      queryClient.setQueryData(['me'], null)
      void navigate('/')
    },
    onError: () => toast.error('Logout failed. Try again.'),
  })

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:gap-8">
      <aside className="w-full shrink-0 md:w-56" aria-label="Account navigation">
        <div className="mb-4 flex items-center gap-2">
          <Link to="/">
            <img src={logo} alt="Eat Good Uganda" className="h-7 w-auto" />
          </Link>
        </div>
        {me && <p className="mb-4 truncate text-sm text-platform-fg-muted">{me.email}</p>}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, iconName, end }) => {
            const Icon = getIcon(iconName)
            return (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon size="sm" color="default" alt="" className="shrink-0" />
                {label}
              </NavLink>
            )
          })}
          <button
            onClick={() => {
              logout.mutate()
            }}
            disabled={logout.isPending}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-platform-fg-muted hover:bg-platform-accent hover:text-platform-fg transition-colors disabled:opacity-50"
          >
            <IconInteractionPhone size="sm" color="default" alt="" className="shrink-0" />
            {logout.isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
