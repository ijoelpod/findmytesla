// src/components/VehicleGrid.jsx
// Responsive grid of VehicleCards with loading and empty states.

import { VehicleCard } from './VehicleCard'

export function VehicleGrid({ vehicles, loading, error, onRequireAuth }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-video bg-surface-2" />
            <div className="p-4 space-y-2">
              <div className="h-3 bg-surface-2 rounded w-1/2" />
              <div className="h-4 bg-surface-2 rounded w-3/4" />
              <div className="h-3 bg-surface-2 rounded w-1/3" />
              <div className="h-6 bg-surface-2 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-400">
        <p className="text-lg font-semibold">Failed to load inventory</p>
        <p className="text-sm mt-1 text-muted">{error}</p>
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-20 text-muted">
        <p className="text-lg font-semibold">No vehicles found</p>
        <p className="text-sm mt-1">Try adjusting your filters or check back later.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {vehicles.map(vehicle => (
        <VehicleCard
          key={vehicle.vin}
          vehicle={vehicle}
          onRequireAuth={onRequireAuth}
        />
      ))}
    </div>
  )
}
