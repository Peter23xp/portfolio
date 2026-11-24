// src/components/admin/ProjectCard.tsx
// Carte de dépôt déplaçable (souris, tactile, clavier : espace pour saisir,
// flèches pour déplacer, espace pour déposer).

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Badge } from '../ui/badge'
import { cn, languageColor } from '../../lib/utils'
import type { PortfolioProject, ProjectCategory } from '../../types/portfolio'

interface ProjectCardProps {
  project: PortfolioProject
  onToggleFeatured: (githubId: number) => void
  overlay?: boolean
  dragDisabled?: boolean
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
      <circle cx="2.5" cy="2" r="1.3" /><circle cx="7.5" cy="2" r="1.3" />
      <circle cx="2.5" cy="7" r="1.3" /><circle cx="7.5" cy="7" r="1.3" />
      <circle cx="2.5" cy="12" r="1.3" /><circle cx="7.5" cy="12" r="1.3" />
    </svg>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
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
    : { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition ?? 'transform 180ms ease' }

  const stopDrag = (e: { stopPropagation(): void }) => e.stopPropagation()
  const isDragging = !overlay && sortable.isDragging

  return (
    <article
      ref={overlay ? undefined : sortable.setNodeRef}
      style={style}
      {...(overlay ? {} : sortable.attributes)}
      {...(overlay ? {} : sortable.listeners)}
      aria-roledescription={dragDisabled ? undefined : 'dépôt déplaçable'}
      aria-label={project.repo_name}
      className={cn(
        'adm-focus group relative flex min-w-0 shrink-0 flex-col gap-2 rounded-lg border px-3 py-2.5',
        'transition-[background-color,border-color,opacity] duration-150',
        dragDisabled ? 'cursor-default' : 'cursor-grab touch-none select-none',
        !overlay && !isDragging && 'border-adm-border bg-adm-card hover:border-adm-border-strong hover:bg-adm-card-hover',
        isDragging && 'border-dashed border-adm-accent bg-transparent opacity-50',
        overlay && 'cursor-grabbing border-adm-accent bg-adm-card-hover shadow-[0_8px_18px_oklch(0.235_0.022_40_/_0.18)]',
        project.is_featured && !isDragging && 'border-adm-accent-border',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {!dragDisabled && (
            <span aria-hidden className={cn('shrink-0 text-adm-ink-3 transition-opacity duration-150', overlay ? 'opacity-70' : 'opacity-40 group-hover:opacity-80')}>
              <GripIcon />
            </span>
          )}
          <h3 className="truncate text-[14px] font-semibold leading-snug text-adm-ink" title={project.repo_name}>
            {project.repo_name}
          </h3>
        </div>

        <button
          type="button"
          onPointerDown={stopDrag}
          onKeyDown={stopDrag}
          onClick={() => onToggleFeatured(project.github_id)}
          aria-pressed={project.is_featured}
          aria-label={project.is_featured ? `Retirer ${project.repo_name} de la mise en avant` : `Mettre ${project.repo_name} en avant`}
          title={project.is_featured ? 'Mis en avant (affiché en premier)' : 'Mettre en avant'}
          className={cn(
            'adm-focus -m-1 shrink-0 rounded-full p-1 transition-colors duration-150',
            project.is_featured ? 'text-adm-accent' : 'text-adm-ink-3 hover:text-adm-accent',
          )}
        >
          <StarIcon filled={project.is_featured} />
        </button>
      </div>

      {project.description ? (
        <p className="line-clamp-2 text-[13px] leading-snug text-adm-ink-2">{project.description}</p>
      ) : (
        <p className="text-[13px] italic leading-snug text-adm-ink-3">Pas de description</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {project.is_private && (
            <Badge className="bg-adm-ink text-adm-bg">
              <LockIcon /> Privé
            </Badge>
          )}
          {project.language && <Badge dot={languageColor(project.language)}>{project.language}</Badge>}
          {project.stars > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-adm-ink-3" aria-label={`${project.stars} étoiles sur GitHub`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
          onKeyDown={stopDrag}
          onClick={stopDrag}
          aria-label={`Ouvrir ${project.repo_name} sur GitHub`}
          className="adm-focus -m-1 shrink-0 rounded-full p-1 text-adm-ink-3 transition-colors duration-150 hover:text-adm-accent"
        >
          <ExternalIcon />
        </a>
      </div>
    </article>
  )
}
