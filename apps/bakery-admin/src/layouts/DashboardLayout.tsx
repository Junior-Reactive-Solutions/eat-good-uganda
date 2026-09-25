import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Button } from '../components/Button'
import { useBakery } from '../contexts/bakery'
import { useMe, useAuthSetup } from '../features/auth/hooks'
import { api } from '../lib/api'

import {
  IconNavigationHome,
  IconNavigationSettings,
  IconAdminCustomers,
  IconAdminInventory,
  IconInteractionDelete,
  IconNavigationMenu,
  IconPaymentGeneric,
} from '@/components/icons'

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: me } = useMe()
  const { bakeryId } = useBakery()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useAuthSetup()

  const initials = (me?.full_name ?? me?.email ?? 'B')
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    api
      .post('/v1/bakery/auth/logout')
      .catch(() => null)
      .finally(() => {
        queryClient.clear()
        void navigate('/login')
      })
  }

  const navGroups = [
    {
      label: 'Operate',
      items: [
        { label: 'Dashboard', icon: IconNavigationHome, path: '/dashboard' },
        { label: 'Orders', icon: IconAdminCustomers, path: '/orders' },
        { label: 'Menu', icon: IconAdminInventory, path: '/menu' },
      ],
    },
    {
      label: 'Configure',
      items: [
        { label: 'Settings', icon: IconNavigationSettings, path: '/settings' },
        { label: 'Payments', icon: IconPaymentGeneric, path: '/payment-setup' },
      ],
    },
  ]

  return (
    <div className="flex h-screen bg-platform-surface">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-platform-fg text-white transform transition-transform duration-300 ease-in-out z-50 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/10">
            <h1 className="text-xl font-semibold">Eat Good Uganda</h1>
            <p className="text-sm text-white/70 mt-1">Bakery Admin</p>
          </div>

          {/* Navigation Menu */}
          <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-1">
                <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setSidebarOpen(false)
                        }}
                        className={({ isActive }) =>
                          [
                            'relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platform-primary',
                            isActive
                              ? 'bg-white/10 text-white'
                              : 'text-white/75 hover:bg-white/5 hover:text-white',
                          ].join(' ')
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span
                                aria-hidden="true"
                                className="absolute -left-3 bottom-1.5 top-1.5 w-[3px] rounded-r bg-platform-primary"
                              />
                            )}
                            <ItemIcon size="md" color="default" alt="" />
                            {item.label}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer - User Info & Logout */}
          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="text-sm">
              <p className="text-white/70">Logged in as</p>
              <p className="font-medium truncate">{me?.full_name || me?.email}</p>
              <p className="text-xs text-white/60 capitalize">{me?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-white hover:bg-white/10"
            >
              <IconInteractionDelete size="sm" color="default" alt="" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => {
            setSidebarOpen(false)
          }}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-platform-border px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen)
            }}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-platform-accent transition-colors"
          >
            {sidebarOpen ? (
              <IconInteractionDelete size="md" color="default" alt="" />
            ) : (
              <IconNavigationMenu size="md" color="default" alt="" />
            )}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(bakeryId).catch(() => null)
            }}
            title="Copy bakery ID for support"
            className="inline-flex min-h-[36px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-platform-fg-muted transition-colors hover:bg-platform-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platform-primary"
          >
            <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-platform-primary text-[11px] font-bold text-white">
              {initials}
            </span>
            <span className="text-left leading-tight">
              <span className="block text-[13px] font-semibold text-platform-fg">
                {me?.full_name ?? 'Bakery'}
              </span>
              <span className="block font-mono text-[10px] text-platform-fg-muted">
                {bakeryId ? `${bakeryId.slice(0, 8)}…` : '—'}
              </span>
            </span>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
