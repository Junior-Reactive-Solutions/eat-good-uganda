import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { z } from 'zod'

import { customerLoginSchema } from '@eatgood/shared'
import { api } from '../../lib/api'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { FormError } from '../../components/FormError'

type FormValues = z.infer<typeof customerLoginSchema>

export function LoginForm() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(customerLoginSchema) })

  const login = useMutation({
    mutationFn: (data: FormValues) => api.post('/v1/customer/auth/login', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      const redirect = params.get('redirect')
      navigate(redirect && redirect.startsWith('/') ? redirect : '/', { replace: true })
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 401) {
        setError('root', { message: 'Incorrect email or password.' })
      } else if (status === 403) {
        setError('root', { message: 'Please verify your email before signing in.' })
      } else {
        toast.error('Something went wrong. Try again.')
      }
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => login.mutate(data))}
      className="flex flex-col gap-4"
      noValidate
    >
      <FormError message={errors.root?.message} />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-sm text-platform-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" loading={isSubmitting || login.isPending} className="w-full">
        Sign in
      </Button>
      <p className="text-center text-sm text-platform-fg-muted">
        Don't have an account?{' '}
        <Link to="/signup" className="text-platform-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </form>
  )
}
