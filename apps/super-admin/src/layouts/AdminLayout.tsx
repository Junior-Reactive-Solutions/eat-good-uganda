import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { Button } from '../components/Button'
import { useMe } from '../features/auth/hooks'
import { logoutAdmin } from '../features/auth/hooks'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: me } = useMe()
  const navigate = useNavigate()

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutAdmin()
    } catch {
      // Error ignored, continue to logout anyway
    }
    // Navigate happens in both try and catch paths
    void navigate('/login')
  }

  const navItems = [{ label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }]

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
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      void navigate(item.path)
                      setSidebarOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left hover:bg-white/10 transition-colors text-sm font-medium"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                )
              })}
            </div>
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
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-platform-surface border-b border-platform-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-platform-fg">Admin Dashboard</h2>
          <Button
            variant="ghost"
            onClick={() => {
              setSidebarOpen(!sidebarOpen)
            }}
            className="md:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
