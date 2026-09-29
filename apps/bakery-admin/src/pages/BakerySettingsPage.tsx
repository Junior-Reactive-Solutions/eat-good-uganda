import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'

import { BakerySettingsForm } from '../components/BakerySettingsForm'
import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import { useShortcutPrefs } from '../components/ShortcutProvider'
import { useToast } from '../components/Toast'
import { useBakeryProfile, useUpdateBakeryProfile } from '../features/settings/api'

function AccessibilitySection() {
  const { singleKeyShortcutsEnabled, setSingleKeyShortcutsEnabled } = useShortcutPrefs()

  return (
    <section className="rounded-lg border border-platform-border bg-platform-surface p-6">
      <h2 className="text-base font-semibold text-platform-fg mb-1">Accessibility</h2>
      <p className="text-sm text-platform-fg-muted mb-5">
        Keyboard behaviour and motion preferences for this browser.
      </p>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-platform-fg">Single-key shortcuts</p>
          <p className="text-xs text-platform-fg-muted mt-0.5">
            Allows navigation with{' '}
            <kbd className="font-mono text-xs border border-platform-border rounded px-1">?</kbd>{' '}
            and{' '}
            <kbd className="font-mono text-xs border border-platform-border rounded px-1">g</kbd>{' '}
            sequences. Disable this if shortcuts interfere with assistive technology. (WCAG 2.1.4)
          </p>
        </div>
        <button
          role="switch"
          aria-checked={singleKeyShortcutsEnabled}
          onClick={() => {
            setSingleKeyShortcutsEnabled(!singleKeyShortcutsEnabled)
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-platform-primary ${
            singleKeyShortcutsEnabled ? 'bg-platform-primary' : 'bg-platform-border'
          }`}
        >
          <span className="sr-only">
            {singleKeyShortcutsEnabled ? 'Disable' : 'Enable'} single-key shortcuts
          </span>
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
              singleKeyShortcutsEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </section>
  )
}

export default function BakerySettingsPage() {
  const { data: profile, isLoading, error } = useBakeryProfile()
  const updateProfile = useUpdateBakeryProfile()
  const { show } = useToast()
  const [isDirty, setIsDirty] = useState(false)

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(isDirty && !updateProfile.isPending)

  useEffect(() => {
    if (updateProfile.isSuccess) {
      show({ message: 'Settings saved successfully.', variant: 'success' })
      setIsDirty(false)
    }
  }, [updateProfile.isSuccess, show])

  useEffect(() => {
    if (updateProfile.isError) {
      show({
        message:
          updateProfile.error instanceof Error
            ? updateProfile.error.message
            : 'Failed to save settings.',
        variant: 'error',
      })
    }
  }, [updateProfile.isError, updateProfile.error, show])

  const handleSubmit = (data: Parameters<typeof updateProfile.mutate>[0]) => {
    updateProfile.mutate(data)
  }

  return (
    <div className="space-y-6 p-8 pb-24">
      <PageHeader title="Bakery Settings" subtitle="Manage your bakery profile and branding" />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-platform-error bg-red-50 p-4">
          <p className="text-sm text-platform-error">
            {error instanceof Error ? error.message : 'Failed to load settings'}
          </p>
        </div>
      )}

      {!isLoading && profile && (
        <section className="rounded-lg border border-platform-border bg-platform-surface p-6">
          <BakerySettingsForm
            profile={profile}
            isLoading={updateProfile.isPending}
            onSubmit={handleSubmit}
            onDirtyChange={setIsDirty}
          />
        </section>
      )}

      <AccessibilitySection />

      {/* Sticky save bar — appears when the form has unsaved changes */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-4 border-t border-platform-border bg-platform-surface/95 px-8 py-4 backdrop-blur-sm">
          <p className="text-sm text-platform-fg-muted">You have unsaved changes.</p>
          <Button type="submit" form="bakery-settings-form" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      )}

      {/* Navigation guard dialog */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-platform-border bg-platform-surface p-6 shadow-xl">
            <h2 className="text-base font-semibold text-platform-fg mb-2">Discard changes?</h2>
            <p className="text-sm text-platform-fg-muted mb-6">
              You have unsaved changes. If you leave now, they will be lost.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  blocker.reset()
                }}
              >
                Keep editing
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  blocker.proceed()
                }}
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
