import { handleContributionsRequest } from '../src/lib/contributions'

/**
 * GET /api/contributions?user=<github-login>&to=<YYYY-MM-DD in the viewer's timezone>
 * Vercel Function on the Node.js runtime (classic req/res signature — supported everywhere).
 * Local dev is served by the matching middleware in vite.config.ts so `npm run dev` hits the same code.
 */
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
