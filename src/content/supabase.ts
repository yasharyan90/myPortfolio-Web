import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Both values are public by design (Supabase's anon key is meant to ship in the browser);
 * the database's row-level security decides what it can do. vite.config.ts fills them from
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, or from the names the Vercel–Supabase integration
 * injects (SUPABASE_URL / SUPABASE_ANON_KEY, NEXT_PUBLIC_…).
 */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

let client: SupabaseClient | null = null

/** Lazily created so pages that never touch Supabase don't pay for it. Null when not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    })
  }
  return client
}

/** Public URL of an object in the media bucket; `download` forces the browser to save it under that name. */
export function mediaUrl(path: string, download?: string) {
  const base = `${SUPABASE_URL}/storage/v1/object/public/media/${path.replace(/^\/+/, '')}`
  return download ? `${base}?download=${encodeURIComponent(download)}` : base
}
