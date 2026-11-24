// src/pages/admin/timeline.tsx
// Parcours : étapes affichées dans la section « Parcours » du site (ordre = ordre
// d'affichage, la dernière étape est mise en avant comme « aujourd'hui »).

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AdminLayout } from '../../components/admin/AdminLayout'
import { Bilingual, IconButton, Icons, Toggle } from '../../components/admin/forms'
import { Button } from '../../components/ui/button'
import { emptyStep, listTimeline, saveTimeline, type TimelineStep } from '../../lib/admin-content'

type Row = TimelineStep & { _key: string }
const withKey = (s: TimelineStep): Row => ({ ...s, _key: s.id ?? crypto.randomUUID() })
const strip = (rows: Row[]) => rows.map(({ _key, ...s }) => s)

export default function TimelinePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [saved, setSaved] = useState<string>('[]')
  const [removed, setRemoved] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const dirty = removed.length > 0 || JSON.stringify(strip(rows)) !== saved

  useEffect(() => {
    listTimeline()
      .then((list) => {
        setRows(list.map(withKey))
        setSaved(JSON.stringify(list))
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const update = (key: string, patch: Partial<TimelineStep>) =>
    setRows((list) => list.map((r) => (r._key === key ? { ...r, ...patch } : r)))

  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows(next)
  }

  const remove = (row: Row) => {
    if (!window.confirm(`Supprimer l'étape « ${row.title_fr || row.period_fr || 'sans titre'} » ?`)) return
    if (row.id) setRemoved((r) => [...r, row.id!])
    setRows((list) => list.filter((r) => r._key !== row._key))
  }

  async function save() {
    if (rows.some((r) => !r.title_fr.trim() && !r.title_en.trim()))
      return toast.error('Chaque étape a besoin d’un titre (au moins en français).')
    setSaving(true)
    try {
      const list = await saveTimeline(strip(rows), removed)
      setRows(list.map(withKey))
      setSaved(JSON.stringify(list))
      setRemoved([])
      toast.success('Parcours enregistré')
    } catch (e) {
      toast.error("Impossible d'enregistrer", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      actions={
        <Button variant="primary" size="sm" onClick={() => void save()} disabled={saving || !dirty}>
          {saving ? 'Enregistrement…' : dirty ? 'Enregistrer' : 'Enregistré'}
        </Button>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[900px] flex-col gap-4 p-5 sm:p-6">
          <div>
            <h2 className="font-oswald text-[22px] font-bold text-adm-ink [font-stretch:110%]">Parcours</h2>
            <p className="mt-1 text-[14px] text-adm-ink-2">
              Dans l'ordre chronologique. La dernière étape est affichée comme « aujourd'hui ».
            </p>
          </div>

          {loading && <p role="status" className="text-[14px] text-adm-ink-3">Chargement…</p>}
          {error && (
            <p role="alert" className="rounded-lg bg-[oklch(0.50_0.17_25_/_0.09)] px-3.5 py-2.5 text-[14px] text-[oklch(0.42_0.15_25)]">{error}</p>
          )}

          <ol className="flex flex-col gap-4">
            {rows.map((r, i) => (
              <li key={r._key} className="rounded-xl border border-adm-border bg-adm-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-[13px] font-semibold text-adm-ink-2">
                    Étape {i + 1}{i === rows.length - 1 ? ' · aujourd’hui' : ''}
                  </span>
                  <div className="flex items-center">
                    <IconButton label="Monter" disabled={i === 0} onClick={() => move(i, -1)}>{Icons.up}</IconButton>
                    <IconButton label="Descendre" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>{Icons.down}</IconButton>
                    <IconButton label="Supprimer l'étape" tone="danger" onClick={() => remove(r)}>{Icons.trash}</IconButton>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <Bilingual label="Période" fr={r.period_fr} en={r.period_en} onFr={(v) => update(r._key, { period_fr: v })} onEn={(v) => update(r._key, { period_en: v })} />
                  <Bilingual label="Titre" fr={r.title_fr} en={r.title_en} onFr={(v) => update(r._key, { title_fr: v })} onEn={(v) => update(r._key, { title_en: v })} />
                  <Bilingual label="Détail" multiline rows={2} fr={r.detail_fr} en={r.detail_en} onFr={(v) => update(r._key, { detail_fr: v })} onEn={(v) => update(r._key, { detail_en: v })} />
                  <Toggle label="Affichée sur le site" checked={r.published} onChange={(v) => update(r._key, { published: v })} />
                </div>
              </li>
            ))}
          </ol>

          {!loading && !error && (
            <div>
              <Button variant="outline" size="md" onClick={() => setRows((list) => [...list, withKey(emptyStep(list.length))])}>
                {Icons.plus} Ajouter une étape
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
