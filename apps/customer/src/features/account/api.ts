import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

/**
 * Notification preferences structure
 */
export interface NotificationPreferences {
  email_orders: boolean
  email_promotions: boolean
  sms_orders: boolean
}

/**
 * Account settings structure
 */
export interface AccountSettings {
  id: string
  email: string
  email_verified: boolean
  phone: string | null
  full_name: string | null
  marketing_opt_in: boolean
  notification_preferences: NotificationPreferences
  language: 'en' | 'sw' | 'lg'
  privacy_mode: boolean
  created_at: Date
  updated_at: Date
}

/**
 * Query key factory for account settings
 */
export const accountQueryKeys = {
  all: ['account'] as const,
  settings: ['account', 'settings'] as const,
}

/**
 * Fetch account settings
 */
export const useAccountSettings = () => {
  return useQuery({
    queryKey: accountQueryKeys.settings,
    queryFn: async () => {
      const { data } = await api.get<AccountSettings>('/v1/customer/account-settings')
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Update notification preferences
 */
export interface UpdateNotificationPreferencesInput {
  email_orders?: boolean
  email_promotions?: boolean
  sms_orders?: boolean
}

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: UpdateNotificationPreferencesInput) => {
      const { data } = await api.patch<AccountSettings>(
        '/v1/customer/account-settings',
        { notification_preferences: preferences },
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.settings })
    },
  })
}

/**
 * Update language preference
 */
export const useUpdateLanguagePreference = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (language: 'en' | 'sw' | 'lg') => {
      const { data } = await api.patch<AccountSettings>(
        '/v1/customer/account-settings',
        { language },
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.settings })
    },
  })
}

/**
 * Update privacy mode
 */
export const useUpdatePrivacyMode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (privacy_mode: boolean) => {
      const { data } = await api.patch<AccountSettings>(
        '/v1/customer/account-settings',
        { privacy_mode },
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.settings })
    },
  })
}

/**
 * Change password
 */
export interface ChangePasswordInput {
  current_password: string
  new_password: string
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const { data } = await api.post<{ message: string }>(
        '/v1/customer/account-settings/change-password',
        input,
      )
      return data
    },
  })
}

/**
 * Send email verification
 */
export const useSendEmailVerification = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ message: string }>(
        '/v1/customer/account-settings/verify-email',
      )
      return data
    },
  })
}

/**
 * Send phone OTP
 */
export const useSendPhoneOTP = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ message: string }>(
        '/v1/customer/account-settings/verify-phone',
      )
      return data
    },
  })
}
