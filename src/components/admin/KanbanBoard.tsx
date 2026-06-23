// src/components/admin/KanbanBoard.tsx
// Tableau kanban horizontal — scroll natif, colonnes fixes 260px.

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import { CategoryColumn } from './CategoryColumn'
import { ProjectCard } from './ProjectCard'
import {
  CATEGORIES,
  CATEGORY_IDS,
  type PortfolioProject,
  type ProjectCategory,
  type ProjectsByCategory,
} from '../../types/portfolio'

interface KanbanBoardProps {
  projects: ProjectsByCategory
  onMove: (
    githubId: number,
    fromCategory: ProjectCategory,
    toCategory: ProjectCategory,
    newOrder: number,
  ) => void
  onToggleFeatured: (githubId: number) => void
  dragDisabled?: boolean
}

function findCategoryOf(
  projects: ProjectsByCategory,
  githubId: number,
): ProjectCategory | null {
  for (const cat of CATEGORY_IDS) {
    if (projects[cat].some((p) => p.github_id === githubId)) return cat
  }
  return null
}

export function KanbanBoard({ projects, onMove, onToggleFeatured, dragDisabled = false }: KanbanBoardProps) {
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    const id = Number(event.active.id)
    const cat = findCategoryOf(projects, id)
    if (cat) setActiveProject(projects[cat].find((p) => p.github_id === id) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveProject(null)
    const { active, over } = event
    if (!over) return

    const githubId = Number(active.id)
    const from =
      (active.data.current?.category as ProjectCategory) ??
      findCategoryOf(projects, githubId)
    if (!from) return

    const overId = over.id
    let to: ProjectCategory
    let newIndex: number

    if (CATEGORY_IDS.includes(overId as ProjectCategory)) {
      to = overId as ProjectCategory
      newIndex = projects[to].length
    } else {
      const overCat =
        (over.data.current?.category as ProjectCategory) ??
        findCategoryOf(projects, Number(overId))
      if (!overCat) return
      to = overCat
      const idx = projects[to].findIndex((p) => p.github_id === Number(overId))
      newIndex = idx === -1 ? projects[to].length : idx
    }

    if (from === to) {
      const cur = projects[from].findIndex((p) => p.github_id === githubId)
      if (cur === newIndex) return
    }

    onMove(githubId, from, to, newIndex)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveProject(null)}
    >
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
      {/* Notice: rendered outside the scroll container so it isn't clipped */}
      {dragDisabled && (
        <div className="mb-2 flex items-center justify-center px-1">
          <span className="rounded-md border border-adm-border bg-adm-surface px-2.5 py-1 text-[11px] text-adm-ink-3">
            Désactiver les filtres pour réorganiser par glisser-déposer
          </span>
        </div>
      )}
      {/* Scroll horizontal natif — les colonnes ont une largeur fixe */}
      <div className="flex flex-1 gap-3 overflow-x-auto pb-4 px-1 min-h-0">
        {CATEGORIES.map((category) => (
          <CategoryColumn
            key={category.id}
            category={category}
            projects={projects[category.id]}
            onToggleFeatured={onToggleFeatured}
            dragDisabled={dragDisabled}
          />
        ))}
        {/* Espace de fin pour que la dernière colonne ne colle pas au bord */}
        <div className="w-1 shrink-0" aria-hidden />
      </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeProject ? (
          <ProjectCard
            project={activeProject}
            onToggleFeatured={onToggleFeatured}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
