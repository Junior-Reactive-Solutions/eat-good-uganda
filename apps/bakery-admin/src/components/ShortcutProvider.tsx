import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  IconInteractionHelp,
  IconNavigationHome,
  IconNavigationMenu,
  IconNavigationOrders,
  IconNavigationSearch,
  IconNavigationSettings,
  IconPaymentGeneric,
  IconAdminCustomers,
} from './icons'

const PREF_KEY = 'eatgood:singleKeyShortcuts'

function readPref(): boolean {
  try {
    const stored = localStorage.getItem(PREF_KEY)
    return stored === null ? true : stored === 'true'
  } catch {
    return true
  }
}

function writePref(value: boolean) {
  try {
    localStorage.setItem(PREF_KEY, String(value))
  } catch {
    // storage unavailable
  }
}

type ShortcutContextValue = {
  singleKeyShortcutsEnabled: boolean
  setSingleKeyShortcutsEnabled: (enabled: boolean) => void
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null)

export function useShortcutPrefs(): ShortcutContextValue {
  const ctx = useContext(ShortcutContext)
  if (!ctx) throw new Error('useShortcutPrefs must be used inside ShortcutProvider')
  return ctx
}

type NavItem = {
  label: string
  path: string
  shortcut: string
  Icon: React.FC<{ size: 'sm'; color: 'default'; alt: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', shortcut: 'g d', Icon: IconNavigationHome },
  { label: 'Orders', path: '/orders', shortcut: 'g o', Icon: IconNavigationOrders },
  { label: 'Menu', path: '/menu', shortcut: 'g m', Icon: IconNavigationMenu },
  { label: 'Customers', path: '/customers', shortcut: 'g c', Icon: IconAdminCustomers },
  { label: 'Settings', path: '/settings', shortcut: 'g s', Icon: IconNavigationSettings },
  { label: 'Payments', path: '/payments', shortcut: 'g p', Icon: IconPaymentGeneric },
]

// Modifier-key shortcuts that are always active
const G_SEQUENCES: Record<string, string> = {
  d: '/',
  o: '/orders',
  m: '/menu',
  c: '/customers',
  s: '/settings',
  p: '/payments',
}

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(readPref)
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const gPending = useRef(false)
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const setSingleKeyShortcutsEnabled = useCallback((val: boolean) => {
    setEnabled(val)
    writePref(val)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      // Cmd/Ctrl+K — always active (uses modifier)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault()
        setPaletteOpen((v) => !v)
        setQuery('')
        return
      }

      // Escape — close any open overlay
      if (e.key === 'Escape') {
        setCheatSheetOpen(false)
        setPaletteOpen(false)
        gPending.current = false
        if (gTimer.current) clearTimeout(gTimer.current)
        return
      }

      // Single-key shortcuts gated by preference and not-in-input
      if (!enabled || inInput) return

      // `?` — open cheat sheet
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setCheatSheetOpen((v) => !v)
        return
      }

      // `g` sequences
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey && !gPending.current) {
        gPending.current = true
        if (gTimer.current) clearTimeout(gTimer.current)
        gTimer.current = setTimeout(() => {
          gPending.current = false
        }, 800)
        return
      }

      if (gPending.current) {
        gPending.current = false
        if (gTimer.current) clearTimeout(gTimer.current)
        const dest = G_SEQUENCES[e.key]
        if (dest) {
          e.preventDefault()
          void navigate(dest)
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [enabled, navigate])

  // Focus palette input when opened
  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [paletteOpen])

  const filtered = query
    ? NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : NAV_ITEMS

  return (
    <ShortcutContext.Provider
      value={{ singleKeyShortcutsEnabled: enabled, setSingleKeyShortcutsEnabled }}
    >
      {children}

      {/* Command Palette */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => {
            setPaletteOpen(false)
          }}
        >
          <div
            className="bg-platform-surface border border-platform-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-platform-border">
              <IconNavigationSearch size="sm" color="default" alt="" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                }}
                placeholder="Go to…"
                className="flex-1 bg-transparent text-platform-fg placeholder-platform-fg-muted outline-none text-sm"
              />
              <kbd className="text-xs text-platform-fg-muted border border-platform-border rounded px-1.5 py-0.5">
                Esc
              </kbd>
            </div>
            <ul role="listbox" className="py-1 max-h-64 overflow-y-auto">
              {filtered.map((item) => (
                <li key={item.path}>
                  <button
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      setPaletteOpen(false)
                      void navigate(item.path)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-platform-fg hover:bg-platform-accent transition-colors"
                  >
                    <item.Icon size="sm" color="default" alt="" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <kbd className="text-xs text-platform-fg-muted">{item.shortcut}</kbd>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Keyboard Cheat Sheet */}
      {cheatSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setCheatSheetOpen(false)
          }}
        >
          <div
            className="bg-platform-surface border border-platform-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-platform-border">
              <div className="flex items-center gap-2">
                <IconInteractionHelp size="sm" color="default" alt="" />
                <h2 className="text-sm font-semibold text-platform-fg">Keyboard shortcuts</h2>
              </div>
              <button
                onClick={() => {
                  setCheatSheetOpen(false)
                }}
                aria-label="Close"
                className="text-platform-fg-muted hover:text-platform-fg"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <section>
                <p className="text-xs font-medium text-platform-fg-muted uppercase tracking-wide mb-2">
                  Navigation
                </p>
                <div className="space-y-1.5">
                  {NAV_ITEMS.map((item) => (
                    <ShortcutRow
                      key={item.path}
                      label={`Go to ${item.label}`}
                      keys={item.shortcut.split(' ')}
                    />
                  ))}
                </div>
              </section>
              <section>
                <p className="text-xs font-medium text-platform-fg-muted uppercase tracking-wide mb-2">
                  Global
                </p>
                <div className="space-y-1.5">
                  <ShortcutRow label="Open command palette" keys={['⌘', 'K']} />
                  <ShortcutRow label="Show this cheat sheet" keys={['?']} />
                  <ShortcutRow label="Close overlay" keys={['Esc']} />
                </div>
              </section>
            </div>

            {!enabled && (
              <p className="px-5 pb-4 text-xs text-platform-fg-muted">
                Single-key shortcuts are disabled. Enable them in Settings → Accessibility.
              </p>
            )}
          </div>
        </div>
      )}
    </ShortcutContext.Provider>
  )
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-platform-fg">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="text-xs font-mono text-platform-fg-muted border border-platform-border rounded px-1.5 py-0.5"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  )
}
