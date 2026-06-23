// src/components/admin/CategoryColumn.tsx

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { ProjectCard } from './ProjectCard'
import { cn } from '../../lib/utils'
import type { CategoryMeta, PortfolioProject, ProjectCategory } from '../../types/portfolio'

const CATEGORY_DOT: Record<ProjectCategory, string> = {
  non_classe:   'oklch(0.50 0.006 275)',
  livre:        'oklch(0.72 0.17 145)',
  hackathon:    'oklch(0.80 0.17 70)',
  personnel:    'oklch(0.65 0.16 230)',
  contribution: 'oklch(0.70 0.15 185)',
  cache:        'oklch(0.60 0.16 25)',
}

interface CategoryColumnProps {
  category: CategoryMeta
  projects: PortfolioProject[]
  onToggleFeatured: (githubId: number) => void
  dragDisabled?: boolean
}

export function CategoryColumn({ category, projects, onToggleFeatured, dragDisabled = false }: CategoryColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: category.id,
    data: { category: category.id },
  })

  const dot = CATEGORY_DOT[category.id]
  const isEmpty = projects.length === 0

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col min-h-0">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: dot }}
          />
          <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-adm-ink-3 leading-none">
            {category.label}
          </span>
        </div>
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none tabular-nums',
            'bg-adm-surface text-adm-ink-3',
            projects.length > 0 && 'bg-adm-card text-adm-ink-2',
          )}
        >
          {projects.length}
        </span>
      </div>

      {/* ── Drop zone ───────────────────────────────────────────── */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-1 rounded-xl border p-1.5',
          'overflow-y-auto adm-scrollbar min-h-0',
          'transition-all duration-150',
          isOver
            ? 'border-adm-accent-border bg-adm-accent-dim'
            : 'bg-adm-surface border-adm-border',
        )}
      >
        <SortableContext
          items={projects.map((p) => p.github_id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.github_id}
              project={project}
              onToggleFeatured={onToggleFeatured}
              dragDisabled={dragDisabled}
            />
          ))}
        </SortableContext>

        {/* Empty / drop hint */}
        {(isEmpty || isOver) && (
          <div
            className={cn(
              'flex flex-1 items-center justify-center rounded-lg border border-dashed',
              'min-h-[56px] transition-colors duration-150',
              isOver
                ? 'border-adm-accent-border'
                : 'border-adm-border',
            )}
          >
            <span className={cn(
              'text-[10px] font-medium leading-none',
              isOver ? 'text-adm-accent-bright' : 'text-adm-ink-3',
            )}>
              {isOver ? '↓ Déposer' : isEmpty ? 'Vide' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
