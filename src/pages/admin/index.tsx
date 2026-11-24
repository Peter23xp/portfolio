// src/pages/admin/index.tsx

import { AdminLayout } from '../../components/admin/AdminLayout'
import { CategoryGlyph } from '../../components/admin/CategoryGlyph'
import { FilterBar } from '../../components/admin/FilterBar'
import { KanbanBoard } from '../../components/admin/KanbanBoard'
import { useProjects } from '../../hooks/useProjects'
import { CATEGORIES, CATEGORY_IDS, isFiltersActive } from '../../types/portfolio'
import { Button } from '../../components/ui/button'

function countAll(projects: ReturnType<typeof useProjects>['projects']): number {
  return CATEGORY_IDS.reduce((sum, cat) => sum + projects[cat].length, 0)
}

// ── Dépôts à classer ─────────────────────────────────────────────────────────
function StatusBar({ projects }: { projects: ReturnType<typeof useProjects>['projects'] }) {
  const n = projects['non_classe'].length
  if (n === 0) return null
  return (
    <div role="status" className="flex items-center gap-2.5 border-b border-adm-border bg-adm-surface px-5 py-2.5">
      <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[oklch(0.72_0.15_70)]" aria-hidden />
      <span className="text-[13px] text-adm-ink-2">
        <strong className="font-semibold tabular-nums text-adm-ink">{n}</strong> dépôt{n > 1 ? 's' : ''} à classer.
        Glisse-{n > 1 ? 'les' : 'le'} de « Non classé » vers une catégorie.
      </span>
    </div>
  )
}

// ── Chargement ──────────────────────────────────────────────────────────────
function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-hidden p-5" role="status" aria-label="Chargement des dépôts">
      {CATEGORIES.map((cat) => (
        <div key={cat.id} className="flex w-[284px] shrink-0 flex-col gap-2.5">
          <div className="flex items-center gap-2.5 px-1">
            <CategoryGlyph category={cat.id} className="opacity-40" />
            <div className="h-3 w-24 rounded-full bg-adm-surface" />
          </div>
          <div className="flex h-72 flex-col gap-1.5 rounded-xl bg-adm-surface p-1.5 motion-safe:animate-pulse">
            <div className="h-[86px] rounded-lg bg-adm-card" />
            <div className="h-[86px] rounded-lg bg-adm-card" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Aucun dépôt synchronisé ─────────────────────────────────────────────────
function EmptyState({ onSync, isSyncing }: { onSync: () => void; isSyncing: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="flex gap-2" aria-hidden>
        {CATEGORIES.slice(0, 5).map((c) => (
          <CategoryGlyph key={c.id} category={c.id} className="h-8 w-8 opacity-60" />
        ))}
      </div>
      <div className="max-w-[440px]">
        <h2 className="font-oswald text-[22px] font-bold leading-tight text-adm-ink [font-stretch:110%]">
          Aucun dépôt importé
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-adm-ink-2">
          Synchronise GitHub pour importer tes dépôts. Ils arrivent dans « Non classé » ;
          glisse-les ensuite dans une catégorie pour décider où ils apparaissent sur le site.
        </p>
      </div>
      <Button variant="primary" size="md" onClick={onSync} disabled={isSyncing}>
        {isSyncing ? 'Synchronisation…' : 'Synchroniser GitHub'}
      </Button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
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
    <AdminLayout isSyncing={isSyncing} onSync={() => void syncFromGitHub()} repoCount={total}>
      {!isLoading && !isEmpty && <StatusBar projects={projects} />}

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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <BoardSkeleton />
        ) : isEmpty ? (
          <EmptyState onSync={() => void syncFromGitHub()} isSyncing={isSyncing} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col p-5 pb-0">
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
