// src/hooks/useProjects.ts
// État central des projets : chargement, sync GitHub, déplacement optimiste,
// toggle featured, filtres/tri, realtime Supabase, auto-sync périodique.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { fetchAllGitHubRepos } from '../lib/github'
import {
  fetchProjectsByCategory,
  moveProject as moveProjectDb,
  toggleFeatured as toggleFeaturedDb,
  upsertProjects,
  supabase,
} from '../lib/supabase'
import {
  DEFAULT_FILTERS,
  emptyProjectsByCategory,
  isFiltersActive,
  type FilterState,
  type PortfolioProject,
  type ProjectCategory,
  type ProjectsByCategory,
  type SortBy,
} from '../types/portfolio'

export interface UseProjectsReturn {
  projects: ProjectsByCategory
  filteredProjects: ProjectsByCategory
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  lastSyncedAt: Date | null
  filters: FilterState
  setFilters: (f: FilterState) => void
  languages: string[]
  syncFromGitHub: () => Promise<void>
  moveProject: (
    githubId: number,
    fromCategory: ProjectCategory,
    toCategory: ProjectCategory,
    newOrder: number,
  ) => Promise<void>
  toggleFeatured: (githubId: number) => Promise<void>
}

const GITHUB_USERNAME = import.meta.env.VITE_GITHUB_USERNAME ?? ''
// Le token est géré côté serveur par /api/github — on ne le passe plus ici.
const GITHUB_TOKEN = ''
const AUTO_SYNC_INTERVAL_MS = 30 * 60 * 1000 // 30 min

function applyFiltersAndSort(
  projects: ProjectsByCategory,
  filters: FilterState,
): ProjectsByCategory {
  const { search, language, onlyFeatured, sortBy } = filters
  const searchLower = search.toLowerCase()

  function filterList(list: PortfolioProject[]): PortfolioProject[] {
    let out = list
    if (searchLower) {
      out = out.filter(
        (p) =>
          p.repo_name.toLowerCase().includes(searchLower) ||
          (p.description ?? '').toLowerCase().includes(searchLower) ||
          p.topics.some((t) => t.toLowerCase().includes(searchLower)),
      )
    }
    if (language) out = out.filter((p) => p.language === language)
    if (onlyFeatured) out = out.filter((p) => p.is_featured)
    return sortList(out, sortBy)
  }

  return Object.fromEntries(
    Object.entries(projects).map(([cat, list]) => [cat, filterList(list)]),
  ) as ProjectsByCategory
}

function sortList(list: PortfolioProject[], sortBy: SortBy): PortfolioProject[] {
  if (sortBy === 'order') return list // déjà trié par display_order depuis Supabase
  return [...list].sort((a, b) => {
    if (sortBy === 'stars') return b.stars - a.stars
    if (sortBy === 'name') return a.repo_name.localeCompare(b.repo_name)
    if (sortBy === 'updated') return b.updated_at.localeCompare(a.updated_at)
    return 0
  })
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<ProjectsByCategory>(emptyProjectsByCategory)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  const reload = useCallback(async () => {
    const grouped = await fetchProjectsByCategory()
    setProjects(grouped)
  }, [])

  // Chargement initial
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setIsLoading(true)
        const grouped = await fetchProjectsByCategory()
        if (active) setProjects(grouped)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur de chargement'
        if (active) setError(message)
        toast.error('Impossible de charger les projets', { description: message })
      } finally {
        if (active) setIsLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  // Realtime Supabase — recharge si la table change depuis un autre onglet/session
  useEffect(() => {
    const channel = supabase
      .channel('portfolio_projects_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portfolio_projects' },
        () => { void reload() },
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [reload])

  const syncFromGitHub = useCallback(async () => {
    setIsSyncing(true)
    setError(null)
    try {
      const repos = await fetchAllGitHubRepos(GITHUB_USERNAME, GITHUB_TOKEN)
      const { inserted, updated } = await upsertProjects(repos)
      await reload()
      setLastSyncedAt(new Date())
      toast.success(`${repos.length} repos synchronisés`, {
        description: `${inserted} nouveau(x), ${updated} mis à jour`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de synchronisation'
      setError(message)
      toast.error('Échec de la synchronisation GitHub', { description: message })
    } finally {
      setIsSyncing(false)
    }
  }, [reload])

  // Auto-sync toutes les 30 min (seulement si fenêtre visible)
  const syncRef = useRef(syncFromGitHub)
  syncRef.current = syncFromGitHub

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void syncRef.current()
      }
    }, AUTO_SYNC_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const moveProject = useCallback(
    async (
      githubId: number,
      fromCategory: ProjectCategory,
      toCategory: ProjectCategory,
      newOrder: number,
    ) => {
      let snapshot: ProjectsByCategory | null = null

      setProjects((prev) => {
        snapshot = prev
        const source = [...prev[fromCategory]]
        const index = source.findIndex((p) => p.github_id === githubId)
        if (index === -1) return prev

        const [moved] = source.splice(index, 1)
        const updated = { ...moved, category: toCategory, display_order: newOrder }

        const target =
          fromCategory === toCategory ? source : [...prev[toCategory]]
        const clampedIndex = Math.min(Math.max(newOrder, 0), target.length)
        target.splice(clampedIndex, 0, updated)

        const reindexed = target.map((p, i) => ({ ...p, display_order: i }))

        return {
          ...prev,
          [fromCategory]: fromCategory === toCategory ? reindexed : source,
          [toCategory]: reindexed,
        }
      })

      try {
        await moveProjectDb(githubId, toCategory, newOrder)
      } catch (err) {
        if (snapshot) setProjects(snapshot)
        const message = err instanceof Error ? err.message : 'Erreur de déplacement'
        toast.error('Déplacement non enregistré', { description: message })
      }
    },
    [],
  )

  const toggleFeatured = useCallback(async (githubId: number) => {
    let snapshot: ProjectsByCategory | null = null
    let nextValue = false

    setProjects((prev) => {
      snapshot = prev
      const next = { ...prev }
      for (const cat of Object.keys(next) as ProjectCategory[]) {
        const idx = next[cat].findIndex((p) => p.github_id === githubId)
        if (idx !== -1) {
          const project = next[cat][idx]
          nextValue = !project.is_featured
          const list = [...next[cat]]
          list[idx] = { ...project, is_featured: nextValue }
          next[cat] = list
          break
        }
      }
      return next
    })

    try {
      await toggleFeaturedDb(githubId, nextValue)
    } catch (err) {
      if (snapshot) setProjects(snapshot)
      const message = err instanceof Error ? err.message : 'Erreur'
      toast.error('Mise en avant non enregistrée', { description: message })
    }
  }, [])

  // Liste des langages uniques présents (pour le filtre)
  const languages = useMemo(() => {
    const set = new Set<string>()
    for (const list of Object.values(projects)) {
      for (const p of list) {
        if (p.language) set.add(p.language)
      }
    }
    return Array.from(set).sort()
  }, [projects])

  // Projets filtrés/triés (mémo pour ne pas recalculer à chaque render)
  const filteredProjects = useMemo(
    () =>
      isFiltersActive(filters)
        ? applyFiltersAndSort(projects, filters)
        : projects,
    [projects, filters],
  )

  return {
    projects,
    filteredProjects,
    isLoading,
    isSyncing,
    error,
    lastSyncedAt,
    filters,
    setFilters,
    languages,
    syncFromGitHub,
    moveProject,
    toggleFeatured,
  }
}
