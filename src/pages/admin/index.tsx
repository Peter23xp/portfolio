// src/pages/admin/index.tsx

import { AdminLayout } from '../../components/admin/AdminLayout'
import { FilterBar } from '../../components/admin/FilterBar'
import { KanbanBoard } from '../../components/admin/KanbanBoard'
import { useProjects } from '../../hooks/useProjects'
import { CATEGORIES, CATEGORY_IDS, isFiltersActive } from '../../types/portfolio'
import { Button } from '../../components/ui/button'

function countAll(projects: ReturnType<typeof useProjects>['projects']): number {
  return CATEGORY_IDS.reduce((sum, cat) => sum + projects[cat].length, 0)
}

// ── Statut repos non classés ─────────────────────────────────────────────────
function StatusBar({ projects }: { projects: ReturnType<typeof useProjects>['projects'] }) {
  const n = projects['non_classe'].length
  if (n === 0) return null
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-adm-border bg-adm-bg">
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
        aria-hidden
      />
      <span className="text-[11px] text-adm-ink-3 leading-none">
        <span className="text-adm-ink-2 tabular-nums">{n}</span>
        {' '}repo{n > 1 ? 's' : ''} non classé{n > 1 ? 's' : ''} — glisse-les dans une catégorie.
      </span>
    </div>
  )
}

// ── Skeleton chargement ──────────────────────────────────────────────────────
function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto p-4">
      {CATEGORIES.map((cat) => (
        <div
          key={cat.id}
          className="flex h-64 w-[260px] shrink-0 flex-col gap-2 rounded-xl border border-adm-border bg-adm-surface p-2 animate-pulse"
        >
          <div className="h-2.5 w-20 rounded-full bg-adm-card" />
          <div className="h-14 rounded-lg bg-adm-card" />
          <div className="h-14 rounded-lg bg-adm-card" />
        </div>
      ))}
    </div>
  )
}

// ── État vide : aucun repo synchronisé ──────────────────────────────────────
function EmptyState({ onSync, isSyncing }: { onSync: () => void; isSyncing: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      {/* Icône */}
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-adm-border bg-adm-surface text-adm-ink-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      {/* Texte */}
      <div className="text-center">
        <p className="text-[14px] font-semibold text-adm-ink leading-snug">
          Aucun repo synchronisé
        </p>
        <p className="mt-1.5 max-w-[320px] text-[12px] text-adm-ink-3 leading-relaxed">
          Lance une synchronisation pour importer tes repos GitHub.
          Ils apparaîtront ici pour être classés par catégorie.
        </p>
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        size="md"
        onClick={onSync}
        disabled={isSyncing}
        className="gap-2"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={isSyncing ? 'animate-spin' : undefined}
        >
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
        </svg>
        {isSyncing ? 'Synchronisation…' : 'Synchroniser GitHub'}
      </Button>
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const {
    projects,
    filteredProjects,
    isLoading,
    isSyncing,
    syncFromGitHub,
    moveProject,
    toggleFeatured,
    filters,
    setFilters,
    languages,
    lastSyncedAt,
  } = useProjects()

  const total = countAll(projects)
  const filtered = countAll(filteredProjects)
  const filtersActive = isFiltersActive(filters)
  const isEmpty = total === 0

  return (
    <AdminLayout
      isSyncing={isSyncing}
      onSync={() => void syncFromGitHub()}
      repoCount={total}
    >
      {/* Status bar — repos non classés */}
      {!isLoading && !isEmpty && <StatusBar projects={projects} />}

      {/* Filter bar — seulement si repos présents */}
      {!isLoading && !isEmpty && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          languages={languages}
          totalCount={total}
          filteredCount={filtered}
          lastSyncedAt={lastSyncedAt}
        />
      )}

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        {isLoading ? (
          <BoardSkeleton />
        ) : isEmpty ? (
          <EmptyState onSync={() => void syncFromGitHub()} isSyncing={isSyncing} />
        ) : (
          <div className="flex flex-1 flex-col p-4 pb-0 min-h-0">
            <KanbanBoard
              projects={filteredProjects}
              onMove={moveProject}
              onToggleFeatured={toggleFeatured}
              dragDisabled={filtersActive}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
