import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleContributionsRequest } from './api/contributions'
import { handleLeetCodeRequest } from './api/leetcode'

type ApiHandler = (search: URLSearchParams) => Promise<{ status: number; body: unknown; cache: string }>

const routes: Record<string, ApiHandler> = {
  '/api/contributions': handleContributionsRequest,
  '/api/leetcode': handleLeetCodeRequest,
}

/** Serves the /api/* functions during `vite dev` with the same handlers Vercel runs in production. */
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      for (const [path, handle] of Object.entries(routes)) {
        server.middlewares.use(path, async (req, res) => {
          const search = new URL((req as { url?: string }).url ?? '/', 'http://localhost').searchParams
          const { status, body, cache } = await handle(search)
          res.statusCode = status
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.setHeader('cache-control', cache)
          res.end(JSON.stringify(body))
        })
      }
    },
  }
}

// no @types/node in this project — the slice of `process` we read
declare const process: { env: Record<string, string | undefined>; cwd(): string }

/** Vercel exposes the deployed commit at build time; locally there is none, so the footer says "dev". */
const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? ''
const buildInfo = {
  __COMMIT_SHA__: JSON.stringify(sha ? sha.slice(0, 7) : 'dev'),
  __COMMIT_MESSAGE__: JSON.stringify((process.env.VERCEL_GIT_COMMIT_MESSAGE ?? '').split('\n')[0]),
  __BUILT_AT__: JSON.stringify(new Date().toISOString()),
}

export default defineConfig(({ mode }) => {
  // Supabase: accept our own VITE_ names, or the names the Vercel–Supabase integration injects.
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const pick = (...names: string[]) => names.map((n) => process.env[n] ?? fileEnv[n]).find(Boolean) ?? ''
  return {
    plugins: [react(), tailwindcss(), devApi()],
    define: {
      ...buildInfo,
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(pick('VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(pick('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')),
    },
  }
})
