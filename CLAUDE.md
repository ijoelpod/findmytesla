# FindMyTesla — Progress Tracker

## Stack
- Frontend: React + Vite + Tailwind CSS + Lucide-React
- Backend: Supabase (Auth + Postgres + Edge Functions)
- Email: Resend.com
- Hosting: Vercel

## Progress Checklist
- [ ] Phase 1: GitHub repo + Vite scaffold + Supabase project created
- [ ] Phase 2: Database schema applied (`supabase db push`)
- [ ] Phase 3: Project folder structure created
- [ ] Phase 4: Tailwind dark theme configured
- [ ] Phase 5: Core components built (VehicleCard, HeartButton, AuthModal, Navbar)
- [ ] Phase 5: Pages built (Home, Detail, Watchlist, Auth)
- [ ] Phase 6: Edge Function — fetch-inventory deployed
- [ ] Phase 6: Edge Function — price-alert deployed
- [ ] Phase 6: Cron schedules set in Supabase
- [ ] Phase 7: Zip code filtering wired up
- [ ] Phase 8: Deployed to Vercel + env vars set

## Setup Instructions

### 1. Install CLI Tools (one-time)
```bash
brew install supabase/tap/supabase
npm install -g vercel
```

### 2. Create Supabase Project
1. Go to https://supabase.com → New Project → name it `findmytesla`
2. From Settings → API, copy your **Project URL** and **anon public key**

### 3. Create `.env.local` (never commit this file)
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key...
```

### 4. Link Supabase CLI to your project
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 5. Apply Database Schema
```bash
supabase db push
```

### 6. Run locally
```bash
npm run dev
# Open http://localhost:5173
```

### 7. Deploy Edge Functions
```bash
supabase functions deploy fetch-inventory
supabase functions deploy price-alert
```
Then set secrets in Supabase Dashboard → Edge Functions → Secrets:
- `RESEND_API_KEY` — from resend.com
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Settings → API

### 8. Deploy to Vercel
```bash
vercel
```
Set env vars in Vercel dashboard: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Key URLs (fill in as you go)
- Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_REF
- Vercel Dashboard: https://vercel.com/dashboard
- Live App: https://findmytesla.vercel.app

## Notes / Issues
(Add notes here as we build)
