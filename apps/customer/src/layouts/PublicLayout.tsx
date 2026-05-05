import { ShoppingCart, User, UtensilsCrossed } from 'lucide-react'
import { Link, Outlet, useMatch } from 'react-router-dom'

import logo from '../assets/brand/logo.svg'
import { useMe } from '../features/auth/hooks'
import { BakeryThemeProvider } from '../features/bakery/BakeryThemeProvider'

function Nav() {
  const { data: me } = useMe()

  return (
    <header className="sticky top-0 z-40 border-b border-platform-border bg-platform-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platform-primary rounded-lg"
        >
          <img src={logo} alt="Eat Good Uganda" className="h-8 w-auto" />
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <Link
            to="/"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-platform-fg-muted hover:bg-platform-accent hover:text-platform-fg transition-colors sm:block"
          >
            All bakeries
          </Link>
          <Link
            to="/about"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-platform-fg-muted hover:bg-platform-accent hover:text-platform-fg transition-colors md:block"
          >
            About
          </Link>
          <Link
            to={me ? '/account' : '/login'}
            aria-label={me ? 'My account' : 'Log in'}
            className="rounded-lg p-2 text-platform-fg-muted hover:bg-platform-accent hover:text-platform-fg transition-colors"
          >
            <User className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            to="/b/cart"
            aria-label="Shopping cart"
            className="rounded-lg p-2 text-platform-fg-muted hover:bg-platform-accent hover:text-platform-fg transition-colors"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-platform-border bg-platform-surface">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-platform-primary" aria-hidden="true" />
            <span className="font-semibold text-platform-fg">Eat Good Uganda</span>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-platform-fg-muted"
          >
            <Link to="/about" className="hover:text-platform-fg transition-colors">
              About
            </Link>
            <Link to="/contact" className="hover:text-platform-fg transition-colors">
              Contact
            </Link>
            <Link to="/privacy" className="hover:text-platform-fg transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-platform-fg transition-colors">
              Terms
            </Link>
          </nav>
        </div>
        <p className="mt-6 text-xs text-platform-fg-muted">
          © {new Date().getFullYear()} Eat Good Uganda. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export function PublicLayout() {
  const isBakeryRoute = useMatch('/b/:slug/*')

  return (
    <div className="flex min-h-screen flex-col bg-platform-bg">
      <Nav />
      <main className="flex-1">
        {isBakeryRoute ? (
          <BakeryThemeProvider>
            <Outlet />
          </BakeryThemeProvider>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  )
}
