import { Menu, X, LogOut, LayoutDashboard, ClipboardList, Package } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { Button } from '../components/Button'
import { useBakery } from '../contexts/bakery'
import { useMe } from '../features/auth/hooks'

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: me } = useMe()
  const { bakeryId } = useBakery()
  const navigate = useNavigate()

  const handleLogout = () => {
    // TODO: Implement logout (clear auth cookie, invalidate query)
    localStorage.removeItem('auth_token')
    void navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Orders', icon: ClipboardList, path: '/orders' },
    { label: 'Menu', icon: Package, path: '/menu' },
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
              <p className="text-xs text-white/60 capitalize">{me?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
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
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex-1" />
          <div className="text-sm text-platform-fg-muted">
            Bakery ID: <span className="font-mono text-xs">{bakeryId}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
