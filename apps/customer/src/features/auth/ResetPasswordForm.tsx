import { resetPasswordSchema } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm, type SubmitHandler } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { z } from 'zod'

import { Button } from '../../components/Button'
import { FormError } from '../../components/FormError'
import { Input } from '../../components/Input'
import { api } from '../../lib/api'

type FormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  })

  const reset = useMutation({
    mutationFn: (data: FormValues) => api.post('/v1/customer/auth/reset-password', data),
    onSuccess: () => {
      toast.success('Password updated. You can now sign in.')
      void navigate('/login')
    },
    onError: () => {
      toast.error('Reset link expired or invalid. Request a new one.')
    },
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    reset.mutate(data)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit) as React.SubmitEventHandler}
      className="flex flex-col gap-4"
      noValidate
    >
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
