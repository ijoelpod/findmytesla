// src/pages/WatchlistPage.jsx
// The user's personal watchlist of hearted vehicles.
// Protected — redirects to /auth if not logged in.

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { VehicleGrid } from '../components/VehicleGrid'

export function WatchlistPage({ onRequireAuth }) {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!user) return

    async function loadWatchlist() {
      // Join user_favorites with vehicles to get full vehicle data
      const { data, error } = await supabase
        .from('user_favorites')
        .select('vin, vehicles(*)')
        .eq('user_id', user.id)
        .order('hearted_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        // Extract the nested vehicle objects
        setVehicles((data || []).map(row => row.vehicles).filter(Boolean))
      }
      setLoading(false)
    }

    loadWatchlist()
  }, [user])

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Heart size={22} className="fill-accent stroke-accent" />
        <h1 className="text-2xl font-bold text-text">My Watchlist</h1>
      </div>

      {!loading && vehicles.length === 0 && !error && (
        <div className="text-center py-20 text-muted">
          <Heart size={40} className="mx-auto mb-3 stroke-surface-2" />
          <p className="text-lg font-semibold">No saved vehicles yet</p>
          <p className="text-sm mt-1">Click the heart icon on any vehicle to add it here.</p>
        </div>
      )}

      <VehicleGrid
        vehicles={vehicles}
        loading={loading}
        error={error}
        onRequireAuth={onRequireAuth}
      />
    </main>
  )
}
