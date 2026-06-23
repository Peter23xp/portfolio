// src/components/admin/ProjectCard.tsx

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Badge } from '../ui/badge'
import { cn, languageColor, truncate } from '../../lib/utils'
import type { PortfolioProject, ProjectCategory } from '../../types/portfolio'

interface ProjectCardProps {
  project: PortfolioProject
  onToggleFeatured: (githubId: number) => void
  overlay?: boolean
  dragDisabled?: boolean
}

function GripIcon() {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="currentColor" aria-hidden>
      <circle cx="2" cy="1.5" r="1.1" /><circle cx="7" cy="1.5" r="1.1" />
      <circle cx="2" cy="6"   r="1.1" /><circle cx="7" cy="6"   r="1.1" />
      <circle cx="2" cy="10.5" r="1.1"/><circle cx="7" cy="10.5" r="1.1"/>
    </svg>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

export function ProjectCard({ project, onToggleFeatured, overlay = false, dragDisabled = false }: ProjectCardProps) {
  const sortable = useSortable({
    id: project.github_id,
    data: { category: project.category as ProjectCategory },
    disabled: overlay || dragDisabled,
  })

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition ?? 'transform 150ms ease',
      }

  const stopDrag = (e: { stopPropagation(): void }) => e.stopPropagation()
  const isDragging = !overlay && sortable.isDragging

  return (
    <div
      ref={overlay ? undefined : sortable.setNodeRef}
      style={style}
      {...(overlay ? {} : sortable.attributes)}
      {...(overlay ? {} : sortable.listeners)}
      className={cn(
        'group relative flex shrink-0 flex-col gap-1.5 rounded-lg border px-2.5 py-2 min-w-0',
        'transition-colors duration-100',
        dragDisabled ? 'cursor-default' : 'cursor-grab select-none',
        // Normal state
        !overlay && !isDragging && 'bg-adm-card border-adm-border hover:bg-adm-card-hover hover:border-adm-border-strong',
        // Dragging ghost
        isDragging && 'opacity-25 bg-adm-card border-adm-border',
        // Overlay (floating card during drag)
        overlay && [
          'cursor-grabbing',
          'bg-adm-card-hover border-adm-accent-border',
          'shadow-[0_16px_48px_rgba(0,0,0,0.7),0_0_0_1px_oklch(0.63_0.22_277_/_0.3)]',
          'scale-[1.03]',
        ],
        // Enter animation (not on overlay)
        !overlay && 'animate-card-in',
      )}
    >
      {/* Row 1: grip + name + featured */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {!dragDisabled && (
            <span
              aria-hidden
              className={cn(
                'shrink-0 text-adm-ink-3 transition-opacity duration-100',
                overlay ? 'opacity-50' : 'opacity-0 group-hover:opacity-50',
              )}
            >
              <GripIcon />
            </span>
          )}
          <span
            className="truncate text-[12px] font-semibold leading-none text-adm-ink"
            title={project.repo_name}
          >
            {truncate(project.repo_name, 26)}
          </span>
        </div>

        <button
          type="button"
          onPointerDown={stopDrag}
          onClick={() => onToggleFeatured(project.github_id)}
          aria-label={project.is_featured ? 'Retirer la mise en avant' : 'Mettre en avant'}
          className={cn(
            'adm-focus shrink-0 rounded p-0.5 leading-none transition-colors duration-100',
            project.is_featured
              ? 'text-amber-400'
              : 'text-adm-ink-3 hover:text-amber-400',
          )}
        >
          <StarIcon filled={project.is_featured} />
        </button>
      </div>

      {/* Row 2: description */}
      {project.description && (
        <p className="line-clamp-1 text-[11px] leading-snug text-adm-ink-3">
          {project.description}
        </p>
      )}

      {/* Row 3: footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {project.is_private && (
            <span className="inline-flex items-center gap-0.5 rounded border border-adm-border-strong px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-adm-ink-3 leading-none">
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              privé
            </span>
          )}
          {project.language && (
            <Badge dot={languageColor(project.language)}>
              {project.language}
            </Badge>
          )}
          {project.stars > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-adm-ink-3 leading-none tabular-nums">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-amber-500/70">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {project.stars}
            </span>
          )}
        </div>

        <a
          href={project.html_url}
          target="_blank"
          rel="noreferrer noopener"
          onPointerDown={stopDrag}
          onClick={stopDrag}
          aria-label={`Ouvrir ${project.repo_name} sur GitHub`}
          className={cn(
            'adm-focus shrink-0 rounded p-0.5 text-adm-ink-3',
            'hover:text-adm-accent-bright transition-colors duration-100',
          )}
        >
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  )
}
