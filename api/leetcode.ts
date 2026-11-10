/**
 * GET /api/leetcode?user=<leetcode-username>
 *
 * Solved-problem counts by difficulty plus global ranking, read from LeetCode's public GraphQL
 * endpoint (the same one leetcode.com's own profile page calls — no token needed).
 *
 * Deployed as a Vercel Function (Node.js runtime). Deliberately self-contained — no relative
 * imports — because the project is ESM and Node can't resolve extensionless imports at runtime.
 * vite.config.ts imports `handleLeetCodeRequest` to serve the same handler during `npm run dev`;
 * the UI imports only types.
 */

export interface LeetCodeStats {
  username: string
  solved: { all: number; easy: number; medium: number; hard: number }
  total: { all: number; easy: number; medium: number; hard: number }
  ranking: number | null
  fetchedAt: string
}

const USERNAME = /^[A-Za-z0-9_-]{1,40}$/

const QUERY = `query($u:String!){
  matchedUser(username:$u){ username profile{ ranking } submitStatsGlobal{ acSubmissionNum{ difficulty count } } }
  allQuestionsCount{ difficulty count }
}`

interface Bucket {
  difficulty: string
  count: number
}

function toCounts(list: Bucket[] | undefined) {
  const get = (d: string) => list?.find((b) => b.difficulty === d)?.count ?? 0
  return { all: get('All'), easy: get('Easy'), medium: get('Medium'), hard: get('Hard') }
}

async function fetchStats(username: string): Promise<LeetCodeStats> {
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      referer: 'https://leetcode.com',
      'user-agent': 'Mozilla/5.0 (compatible; portfolio-stats/1.0)',
    },
    body: JSON.stringify({ query: QUERY, variables: { u: username } }),
  })
  if (!res.ok) throw Object.assign(new Error(`LeetCode responded ${res.status}`), { status: 502 })
  const json = (await res.json()) as {
    data?: {
      matchedUser: { username: string; profile?: { ranking?: number }; submitStatsGlobal?: { acSubmissionNum?: Bucket[] } } | null
      allQuestionsCount?: Bucket[]
    }
    errors?: { message: string }[]
  }
  const user = json.data?.matchedUser
  if (!user) throw Object.assign(new Error(json.errors?.[0]?.message ?? 'LeetCode user not found'), { status: 404 })
  return {
    username: user.username,
    solved: toCounts(user.submitStatsGlobal?.acSubmissionNum),
    total: toCounts(json.data?.allQuestionsCount),
    ranking: user.profile?.ranking ?? null,
    fetchedAt: new Date().toISOString(),
  }
}

/** Framework-agnostic core: status, cache header and JSON body for a query string. */
export async function handleLeetCodeRequest(search: URLSearchParams): Promise<{ status: number; body: unknown; cache: string }> {
  const user = search.get('user')
  if (!user || !USERNAME.test(user)) return { status: 400, body: { error: 'invalid or missing ?user=' }, cache: 'no-store' }
  try {
    const stats = await fetchStats(user)
    // shared CDN cache for 5 min, serve stale for an hour while refreshing
    return { status: 200, body: stats, cache: 'public, s-maxage=300, stale-while-revalidate=3600' }
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
  const { status, body, cache } = await handleLeetCodeRequest(search)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', cache)
  res.setHeader('access-control-allow-origin', '*')
  res.end(JSON.stringify(body))
}
