import { defineConfig, type Plugin } from 'vite'
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

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
})
