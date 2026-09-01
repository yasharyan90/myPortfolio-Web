/**
 * GET /api/contributions?user=<github-login>&to=<YYYY-MM-DD in the viewer's timezone>[&year=YYYY]
 *
 * Without ?year: a rolling window covering the 365 days ending on `to` (GitHub's default view).
 * With ?year: that calendar year, GitHub-profile style — trimmed to `to` for the current year.
 *
 * Pulls a contribution calendar straight from GitHub's public contributions page (the same page
 * github.com renders on a profile), so the data is as current as GitHub itself.
 *
 * Why not a third-party API: they query in UTC and cache for minutes, so "today" in India
 * (UTC+5:30) is missing until 05:30 and fresh commits lag. Asking GitHub for an explicit
 * `to=<today in the viewer's timezone>` returns today's cell immediately.
 *
 * Deployed as a Vercel Function (Node.js runtime). This file is deliberately self-contained —
 * no relative imports — because the project is ESM and Node can't resolve extensionless
 * imports at runtime. vite.config.ts imports `handleContributionsRequest` from here to serve
 * the same handler during `npm run dev`; the UI imports only types.
 */

export type Level = 0 | 1 | 2 | 3 | 4

export interface ContributionDay {
  date: string
  count: number
  level: Level
}

export interface ContributionCalendar {
  username: string
  from: string
  to: string
  total: number
  days: ContributionDay[]
  fetchedAt: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Clamp a client-supplied "today" to within a day of the server's UTC today (timezones can legitimately differ by up to ±14h). */
export function resolveToDate(input: string | null | undefined): string {
  const utcToday = iso(new Date())
  if (!input || !ISO_DATE.test(input)) return utcToday
  const diff = Math.abs(new Date(input + 'T00:00:00Z').getTime() - new Date(utcToday + 'T00:00:00Z').getTime())
  return diff <= 86_400_000 ? input : utcToday
}

export function isValidUsername(u: string | null | undefined): u is string {
  return !!u && USERNAME.test(u)
}

/** Parse a ?year= value: any calendar year from GitHub's launch (2008) through the current one. */
export function resolveYear(input: string | null | undefined, to: string): number | undefined {
  if (!input || !/^\d{4}$/.test(input)) return undefined
  const y = Number(input)
  return y >= 2008 && y <= Number(to.slice(0, 4)) ? y : undefined
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`))
  return m?.[1]
}

export function parseContributionsHtml(html: string): ContributionDay[] {
  // count per cell lives in a sibling <tool-tip for="cell-id">N contributions on Month Dth.</tool-tip>
  const counts = new Map<string, number>()
  for (const m of html.matchAll(/<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g)) {
    const forId = attr(m[1], 'for')
    if (!forId) continue
    const n = m[2].trim().match(/^(\d+|No) contribution/i)
    if (n) counts.set(forId, n[1].toLowerCase() === 'no' ? 0 : Number(n[1]))
  }

  const days: ContributionDay[] = []
  for (const m of html.matchAll(/<td\b([^>]*\bdata-date="[^"]+"[^>]*)>/g)) {
    const tag = m[1]
    const date = attr(tag, 'data-date')
    const id = attr(tag, 'id')
    const level = Number(attr(tag, 'data-level') ?? 0)
    if (!date || !ISO_DATE.test(date)) continue
    days.push({ date, count: (id && counts.get(id)) || 0, level: Math.min(4, Math.max(0, level)) as Level })
  }
  return days
}

async function fetchYear(username: string, year: number): Promise<ContributionDay[]> {
  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions?from=${year}-01-01&to=${year}-12-31`
  const res = await fetch(url, {
    headers: {
      accept: 'text/html',
      'user-agent': 'Mozilla/5.0 (compatible; portfolio-contributions/1.0; +https://github.com/yasharyan90)',
    },
  })
  if (res.status === 404) throw Object.assign(new Error(`GitHub user not found: ${username}`), { status: 404 })
  if (!res.ok) throw Object.assign(new Error(`GitHub responded ${res.status}`), { status: 502 })
  return parseContributionsHtml(await res.text())
}

export async function fetchContributions(username: string, to: string, year?: number): Promise<ContributionCalendar> {
  let from: string
  if (year !== undefined) {
    // GitHub-profile-style single-year view: Jan 1 through Dec 31, trimmed to today for the current year.
    from = `${year}-01-01`
    const dec31 = `${year}-12-31`
    if (to < from || to > dec31) to = dec31
  } else {
    const toDate = new Date(to + 'T00:00:00Z')
    const fromDate = new Date(toDate)
    fromDate.setUTCFullYear(fromDate.getUTCFullYear() - 1)
    fromDate.setUTCDate(fromDate.getUTCDate() + 1)
    from = iso(fromDate)
  }

  // GitHub snaps any from/to window to a single calendar year, so fetch each year the window
  // touches (at most two) and merge — future days come back at level 0 and are trimmed below.
  const years: number[] = []
  for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) years.push(y)
  const pages = await Promise.all(years.map((y) => fetchYear(username, y)))

  const byDate = new Map<string, ContributionDay>()
  pages.flat().forEach((d) => byDate.set(d.date, d))
  const days = [...byDate.values()].filter((d) => d.date >= from && d.date <= to).sort((a, b) => (a.date < b.date ? -1 : 1))
  if (!days.length) throw Object.assign(new Error('No contribution cells found — GitHub markup may have changed'), { status: 502 })
  const total = days.reduce((s, d) => s + d.count, 0)

  return { username, from, to, total, days, fetchedAt: new Date().toISOString() }
}

/** Framework-agnostic core: status, cache header and JSON body for a query string. */
export async function handleContributionsRequest(search: URLSearchParams): Promise<{ status: number; body: unknown; cache: string }> {
  const user = search.get('user')
  if (!isValidUsername(user)) return { status: 400, body: { error: 'invalid or missing ?user=' }, cache: 'no-store' }
  const to = resolveToDate(search.get('to'))
  const yearParam = search.get('year')
  const year = resolveYear(yearParam, to)
  if (yearParam && year === undefined) return { status: 400, body: { error: 'invalid ?year=' }, cache: 'no-store' }
  try {
    const calendar = await fetchContributions(user, to, year)
    // a finished past year never changes — cache it for a day; otherwise near-live:
    // shared CDN cache for 60s, serve stale while refreshing for 10 min
    const cache =
      year !== undefined && year < Number(to.slice(0, 4))
        ? 'public, s-maxage=86400, stale-while-revalidate=604800'
        : 'public, s-maxage=60, stale-while-revalidate=600'
    return { status: 200, body: calendar, cache }
  } catch (e) {
    const err = e as Error & { status?: number }
    return { status: err.status ?? 502, body: { error: err.message }, cache: 'no-store' }
  }
}

/* ── Vercel Function entry (classic Node req/res signature) ─────────────── */

interface Req {
  url?: string
  headers: Record<string, string | string[] | undefined>
}
interface Res {
  statusCode: number
  setHeader(name: string, value: string): void
  end(body?: string): void
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const host = (Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host) ?? 'localhost'
  const search = new URL(req.url ?? '/', `https://${host}`).searchParams
  const { status, body, cache } = await handleContributionsRequest(search)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', cache)
  res.setHeader('access-control-allow-origin', '*')
  res.end(JSON.stringify(body))
}
