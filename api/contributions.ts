import { handleContributionsRequest } from '../src/lib/contributions'

/**
 * GET /api/contributions?user=<github-login>&to=<YYYY-MM-DD in the viewer's timezone>
 * Vercel Function (Node.js runtime, Web handler signature). Local dev is served by the
 * matching middleware in vite.config.ts so `npm run dev` hits the same code.
 */
export async function GET(request: Request): Promise<Response> {
  const { status, body, cache } = await handleContributionsRequest(new URL(request.url).searchParams)
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache,
      'access-control-allow-origin': '*',
    },
  })
}
