import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as apiModule from '../../lib/api'

import {
  useAccountSettings,
  useUpdateNotificationPreferences,
  useUpdateLanguagePreference,
  useUpdatePrivacyMode,
  useChangePassword,
  useSendEmailVerification,
  accountQueryKeys,
} from './api'
import type { AccountSettings } from './api'

const mockSettings: AccountSettings = {
  id: 'customer-1',
  email: 'test@example.com',
  email_verified: true,
  phone: '+256701234567',
  full_name: 'Test User',
  marketing_opt_in: true,
  notification_preferences: {
    email_orders: true,
    email_promotions: true,
    sms_orders: false,
  },
  language: 'en',
  privacy_mode: false,
  created_at: new Date('2026-05-01'),
  updated_at: new Date('2026-05-02'),
}

const createWrapper = () => {
  const queryClient = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('accountQueryKeys', () => {
  it('generates correct keys', () => {
    expect(accountQueryKeys.all).toEqual(['account'])
    expect(accountQueryKeys.settings).toEqual(['account', 'settings'])
  })
})

describe('useAccountSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches account settings', async () => {
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockSettings })

    const { result } = renderHook(() => useAccountSettings(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockSettings)
    expect(mockGet).toHaveBeenCalledWith('/v1/customer/account-settings')
  })

  it('handles errors correctly', async () => {
    const error = new Error('Failed to fetch settings')
    vi.spyOn(apiModule.api, 'get').mockRejectedValue(error)

    const { result } = renderHook(() => useAccountSettings(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useUpdateNotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates notification preferences', async () => {
    const mockPatch = vi.spyOn(apiModule.api, 'patch').mockResolvedValue({ data: mockSettings })

    const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper: createWrapper() })

    result.current.mutate({
      email_orders: false,
      email_promotions: true,
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockPatch).toHaveBeenCalledWith(
      '/v1/customer/account-settings',
      expect.objectContaining({
        notification_preferences: {
          email_orders: false,
          email_promotions: true,
        },
      }),
    )
  })
})

describe('useUpdateLanguagePreference', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates language preference', async () => {
    const mockPatch = vi.spyOn(apiModule.api, 'patch').mockResolvedValue({
      data: { ...mockSettings, language: 'sw' as const },
    })

    const { result } = renderHook(() => useUpdateLanguagePreference(), { wrapper: createWrapper() })

    result.current.mutate('sw')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockPatch).toHaveBeenCalledWith(
      '/v1/customer/account-settings',
      { language: 'sw' },
    )
  })
})

describe('useUpdatePrivacyMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates privacy mode', async () => {
    const mockPatch = vi.spyOn(apiModule.api, 'patch').mockResolvedValue({
      data: { ...mockSettings, privacy_mode: true },
    })

    const { result } = renderHook(() => useUpdatePrivacyMode(), { wrapper: createWrapper() })

    result.current.mutate(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockPatch).toHaveBeenCalledWith(
      '/v1/customer/account-settings',
      { privacy_mode: true },
    )
  })
})

describe('useChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('changes password successfully', async () => {
    const mockPost = vi.spyOn(apiModule.api, 'post').mockResolvedValue({
      data: { message: 'Password changed successfully' },
    })

    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() })

    result.current.mutate({
      current_password: 'oldpass123',
      new_password: 'newpass456',
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockPost).toHaveBeenCalledWith(
      '/v1/customer/account-settings/change-password',
      expect.objectContaining({
        current_password: 'oldpass123',
        new_password: 'newpass456',
      }),
    )
  })

  it('handles password change error', async () => {
    const error = new Error('Current password is incorrect')
    vi.spyOn(apiModule.api, 'post').mockRejectedValue(error)

    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() })

    result.current.mutate({
      current_password: 'wrongpass',
      new_password: 'newpass456',
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useSendEmailVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends email verification', async () => {
    const mockPost = vi.spyOn(apiModule.api, 'post').mockResolvedValue({
      data: { message: 'Verification email sent' },
    })

    const { result } = renderHook(() => useSendEmailVerification(), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockPost).toHaveBeenCalledWith('/v1/customer/account-settings/verify-email')
  })
})
