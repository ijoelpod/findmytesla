// src/lib/supabaseClient.js
// Single shared Supabase client used throughout the entire frontend.
// Import { supabase } from here wherever you need to query the DB or use auth.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'See CLAUDE.md for setup instructions.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
