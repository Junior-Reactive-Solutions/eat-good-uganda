import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '../components/Button'
import { useMe, useAuthSetup, logoutAdmin } from '../features/auth/hooks'

import {
  IconNavigationHome,
  IconAdminAnalytics,
  IconAdminAuditLog,
  IconAdminStaff,
  IconAdminCustomers,
  IconInteractionDownload,
  IconInteractionPhone,
  IconInteractionDelete,
  IconNavigationMenu,
} from '@/components/icons'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: me } = useMe()
  const navigate = useNavigate()
  const location = useLocation()
  useAuthSetup()

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutAdmin()
    } catch {
      // Error ignored, continue to logout anyway
    }
    // Navigate happens in both try and catch paths
    void navigate('/login')
  }

  const navGroups = [
    {
      label: 'Oversight',
      items: [
        { label: 'Dashboard', icon: IconNavigationHome, path: '/dashboard' },
        { label: 'Bakeries', icon: IconAdminAnalytics, path: '/bakeries' },
        { label: 'Users', icon: IconAdminCustomers, path: '/users' },
        { label: 'Support', icon: IconInteractionPhone, path: '/support' },
      ],
    },
    {
      label: 'Governance',
      items: [
        { label: 'Audit Logs', icon: IconAdminAuditLog, path: '/audit-logs' },
        { label: 'Staff', icon: IconAdminStaff, path: '/staff' },
        { label: 'Exports', icon: IconInteractionDownload, path: '/exports' },
      ],
    },
  ]

  // Breadcrumb label for the current route, so the header stops saying
  // "Admin Dashboard" on every page.
  const currentLabel =
    navGroups
      .flatMap((g) => g.items)
      .find((item) => location.pathname.startsWith(item.path))?.label ?? 'Dashboard'

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
            <p className="text-sm text-white/70 mt-1">Super Admin</p>
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
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleLogout().catch(() => {
                  // Handle logout error silently
                })
              }}
              className="w-full justify-start text-white hover:bg-white/10"
            >
              <IconInteractionDelete size="sm" color="default" alt="" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-platform-surface border-b border-platform-border p-4 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            <span className="text-platform-fg-muted">Eat Good Uganda</span>
            <span aria-hidden="true" className="text-platform-border">
              /
            </span>
            <span aria-current="page" className="font-semibold text-platform-fg">
              {currentLabel}
            </span>
          </nav>
          <Button
            variant="ghost"
            onClick={() => {
              setSidebarOpen(!sidebarOpen)
            }}
            className="md:hidden"
          >
            {sidebarOpen ? (
              <IconInteractionDelete size="md" color="default" alt="" />
            ) : (
              <IconNavigationMenu size="md" color="default" alt="" />
            )}
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
