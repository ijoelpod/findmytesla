// scripts/fetch-inventory.js
// Runs via GitHub Actions every 4 hours.
// Fetches Tesla used inventory and stores it in Supabase.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const TESLA_MODELS = ['m3', 'my', 'ms', 'mx']

function buildTeslaApiUrl(model, offset = 0) {
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
      lng: -98.5795,
      lat: 39.8283,
      zip: '66502',
      range: 0,
    },
    offset,
    count: 50,
    outsideOffset: 0,
    outsideSearch: true,
  }
  // Try the v1 endpoint which has fewer restrictions than v4
  return `https://www.tesla.com/inventory/api/v1/inventory-results?query=${encodeURIComponent(JSON.stringify(query))}`
}

function buildImageUrl(model, options = []) {
  return `https://static-assets.tesla.com/v1/compositor/?model=${model}&view=FRONT34&size=1440&options=${options.join(',')}&bkba_opt=1&context=design_studio_2`
}

function normalizeVehicle(raw) {
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

async function main() {
  const allVins = new Set()
  let totalUpserted = 0
  let totalPriceChanges = 0

  for (const model of TESLA_MODELS) {
    let offset = 0
    let keepFetching = true

    while (keepFetching) {
      const url = buildTeslaApiUrl(model, offset)
      console.log(`Fetching ${model} offset ${offset}...`)

      let data
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.tesla.com/inventory/used/m3',
            'Origin': 'https://www.tesla.com',
          },
        })

        if (!res.ok) {
          console.error(`Tesla API error for ${model} offset ${offset}: ${res.status}`)
          break
        }

        data = await res.json()
      } catch (err) {
        console.error(`Fetch error for ${model}:`, err.message)
        break
      }

      const results = data.results || []
      console.log(`Got ${results.length} results for ${model} offset ${offset}`)

      if (results.length === 0) break

      for (const raw of results) {
        const vehicle = normalizeVehicle(raw)
        allVins.add(vehicle.vin)

        // Check for price change
        const { data: existing } = await supabase
          .from('vehicles')
          .select('price')
          .eq('vin', vehicle.vin)
          .single()

        if (existing && existing.price !== vehicle.price) {
          await supabase.from('price_history').insert({ vin: vehicle.vin, price: vehicle.price })
          totalPriceChanges++
        } else if (!existing) {
          await supabase.from('price_history').insert({ vin: vehicle.vin, price: vehicle.price })
        }

        await supabase.from('vehicles').upsert(vehicle, { onConflict: 'vin' })
        totalUpserted++
      }

      const totalCount = data.total_matches_found || 0
      offset += results.length
      keepFetching = results.length === 50 && offset < totalCount
    }
  }

  // Only mark vehicles unavailable if we actually got real data back.
  // If Tesla blocked all requests (0 upserted), skip this to avoid wiping the DB.
  if (totalUpserted > 0) {
    const { data: stored } = await supabase
      .from('vehicles')
      .select('vin')
      .eq('is_available', true)

    if (stored) {
      const toDeactivate = stored.filter(v => !allVins.has(v.vin)).map(v => v.vin)
      if (toDeactivate.length > 0) {
        await supabase.from('vehicles').update({ is_available: false }).in('vin', toDeactivate)
        console.log(`Marked ${toDeactivate.length} vehicles as unavailable`)
      }
    }
  } else {
    console.log('Got 0 results — skipping deactivation to preserve existing data.')
  }

  console.log(`Done. Upserted: ${totalUpserted}, Price changes: ${totalPriceChanges}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
