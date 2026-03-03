// supabase/functions/fetch-inventory/index.ts
//
// This Edge Function scrapes Tesla's used inventory API and stores results
// in the Supabase database. It also detects price changes.
//
// Schedule: Run every 4 hours via Supabase cron.
// Deploy with: supabase functions deploy fetch-inventory
//
// Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
//   SUPABASE_URL              (auto-provided by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY (auto-provided by Supabase)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TESLA_MODELS = ['m3', 'my', 'ms', 'mx']

// Build the Tesla inventory API URL
function buildTeslaApiUrl(model: string, offset = 0): string {
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
    outsideSearch: false,
    isFalconDeliverySelectionEnabled: false,
    version: null,
  }
  return `https://www.tesla.com/inventory/api/v4/inventory-search/inventory-search?query=${encodeURIComponent(JSON.stringify(query))}`
}

// Build Tesla compositor image URL
function buildImageUrl(model: string, options: string[]): string {
  return `https://static-assets.tesla.com/v1/compositor/?model=${model}&view=FRONT34&size=1440&options=${options.join(',')}&bkba_opt=1&context=design_studio_2`
}

// Normalize a raw Tesla API vehicle object into our DB schema
function normalizeVehicle(raw: Record<string, unknown>) {
  const options = typeof raw.OptionCodeList === 'string'
    ? raw.OptionCodeList.split(',')
    : []

  return {
    vin: raw.VIN as string,
    model: raw.Model as string,
    year: raw.Year as number,
    trim_name: (raw.TrimName as string) || null,
    price: (raw.InventoryPrice as number) || (raw.Price as number) || 0,
    mileage: (raw.Odometer as number) || null,
    color: (raw.PAINT as string[])?.[0] || null,
    interior: (raw.INTERIOR as string[])?.[0] || null,
    options,
    location_city: (raw.City as string) || null,
    location_state: (raw.StateProvince as string) || null,
    zip_code: (raw.PostalCode as string) || null,
    latitude: (raw.Latitude as number) || null,
    longitude: (raw.Longitude as number) || null,
    image_url: buildImageUrl(raw.Model as string, options),
    detail_url: `https://www.tesla.com/used/${raw.VIN}`,
    is_available: true,
    last_seen_at: new Date().toISOString(),
  }
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const allVins = new Set<string>()
  let totalUpserted = 0
  let totalPriceChanges = 0

  // Fetch all models
  for (const model of TESLA_MODELS) {
    let offset = 0
    let keepFetching = true

    while (keepFetching) {
      const url = buildTeslaApiUrl(model, offset)

      let data: Record<string, unknown>
      try {
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.tesla.com/inventory/used/m3',
            'Origin': 'https://www.tesla.com',
          },
        })
        if (!res.ok) {
          console.error(`Tesla API error for ${model} offset ${offset}: ${res.status}`)
          break
        }
        data = await res.json() as Record<string, unknown>
        console.log(`Fetched ${model} offset ${offset}: ${(data.results as unknown[])?.length ?? 0} results`)
      } catch {
        break
      }

      const results = (data.results as Record<string, unknown>[]) || []
      if (results.length === 0) break

      for (const raw of results) {
        const vehicle = normalizeVehicle(raw)
        allVins.add(vehicle.vin)

        // Check if price changed vs what's currently in the DB
        const { data: existing } = await supabase
          .from('vehicles')
          .select('price')
          .eq('vin', vehicle.vin)
          .single()

        if (existing && existing.price !== vehicle.price) {
          // Record the price change in history
          await supabase.from('price_history').insert({
            vin: vehicle.vin,
            price: vehicle.price,
          })
          totalPriceChanges++
        } else if (!existing) {
          // First time we see this vehicle — record initial price
          await supabase.from('price_history').insert({
            vin: vehicle.vin,
            price: vehicle.price,
          })
        }

        // Upsert the vehicle (insert or update)
        await supabase.from('vehicles').upsert(vehicle, {
          onConflict: 'vin',
          ignoreDuplicates: false,
        })
        totalUpserted++
      }

      // Check if there are more pages
      const totalCount = (data.total_matches_found as number) || 0
      offset += results.length
      keepFetching = offset < totalCount && results.length === 50
    }
  }

  // Mark vehicles no longer in the API as unavailable
  const { data: storedVehicles } = await supabase
    .from('vehicles')
    .select('vin')
    .eq('is_available', true)

  if (storedVehicles) {
    const toDeactivate = storedVehicles
      .filter(v => !allVins.has(v.vin))
      .map(v => v.vin)

    if (toDeactivate.length > 0) {
      await supabase
        .from('vehicles')
        .update({ is_available: false })
        .in('vin', toDeactivate)
    }
  }

  return new Response(JSON.stringify({
    success: true,
    upserted: totalUpserted,
    price_changes: totalPriceChanges,
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
