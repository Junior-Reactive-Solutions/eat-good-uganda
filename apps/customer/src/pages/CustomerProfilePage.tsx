import { useCustomerProfile, useUpdateProfile } from '../features/profile/api'
import { ProfileForm } from '../components/ProfileForm'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'

export default function CustomerProfilePage() {
  const { data: profile, isLoading, error } = useCustomerProfile()
  const updateProfile = useUpdateProfile()

  const handleSubmit = (data: any) => {
    updateProfile.mutate(data)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading="My Profile"
        subheading="Update your personal information"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-platform-error bg-red-50 p-4">
          <p className="text-sm text-platform-error">
            {error instanceof Error ? error.message : 'Failed to load profile'}
          </p>
        </div>
      )}

      {!isLoading && profile && (
        <Card className="rounded-lg border border-platform-border bg-platform-surface p-6">
          <ProfileForm
            profile={profile}
            isLoading={updateProfile.isPending}
            onSubmit={handleSubmit}
          />

          {updateProfile.isError && (
            <div className="mt-4 rounded-lg border border-platform-error bg-red-50 p-4">
              <p className="text-sm text-platform-error">
                {updateProfile.error instanceof Error
                  ? updateProfile.error.message
                  : 'Failed to update profile'}
              </p>
            </div>
          )}

          {updateProfile.isSuccess && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">
                Profile updated successfully!
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
