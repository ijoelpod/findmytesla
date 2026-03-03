// src/hooks/useVehicles.js
// Fetches vehicles from the Supabase DB with optional filters.
// The DB is populated by the GitHub Actions scraper.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useVehicles(filters = {}) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function fetchVehicles() {
      let query = supabase
        .from('vehicles')
        .select('*')
        .eq('is_available', true)
        .order('price', { ascending: true })
        .limit(100)

      if (filters.model)    query = query.eq('model', filters.model)
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice)
      if (filters.minPrice) query = query.gte('price', filters.minPrice)
      if (filters.minYear)  query = query.gte('year', filters.minYear)

      const { data, error } = await query

      if (cancelled) return
      if (error) { setError(error.message); setLoading(false); return }
      setVehicles(data || [])
      setLoading(false)
    }

    fetchVehicles()
    return () => { cancelled = true }
  }, [filters.model, filters.maxPrice, filters.minPrice, filters.minYear])

  return { vehicles, loading, error, total: vehicles.length }
}
