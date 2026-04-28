import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Heart, LogOut, Package, User } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { api } from '../lib/api'
import { useMe } from '../features/auth/hooks'
import logo from '../assets/brand/logo.svg'

const navItems = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package, end: false },
  { to: '/account/favourites', label: 'Favourites', icon: Heart, end: false },
]

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
      navigate('/')
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
        {me && (
          <p className="mb-4 truncate text-sm text-platform-fg-muted">{me.email}</p>
        )}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-platform-fg-muted hover:bg-platform-accent hover:text-platform-fg transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
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
