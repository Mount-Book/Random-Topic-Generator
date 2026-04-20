import type { IncomingMessage } from 'node:http'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleFeedbackRequest } from './server/feedback/feedbackHandler'

const readJsonBody = async (request: IncomingMessage) => {
  const chunks: Uint8Array[] = []

  for await (const chunk of request) {
    chunks.push(
      typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk),
    )
  }

  if (chunks.length === 0) {
    return {}
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  for (const [key, value] of Object.entries(env)) {
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }

  return {
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(
        process.env.npm_package_version ?? '0.0.0',
      ),
    },
    plugins: [
      react(),
      {
        name: 'feedback-api-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/api/feedback', async (req, res) => {
            const body = req.method === 'POST' ? await readJsonBody(req) : {}
            const response = await handleFeedbackRequest({
              body,
              headers: req.headers,
              method: req.method,
              requestUrl: req.url,
            })

            res.statusCode = response.status
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(response.body))
          })
        },
      },
    ],
  }
})
