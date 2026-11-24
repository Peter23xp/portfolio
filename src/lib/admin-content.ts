// src/lib/admin-content.ts
// Écriture du contenu éditable (migration 005) depuis l'admin : projets vitrine,
// parcours, réglages, médias. Les écritures passent la RLS « admin uniquement ».

import { supabase } from './supabase'

export interface Screenshot {
  url: string
  alt_fr?: string
  alt_en?: string
  /** cadre d'affichage : téléphone ou fenêtre de navigateur (absent = déduit des proportions) */
  kind?: 'mobile' | 'desktop'
}

/** Type d'une capture d'après ses proportions : plus large que haute = ordinateur. */
export async function detectShotKind(file: File): Promise<'mobile' | 'desktop'> {
  try {
    const bmp = await createImageBitmap(file)
    const kind = bmp.width > bmp.height * 1.05 ? 'desktop' : 'mobile'
    bmp.close()
    return kind
  } catch {
    return 'mobile'
  }
}

export interface ShowcaseProject {
  id?: string
  slug: string
  name: string
  category: string
  tagline_fr: string
  tagline_en: string
  body_fr: string
  body_en: string
  role_fr: string
  role_en: string
  platforms: string
  stack: string[]
  site_url: string
  ios_url: string
  android_url: string
  github_url: string
  icon_url: string
  screenshots: Screenshot[]
  is_featured: boolean
  published: boolean
  display_order: number
}

export interface TimelineStep {
  id?: string
  period_fr: string
  period_en: string
  title_fr: string
  title_en: string
  detail_fr: string
  detail_en: string
  published: boolean
  display_order: number
}

export const emptyProject = (order: number): ShowcaseProject => ({
  slug: '', name: '', category: 'livre',
  tagline_fr: '', tagline_en: '', body_fr: '', body_en: '', role_fr: '', role_en: '',
  platforms: '', stack: [], site_url: '', ios_url: '', android_url: '', github_url: '', icon_url: '',
  screenshots: [], is_featured: false, published: true, display_order: order,
})

export const emptyStep = (order: number): TimelineStep => ({
  period_fr: '', period_en: '', title_fr: '', title_en: '', detail_fr: '', detail_en: '',
  published: true, display_order: order,
})

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Message lisible quand la migration 005 n'est pas encore appliquée.
function explain(error: { message?: string; code?: string } | null): never {
  const msg = error?.message ?? 'Erreur inconnue'
  if (/does not exist|schema cache|42P01/i.test(msg) || error?.code === '42P01')
    throw new Error('Tables absentes : applique la migration 005_portfolio_content.sql dans Supabase (SQL Editor).')
  if (/row-level security|permission denied|42501/i.test(msg))
    throw new Error('Écriture refusée : seul le compte admin peut modifier le contenu (migrations 004/005).')
  throw new Error(msg)
}

// ── Projets vitrine ──────────────────────────────────────────────────────────
export async function listShowcase(): Promise<ShowcaseProject[]> {
  const { data, error } = await supabase.from('portfolio_showcase').select('*').order('display_order')
  if (error) explain(error)
  return (data ?? []) as ShowcaseProject[]
}

export async function saveShowcase(p: ShowcaseProject): Promise<ShowcaseProject> {
  const row = { ...p, slug: p.slug || slugify(p.name) }
  const query = row.id
    ? supabase.from('portfolio_showcase').update(row).eq('id', row.id).select().single()
    : supabase.from('portfolio_showcase').insert(row).select().single()
  const { data, error } = await query
  if (error) explain(error)
  return data as ShowcaseProject
}

export async function deleteShowcase(id: string): Promise<void> {
  const { error } = await supabase.from('portfolio_showcase').delete().eq('id', id)
  if (error) explain(error)
}

