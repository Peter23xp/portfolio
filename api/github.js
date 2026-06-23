// api/github.js — Vercel Serverless Function
// Proxy sécurisé pour l'API GitHub. Le token reste côté serveur,
// jamais exposé dans le bundle client.

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';
const ALLOWED_PATHS = new Set([
  '/user/repos',
  '/users/Peter23xp/repos',
  '/graphql',
]);

function isAllowedEndpoint(path) {
  // Accepte les chemins exacts ou les sous-chemins de repos connus
  if (ALLOWED_PATHS.has(path)) return true;
  if (/^\/repos\/Peter23xp\/[^/]+\/commits$/.test(path)) return true;
  if (/^\/repos\/Peter23xp\/[^/]+\/readme$/.test(path)) return true;
  return false;
}

export default async function handler(req, res) {
  // CORS — uniquement le domaine du portfolio
  const origin = req.headers.origin ?? '';
  const allowed = ['https://peterakilimali.site', 'http://localhost:5173'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Lire le chemin et la méthode cibles depuis la requête
  const { path, method = 'GET', body } = req.method === 'POST'
    ? req.body ?? {}
    : { path: req.query.path, method: 'GET', body: null };

  if (!path || typeof path !== 'string') {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  // Whitelist stricte — aucun path arbitraire n'est proxifié
  if (!isAllowedEndpoint(path)) {
    res.status(403).json({ error: 'Endpoint not allowed' });
    return;
  }

  const url = `https://api.github.com${path}`;
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
  } catch (err) {
    res.status(502).json({ error: 'GitHub API unreachable' });
  }
}
