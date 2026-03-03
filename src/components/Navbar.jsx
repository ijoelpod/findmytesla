// src/components/Navbar.jsx
// Top navigation bar: logo, watchlist link, and sign in/out button.

import { Link, useNavigate } from 'react-router-dom'
import { Heart, LogIn, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function Navbar({ onOpenAuth }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 group">
          <span className="text-accent font-bold text-xl tracking-tight">Find</span>
          <span className="text-text font-bold text-xl tracking-tight">MyTesla</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Watchlist link */}
              <Link
                to="/watchlist"
                className="flex items-center gap-1.5 text-muted hover:text-text text-sm transition-colors"
              >
                <Heart size={16} />
                <span className="hidden sm:inline">Watchlist</span>
              </Link>

              {/* User email display */}
              <span className="hidden md:flex items-center gap-1 text-xs text-muted">
                <User size={14} />
                {user.email}
              </span>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-muted hover:text-text text-sm transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover
                         text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogIn size={16} />
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
