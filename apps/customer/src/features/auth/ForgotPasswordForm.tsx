import { forgotPasswordSchema } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm, type SubmitHandler } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import type { z } from 'zod'

import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { api } from '../../lib/api'

type FormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const forgot = useMutation({
    mutationFn: (data: FormValues) => api.post('/v1/customer/auth/forgot-password', data),
    onSuccess: () => toast.success('If that email exists, a reset link is on its way.'),
    onError: () => toast.error('Something went wrong. Try again.'),
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    forgot.mutate(data)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit) as React.SubmitEventHandler}
      className="flex flex-col gap-4"
      noValidate
    >
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
        <Link to="/login" className="text-platform-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
