// src/components/FilterBar.jsx
// Filter controls: model selector, price range, year, and zip code.
// Calls onChange with the updated filters object whenever anything changes.

import { useState } from 'react'
import { Search } from 'lucide-react'
import { MODEL_LABELS, zipToLatLng } from '../lib/teslaApi'

const CURRENT_YEAR = new Date().getFullYear()

export function FilterBar({ filters, onChange }) {
  const [zipInput, setZipInput] = useState(filters.zip || '')
  const [zipError, setZipError] = useState('')

  async function handleZipSubmit(e) {
    e.preventDefault()
    setZipError('')
    if (!zipInput || zipInput.length < 5) {
      setZipError('Enter a valid 5-digit zip code')
      return
    }
    const coords = await zipToLatLng(zipInput)
    if (!coords) {
      setZipError('Zip code not found')
      return
    }
    onChange({ ...filters, zip: zipInput, lat: coords.lat, lng: coords.lng })
  }

  return (
    <div className="bg-surface rounded-2xl p-4 flex flex-wrap gap-3 items-end">

      {/* Model filter */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs text-muted font-medium uppercase tracking-wide">Model</label>
        <select
          value={filters.model || ''}
          onChange={e => onChange({ ...filters, model: e.target.value || null })}
          className="bg-surface-2 text-text rounded-lg px-3 py-2 text-sm border border-white/10 focus:outline-none focus:border-accent"
        >
          <option value="">All Models</option>
          {Object.entries(MODEL_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {/* Max price filter */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs text-muted font-medium uppercase tracking-wide">Max Price</label>
        <select
          value={filters.maxPrice || ''}
          onChange={e => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
          className="bg-surface-2 text-text rounded-lg px-3 py-2 text-sm border border-white/10 focus:outline-none focus:border-accent"
        >
          <option value="">Any Price</option>
          <option value="30000">Under $30,000</option>
          <option value="40000">Under $40,000</option>
          <option value="50000">Under $50,000</option>
          <option value="60000">Under $60,000</option>
          <option value="75000">Under $75,000</option>
          <option value="100000">Under $100,000</option>
        </select>
      </div>

      {/* Min year filter */}
      <div className="flex flex-col gap-1 min-w-[120px]">
        <label className="text-xs text-muted font-medium uppercase tracking-wide">Min Year</label>
        <select
          value={filters.minYear || ''}
          onChange={e => onChange({ ...filters, minYear: e.target.value ? Number(e.target.value) : null })}
          className="bg-surface-2 text-text rounded-lg px-3 py-2 text-sm border border-white/10 focus:outline-none focus:border-accent"
        >
          <option value="">Any Year</option>
          {Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i).map(y => (
            <option key={y} value={y}>{y}+</option>
          ))}
        </select>
      </div>

      {/* Zip code filter */}
      <form onSubmit={handleZipSubmit} className="flex flex-col gap-1">
        <label className="text-xs text-muted font-medium uppercase tracking-wide">Near Zip Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={zipInput}
            onChange={e => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 90210"
            maxLength={5}
            className="bg-surface-2 text-text rounded-lg px-3 py-2 text-sm border border-white/10
                       focus:outline-none focus:border-accent w-28"
          />
          <button
            type="submit"
            className="bg-accent hover:bg-accent-hover text-white px-3 py-2 rounded-lg transition-colors"
            aria-label="Apply zip code filter"
          >
            <Search size={16} />
          </button>
        </div>
        {zipError && <p className="text-xs text-red-400">{zipError}</p>}
      </form>

      {/* Clear all filters */}
      {(filters.model || filters.maxPrice || filters.minYear || filters.zip) && (
        <button
          onClick={() => onChange({})}
          className="text-xs text-muted hover:text-text underline underline-offset-2 self-end pb-2"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
