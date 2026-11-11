/**
 * GET /api/keepalive — a tiny read against Supabase so a free-tier project never pauses for
 * inactivity. Scheduled weekly by the cron entry in vercel.json. Self-contained on purpose
 * (ESM project; no relative imports in functions).
 */

// no @types/node in this project — the slice of `process` we read
declare const process: { env: Record<string, string | undefined> }

interface Req {
  url?: string
  headers: Record<string, string | string[] | undefined>
}
interface Res {
  statusCode: number
  setHeader(name: string, value: string): void
  end(body?: string): void
}

const env = (...names: string[]) => names.map((n) => process.env[n]).find(Boolean) ?? ''

export default async function handler(_req: Req, res: Res): Promise<void> {
  const url = env('VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
  const key = env('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  if (!url || !key) {
    res.statusCode = 200
    res.end(JSON.stringify({ ok: false, reason: 'supabase not configured' }))
    return
  }
  try {
    const r = await fetch(`${url}/rest/v1/content?select=section&limit=1`, { headers: { apikey: key, authorization: `Bearer ${key}` } })
    res.statusCode = r.ok ? 200 : 502
    res.end(JSON.stringify({ ok: r.ok, status: r.status, at: new Date().toISOString() }))
  } catch (e) {
    res.statusCode = 502
    res.end(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }))
  }
}
