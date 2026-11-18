import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';
const ALLOWED_ORIGINS = ['https://peterakilimali.site', 'http://localhost:5173', 'http://localhost:5174'];

function isAllowedEndpoint(pathname) {
  if (pathname === '/user/repos') return true;
  if (pathname === '/users/Peter23xp/repos') return true;
  if (pathname === '/graphql') return true;
  if (/^\/repos\/Peter23xp\/[^/]+\/commits$/.test(pathname)) return true;
  if (/^\/repos\/Peter23xp\/[^/]+\/readme$/.test(pathname)) return true;
  return false;
}

app.use((req, res, next) => {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.all('/api/github', async (req, res) => {
  let reqPath, method, body;
  if (req.method === 'POST') {
    const b = req.body ?? {};
    reqPath = b.path; method = b.method || 'POST'; body = b.body;
  } else {
    reqPath = req.query?.path; method = 'GET'; body = null;
  }

  if (!reqPath || typeof reqPath !== 'string') {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const [pathname] = reqPath.split('?');
  if (!isAllowedEndpoint(pathname)) {
    return res.status(403).json({ error: 'Endpoint not allowed' });
  }

  const url = `https://api.github.com${reqPath}`;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'peterakilimali-portfolio',
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  };

  try {
    const ghRes = await fetch(url, {
      method: method === 'POST' ? 'POST' : 'GET',
      headers: {
        ...headers,
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const contentType = ghRes.headers.get('content-type') ?? '';
    const linkHeader = ghRes.headers.get('Link');

    if (contentType.includes('application/json')) {
      const data = await ghRes.json();
      const response = { data };
      if (linkHeader) response.link = linkHeader;
      res.status(ghRes.status).json(response);
    } else {
      const text = await ghRes.text();
      res.status(ghRes.status).send(text);
    }
  } catch {
    res.status(502).json({ error: 'GitHub API unreachable' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
