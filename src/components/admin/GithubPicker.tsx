// src/components/admin/GithubPicker.tsx
// Choisir parmi TOUS les dépôts GitHub synchronisés ceux à mettre en vitrine
// (ou directement en projet phare), avec recherche et filtres.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Icons, inputClass } from './forms'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { listRepos, type RepoRow } from '../../lib/admin-content'
import { cn, languageColor } from '../../lib/utils'

const CATEGORY_LABEL: Record<string, string> = {
  non_classe: 'Non classé', livre: 'Livré', hackathon: 'Hackathon', personnel: 'Personnel', contribution: 'Contribution', cache: 'Caché',
}

interface Props {
  open: boolean
  onClose: () => void
  /** URLs GitHub et noms déjà présents en vitrine */
  existing: { urls: Set<string>; names: Set<string> }
  onAdd: (repo: RepoRow, featured: boolean) => Promise<void>
}

export function GithubPicker({ open, onClose, existing, onAdd }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [repos, setRepos] = useState<RepoRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [lang, setLang] = useState('')
  const [cat, setCat] = useState('')
  const [onlyNew, setOnlyNew] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  }, [open])

  useEffect(() => {
    if (!open || repos) return
    listRepos().then(setRepos).catch((e) => setError((e as Error).message))
  }, [open, repos])

  const inShowcase = (r: RepoRow) => existing.urls.has(r.html_url) || existing.names.has(r.repo_name.toLowerCase())

  const languages = useMemo(
    () => Array.from(new Set((repos ?? []).map((r) => r.language).filter(Boolean) as string[])).sort(),
    [repos],
  )
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (repos ?? []).filter((r) =>
      (!q || r.repo_name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q)) &&
      (!lang || r.language === lang) &&
      (!cat || r.category === cat) &&
      (!onlyNew || !inShowcase(r)),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, query, lang, cat, onlyNew, existing])

  async function add(r: RepoRow, featured: boolean) {
    setBusy(r.github_id)
    try {
      await onAdd(r, featured)
    } finally {
      setBusy(null)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close() }}
      aria-labelledby="gh-picker-title"
      className="m-auto w-[min(860px,calc(100vw-2rem))] rounded-2xl border-0 bg-adm-bg p-0 text-adm-ink backdrop:bg-[oklch(0.2_0.03_35_/_0.6)]"
    >
      <div className="flex max-h-[86vh] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-adm-border px-6 py-4">
          <div>
            <h2 id="gh-picker-title" className="font-oswald text-[20px] font-bold [font-stretch:108%]">Ajouter depuis GitHub</h2>
            <p className="mt-0.5 text-[13px] text-adm-ink-2">
              Tous tes dépôts synchronisés. Ajoute-les à la vitrine, ou directement en projet phare.
            </p>
          </div>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Fermer" className="adm-focus grid h-9 w-9 shrink-0 place-items-center rounded-full bg-adm-surface text-adm-ink-2 hover:text-adm-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-adm-border bg-adm-surface px-6 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un dépôt…"
            aria-label="Rechercher un dépôt"
            className={cn(inputClass, 'h-9 w-full rounded-full sm:w-60')}
            autoFocus
          />
          <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Filtrer par langage" className={cn(inputClass, 'h-9 w-auto rounded-full')}>
            <option value="">Tous les langages</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filtrer par catégorie" className={cn(inputClass, 'h-9 w-auto rounded-full')}>
            <option value="">Toutes les catégories</option>
            {Object.entries(CATEGORY_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-adm-ink">
            <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} className="h-4 w-4 accent-[oklch(0.40_0.095_35)]" />
            Pas encore en vitrine
          </label>
          <span className="ml-auto text-[13px] tabular-nums text-adm-ink-3" role="status">
            {repos ? `${filtered.length} / ${repos.length}` : ''}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {!repos && !error && <p role="status" className="px-3 py-6 text-[14px] text-adm-ink-3">Chargement des dépôts…</p>}
          {error && <p role="alert" className="m-3 rounded-lg bg-[oklch(0.50_0.17_25_/_0.09)] px-3.5 py-2.5 text-[14px] text-[oklch(0.42_0.15_25)]">{error}</p>}
          {repos && repos.length === 0 && (
            <div className="px-3 py-8 text-center text-[14px] text-adm-ink-2">
              Aucun dépôt synchronisé. Va dans <Link to="/admin" className="font-semibold text-adm-accent underline">Dépôts GitHub</Link> et lance « Synchroniser GitHub ».
            </div>
          )}
          {repos && repos.length > 0 && filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-[14px] text-adm-ink-2">Aucun dépôt ne correspond à ces filtres.</p>
          )}
          <ul className="flex flex-col">
            {filtered.map((r) => {
              const already = inShowcase(r)
              return (
                <li key={r.github_id} className="flex flex-wrap items-center gap-3 border-b border-adm-border px-3 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[15px] font-semibold text-adm-ink">{r.repo_name}</span>
                      <Badge>{CATEGORY_LABEL[r.category] ?? r.category}</Badge>
                      {r.is_private && <Badge className="bg-adm-ink text-adm-bg">Privé</Badge>}
                      {r.language && <Badge dot={languageColor(r.language)}>{r.language}</Badge>}
                    </div>
                    <p className={cn('mt-0.5 line-clamp-1 text-[13px]', r.description ? 'text-adm-ink-2' : 'italic text-adm-ink-3')}>
                      {r.description || 'Pas de description'}
                    </p>
                  </div>
                  {already ? (
                    <span className="text-[13px] font-medium text-adm-ink-3">Déjà en vitrine</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void add(r, false)}>
                        {Icons.plus} Ajouter
                      </Button>
                      <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void add(r, true)} className="text-adm-accent">
                        {Icons.star(true)} En projet phare
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </dialog>
  )
}
