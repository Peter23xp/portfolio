import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const GITHUB_TOKEN = env.GITHUB_TOKEN || env.VITE_GITHUB_TOKEN || ''

  return {
    plugins: [
      react(),
      {
        name: 'github-proxy',
        configureServer(server) {
          server.middlewares.use('/api/github', (req, res) => {
            const url = new URL(req.url, 'http://localhost')
            let body = ''
            req.on('data', c => { body += c })
            req.on('end', async () => {
              let path, method, reqBody
              if (req.method === 'POST') {
                try { const p = JSON.parse(body); path = p.path; method = p.method || 'POST'; reqBody = p.body } catch { /* */ }
              } else {
                path = url.searchParams.get('path')
                method = 'GET'
              }

              if (!path) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Missing path' }))
                return
              }

              // Valider le pathname (sans query string)
              const [pathname] = path.split('?')
              const allowedPaths = ['/user/repos', '/users/Peter23xp/repos', '/graphql']
              const isAllowed = allowedPaths.includes(pathname)
                || /^\/repos\/Peter23xp\/[^/]+\/commits$/.test(pathname)
                || /^\/repos\/Peter23xp\/[^/]+\/readme$/.test(pathname)
              if (!isAllowed) {
                res.writeHead(403, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Endpoint not allowed' }))
                return
              }

              const ghUrl = `https://api.github.com${path}`
              const headers = {
                Accept: 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'peterakilimali-portfolio',
                ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
              }

              try {
                const ghRes = await fetch(ghUrl, {
                  method: method === 'POST' ? 'POST' : 'GET',
                  headers: {
                    ...headers,
                    ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
                  },
                  ...(reqBody ? { body: JSON.stringify(reqBody) } : {}),
                })

                const ct = ghRes.headers.get('content-type') || ''
                const linkHeader = ghRes.headers.get('Link')

                if (ct.includes('application/json')) {
                  const data = await ghRes.json()
                  const response = { data }
                  if (linkHeader) response.link = linkHeader
                  res.writeHead(ghRes.status, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify(response))
                } else {
                  const text = await ghRes.text()
                  res.writeHead(ghRes.status, { 'Content-Type': ct || 'text/plain' })
                  res.end(text)
                }
              } catch (err) {
                res.writeHead(502, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'GitHub API unreachable' }))
              }
            })
          })
        },
      },
    ],
  }
})
