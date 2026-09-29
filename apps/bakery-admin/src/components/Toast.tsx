import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { IconAdminApproved, IconAdminRejected, IconInteractionHelp } from './icons'

export type ToastVariant = 'success' | 'error' | 'info'

export type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
  /** Label for the optional undo action */
  undoLabel?: string
  onUndo?: () => void
  durationMs?: number
}

type ToastContextValue = {
  show: (item: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).slice(2)
      const duration = item.durationMs ?? (item.onUndo ? 5000 : 3000)
      setToasts((prev) => [...prev.slice(-3), { ...item, id }])
      const timer = setTimeout(() => {
        dismiss(id)
      }, duration)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((t) => {
        clearTimeout(t)
      })
    }
  }, [])

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          aria-atomic="false"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm"
        >
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              onDismiss={() => {
                dismiss(toast.id)
              }}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const bg =
    toast.variant === 'success'
      ? 'bg-green-50 border-green-200 text-green-900'
      : toast.variant === 'error'
        ? 'bg-red-50 border-red-200 text-red-900'
        : 'bg-blue-50 border-blue-200 text-blue-900'

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md animate-fade-in ${bg}`}
    >
      <span className="mt-0.5 shrink-0">
        {toast.variant === 'success' && <IconAdminApproved size="sm" color="success" alt="" />}
        {toast.variant === 'error' && <IconAdminRejected size="sm" color="error" alt="" />}
        {toast.variant === 'info' && <IconInteractionHelp size="sm" color="default" alt="" />}
      </span>
      <span className="flex-1 text-sm">{toast.message}</span>
      {toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo?.()
            onDismiss()
          }}
          className="shrink-0 text-sm font-medium underline"
        >
          {toast.undoLabel ?? 'Undo'}
        </button>
      )}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-sm opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
