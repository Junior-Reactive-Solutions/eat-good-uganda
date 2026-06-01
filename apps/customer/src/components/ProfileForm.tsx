import type { CustomerProfile } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from './Button'

const profileFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(255),
  last_name: z.string().min(1, 'Last name is required').max(255),
  date_of_birth: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatar_url: z.string().url('Invalid avatar URL').or(z.literal('')).optional().nullable(),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  profile: CustomerProfile | null
  isLoading?: boolean
  onSubmit: (data: ProfileFormData) => void
}

const inputBase =
  'w-full rounded-lg border bg-platform-surface px-3 py-2 text-sm text-platform-fg placeholder:text-platform-fg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-platform-primary focus:ring-offset-1 disabled:opacity-50'

const inputBorder = (error?: string) =>
  error ? 'border-platform-error' : 'border-platform-border'

export function ProfileForm({
  profile,
  isLoading = false,
  onSubmit,
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profile
      ? {
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          date_of_birth: profile.date_of_birth || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || null,
        }
      : {
          first_name: '',
          last_name: '',
          date_of_birth: '',
          bio: '',
          avatar_url: null,
        },
  })

  const avatarUrl = watch('avatar_url')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-platform-fg mb-1">
            First Name <span className="text-platform-error">*</span>
          </label>
          <input
            {...register('first_name')}
            type="text"
            placeholder="John"
            disabled={isLoading}
            aria-invalid={errors.first_name ? 'true' : 'false'}
            className={[inputBase, inputBorder(errors.first_name?.message)].join(' ')}
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-platform-error">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-platform-fg mb-1">
            Last Name <span className="text-platform-error">*</span>
          </label>
          <input
            {...register('last_name')}
            type="text"
            placeholder="Doe"
            disabled={isLoading}
            aria-invalid={errors.last_name ? 'true' : 'false'}
            className={[inputBase, inputBorder(errors.last_name?.message)].join(' ')}
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-platform-error">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-sm font-medium text-platform-fg mb-1">
          Date of Birth
        </label>
        <input
          {...register('date_of_birth')}
          type="date"
          disabled={isLoading}
          aria-invalid={errors.date_of_birth ? 'true' : 'false'}
          className={[inputBase, inputBorder(errors.date_of_birth?.message)].join(' ')}
        />
        {errors.date_of_birth && (
          <p className="mt-1 text-xs text-platform-error">{errors.date_of_birth.message}</p>
        )}
      </div>

      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium text-platform-fg mb-1">
          Avatar URL
        </label>
        <input
          {...register('avatar_url')}
          type="url"
          placeholder="https://example.com/avatar.jpg"
          disabled={isLoading}
          aria-invalid={errors.avatar_url ? 'true' : 'false'}
          className={[inputBase, inputBorder(errors.avatar_url?.message)].join(' ')}
        />
        {errors.avatar_url && (
          <p className="mt-1 text-xs text-platform-error">{errors.avatar_url.message}</p>
        )}
        {avatarUrl && (
          <div className="mt-3">
            <p className="text-xs text-platform-fg-muted mb-2">Preview:</p>
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="w-24 h-24 rounded-full object-cover border-2 border-platform-border"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-platform-fg mb-1">
          Bio
        </label>
        <textarea
          {...register('bio')}
          placeholder="Tell us about yourself..."
          rows={4}
          disabled={isLoading}
          aria-invalid={errors.bio ? 'true' : 'false'}
          className={[
            inputBase,
            inputBorder(errors.bio?.message),
            'min-h-[100px] resize-y',
          ].join(' ')}
        />
        {errors.bio && (
          <p className="mt-1 text-xs text-platform-error">{errors.bio.message}</p>
        )}
        <p className="mt-1 text-xs text-platform-fg-muted">
          {watch('bio')?.length || 0}/500 characters
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-6 border-t border-platform-border">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  )
}
