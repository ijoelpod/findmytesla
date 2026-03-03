// src/pages/HomePage.jsx
// Main inventory dashboard — shows the FilterBar and VehicleGrid.

import { useState } from 'react'
import { FilterBar } from '../components/FilterBar'
import { VehicleGrid } from '../components/VehicleGrid'
import { useVehicles } from '../hooks/useVehicles'

export function HomePage({ onRequireAuth }) {
  const [filters, setFilters] = useState({})
  const { vehicles, loading, error, total } = useVehicles(filters)

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Used Tesla Inventory</h1>
        {!loading && (
          <p className="text-muted text-sm mt-1">
            {total} vehicle{total !== 1 ? 's' : ''} available
          </p>
        )}
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Vehicle grid */}
      <VehicleGrid
        vehicles={vehicles}
        loading={loading}
        error={error}
        onRequireAuth={onRequireAuth}
      />
    </main>
  )
}
