import { useEffect, useState } from 'react'

import { BakerySettingsForm } from '../components/BakerySettingsForm'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import { useBakeryProfile, useUpdateBakeryProfile } from '../features/settings/api'

export default function BakerySettingsPage() {
  const { data: profile, isLoading, error } = useBakeryProfile()
  const updateProfile = useUpdateBakeryProfile()
  const [successMessage, setSuccessMessage] = useState(false)

  // Clear success message after 3 seconds
  useEffect(() => {
    if (updateProfile.isSuccess) {
      setSuccessMessage(true)
      const timer = setTimeout(() => setSuccessMessage(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [updateProfile.isSuccess])

  const handleSubmit = (data: any) => {
    updateProfile.mutate(data)
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Bakery Settings"
        subtitle="Manage your bakery profile and branding"
      />

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
        <>
          <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
            <BakerySettingsForm
              profile={profile}
              isLoading={updateProfile.isPending}
              onSubmit={handleSubmit}
            />
          </div>

          {updateProfile.isError && (
            <div className="rounded-lg border border-platform-error bg-red-50 p-4">
              <p className="text-sm text-platform-error">
                {updateProfile.error instanceof Error
                  ? updateProfile.error.message
                  : 'Failed to update settings'}
              </p>
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">
                Settings saved successfully!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
