// src/pages/admin/analytics.tsx
// Audience du portfolio : visites, pages vues, CV, contacts, provenance.
// Méthode dataviz : une seule teinte (encre), barres fines à bout arrondi,
// barres classées pour les parts, un seul axe, info-bulle au survol ET au
// clavier, vue tableau pour la série journalière, période en tête.

import { useEffect, useMemo, useRef, useState } from 'react'

import { AdminLayout } from '../../components/admin/AdminLayout'
import { listEvents, type EventRow } from '../../lib/admin-content'
import { cn } from '../../lib/utils'

const PERIODS = [7, 30, 90] as const
type Period = (typeof PERIODS)[number]

const DAY = 86_400_000
// clé de jour en heure locale (pas UTC : une visite à 23 h reste sur le bon jour)
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmt = new Intl.NumberFormat('fr-FR')
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const longDateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

const CONTACT_LABEL: Record<string, string> = { email: 'Email', whatsapp: 'WhatsApp', linkedin: 'LinkedIn', github: 'GitHub' }
const CONTEXT_LABEL: Record<string, string> = { recruit: '« Je recrute »', client: '« J’ai un projet »', neutral: 'Retour au neutre' }
const DEVICE_LABEL: Record<string, string> = { mobile: 'Mobile', desktop: 'Ordinateur' }

function pageLabel(path: string | null) {
  if (!path || path === '/') return 'Accueil'
  if (path === '/cv') return 'Page CV'
  const m = path.match(/^\/projets\/(.+)$/)
  return m ? `Étude de cas · ${m[1]}` : path
}

// ── calculs ──────────────────────────────────────────────────────────────────
function summarize(events: EventRow[]) {
  const sessions = new Set(events.map((e) => e.session_id).filter(Boolean))
  const views = events.filter((e) => e.type === 'page_view' || e.type === 'case_view' || e.type === 'cv_view').length
  const count = (type: string) => events.filter((e) => e.type === type).length
  return {
    visits: sessions.size,
    views,
    cvViews: count('cv_view'),
    cvDownloads: count('cv_download'),
    contacts: count('contact_click'),
  }
}

function rank(entries: Map<string, number>, limit = 6) {
  const rows = [...entries.entries()].sort((a, b) => b[1] - a[1])
  if (rows.length <= limit) return rows.map(([label, value]) => ({ label, value }))
  const head = rows.slice(0, limit - 1)
  const other = rows.slice(limit - 1).reduce((s, [, v]) => s + v, 0)
  return [...head.map(([label, value]) => ({ label, value })), { label: 'Autres', value: other }]
}

