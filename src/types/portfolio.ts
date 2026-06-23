// src/types/portfolio.ts
// Types partagés entre l'admin (catégorisation) et le portfolio public.

// ── Filtres / tri ────────────────────────────────────────────────────────────
export type SortBy = 'order' | 'stars' | 'name' | 'updated'

export interface FilterState {
  search: string
  language: string
  onlyFeatured: boolean
  sortBy: SortBy
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  language: '',
  onlyFeatured: false,
  sortBy: 'order',
}

export function isFiltersActive(f: FilterState): boolean {
  return f.search !== '' || f.language !== '' || f.onlyFeatured || f.sortBy !== 'order'
}

export type ProjectCategory =
  | 'non_classe'
  | 'livre'
  | 'hackathon'
  | 'personnel'
  | 'contribution'
  | 'cache'

export interface CategoryMeta {
  id: ProjectCategory
  label: string
  emoji: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'non_classe', label: 'Non classé', emoji: '📦' },
  { id: 'livre', label: 'Livré', emoji: '🚀' },
  { id: 'hackathon', label: 'Hackathon', emoji: '🏆' },
  { id: 'personnel', label: 'Personnel', emoji: '👤' },
  { id: 'contribution', label: 'Contribution', emoji: '🤝' },
  { id: 'cache', label: 'Caché', emoji: '🙈' },
]

// Liste des identifiants, utile pour valider une cible de drop ou initialiser l'état.
export const CATEGORY_IDS: ProjectCategory[] = CATEGORIES.map((c) => c.id)

// Réponse brute de l'API GitHub REST v3 (champs utilisés uniquement).
export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  topics: string[]
  fork: boolean
  archived: boolean
  private: boolean
  updated_at: string
}

// Ligne de la table portfolio_projects (Supabase).
export interface PortfolioProject {
  id: string
  github_id: number
  repo_name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stars: number
  forks: number
  topics: string[]
  category: ProjectCategory
  display_order: number
  is_featured: boolean
  is_private: boolean
  created_at: string
  updated_at: string
}

// État groupé par colonne : { non_classe: [...], livre: [...], ... }
export type ProjectsByCategory = Record<ProjectCategory, PortfolioProject[]>

// Construit un état vide pour toutes les catégories.
export function emptyProjectsByCategory(): ProjectsByCategory {
  return CATEGORY_IDS.reduce((acc, id) => {
    acc[id] = []
    return acc
  }, {} as ProjectsByCategory)
}
