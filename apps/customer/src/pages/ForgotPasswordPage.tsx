import { ForgotPasswordForm } from '../features/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold text-platform-fg">Reset password</h1>
      <p className="mb-8 text-sm text-platform-fg-muted">Enter your email and we'll send a reset link.</p>
      <ForgotPasswordForm />
    </div>
  )
}
