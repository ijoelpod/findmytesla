// src/App.jsx
// Defines all app routes and manages the global AuthModal state.

import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { AuthModal } from './components/AuthModal'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { VehicleDetailPage } from './pages/VehicleDetailPage'
import { WatchlistPage } from './pages/WatchlistPage'
import { AuthPage } from './pages/AuthPage'

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar onOpenAuth={() => setShowAuthModal(true)} />

      <Routes>
        <Route
          path="/"
          element={<HomePage onRequireAuth={() => setShowAuthModal(true)} />}
        />
        <Route
          path="/vehicle/:vin"
          element={<VehicleDetailPage onRequireAuth={() => setShowAuthModal(true)} />}
        />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <WatchlistPage onRequireAuth={() => setShowAuthModal(true)} />
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}
