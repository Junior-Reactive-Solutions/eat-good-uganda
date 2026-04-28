import { ResetPasswordForm } from '../features/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold text-platform-fg">Set new password</h1>
      <ResetPasswordForm />
    </div>
  )
}
