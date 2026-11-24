// src/components/admin/CategoryColumn.tsx
// Colonne de catégorie : glyphe de pigment (même vocabulaire que le site),
// rappel de ce que la catégorie devient sur le site, zone de dépôt.

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { CategoryGlyph } from './CategoryGlyph'
import { ProjectCard } from './ProjectCard'
import { cn } from '../../lib/utils'
import type { CategoryMeta, PortfolioProject, ProjectCategory } from '../../types/portfolio'

// Ce que la catégorie produit sur le site public.
const CATEGORY_HINT: Record<ProjectCategory, string> = {
  non_classe: 'À classer · affiché dans « Autres dépôts »',
  livre: 'Filtre « Livrés » du site',
  hackathon: 'Filtre « Hackathon & Web3 »',
  personnel: 'Filtre « Personnels »',
  contribution: 'Filtre « Contributions »',
  cache: 'Jamais affiché sur le site',
}

interface CategoryColumnProps {
  category: CategoryMeta
  projects: PortfolioProject[]
  onToggleFeatured: (githubId: number) => void
  dragDisabled?: boolean
}

export function CategoryColumn({ category, projects, onToggleFeatured, dragDisabled = false }: CategoryColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: category.id, data: { category: category.id } })
  const isEmpty = projects.length === 0
  const headingId = `col-${category.id}`

  return (
    <section aria-labelledby={headingId} className="flex h-full w-[284px] shrink-0 flex-col min-h-0">
      <header className="mb-2.5 flex items-start gap-2.5 px-1">
        <CategoryGlyph category={category.id} active={isOver} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id={headingId} className="truncate font-oswald text-[15px] font-semibold leading-tight text-adm-ink">
              {category.label}
            </h2>
            <span className="shrink-0 text-[13px] font-medium tabular-nums text-adm-ink-2">{projects.length}</span>
          </div>
          <p className="mt-0.5 truncate text-[12px] leading-snug text-adm-ink-3">{CATEGORY_HINT[category.id]}</p>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'adm-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto rounded-xl border p-1.5',
          'transition-[background-color,border-color] duration-200',
          isOver ? 'border-adm-accent bg-adm-accent-dim' : 'border-transparent bg-adm-surface',
        )}
      >
        <SortableContext items={projects.map((p) => p.github_id)} strategy={verticalListSortingStrategy}>
          {projects.map((project) => (
            <ProjectCard
              key={project.github_id}
              project={project}
              onToggleFeatured={onToggleFeatured}
              dragDisabled={dragDisabled}
            />
          ))}
        </SortableContext>

        {(isEmpty || isOver) && (
          <div
            className={cn(
              'flex min-h-[64px] flex-1 items-center justify-center rounded-lg border border-dashed px-3 text-center',
              'transition-colors duration-200',
              isOver ? 'border-adm-accent text-adm-accent' : 'border-adm-border-strong text-adm-ink-3',
            )}
          >
            <span className="text-[13px] font-medium leading-snug">
              {isOver ? 'Déposer ici' : 'Glisse un dépôt ici'}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