export async function reorderShowcase(ids: string[]): Promise<void> {
  const results = await Promise.all(
    ids.map((id, i) => supabase.from('portfolio_showcase').update({ display_order: i }).eq('id', id)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) explain(failed.error)
}

// ── Parcours ─────────────────────────────────────────────────────────────────
export async function listTimeline(): Promise<TimelineStep[]> {
  const { data, error } = await supabase.from('portfolio_timeline').select('*').order('display_order')
  if (error) explain(error)
  return (data ?? []) as TimelineStep[]
}

export async function saveTimeline(steps: TimelineStep[], removedIds: string[]): Promise<TimelineStep[]> {
  if (removedIds.length) {
    const { error } = await supabase.from('portfolio_timeline').delete().in('id', removedIds)
    if (error) explain(error)
  }
  const rows = steps.map((s, i) => ({ ...s, display_order: i }))
  const existing = rows.filter((r) => r.id)
  const fresh = rows.filter((r) => !r.id).map(({ id: _omit, ...r }) => r)
  if (existing.length) {
    const { error } = await supabase.from('portfolio_timeline').upsert(existing)
    if (error) explain(error)
  }
  if (fresh.length) {
    const { error } = await supabase.from('portfolio_timeline').insert(fresh)
    if (error) explain(error)
  }
  return listTimeline()
}

// ── Réglages ─────────────────────────────────────────────────────────────────
export async function getSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from('portfolio_settings').select('key,value')
  if (error) explain(error)
  return Object.fromEntries((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]))
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase.from('portfolio_settings').upsert({ key, value })
  if (error) explain(error)
}

// ── Médias ───────────────────────────────────────────────────────────────────
const BUCKET = 'portfolio-media'

// Réduit et convertit une image en WebP avant envoi : les captures restent légères.
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  return blob && blob.size < file.size ? blob : file
}

export async function uploadMedia(file: File, folder: string, opts?: { maxSide?: number }): Promise<string> {
  const isImage = file.type.startsWith('image/')
  const body = isImage ? await compressImage(file, opts?.maxSide) : file
  const ext = isImage && body.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'bin').toLowerCase()
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'fichier'
  const path = `${folder}/${Date.now()}-${base}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: body.type || file.type,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) {
    if (/bucket not found/i.test(error.message)) throw new Error('Espace de stockage absent : applique la migration 005 dans Supabase.')
    throw new Error(error.message)
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// ── Dépôts GitHub synchronisés (pour les ajouter à la vitrine) ───────────────
export interface RepoRow {
  github_id: number
  repo_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stars: number
  category: string
  is_private: boolean
  updated_at: string
}

export async function listRepos(): Promise<RepoRow[]> {
  const { data, error } = await supabase
    .from('portfolio_projects')
    .select('github_id,repo_name,description,html_url,homepage,language,stars,category,is_private,updated_at')
    .order('updated_at', { ascending: false })
  if (error) explain(error)
  return (data ?? []) as RepoRow[]
}

// Crée un projet vitrine pré-rempli à partir d'un dépôt.
export function projectFromRepo(repo: RepoRow, order: number, featured: boolean): ShowcaseProject {
  const category = ['livre', 'hackathon', 'personnel', 'contribution'].includes(repo.category) ? repo.category : 'personnel'
  const desc = (repo.description ?? '').replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '')
  return {
    ...emptyProject(order),
    name: repo.repo_name,
    slug: slugify(repo.repo_name),
    category,
    tagline_fr: desc,
    tagline_en: desc,
    stack: repo.language ? [repo.language] : [],
    site_url: repo.homepage && /^https?:/.test(repo.homepage) ? repo.homepage : '',
    github_url: repo.is_private ? '' : repo.html_url,
    is_featured: featured,
  }
}

// ── Mesure d'audience (migration 006) ─────────────────────────────────────────
export interface EventRow {
  created_at: string
  type: string
  label: string | null
  path: string | null
  session_id: string | null
  referrer_host: string | null
  device: string | null
}

/** Évènements depuis une date, paginés (Supabase renvoie 1 000 lignes max par requête). */
export async function listEvents(sinceIso: string, maxPages = 30): Promise<EventRow[]> {
  const out: EventRow[] = []
  const size = 1000
  for (let page = 0; page < maxPages; page++) {
    const { data, error } = await supabase
      .from('portfolio_events')
      .select('created_at,type,label,path,session_id,referrer_host,device')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .range(page * size, page * size + size - 1)
    if (error) {
      if (/does not exist|schema cache|42P01/i.test(error.message))
        throw new Error('Table absente : applique la migration 006_portfolio_analytics.sql dans Supabase (SQL Editor).')
      explain(error)
    }
    out.push(...((data ?? []) as EventRow[]))
    if (!data || data.length < size) break
  }
  return out
}