function tally<T>(items: T[], key: (x: T) => string | null) {
  const m = new Map<string, number>()
  for (const it of items) {
    const k = key(it)
    if (k) m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

// ── tuiles ───────────────────────────────────────────────────────────────────
function StatTile({ label, value, prev, period }: { label: string; value: number; prev: number; period: Period }) {
  const delta = prev === 0 ? null : Math.round(((value - prev) / prev) * 100)
  return (
    <div className="rounded-xl border border-adm-border bg-adm-card px-5 py-4">
      <p className="text-[13px] font-medium text-adm-ink-2">{label}</p>
      <p className="mt-1 font-oswald text-[32px] font-bold leading-none text-adm-ink [font-stretch:108%]">{fmt.format(value)}</p>
      <p className="mt-2 text-[12px] text-adm-ink-3">
        {delta === null ? (
          prev === 0 && value > 0 ? 'Nouveau sur la période' : `Aucune donnée les ${period} jours précédents`
        ) : (
          <>
            <span className="font-semibold text-adm-ink-2">
              {delta > 0 ? '+' : delta < 0 ? '−' : '±'}{Math.abs(delta)} %
            </span>{' '}
            vs les {period} jours précédents
          </>
        )}
      </p>
    </div>
  )
}

// ── colonnes : visites par jour ──────────────────────────────────────────────
interface Day { key: string; date: Date; visits: number; views: number }

function niceMax(v: number) {
  if (v <= 4) return 4
  const p = 10 ** Math.floor(Math.log10(v))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

function DailyColumns({ days }: { days: Day[] }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)
  const [active, setActive] = useState<number | null>(null)
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const H = 220, padL = 36, padB = 26, padT = 10
  const innerW = width - padL - 8
  const innerH = H - padB - padT
  const max = niceMax(Math.max(0, ...days.map((d) => d.visits)))
  const band = innerW / Math.max(1, days.length)
  const barW = Math.max(2, Math.min(24, band * 0.62))
  const ticks = [0, max / 2, max]
  const labelEvery = Math.ceil(days.length / Math.max(2, Math.floor(innerW / 70)))
  const y = (v: number) => padT + innerH - (v / max) * innerH

  const cur = active !== null ? days[active] : null

  return (
    <div ref={wrap} className="relative">
      <svg
        width={width}
        height={H}
        role="img"
        aria-label={`Visites par jour, du ${dateFmt.format(days[0].date)} au ${dateFmt.format(days[days.length - 1].date)}`}
        tabIndex={0}
        className="adm-focus block rounded-md"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); setActive((a) => Math.min(days.length - 1, (a ?? -1) + 1)) }
          if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((a) => Math.max(0, (a ?? days.length) - 1)) }
          if (e.key === 'Escape') setActive(null)
        }}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        {/* grille recessive, une seule échelle */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={width - 8} y1={y(t)} y2={y(t)} stroke="oklch(0.88 0.02 32)" strokeWidth="1" />
            <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-adm-ink-3 text-[11px] tabular-nums">{fmt.format(t)}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const cx = padL + band * i + band / 2
          const h = (d.visits / max) * innerH
          const x = cx - barW / 2
          const top = padT + innerH - h
          const r = Math.min(4, barW / 2, h)
          return (
            <g key={d.key} onPointerEnter={() => setActive(i)}>
              {/* zone de survol : toute la bande, plus grande que la barre */}
              <rect x={padL + band * i} y={padT} width={band} height={innerH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${padT + innerH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${padT + innerH} Z`}
                  className={cn(active === i ? 'fill-adm-accent-bright' : 'fill-adm-accent')}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={cx} y={H - 8} textAnchor="middle" className="fill-adm-ink-3 text-[11px]">{dateFmt.format(d.date)}</text>
              )}
            </g>
          )
        })}
        <line x1={padL} x2={width - 8} y1={padT + innerH} y2={padT + innerH} stroke="oklch(0.74 0.035 33)" strokeWidth="1" />
      </svg>

      {cur && active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 rounded-lg border border-adm-border bg-adm-card px-3 py-2 text-[12px] shadow-[0_4px_12px_oklch(0.2_0.03_35_/_0.15)]"
          style={{ left: Math.min(width - 170, Math.max(0, padL + band * active + band / 2 - 80)) }}
        >
          <p className="text-adm-ink-3">{longDateFmt.format(cur.date)}</p>
          <p className="mt-0.5"><strong className="text-[15px] text-adm-ink">{fmt.format(cur.visits)}</strong> <span className="text-adm-ink-2">visite{cur.visits > 1 ? 's' : ''}</span></p>
          <p><strong className="text-adm-ink">{fmt.format(cur.views)}</strong> <span className="text-adm-ink-2">page{cur.views > 1 ? 's' : ''} vue{cur.views > 1 ? 's' : ''}</span></p>
        </div>
      )}
    </div>
  )
}

// ── barres classées ──────────────────────────────────────────────────────────
function RankedBars({ title, rows, unit, empty }: { title: string; rows: { label: string; value: number }[]; unit: string; empty: string }) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <section className="rounded-xl border border-adm-border bg-adm-card p-5" aria-label={title}>
      <h3 className="font-oswald text-[16px] font-bold text-adm-ink [font-stretch:106%]">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-[13px] text-adm-ink-3">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {rows.map((r) => (
            <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
              <span className="truncate text-[13px] text-adm-ink" title={r.label}>{r.label}</span>
              <span className="text-[13px] tabular-nums text-adm-ink-2">
                <strong className="font-semibold text-adm-ink">{fmt.format(r.value)}</strong>{' '}
                <span className="text-adm-ink-3">· {Math.round((r.value / total) * 100)} %</span>
              </span>
              <span className="col-span-2 block h-2 rounded-full bg-adm-surface" aria-hidden>
                <span className="block h-2 rounded-full bg-adm-accent" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 && <p className="mt-3 text-[12px] text-adm-ink-3">{fmt.format(total)} {unit} au total</p>}
    </section>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>(30)
  const [events, setEvents] = useState<EventRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    // période courante + période précédente (pour les variations)
    const since = new Date(Date.now() - period * 2 * DAY)
    listEvents(since.toISOString())
      .then((rows) => { if (alive) { setEvents(rows); setError(null) } })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [period])

  const data = useMemo(() => {
    if (!events) return null
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const from = new Date(start.getTime() - (period - 1) * DAY)
    const prevFrom = new Date(from.getTime() - period * DAY)
    const current = events.filter((e) => new Date(e.created_at) >= from)
    const previous = events.filter((e) => { const d = new Date(e.created_at); return d >= prevFrom && d < from })

    const days: Day[] = Array.from({ length: period }, (_, i) => {
      const date = new Date(from.getTime() + i * DAY)
      return { key: dayKey(date), date, visits: 0, views: 0 }
    })
    const byKey = new Map(days.map((d) => [d.key, d]))
    const sessionsByDay = new Map<string, Set<string>>()
    for (const e of current) {
      const k = dayKey(new Date(e.created_at))
      const day = byKey.get(k)
      if (!day) continue
      if (e.type === 'page_view' || e.type === 'case_view' || e.type === 'cv_view') day.views++
      if (e.session_id) {
        if (!sessionsByDay.has(k)) sessionsByDay.set(k, new Set())
        sessionsByDay.get(k)!.add(e.session_id)
      }
    }
    for (const d of days) d.visits = sessionsByDay.get(d.key)?.size ?? 0

    // provenance et appareil : une fois par visite (premier évènement)
    const firstBySession = new Map<string, EventRow>()
    for (const e of current) if (e.session_id && !firstBySession.has(e.session_id)) firstBySession.set(e.session_id, e)
    const firsts = [...firstBySession.values()]

    return {
      now: summarize(current),
      before: summarize(previous),
      days,
      referrers: rank(tally(firsts, (e) => e.referrer_host ?? 'Accès direct ou inconnu')),
      pages: rank(tally(current.filter((e) => ['page_view', 'case_view', 'cv_view'].includes(e.type)), (e) => pageLabel(e.path)), 8),
      contacts: rank(tally(current.filter((e) => e.type === 'contact_click'), (e) => CONTACT_LABEL[e.label ?? ''] ?? e.label)),
      contexts: rank(tally(current.filter((e) => e.type === 'context_select'), (e) => CONTEXT_LABEL[e.label ?? ''] ?? e.label)),
      devices: rank(tally(firsts, (e) => DEVICE_LABEL[e.device ?? ''] ?? 'Inconnu')),
      empty: current.length === 0,
    }
  }, [events, period])

  return (
    <AdminLayout>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={cn('mx-auto flex max-w-[1100px] flex-col gap-5 p-5 transition-opacity duration-200 sm:p-6', loading && events && 'opacity-60')}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-oswald text-[22px] font-bold text-adm-ink [font-stretch:110%]">Audience</h2>
              <p className="mt-1 text-[14px] text-adm-ink-2">
                Sans cookie ni adresse IP. Tes propres visites (navigateur connecté à l'admin) ne sont pas comptées.
              </p>
            </div>
            {/* période : une seule rangée, au-dessus de tout ce qu'elle filtre */}
            <div role="radiogroup" aria-label="Période" className="inline-flex rounded-full border border-adm-border-strong bg-adm-card p-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={period === p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'adm-focus rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150',
                    period === p ? 'bg-adm-ink text-adm-bg' : 'text-adm-ink-2 hover:text-adm-ink',
                  )}
                >
                  {p} jours
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-[oklch(0.50_0.17_25_/_0.09)] px-3.5 py-2.5 text-[14px] text-[oklch(0.42_0.15_25)]">{error}</p>
          )}
          {!events && !error && <p role="status" className="text-[14px] text-adm-ink-3">Chargement des statistiques…</p>}

          {data && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatTile label="Visites" value={data.now.visits} prev={data.before.visits} period={period} />
                <StatTile label="Pages vues" value={data.now.views} prev={data.before.views} period={period} />
                <StatTile label="CV consulté" value={data.now.cvViews} prev={data.before.cvViews} period={period} />
                <StatTile label="CV téléchargé" value={data.now.cvDownloads} prev={data.before.cvDownloads} period={period} />
                <StatTile label="Clics de contact" value={data.now.contacts} prev={data.before.contacts} period={period} />
              </div>

              {data.empty && (
                <p className="rounded-xl border border-dashed border-adm-border-strong bg-adm-card px-5 py-4 text-[14px] text-adm-ink-2">
                  Aucune visite enregistrée sur cette période. Les statistiques se remplissent dès que le site déployé reçoit des visiteurs
                  (migration 006 appliquée).
                </p>
              )}

              <section className="rounded-xl border border-adm-border bg-adm-card p-5" aria-labelledby="daily-title">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 id="daily-title" className="font-oswald text-[16px] font-bold text-adm-ink [font-stretch:106%]">Visites par jour</h3>
                  <button type="button" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable} className="adm-focus rounded text-[13px] font-semibold text-adm-accent underline-offset-4 hover:underline">
                    {showTable ? 'Voir le graphique' : 'Voir en tableau'}
                  </button>
                </div>
                {showTable ? (
                  <div className="max-h-[320px] overflow-y-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead className="sticky top-0 bg-adm-card text-adm-ink-2">
                        <tr><th className="py-1.5 font-semibold">Jour</th><th className="py-1.5 text-right font-semibold">Visites</th><th className="py-1.5 text-right font-semibold">Pages vues</th></tr>
                      </thead>
                      <tbody className="tabular-nums">
                        {[...data.days].reverse().map((d) => (
                          <tr key={d.key} className="border-t border-adm-border">
                            <td className="py-1.5 text-adm-ink">{longDateFmt.format(d.date)}</td>
                            <td className="py-1.5 text-right text-adm-ink">{fmt.format(d.visits)}</td>
                            <td className="py-1.5 text-right text-adm-ink-2">{fmt.format(d.views)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    <DailyColumns days={data.days} />
                    <p className="mt-2 text-[12px] text-adm-ink-3">Survole une colonne, ou utilise les flèches du clavier, pour le détail du jour.</p>
                  </>
                )}
              </section>

              <div className="grid gap-3 md:grid-cols-2">
                <RankedBars title="D’où viennent les visiteurs" rows={data.referrers} unit="visites" empty="Pas encore de provenance." />
                <RankedBars title="Pages les plus vues" rows={data.pages} unit="pages vues" empty="Pas encore de page vue." />
                <RankedBars title="Clics de contact par canal" rows={data.contacts} unit="clics" empty="Personne n’a encore cliqué sur un contact." />
                <RankedBars title="Qui visite (sélecteur du haut de page)" rows={data.contexts} unit="choix" empty="Aucun visiteur n’a encore utilisé le sélecteur." />
                <RankedBars title="Appareil" rows={data.devices} unit="visites" empty="Pas encore de visite." />
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
