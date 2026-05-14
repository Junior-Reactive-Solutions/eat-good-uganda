import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../components/Button'
import { loginAdmin } from '../features/auth/hooks'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp_code, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTotpForm, setShowTotpForm] = useState(false)

  const handleFirstStep = () => {
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setShowTotpForm(true)
  }

  const handleLogin = (): void => {
    if (!totp_code || totp_code.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)

    void (async () => {
      try {
        await loginAdmin(email, password, totp_code)
        toast.success('Login successful')
        void navigate(redirect)
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error('Login failed')
        }
      } finally {
        setLoading(false)
      }
    })()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-platform-bg to-platform-surface">
      <div className="w-full max-w-md">
        <div className="bg-platform-surface rounded-xl shadow-lg p-8 border border-platform-border">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-platform-fg mb-2">Eat Good Uganda</h1>
            <p className="text-platform-fg-muted">Super Admin Console</p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
            }}
            className="space-y-6"
          >
            {!showTotpForm ? (
              <>
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-platform-fg mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                    }}
                    placeholder="admin@example.com"
                    className="w-full px-4 py-2 rounded-lg border border-platform-border bg-platform-bg text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-platform-primary"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-platform-fg mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                    }}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 rounded-lg border border-platform-border bg-platform-bg text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-platform-primary"
                    required
                  />
                </div>

                {/* Next Button */}
                <Button type="button" onClick={handleFirstStep} className="w-full">
                  Continue
                </Button>
              </>
            ) : (
              <>
                {/* TOTP Code Field */}
                <div>
                  <label
                    htmlFor="totp_code"
                    className="block text-sm font-medium text-platform-fg mb-2"
                  >
                    Two-Factor Authentication Code
                  </label>
                  <p className="text-sm text-platform-fg-muted mb-3">
                    Enter the 6-digit code from your authenticator app.
                  </p>
                  <input
                    id="totp_code"
                    type="text"
                    maxLength={6}
                    value={totp_code}
                    onChange={(e) => {
                      setTotpCode(e.target.value.replace(/\D/g, ''))
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-2 rounded-lg border border-platform-border bg-platform-bg text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-platform-primary text-center text-2xl tracking-widest"
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="button"
                  loading={loading}
                  disabled={loading}
                  onClick={handleLogin}
                  className="w-full"
                >
                  Sign In
                </Button>

                {/* Back Button */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowTotpForm(false)
                    setTotpCode('')
                  }}
                  className="w-full"
                >
                  Back
                </Button>
              </>
            )}
          </form>

          {/* Footer */}
          <p className="text-xs text-platform-fg-muted text-center mt-6">
            This console is for platform administrators only.
          </p>
        </div>
      </div>
    </div>
  )
}
