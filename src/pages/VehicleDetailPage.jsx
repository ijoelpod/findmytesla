// src/pages/VehicleDetailPage.jsx
// Full detail view for a single Tesla — image gallery, specs, price history, heart button.

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { buildImageGallery, MODEL_LABELS } from '../lib/teslaApi'
import { ImageGallery } from '../components/ImageGallery'
import { HeartButton } from '../components/HeartButton'
import { PriceTag } from '../components/PriceTag'

export function VehicleDetailPage({ onRequireAuth }) {
  const { vin } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle]         = useState(null)
  const [priceHistory, setPriceHistory] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function load() {
      const [vehicleRes, historyRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('vin', vin).single(),
        supabase
          .from('price_history')
          .select('price, recorded_at')
          .eq('vin', vin)
          .order('recorded_at', { ascending: false })
          .limit(10),
      ])
      setVehicle(vehicleRes.data)
      setPriceHistory(historyRes.data || [])
      setLoading(false)
    }
    load()
  }, [vin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20 text-muted">
        <p className="text-lg font-semibold">Vehicle not found</p>
        <button onClick={() => navigate('/')} className="mt-3 text-sm text-accent hover:underline">
          Back to inventory
        </button>
      </div>
    )
  }

  const modelLabel = MODEL_LABELS[vehicle.model] || vehicle.model.toUpperCase()
  const images = buildImageGallery(vehicle.model, vehicle.options || [])
  const previousPrice = priceHistory[1]?.price

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-muted hover:text-text text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: image gallery */}
        <div className="relative">
          <ImageGallery images={images} alt={`${vehicle.year} Tesla ${modelLabel}`} />
        </div>

        {/* Right: details */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted text-sm">{vehicle.year} · {modelLabel}</p>
              <h1 className="text-2xl font-bold text-text mt-0.5">
                {vehicle.trim_name || modelLabel}
              </h1>
            </div>
            {/* Heart button — positioned in top-right of details */}
            <div className="relative w-10 h-10">
              <HeartButton vin={vehicle.vin} onRequireAuth={onRequireAuth} />
            </div>
          </div>

          {/* Price */}
          <PriceTag price={vehicle.price} previousPrice={previousPrice} />

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-3 bg-surface rounded-xl p-4">
            <Spec label="Mileage" value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : 'N/A'} />
            <Spec label="Year" value={vehicle.year} />
            <Spec label="Color" value={vehicle.color || 'N/A'} />
            <Spec label="Interior" value={vehicle.interior || 'N/A'} />
            <Spec label="Location" value={vehicle.location_city ? `${vehicle.location_city}, ${vehicle.location_state}` : 'N/A'} />
            <Spec label="VIN" value={vehicle.vin} mono />
          </div>

          {/* View on Tesla.com */}
          <a
            href={vehicle.detail_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full
                       bg-accent hover:bg-accent-hover text-white font-semibold
                       py-3 rounded-xl transition-colors"
          >
            View on Tesla.com
            <ExternalLink size={16} />
          </a>

          {/* Price history */}
          {priceHistory.length > 0 && (
            <div className="bg-surface rounded-xl p-4">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Price History</h2>
              <ul className="space-y-2">
                {priceHistory.map((row, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-muted">{new Date(row.recorded_at).toLocaleDateString()}</span>
                    <span className="text-text font-medium">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(row.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function Spec({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-text text-sm font-medium mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
