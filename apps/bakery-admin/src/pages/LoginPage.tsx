import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../components/Button'
import { api } from '../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await api.post('/v1/bakery/login', { email, password })
      const redirect = searchParams.get('redirect') || '/dashboard'
      void navigate(redirect)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-platform-primary to-platform-primary-hover p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Eat Good Uganda</h1>
          <p className="text-center text-platform-fg-muted mb-8">Bakery Staff Login</p>

          <form
            onSubmit={(e) => {
              void handleSubmit(e)
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-platform-fg mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                }}
                disabled={loading}
                placeholder="staff@bakery.com"
                className="w-full px-4 py-2 border border-platform-border rounded-lg focus:outline-none focus:ring-2 focus:ring-platform-primary disabled:opacity-50 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-platform-fg mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                disabled={loading}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-platform-border rounded-lg focus:outline-none focus:ring-2 focus:ring-platform-primary disabled:opacity-50 disabled:bg-gray-100"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-platform-fg-muted">
            <p>Demo credentials:</p>
            <p className="font-mono">staff@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
