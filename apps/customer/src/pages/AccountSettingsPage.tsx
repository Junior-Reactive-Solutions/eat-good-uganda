import { useState } from 'react'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import {
  IconInteractionBellNotification,
  IconInteractionPhone,
  IconNavigationSettings,
  IconAdminApproved,
  IconAdminRejected,
} from '../components/icons'
import { Input as InputComponent } from '../components/Input'
import { LoadingSpinner } from '../components/LoadingSpinner'
import {
  useAccountSettings,
  useUpdateNotificationPreferences,
  useUpdateLanguagePreference,
  useUpdatePrivacyMode,
  useChangePassword,
  useSendEmailVerification,
} from '../features/account/api'

export default function AccountSettingsPage() {
  const { data: settings, isLoading, error } = useAccountSettings()
  const updateNotificationPrefs = useUpdateNotificationPreferences()
  const updateLanguage = useUpdateLanguagePreference()
  const updatePrivacyMode = useUpdatePrivacyMode()
  const changePassword = useChangePassword()
  const sendEmailVerification = useSendEmailVerification()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const handleNotificationChange = (key: string, value: boolean) => {
    if (!settings) return
    updateNotificationPrefs.mutate({
      ...settings.notification_preferences,
      [key]: value,
    })
  }

  const handleLanguageChange = (language: 'en' | 'sw' | 'lg') => {
    updateLanguage.mutate(language)
  }

  const handlePrivacyModeChange = (value: boolean) => {
    updatePrivacyMode.mutate(value)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    changePassword.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          setPasswordSuccess('Password changed successfully!')
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        },
        onError: (err) => {
          setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-900 font-medium">
          Failed to load account settings
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-platform-fg">Account Settings</h1>
        <p className="mt-2 text-platform-fg-muted">
          Manage your account preferences, security, and notifications
        </p>
      </div>

      {/* Email Verification */}
      {settings && !settings.email_verified && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex items-start gap-3">
          <IconAdminRejected size="sm" color="warning" className="flex-shrink-0" alt="" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900">Verify your email</h3>
            <p className="text-sm text-yellow-800 mt-1">
              Your email address has not been verified yet. Click the button below to send a verification link.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => { sendEmailVerification.mutate(); }}
              disabled={sendEmailVerification.isPending}
            >
              {sendEmailVerification.isPending ? 'Sending...' : 'Send Verification Email'}
            </Button>
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <IconInteractionBellNotification size="sm" color="default" alt="" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-platform-fg">Notifications</h2>
            <p className="text-sm text-platform-fg-muted">
              Control how you receive updates about your orders
            </p>
          </div>
        </div>

        {settings && (
          <div className="space-y-4 border-t border-platform-border pt-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-platform-fg">Order Updates via Email</p>
                <p className="text-sm text-platform-fg-muted">
                  Get notifications about order status changes
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notification_preferences.email_orders}
                onChange={(e) => { handleNotificationChange('email_orders', e.target.checked); }}
                disabled={updateNotificationPrefs.isPending}
                className="w-5 h-5 rounded border-platform-border"
              />
            </div>

            {/* Promotional Emails */}
            <div className="flex items-center justify-between py-3 border-t border-platform-border/50">
              <div>
                <p className="font-medium text-platform-fg">Promotional Emails</p>
                <p className="text-sm text-platform-fg-muted">
                  Receive special offers and promotions from bakeries
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notification_preferences.email_promotions}
                onChange={(e) => { handleNotificationChange('email_promotions', e.target.checked); }}
                disabled={updateNotificationPrefs.isPending}
                className="w-5 h-5 rounded border-platform-border"
              />
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between py-3 border-t border-platform-border/50">
              <div>
                <p className="font-medium text-platform-fg">Order Updates via SMS</p>
                <p className="text-sm text-platform-fg-muted">
                  Get SMS alerts for important order updates (requires phone number)
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notification_preferences.sms_orders}
                onChange={(e) => { handleNotificationChange('sms_orders', e.target.checked); }}
                disabled={updateNotificationPrefs.isPending || !settings.phone}
                className="w-5 h-5 rounded border-platform-border"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Security Settings */}
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <IconAdminApproved size="sm" color="success" alt="" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-platform-fg">Security</h2>
            <p className="text-sm text-platform-fg-muted">
              Update your password and manage security settings
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 border-t border-platform-border pt-4">
          {passwordSuccess && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
              <IconAdminApproved size="sm" color="success" className="flex-shrink-0" alt="" />
              <p className="text-sm text-green-800">{passwordSuccess}</p>
            </div>
          )}

          {passwordError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <IconAdminRejected size="sm" color="error" className="flex-shrink-0" alt="" />
              <p className="text-sm text-red-800">{passwordError}</p>
            </div>
          )}

          <InputComponent
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); }}
            placeholder="Enter your current password"
            disabled={changePassword.isPending}
            required
          />

          <InputComponent
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); }}
            placeholder="Enter your new password (min 8 characters)"
            disabled={changePassword.isPending}
            required
          />

          <InputComponent
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); }}
            placeholder="Confirm your new password"
            disabled={changePassword.isPending}
            required
          />

          <Button
            type="submit"
            disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
          >
            {changePassword.isPending ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </Card>

      {/* Language Preference */}
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <IconNavigationSettings size="sm" color="default" alt="" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-platform-fg">Language</h2>
            <p className="text-sm text-platform-fg-muted">
              Choose your preferred language
            </p>
          </div>
        </div>

        {settings && (
          <div className="border-t border-platform-border pt-4">
            <select
              value={settings.language}
              onChange={(e) => { handleLanguageChange(e.target.value as 'en' | 'sw' | 'lg'); }}
              disabled={updateLanguage.isPending}
              className="w-full rounded-md border border-platform-border bg-platform-bg px-3 py-2 text-platform-fg disabled:opacity-50"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="lg">Luganda</option>
            </select>
            <p className="text-xs text-platform-fg-muted mt-2">
              {updateLanguage.isPending ? 'Updating...' : 'Changes applied automatically'}
            </p>
          </div>
        )}
      </Card>

      {/* Privacy Settings */}
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <IconInteractionPhone size="sm" color="default" alt="" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-platform-fg">Privacy</h2>
            <p className="text-sm text-platform-fg-muted">
              Control how your information is used
            </p>
          </div>
        </div>

        {settings && (
          <div className="border-t border-platform-border pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-platform-fg">Privacy Mode</p>
                <p className="text-sm text-platform-fg-muted">
                  Hide your profile from other users (coming soon)
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy_mode}
                onChange={(e) => { handlePrivacyModeChange(e.target.checked); }}
                disabled={updatePrivacyMode.isPending}
                className="w-5 h-5 rounded border-platform-border"
              />
            </div>

            <div className="border-t border-platform-border/50 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-platform-fg">Marketing Opt-in</p>
                  <p className="text-sm text-platform-fg-muted">
                    Allow us to send you special offers and promotions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.marketing_opt_in}
                  disabled
                  className="w-5 h-5 rounded border-platform-border opacity-50"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Account Info */}
      <Card>
        <h2 className="text-lg font-semibold text-platform-fg mb-4">Account Information</h2>

        {settings && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2 border-b border-platform-border/50">
              <span className="text-platform-fg-muted">Email</span>
              <span className="text-platform-fg font-medium">{settings.email}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-platform-border/50">
              <span className="text-platform-fg-muted">Email Status</span>
              <span className={`font-medium ${settings.email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                {settings.email_verified ? 'Verified' : 'Not Verified'}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-platform-border/50">
              <span className="text-platform-fg-muted">Account Created</span>
              <span className="text-platform-fg">
                {new Date(settings.created_at).toLocaleDateString('en-UG')}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-platform-fg-muted">Last Updated</span>
              <span className="text-platform-fg">
                {new Date(settings.updated_at).toLocaleDateString('en-UG')}
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
