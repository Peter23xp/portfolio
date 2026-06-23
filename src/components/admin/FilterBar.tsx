// src/components/admin/FilterBar.tsx
// Barre de filtres/tri pour le kanban admin.

import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import { DEFAULT_FILTERS, type FilterState, type SortBy } from '../../types/portfolio'

interface FilterBarProps {
  filters: FilterState
  onChange: (f: FilterState) => void
  languages: string[]
  totalCount: number
  filteredCount: number
  lastSyncedAt: Date | null
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'order', label: 'Ordre manuel' },
  { value: 'stars', label: 'Étoiles' },
  { value: 'name', label: 'Nom A→Z' },
  { value: 'updated', label: 'Récents' },
]

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="pointer-events-none shrink-0">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

function formatRelative(date: Date, now: number): string {
  const diffMs = now - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'à l\'instant'
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  return `il y a ${Math.floor(diffH / 24)} j`
}

const selectBase = cn(
  'h-7 rounded-md border px-2 text-[12px] leading-none',
  'bg-adm-surface border-adm-border text-adm-ink',
  'focus:outline-none focus:border-adm-accent',
  'transition-colors duration-100',
  // Reset browser default select styling
  'appearance-none',
)

interface StyledSelectProps {
  value: string
  onChange: (v: string) => void
  'aria-label': string
  children: React.ReactNode
}

function StyledSelect({ value, onChange, 'aria-label': ariaLabel, children }: StyledSelectProps) {
  return (
    <div className="relative flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={cn(selectBase, 'pr-6')}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-1.5 text-adm-ink-3">
        <ChevronIcon />
      </span>
    </div>
  )
}

export function FilterBar({
  filters,
  onChange,
  languages,
  totalCount,
  filteredCount,
  lastSyncedAt,
}: FilterBarProps) {
  const now = useNow(30_000)

  const isActive =
    filters.search !== '' ||
    filters.language !== '' ||
    filters.onlyFeatured ||
    filters.sortBy !== 'order'

  const showCount = isActive && filteredCount !== totalCount

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 px-4 py-2',
        'border-b border-adm-border bg-adm-bg',
      )}
    >
      {/* ── Recherche ─────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-2.5 text-adm-ink-3">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Rechercher…"
          aria-label="Rechercher un repo"
          className={cn(
            'h-7 w-44 rounded-md border pl-7 pr-2 text-[12px] leading-none',
            'bg-adm-surface border-adm-border text-adm-ink placeholder:text-adm-ink-3',
            'focus:outline-none focus:border-adm-accent',
            'transition-colors duration-100',
          )}
        />
      </div>

      {/* ── Filtre langue ─────────────────────────────────────── */}
      {languages.length > 0 && (
        <StyledSelect
          value={filters.language}
          onChange={(v) => onChange({ ...filters, language: v })}
          aria-label="Filtrer par langage"
        >
          <option value="">Tous langages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </StyledSelect>
      )}

      {/* ── Seulement mis en avant ─────────────────────────────── */}
      <button
        type="button"
        onClick={() => onChange({ ...filters, onlyFeatured: !filters.onlyFeatured })}
        aria-pressed={filters.onlyFeatured}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-md border px-2.5',
          'text-[12px] leading-none transition-colors duration-100',
          filters.onlyFeatured
            ? 'border-adm-accent-border bg-adm-accent-dim text-adm-accent-bright'
            : 'border-adm-border bg-adm-surface text-adm-ink-2 hover:border-adm-border-strong hover:text-adm-ink',
        )}
      >
        <StarIcon />
        Featured
      </button>

      {/* ── Tri ───────────────────────────────────────────────── */}
      <StyledSelect
        value={filters.sortBy}
        onChange={(v) => onChange({ ...filters, sortBy: v as SortBy })}
        aria-label="Trier les repos"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </StyledSelect>

      {/* ── Reset ─────────────────────────────────────────────── */}
      {isActive && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          aria-label="Réinitialiser les filtres"
          className={cn(
            'flex h-7 items-center gap-1 rounded-md border px-2',
            'border-adm-border bg-adm-surface text-[11px] text-adm-ink-3',
            'hover:border-adm-border-strong hover:text-adm-ink transition-colors duration-100',
          )}
        >
          <XIcon />
          Reset
        </button>
      )}

      {/* ── Spacer ────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Compteur + dernière sync ───────────────────────────── */}
      <div className="flex items-center gap-3">
        {showCount && (
          <span className="text-[11px] text-adm-ink-3 tabular-nums">
            {filteredCount} / {totalCount}
          </span>
        )}
        {lastSyncedAt && (
          <span className="text-[11px] text-adm-ink-3" title={lastSyncedAt.toLocaleString()}>
            Sync {formatRelative(lastSyncedAt, now)}
          </span>
        )}
      </div>
    </div>
  )
}
