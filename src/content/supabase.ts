import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Both values are public by design (Supabase's anon key is meant to ship in the browser);
 * the database's row-level security decides what it can do. vite.config.ts fills them from
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, or from the names the Vercel–Supabase integration
 * injects (SUPABASE_URL / SUPABASE_ANON_KEY, NEXT_PUBLIC_…).
 */
export const SUPABASE_URL: string = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '')
export const SUPABASE_ANON_KEY: string = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/** Headers for talking to PostgREST / Storage directly as the anonymous role. */
export const anonHeaders = (): Record<string, string> => ({ apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` })

/**
 * The SDK is ~55 kB gzipped and visitors never need it: published content is read with plain
 * fetch (see ContentProvider). It is loaded on demand for Realtime (after first paint) and for
 * the owner console (auth, drafts, uploads), so it never sits on the critical path.
 */
let clientPromise: Promise<SupabaseClient> | null = null
let client: SupabaseClient | null = null

export function loadSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured) return Promise.reject(new Error('Supabase is not configured'))
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
      })
      return client
    })
  }
  return clientPromise
}

/** The client if it has already been loaded (null otherwise) — prefer loadSupabase(). */
export function getSupabase(): SupabaseClient | null {
  return client
}

/** Public URL of an object in the media bucket; `download` forces the browser to save it under that name. */
export function mediaUrl(path: string, download?: string) {
  const base = `${SUPABASE_URL}/storage/v1/object/public/media/${path.replace(/^\/+/, '')}`
  return download ? `${base}?download=${encodeURIComponent(download)}` : base
}
