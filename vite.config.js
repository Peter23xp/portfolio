import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { createRequire } from 'module'

// Charge le handler Vercel localement pour le dev
async function githubProxyPlugin() {
  return {
    name: 'github-proxy',
    configureServer(server) {
      server.middlewares.use('/api/github', async (req, res) => {
        // Simuler l'objet req/res Vercel
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          const url = new URL(req.url, 'http://localhost')

          const fakeReq = {
            method: req.method,
            headers: req.headers,
            query: Object.fromEntries(url.searchParams),
            body: body ? (() => { try { return JSON.parse(body) } catch { return {} } })() : {},
          }

          const fakeRes = {
            _status: 200,
            _headers: {},
            status(code) { this._status = code; return this },
            setHeader(k, v) { this._headers[k] = v; return this },
            json(data) {
              res.writeHead(this._status, { 'Content-Type': 'application/json', ...this._headers })
              res.end(JSON.stringify(data))
            },
            send(data) {
              res.writeHead(this._status, { 'Content-Type': 'text/plain', ...this._headers })
              res.end(data)
            },
            end() { res.writeHead(this._status, this._headers); res.end() },
          }

          try {
            const { default: handler } = await import('./api/github.js?t=' + Date.now())
            await handler(fakeReq, fakeRes)
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: String(err) }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), await githubProxyPlugin()],
})
