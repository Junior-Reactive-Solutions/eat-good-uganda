import type { CustomerDetail } from '@eatgood/db'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import z from 'zod'

import { Button } from '@/components/Button'
import { IconInteractionHelp, IconInteractionDelete } from '@/components/icons'
import { useBanCustomer, useUnbanCustomer } from '@/features/users/api'

const banReasonSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be at most 500 characters'),
})

type BanReasonData = z.infer<typeof banReasonSchema>

export interface UserBanModalProps {
  isOpen: boolean
  onClose: () => void
  customer: CustomerDetail
  onSuccess?: () => void
}

export function UserBanModal({ isOpen, onClose, customer, onSuccess }: UserBanModalProps) {
  const isBanned = customer.is_banned
  const banMutation = useBanCustomer()
  const unbanMutation = useUnbanCustomer()
  const isLoading = banMutation.isPending || unbanMutation.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BanReasonData>({
    resolver: zodResolver(banReasonSchema),
    defaultValues: {
      reason: '',
    },
  })

  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const onSubmit = async (data: BanReasonData) => {
    try {
      await banMutation.mutateAsync({
        customerId: customer.id,
        reason: data.reason,
      })
      toast.success('User has been banned')
      onClose()
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to ban user'
      toast.error(message)
    }
  }

  const handleUnban = async () => {
    try {
      await unbanMutation.mutateAsync(customer.id)
      toast.success('User has been unbanned')
      onClose()
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unban user'
      toast.error(message)
    }
  }

  if (!isOpen) return null

  const errorMessage = banMutation.error || unbanMutation.error
  const hasError = errorMessage !== null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-lg bg-platform-surface shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-platform-border px-6 py-4">
          <h2 className="text-lg font-semibold text-platform-fg">
            {isBanned ? 'Unban User' : 'Ban User'}
          </h2>
          <button
            onClick={onClose}
            className="text-platform-fg-muted hover:text-platform-fg"
            aria-label="Close modal"
          >
            <IconInteractionDelete size="md" color="default" alt="" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="rounded-lg border border-platform-border bg-platform-bg p-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-platform-fg-muted">Name</p>
                <p className="font-medium text-platform-fg">{customer.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-platform-fg-muted">Email</p>
                <p className="font-medium text-platform-fg">{customer.email}</p>
              </div>
              {isBanned && (
                <div>
                  <p className="text-sm text-platform-fg-muted">Ban Status</p>
                  <p className="inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    Banned
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Conditional Content */}
          {isBanned ? (
            // Unban confirmation
            <div className="space-y-4">
              {customer.ban_reason && (
                <div className="rounded-lg border border-platform-border bg-platform-bg p-4">
                  <p className="text-sm text-platform-fg-muted mb-2">Ban Reason</p>
                  <p className="text-sm text-platform-fg">{customer.ban_reason}</p>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <IconInteractionHelp
                  size="md"
                  color="default"
                  className="flex-shrink-0 mt-0.5"
                  alt=""
                />
                <p className="text-sm text-yellow-800">
                  Unbanning this user will allow them to place orders again.
                </p>
              </div>
            </div>
          ) : (
            // Ban form
            <form
              onSubmit={(e) => {
                void handleSubmit(onSubmit)(e)
              }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <IconInteractionHelp
                  size="md"
                  color="default"
                  className="flex-shrink-0 mt-0.5"
                  alt=""
                />
                <p className="text-sm text-red-800">
                  Banning this user will prevent them from placing orders. This action can be
                  reversed.
                </p>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-platform-fg mb-1">
                  Ban Reason
                </label>
                <textarea
                  {...register('reason')}
                  id="reason"
                  className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-platform-fg placeholder-platform-fg-muted focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary resize-none"
                  placeholder="Describe the reason for banning this user..."
                  rows={4}
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-platform-error">{errors.reason.message}</p>
                )}
              </div>

              {hasError && (
                <div className="rounded-lg border border-platform-error bg-red-50 p-3">
                  <p className="text-sm text-platform-error">
                    {errorMessage instanceof Error ? errorMessage.message : 'An error occurred'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button variant="danger" type="submit" loading={isLoading} className="flex-1">
                  Ban User
                </Button>
              </div>
            </form>
          )}

          {/* Unban Button (shown when banned) */}
          {isBanned && (
            <div>
              {hasError && (
                <div className="rounded-lg border border-platform-error bg-red-50 p-3 mb-3">
                  <p className="text-sm text-platform-error">
                    {errorMessage instanceof Error ? errorMessage.message : 'An error occurred'}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    void handleUnban()
                  }}
                  loading={isLoading}
                  className="flex-1"
                >
                  Unban User
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
