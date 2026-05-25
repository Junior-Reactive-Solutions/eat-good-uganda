import type { BakeryStaff } from '@eatgood/db'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import z from 'zod'

import { Button } from '@/components/Button'
import { IconInteractionDelete } from '@/components/icons'
import { useAddStaffMember, useUpdateStaffRole } from '@/features/staff/api'

const staffFormSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  email: z.string().email(),
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  phone: z.string().optional(),
  role: z.enum(['owner', 'manager', 'staff']),
})

type StaffFormData = z.infer<typeof staffFormSchema>

export interface StaffFormModalProps {
  isOpen: boolean
  onClose: () => void
  bakeryId: string
  initialData?: BakeryStaff | undefined
  onSuccess?: () => void
}

export function StaffFormModal({
  isOpen,
  onClose,
  bakeryId,
  initialData,
  onSuccess,
}: StaffFormModalProps) {
  const isEditMode = !!initialData
  const addMutation = useAddStaffMember()
  const updateMutation = useUpdateStaffRole()
  const isLoading = addMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      email: initialData?.email ?? '',
      fullName: initialData?.full_name ?? '',
      phone: initialData?.phone ?? '',
      role: initialData?.role ?? 'staff',
    },
  })

  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const onSubmit = async (data: StaffFormData) => {
    try {
      if (isEditMode) {
        // For now, we only support adding staff, not editing
        // In full implementation, we could update phone and role
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (initialData && data.role !== initialData.role) {
          await updateMutation.mutateAsync({
            staffId: initialData.id,
            role: data.role,
          })
        }
      } else {
        await addMutation.mutateAsync({
          bakeryId,
          email: data.email,
          fullName: data.fullName,
          ...(data.phone && { phone: data.phone }),
          role: data.role,
        })
      }
      toast.success(isEditMode ? 'Staff member updated' : 'Staff member added successfully')
      onClose()
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  if (!isOpen) return null

  const errorMessage = addMutation.error || updateMutation.error
  const hasError = errorMessage !== null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-lg bg-platform-surface shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-platform-border px-6 py-4">
          <h2 className="text-lg font-semibold text-platform-fg">
            {isEditMode ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button
            onClick={() => {
              onClose()
            }}
            className="text-platform-fg-muted hover:text-platform-fg"
            aria-label="Close modal"
          >
            <IconInteractionDelete size="md" color="default" alt="" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4 p-6"
        >
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-platform-fg mb-1">
              Email
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              disabled={isEditMode}
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-platform-fg placeholder-platform-fg-muted focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="staff@bakery.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-platform-error">{errors.email.message}</p>
            )}
          </div>

          {/* Full Name Field */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-platform-fg mb-1">
              Full Name
            </label>
            <input
              {...register('fullName')}
              id="fullName"
              type="text"
              disabled={isEditMode}
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-platform-fg placeholder-platform-fg-muted focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-platform-error">{errors.fullName.message}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-platform-fg mb-1">
              Phone (Optional)
            </label>
            <input
              {...register('phone')}
              id="phone"
              type="tel"
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-platform-fg placeholder-platform-fg-muted focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
              placeholder="+256 700 123 456"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-platform-error">{errors.phone.message}</p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-platform-fg mb-1">
              Role
            </label>
            <select
              {...register('role')}
              id="role"
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-platform-fg focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-platform-error">{errors.role.message}</p>
            )}
          </div>

          {/* Error State */}
          {hasError && (
            <div className="rounded-lg border border-platform-error bg-red-50 p-3">
              <p className="text-sm text-platform-error">
                {errorMessage instanceof Error ? errorMessage.message : 'An error occurred'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isLoading} className="flex-1">
              {isEditMode ? 'Update' : 'Add'} Staff
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
