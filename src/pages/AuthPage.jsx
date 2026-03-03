// src/pages/AuthPage.jsx
// Standalone login/signup page — shown when navigating to /auth directly.
// Redirects home if the user is already signed in.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function AuthPage() {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]         = useState('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  // Redirect to home if already signed in
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = mode === 'signin'
      ? await signIn({ email, password })
      : await signUp({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (mode === 'signup') {
      setSuccess(true)
    }
    // For signin, the useEffect above handles the redirect via user state change
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm p-8 space-y-6">
        {/* Logo */}
        <div className="text-center">
          <span className="text-accent text-3xl font-bold tracking-tight">FindMyTesla</span>
          <p className="text-muted text-sm mt-2">
            {mode === 'signin' ? 'Welcome back' : 'Create your free account'}
          </p>
        </div>

        {success ? (
          <div className="text-center text-green-400 py-4">
            <p className="font-semibold text-base mb-1">Check your email!</p>
            <p className="text-sm">We sent a confirmation to <strong>{email}</strong>.</p>
            <p className="mt-2 text-muted text-sm">Click the link, then sign in.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted uppercase tracking-wide block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-surface-2 text-text rounded-lg px-3 py-3 text-sm
                           border border-white/10 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="w-full bg-surface-2 text-text rounded-lg px-3 py-3 text-sm
                           border border-white/10 focus:outline-none focus:border-accent"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50
                         text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Toggle mode */}
        {!success && (
          <p className="text-center text-sm text-muted">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
              className="text-text underline underline-offset-2 hover:text-accent transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}

        {/* Back to home */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-muted hover:text-text underline underline-offset-2 transition-colors"
          >
            ← Back to inventory
          </button>
        </div>
      </div>
    </main>
  )
}
