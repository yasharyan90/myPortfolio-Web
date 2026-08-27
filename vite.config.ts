import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleContributionsRequest } from './src/lib/contributions'

/** Serves /api/contributions during `vite dev` with the same handler Vercel runs in production. */
function devApi(): Plugin {
  return {
    name: 'dev-api-contributions',
    configureServer(server) {
      server.middlewares.use('/api/contributions', async (req, res) => {
        const search = new URL((req as { url?: string }).url ?? '/', 'http://localhost').searchParams
        const { status, body, cache } = await handleContributionsRequest(search)
        res.statusCode = status
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.setHeader('cache-control', cache)
        res.end(JSON.stringify(body))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
})
