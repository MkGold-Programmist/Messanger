import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://pdovnvdnqenmuvairimu.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkb3ZudmRucWVubXV2YWlyaW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDA2NjMsImV4cCI6MjA5NzUxNjY2M30.CdUJCqhKIhL0YrFSti5URWWXrgeYKmW7Npdsrauasd0"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase config is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
