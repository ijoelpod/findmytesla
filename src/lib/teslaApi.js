// src/lib/teslaApi.js
// Utilities for working with Tesla's inventory API.
// The actual scraping runs in Edge Functions (server-side) to avoid CORS.
// The image builder and normalizer are shared here and imported by Edge Functions too.

export const TESLA_MODELS = ['m3', 'my', 'ms', 'mx']

// Human-readable model labels
export const MODEL_LABELS = {
  m3: 'Model 3',
  my: 'Model Y',
  ms: 'Model S',
  mx: 'Model X',
  ct: 'Cybertruck',
}

/**
 * Builds the Tesla inventory search URL for a given model + zip code.
 * @param {Object} params
 * @param {string} params.model - Tesla model code e.g. 'm3'
 * @param {string} params.zip - Zip code e.g. '90210'
 * @param {number} params.lat - Latitude
 * @param {number} params.lng - Longitude
 * @param {number} params.offset - Pagination offset (50 results per page)
 */
export function buildTeslaApiUrl({ model = 'm3', zip = '10001', lat = 40.7128, lng = -74.006, offset = 0 }) {
  const query = {
    query: {
      model,
      condition: 'used',
      options: {},
      arrangeby: 'Price',
      order: 'asc',
      market: 'US',
      language: 'en',
      super_region: 'north america',
      lng,
      lat,
      zip,
      range: 0,
    },
    offset,
    count: 50,
    outsideOffset: 0,
    outsideSearch: false,
    isFalconDeliverySelectionEnabled: false,
    version: null,
  }

  const encoded = encodeURIComponent(JSON.stringify(query))
  // In development, requests go through Vite's proxy (/tesla-api → tesla.com)
  // to avoid CORS errors. In production (Vercel), a serverless function handles this.
  const base = import.meta.env.DEV
    ? '/tesla-api'
    : 'https://www.tesla.com'
  return `${base}/inventory/api/v4/inventory-search/inventory-search?query=${encoded}`
}

/**
 * Builds the Tesla compositor image URL for a vehicle.
 * Tesla generates car images dynamically based on option codes (paint color, wheels, etc.)
 *
 * @param {string} model - Tesla model code e.g. 'm3'
 * @param {string[]} options - Array of option codes e.g. ['PMNG', 'W40B', 'DV4W']
 * @param {string} view - Camera angle: 'FRONT34' | 'REAR34' | 'SIDE' | 'INTERIOR_FRONT'
 */
export function buildImageUrl(model, options = [], view = 'FRONT34') {
  const optionStr = options.join(',')
  return `https://static-assets.tesla.com/v1/compositor/?model=${model}&view=${view}&size=1440&options=${optionStr}&bkba_opt=1&context=design_studio_2`
}

/**
 * Build multiple image URLs for different angles — used in the detail page gallery.
 * @param {string} model
 * @param {string[]} options
 */
export function buildImageGallery(model, options = []) {
  const views = ['FRONT34', 'REAR34', 'SIDE', 'SEAT_FRONT', 'DRIVINGFRONT']
  return views.map(view => buildImageUrl(model, options, view))
}

/**
 * Normalizes a raw vehicle object from Tesla's API into our DB schema shape.
 * @param {Object} raw - Raw vehicle object from Tesla's API response
 */
export function normalizeVehicle(raw) {
  const options = raw.OptionCodeList ? raw.OptionCodeList.split(',') : []

  return {
    vin:            raw.VIN,
    model:          raw.Model,
    year:           raw.Year,
    trim_name:      raw.TrimName || null,
    price:          raw.InventoryPrice || raw.Price || 0,
    mileage:        raw.Odometer || null,
    color:          raw.PAINT?.[0] || null,
    interior:       raw.INTERIOR?.[0] || null,
    options,
    location_city:  raw.City || null,
    location_state: raw.StateProvince || null,
    zip_code:       raw.PostalCode || null,
    latitude:       raw.Latitude || null,
    longitude:      raw.Longitude || null,
    image_url:      buildImageUrl(raw.Model, options),
    detail_url:     `https://www.tesla.com/used/${raw.VIN}`,
    is_available:   true,
    last_seen_at:   new Date().toISOString(),
  }
}

/**
 * Converts a zip code to lat/lng using the free Zippopotam API.
 * Used by FilterBar to let users filter by zip code.
 * @param {string} zip
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function zipToLatLng(zip) {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) return null
    const data = await res.json()
    return {
      lat: parseFloat(data.places[0].latitude),
      lng: parseFloat(data.places[0].longitude),
    }
  } catch {
    return null
  }
}
