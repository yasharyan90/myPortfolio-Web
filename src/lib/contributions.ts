/**
 * Server-side: pull a contribution calendar straight from GitHub's public contributions page
 * (the same page github.com renders on a profile), so the data is as current as GitHub itself.
 *
 * Why not a third-party API: they query in UTC and cache for minutes, so "today" in India
 * (UTC+5:30) is missing until 05:30 and fresh commits lag. Asking GitHub for an explicit
 * `to=<today in the viewer's timezone>` returns today's cell immediately.
 *
 * Runs in the Vercel function (api/contributions.ts) and the Vite dev middleware — never in the browser.
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
  const now = new Date()
  const utcToday = iso(now)
  if (!input || !ISO_DATE.test(input)) return utcToday
  const diff = Math.abs(new Date(input + 'T00:00:00Z').getTime() - new Date(utcToday + 'T00:00:00Z').getTime())
  return diff <= 86_400_000 ? input : utcToday
}

export function isValidUsername(u: string | null | undefined): u is string {
  return !!u && USERNAME.test(u)
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`))
  return m?.[1]
}

export function parseContributionsHtml(html: string): { days: ContributionDay[]; total: number } {
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
    days.push({ date, count: (id && counts.get(id)) || 0, level: (Math.min(4, Math.max(0, level)) as Level) })
  }
  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return { days, total: days.reduce((s, d) => s + d.count, 0) }
}

export async function fetchContributions(username: string, to: string): Promise<ContributionCalendar> {
  const toDate = new Date(to + 'T00:00:00Z')
  const fromDate = new Date(toDate)
  fromDate.setUTCFullYear(fromDate.getUTCFullYear() - 1)
  fromDate.setUTCDate(fromDate.getUTCDate() + 1)
  const from = iso(fromDate)

  // GitHub snaps any from/to window to a single calendar year, so fetch each year the window
  // touches (at most two) and merge — future days come back at level 0 and are trimmed below.
  const years: number[] = []
  for (let y = fromDate.getUTCFullYear(); y <= toDate.getUTCFullYear(); y++) years.push(y)
  const pages = await Promise.all(
    years.map(async (y) => {
      const url = `https://github.com/users/${encodeURIComponent(username)}/contributions?from=${y}-01-01&to=${y}-12-31`
      const res = await fetch(url, {
        headers: {
          accept: 'text/html',
          'user-agent': 'Mozilla/5.0 (compatible; portfolio-contributions/1.0; +https://github.com/yasharyan90)',
        },
      })
      if (res.status === 404) throw Object.assign(new Error(`GitHub user not found: ${username}`), { status: 404 })
      if (!res.ok) throw Object.assign(new Error(`GitHub responded ${res.status}`), { status: 502 })
      return parseContributionsHtml(await res.text()).days
    }),
  )

  const byDate = new Map<string, ContributionDay>()
  pages.flat().forEach((d) => byDate.set(d.date, d))
  const trimmed = [...byDate.values()].filter((d) => d.date >= from && d.date <= to).sort((a, b) => (a.date < b.date ? -1 : 1))
  if (!trimmed.length) throw Object.assign(new Error('No contribution cells found — GitHub markup may have changed'), { status: 502 })
  const total = trimmed.reduce((s, d) => s + d.count, 0)

  return { username, from, to, total, days: trimmed, fetchedAt: new Date().toISOString() }
}

/** Framework-agnostic handler: returns status, headers and JSON body for a query string. */
export async function handleContributionsRequest(search: URLSearchParams): Promise<{ status: number; body: unknown; cache: string }> {
  const user = search.get('user')
  if (!isValidUsername(user)) return { status: 400, body: { error: 'invalid or missing ?user=' }, cache: 'no-store' }
  const to = resolveToDate(search.get('to'))
  try {
    const calendar = await fetchContributions(user, to)
    // near-live: shared CDN cache for 60s, serve stale while refreshing for 10 min
    return { status: 200, body: calendar, cache: 'public, s-maxage=60, stale-while-revalidate=600' }
  } catch (e) {
    const err = e as Error & { status?: number }
    return { status: err.status ?? 502, body: { error: err.message }, cache: 'no-store' }
  }
}
