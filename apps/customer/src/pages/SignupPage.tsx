import { SignupForm } from '../features/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold text-platform-fg">Create account</h1>
      <SignupForm />
    </div>
  )
}
