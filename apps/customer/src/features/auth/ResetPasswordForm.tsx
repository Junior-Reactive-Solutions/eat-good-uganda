import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { z } from 'zod'

import { resetPasswordSchema } from '@eatgood/shared'
import { api } from '../../lib/api'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { FormError } from '../../components/FormError'

type FormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  })

  const reset = useMutation({
    mutationFn: (data: FormValues) => api.post('/v1/customer/auth/reset-password', data),
    onSuccess: () => {
      toast.success('Password updated. You can now sign in.')
      navigate('/login')
    },
    onError: () => {
      toast.error('Reset link expired or invalid. Request a new one.')
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => reset.mutate(data))} className="flex flex-col gap-4" noValidate>
      <FormError message={errors.root?.message} />
      <input type="hidden" {...register('token')} />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" loading={isSubmitting || reset.isPending} className="w-full">
        Set new password
      </Button>
    </form>
  )
}
