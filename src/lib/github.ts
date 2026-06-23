// src/lib/github.ts
// Toutes les requêtes GitHub passent par /api/github (proxy serveur).
// Le token n'est JAMAIS exposé côté client.

import type { GitHubRepo } from '../types/portfolio'

const PROXY = '/api/github'

// Appel GET via le proxy
async function proxyGet<T>(path: string): Promise<{ data: T; link: string | null }> {
  const res = await fetch(`${PROXY}?path=${encodeURIComponent(path)}`)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub proxy ${res.status} — ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  return { data: json.data as T, link: json.link ?? null }
}

// Appel POST via le proxy (GraphQL)
async function proxyPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, method: 'POST', body }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub proxy ${res.status} — ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  return json.data as T
}

// Extrait l'URL rel="next" du header Link, ou null si dernière page.
function parseNextPath(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  const next = linkHeader.split(',').find((p) => p.includes('rel="next"'))
  if (!next) return null
  const match = next.match(/<https:\/\/api\.github\.com([^>]+)>/)
  return match ? match[1] : null
}

/**
 * Récupère tous les repos de l'utilisateur authentifié via le proxy serveur.
 * Inclut les repos privés si le token serveur a le scope repo.
 */
export async function fetchAllGitHubRepos(
  _username: string,
  _token: string,
  includeForks = false,
): Promise<GitHubRepo[]> {
  const all: GitHubRepo[] = []
  let path: string | null =
    '/user/repos?per_page=100&sort=updated&direction=desc&affiliation=owner,collaborator&visibility=all'

  while (path) {
    const { data, link } = await proxyGet<GitHubRepo[]>(path)
    all.push(...data)
    path = parseNextPath(link)
  }

  return all.filter((repo) => !repo.archived && (includeForks || !repo.fork))
}

/**
 * Récupère les contributions GitHub via GraphQL (proxy serveur).
 */
export async function fetchContributions(username: string) {
  const query = `{
    user(login: "${username}") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { contributionCount date }
          }
        }
      }
    }
  }`
  const result = await proxyPost<{
    data: { user: { contributionsCollection: { contributionCalendar: unknown } } }
  }>('/graphql', { query })
  const r = result as { data?: { user?: { contributionsCollection?: { contributionCalendar?: unknown } } } }
  return r?.data?.user?.contributionsCollection?.contributionCalendar ?? null
}

/**
 * Récupère les commits d'un repo via le proxy.
 * Retourne le Link header pour extraire le count total.
 */
export async function fetchRepoCommitCount(
  username: string,
  repoName: string,
): Promise<number> {
  const { link } = await proxyGet<unknown[]>(
    `/repos/${username}/${repoName}/commits?per_page=1`,
  )
  const match = (link ?? '').match(/[?&]page=(\d+)>;\s*rel="last"/)
  return match ? parseInt(match[1]) : 1
}

/**
 * Récupère le README d'un repo via le proxy.
 */
export async function fetchRepoReadme(
  username: string,
  repoName: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${PROXY}?path=${encodeURIComponent(`/repos/${username}/${repoName}/readme`)}`,
      { headers: { Accept: 'application/vnd.github.raw' } },
    )
    if (!res.ok) return null
    // Le proxy renvoie le JSON Supabase si content-type json, sinon le texte brut
    const ct = res.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) {
      const json = await res.json()
      // GitHub renvoie le contenu base64 dans json.data.content
      const encoded: string = json?.data?.content ?? ''
      if (!encoded) return null
      return decodeURIComponent(escape(atob(encoded.replace(/\n/g, ''))))
    }
    return await res.text()
  } catch {
    return null
  }
}
