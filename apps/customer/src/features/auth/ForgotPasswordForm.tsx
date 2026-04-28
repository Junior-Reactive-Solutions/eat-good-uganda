import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { z } from 'zod'

import { forgotPasswordSchema } from '@eatgood/shared'
import { api } from '../../lib/api'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'

type FormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const forgot = useMutation({
    mutationFn: (data: FormValues) => api.post('/v1/customer/auth/forgot-password', data),
    onSuccess: () => toast.success('If that email exists, a reset link is on its way.'),
    onError: () => toast.error('Something went wrong. Try again.'),
  })

  return (
    <form onSubmit={handleSubmit((data) => forgot.mutate(data))} className="flex flex-col gap-4" noValidate>
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" loading={isSubmitting || forgot.isPending} className="w-full">
        Send reset link
      </Button>
      <p className="text-center text-sm text-platform-fg-muted">
        <Link to="/login" className="text-platform-primary hover:underline">Back to sign in</Link>
      </p>
    </form>
  )
}
