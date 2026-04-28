import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { z } from 'zod'

import { customerSignupSchema } from '@eatgood/shared'
import { api } from '../../lib/api'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { FormError } from '../../components/FormError'

type FormValues = z.infer<typeof customerSignupSchema>

export function SignupForm() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(customerSignupSchema) })

  const signup = useMutation({
    mutationFn: (data: FormValues) => api.post('/v1/customer/auth/signup', data),
    onSuccess: () => {
      toast.success('Account created! Check your email to verify.')
      navigate('/verify-email')
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        setError('email', { message: 'An account with this email already exists.' })
      } else {
        toast.error('Something went wrong. Try again.')
      }
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => signup.mutate(data))}
      className="flex flex-col gap-4"
      noValidate
    >
      <FormError message={errors.root?.message} />
      <Input
        label="Full name"
        type="text"
        autoComplete="name"
        error={errors.full_name?.message}
        {...register('full_name')}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        placeholder="+256 700 000 000"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" loading={isSubmitting || signup.isPending} className="w-full">
        Create account
      </Button>
      <p className="text-center text-sm text-platform-fg-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-platform-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
