// supabase/functions/price-alert/index.ts
//
// This Edge Function sends email alerts when a hearted vehicle's price changes.
// It runs after fetch-inventory has updated the DB.
//
// Schedule: Every 4 hours, 30 minutes after fetch-inventory (e.g. 30 */4 * * *)
// Deploy with: supabase functions deploy price-alert
//
// Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
//   SUPABASE_URL              (auto-provided)
//   SUPABASE_SERVICE_ROLE_KEY (auto-provided)
//   RESEND_API_KEY            (get from resend.com)
//   FROM_EMAIL                (your verified sender email, e.g. alerts@yourdomain.com)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LOOKBACK_HOURS = 5   // Check for price changes in the last 5 hours

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const resendKey  = Deno.env.get('RESEND_API_KEY')!
  const fromEmail  = Deno.env.get('FROM_EMAIL') || 'alerts@findmytesla.com'
  const lookbackTime = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString()

  // Find all price changes recorded since last run
  const { data: recentChanges } = await supabase
    .from('price_history')
    .select('vin, price, recorded_at')
    .gte('recorded_at', lookbackTime)
    .order('recorded_at', { ascending: false })

  if (!recentChanges || recentChanges.length === 0) {
    return new Response(JSON.stringify({ success: true, alerts_sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get unique VINs that changed price
  const changedVins = [...new Set(recentChanges.map(r => r.vin))]

  let alertsSent = 0

  for (const vin of changedVins) {
    // Get vehicle details
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('vin, model, year, trim_name, price, detail_url')
      .eq('vin', vin)
      .single()

    if (!vehicle) continue

    // Get the previous price (the row before the most recent one)
    const { data: history } = await supabase
      .from('price_history')
      .select('price, recorded_at')
      .eq('vin', vin)
      .order('recorded_at', { ascending: false })
      .limit(2)

    if (!history || history.length < 2) continue

    const newPrice = history[0].price
    const oldPrice = history[1].price

    if (newPrice === oldPrice) continue

    const priceDiff  = newPrice - oldPrice
    const direction  = priceDiff < 0 ? 'dropped' : 'increased'
    const diffAmount = Math.abs(priceDiff)

    // Find all users who have this vehicle hearted
    const { data: favorites } = await supabase
      .from('user_favorites')
      .select('user_id')
      .eq('vin', vin)

    if (!favorites || favorites.length === 0) continue

    for (const fav of favorites) {
      // Check we haven't already sent an alert for this vin + price combo
      const { data: existingAlert } = await supabase
        .from('alert_log')
        .select('id')
        .eq('user_id', fav.user_id)
        .eq('vin', vin)
        .eq('new_price', newPrice)
        .single()

      if (existingAlert) continue  // already alerted, skip

      // Get the user's email from Supabase auth
      const { data: { user } } = await supabase.auth.admin.getUserById(fav.user_id)
      if (!user?.email) continue

      const modelLabel = {
        m3: 'Model 3', my: 'Model Y', ms: 'Model S', mx: 'Model X', ct: 'Cybertruck',
      }[vehicle.model] || vehicle.model.toUpperCase()

      const vehicleName = `${vehicle.year} Tesla ${modelLabel}${vehicle.trim_name ? ` ${vehicle.trim_name}` : ''}`
      const formattedOld = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(oldPrice)
      const formattedNew = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(newPrice)
      const formattedDiff = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(diffAmount)

      // Send email via Resend
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [user.email],
          subject: `Price ${direction} on your ${vehicleName} — ${formattedNew}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #212121; color: #F2F2F2; padding: 32px; border-radius: 12px;">
              <h1 style="color: #CC0000; margin: 0 0 8px;">FindMyTesla</h1>
              <h2 style="font-size: 18px; margin: 0 0 24px; color: #F2F2F2;">Price Alert</h2>

              <p style="font-size: 16px; color: #F2F2F2;">
                The price on your saved <strong>${vehicleName}</strong> has <strong>${direction}</strong>!
              </p>

              <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #9ca3af; padding: 4px 0;">Previous price</td>
                    <td style="text-align: right; color: #F2F2F2; font-weight: bold;">${formattedOld}</td>
                  </tr>
                  <tr>
                    <td style="color: #9ca3af; padding: 4px 0;">New price</td>
                    <td style="text-align: right; color: ${direction === 'dropped' ? '#4ade80' : '#f87171'}; font-weight: bold; font-size: 20px;">${formattedNew}</td>
                  </tr>
                  <tr>
                    <td style="color: #9ca3af; padding: 4px 0;">Change</td>
                    <td style="text-align: right; color: ${direction === 'dropped' ? '#4ade80' : '#f87171'}; font-weight: bold;">
                      ${direction === 'dropped' ? '▼' : '▲'} ${formattedDiff}
                    </td>
                  </tr>
                </table>
              </div>

              <a href="${vehicle.detail_url}"
                 style="display: block; background: #CC0000; color: white; text-align: center;
                        padding: 14px 24px; border-radius: 8px; text-decoration: none;
                        font-weight: bold; font-size: 16px; margin: 24px 0;">
                View Vehicle →
              </a>

              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                You received this because you saved this vehicle on FindMyTesla.<br>
                <a href="https://findmytesla.vercel.app/watchlist" style="color: #9ca3af;">Manage your watchlist</a>
              </p>
            </div>
          `,
        }),
      })

      if (emailRes.ok) {
        // Log the sent alert to prevent duplicates
        await supabase.from('alert_log').insert({
          user_id: fav.user_id,
          vin,
          old_price: oldPrice,
          new_price: newPrice,
        })
        alertsSent++
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    alerts_sent: alertsSent,
    vins_checked: changedVins.length,
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
