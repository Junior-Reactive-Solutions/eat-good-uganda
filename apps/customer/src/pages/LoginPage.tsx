import { LoginForm } from '../features/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold text-platform-fg">Sign in</h1>
      <LoginForm />
    </div>
  )
}
