// src/lib/supabase.ts
// Client Supabase + helpers CRUD pour la table portfolio_projects.

import { createClient } from '@supabase/supabase-js'

import {
  CATEGORY_IDS,
  emptyProjectsByCategory,
  type GitHubRepo,
  type PortfolioProject,
  type ProjectCategory,
  type ProjectsByCategory,
} from '../types/portfolio'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

// On crée le client même si les vars sont vides : les requêtes échoueront avec
// une erreur Supabase lisible, plutôt qu'un crash module qui plante toute l'app.
if (!url || !anonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant — ' +
    'vérifier .env.local et relancer le serveur de développement.',
  )
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder')

const TABLE = 'portfolio_projects'

// Champs mutables synchronisés depuis GitHub (on NE touche PAS à category /
// display_order / is_featured pour préserver le classement manuel existant).
function toMutableRow(repo: GitHubRepo) {
  return {
    github_id: repo.id,
    repo_name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    homepage: repo.homepage,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    topics: repo.topics ?? [],
    is_private: repo.private ?? false,
  }
}

/**
 * Upsert des repos GitHub dans Supabase (conflit sur github_id).
 * - Nouveau repo  → inséré ; category prend le défaut 'non_classe', order 0 (défauts SQL).
 * - Repo existant → seuls stars/forks/description/topics/... sont mis à jour.
 */
export async function upsertProjects(
  repos: GitHubRepo[],
): Promise<{ inserted: number; updated: number }> {
  if (repos.length === 0) return { inserted: 0, updated: 0 }

  // On distingue nouveaux/existants AVANT l'upsert pour le compteur du toast.
  const { data: existing, error: existingError } = await supabase
    .from(TABLE)
    .select('github_id')

  if (existingError) throw existingError

  const existingIds = new Set((existing ?? []).map((row) => row.github_id as number))
  const inserted = repos.filter((r) => !existingIds.has(r.id)).length
  const updated = repos.length - inserted

  const rows = repos.map(toMutableRow)
  const { error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'github_id', ignoreDuplicates: false })

  if (error) throw error

  return { inserted, updated }
}

// Récupère tous les projets, groupés par catégorie et triés par display_order.
export async function fetchProjectsByCategory(): Promise<ProjectsByCategory> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('category', { ascending: true })
    .order('display_order', { ascending: true })

  if (error) throw error

  const grouped = emptyProjectsByCategory()
  for (const project of (data ?? []) as PortfolioProject[]) {
    // Garde-fou si une catégorie inconnue traîne en base.
    if (CATEGORY_IDS.includes(project.category)) {
      grouped[project.category].push(project)
    }
  }
  return grouped
}

// Récupère les projets visibles publiquement (tout sauf 'cache'),
// featured en premier, puis display_order.
export async function fetchPublicProjects(): Promise<PortfolioProject[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .neq('category', 'cache')
    .eq('is_private', false)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as PortfolioProject[]
}

// Déplace un projet : met à jour category + display_order.
export async function moveProject(
  githubId: number,
  newCategory: ProjectCategory,
  newOrder: number,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ category: newCategory, display_order: newOrder })
    .eq('github_id', githubId)

  if (error) throw error
}

// Bascule le flag is_featured.
export async function toggleFeatured(githubId: number, value: boolean): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ is_featured: value })
    .eq('github_id', githubId)

  if (error) throw error
}
