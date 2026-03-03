// src/hooks/useFavorites.js
// Manages the user's hearted/saved vehicles.
// Uses a Set<string> of VINs for O(1) lookups in VehicleCard.
// Uses optimistic UI — the heart toggles instantly, then syncs to DB.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState(new Set()) // Set of VIN strings
  const [loading, setLoading]     = useState(false)

  // Fetch all favorites for the logged-in user whenever they change
  useEffect(() => {
    if (!user) {
      setFavorites(new Set())
      return
    }

    setLoading(true)
    supabase
      .from('user_favorites')
      .select('vin')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setFavorites(new Set(data.map(row => row.vin)))
        }
        setLoading(false)
      })
  }, [user])

  // Toggle heart on/off for a VIN
  const toggleFavorite = useCallback(async (vin) => {
    if (!user) return  // caller opens AuthModal if not signed in

    const isHearted = favorites.has(vin)

    // Optimistic update — update UI immediately
    if (isHearted) {
      setFavorites(prev => {
        const next = new Set(prev)
        next.delete(vin)
        return next
      })
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('vin', vin)
    } else {
      setFavorites(prev => new Set(prev).add(vin))
      await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, vin })
    }
  }, [user, favorites])

  return { favorites, toggleFavorite, loading }
}
