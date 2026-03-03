// src/components/VehicleCard.jsx
// Displays a single Tesla vehicle: image, year/model/trim, price, mileage, and heart.

import { useNavigate } from 'react-router-dom'
import { HeartButton } from './HeartButton'
import { PriceTag } from './PriceTag'
import { MODEL_LABELS } from '../lib/teslaApi'

export function VehicleCard({ vehicle, onRequireAuth }) {
  const navigate = useNavigate()

  const modelLabel = MODEL_LABELS[vehicle.model] || vehicle.model.toUpperCase()
  const miles = vehicle.mileage
    ? `${vehicle.mileage.toLocaleString()} mi`
    : 'Mileage N/A'

  return (
    <div
      onClick={() => navigate(`/vehicle/${vehicle.vin}`)}
      className="relative bg-surface rounded-2xl overflow-hidden cursor-pointer
                 hover:ring-2 hover:ring-accent transition-all duration-200 group"
    >
      {/* Vehicle image */}
      <div className="relative aspect-video bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
        <img
          src={vehicle.image_url}
          alt={`${vehicle.year} Tesla ${modelLabel}`}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        {/* Placeholder shown when image fails to load */}
        <div
          style={{ display: 'none' }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
        >
          <span className="text-accent text-3xl font-bold tracking-tight">T</span>
          <span className="text-muted text-sm font-medium">{vehicle.year} {modelLabel}</span>
        </div>
        <HeartButton vin={vehicle.vin} onRequireAuth={onRequireAuth} />
      </div>

      {/* Vehicle info */}
      <div className="p-4 space-y-1">
        <p className="text-muted text-sm font-medium">
          {vehicle.year} · {modelLabel}
        </p>
        <h3 className="text-text font-semibold text-base leading-tight">
          {vehicle.trim_name || modelLabel}
        </h3>
        <p className="text-muted text-sm">{miles}</p>
        {vehicle.location_city && (
          <p className="text-muted text-xs">{vehicle.location_city}, {vehicle.location_state}</p>
        )}
        <div className="pt-1">
          <PriceTag price={vehicle.price} />
        </div>
      </div>
    </div>
  )
}
