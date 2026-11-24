// src/pages/admin/showcase.tsx
// Projets vitrine : ajout / modification / suppression des projets hors GitHub,
// captures d'écran, choix des projets phares, ordre d'affichage.

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { AdminLayout } from '../../components/admin/AdminLayout'
import { GithubPicker } from '../../components/admin/GithubPicker'
import { Bilingual, Field, IconButton, Icons, Panel, TextInput, Toggle, UploadButton, inputClass } from '../../components/admin/forms'
import { Button } from '../../components/ui/button'
import {
  deleteShowcase,
  emptyProject,
  listShowcase,
  projectFromRepo,
  type RepoRow,
  reorderShowcase,
  saveShowcase,
  slugify,
  uploadMedia,
  type ShowcaseProject,
} from '../../lib/admin-content'
import { cn } from '../../lib/utils'

const CATEGORIES = [
  { id: 'livre', label: 'Livré' },
  { id: 'hackathon', label: 'Hackathon & Web3' },
  { id: 'personnel', label: 'Personnel' },
  { id: 'contribution', label: 'Contribution' },
]

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export default function ShowcasePage() {
  const [items, setItems] = useState<ShowcaseProject[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null) // id, ou 'new'
  const [draft, setDraft] = useState<ShowcaseProject | null>(null)
  const [stackText, setStackText] = useState('')
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const existing = useMemo(
    () => ({
      urls: new Set(items.map((p) => p.github_url).filter(Boolean)),
      names: new Set(items.map((p) => p.name.toLowerCase())),
    }),
    [items],
  )

  // ajout depuis GitHub : projet pré-rempli, adresse unique
  async function addFromRepo(repo: RepoRow, featured: boolean) {
    const project = projectFromRepo(repo, items.length, featured)
    let slug = project.slug || 'projet'
    for (let n = 2; items.some((p) => p.slug === slug); n++) slug = `${project.slug}-${n}`
    try {
      const saved = await saveShowcase({ ...project, slug })
      await load()
      toast.success(featured ? `« ${saved.name} » ajouté en projet phare` : `« ${saved.name} » ajouté à la vitrine`, {
        description: 'Complète ses textes et ajoute des captures quand tu veux.',
      })
    } catch (e) {
      toast.error("Ajout impossible", { description: (e as Error).message })
    }
  }

  const original = useMemo(
    () => (selected === 'new' ? null : items.find((p) => p.id === selected) ?? null),
    [items, selected],
  )
  const dirty =
    !!draft &&
    (selected === 'new' || !same(draft, original) || stackText !== (original?.stack ?? []).join(', '))

  const load = async () => {
    try {
      const list = await listShowcase()
      setItems(list)
      setLoadError(null)
      return list
    } catch (e) {
      setLoadError((e as Error).message)
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load().then((list) => {
      if (list[0]?.id) open(list[0])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // avertir avant de quitter avec des changements non enregistrés
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault() }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  function open(p: ShowcaseProject | 'new') {
    if (dirty && !window.confirm('Des modifications ne sont pas enregistrées. Les abandonner ?')) return
    if (p === 'new') {
      const fresh = emptyProject(items.length)
      setSelected('new')
      setDraft(fresh)
      setStackText('')
    } else {
      setSelected(p.id ?? null)
      setDraft(structuredClone(p))
      setStackText((p.stack ?? []).join(', '))
    }
  }

  const set = <K extends keyof ShowcaseProject>(key: K, value: ShowcaseProject[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d))

  async function save() {
    if (!draft) return
    if (!draft.name.trim()) return toast.error('Le nom du projet est obligatoire.')
    const slug = draft.slug.trim() || slugify(draft.name)
    if (items.some((p) => p.slug === slug && p.id !== draft.id))
      return toast.error(`L'adresse « ${slug} » est déjà utilisée par un autre projet.`)
    setSaving(true)
    try {
      const stack = stackText.split(',').map((s) => s.trim()).filter(Boolean)
      const saved = await saveShowcase({ ...draft, slug, stack })
      await load()
      setSelected(saved.id ?? null)
      setDraft(structuredClone(saved))
      setStackText(saved.stack.join(', '))
      toast.success('Projet enregistré', { description: 'Visible sur le site au prochain chargement.' })
    } catch (e) {
      toast.error("Impossible d'enregistrer", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!draft?.id) { setSelected(null); setDraft(null); return }
    if (!window.confirm(`Supprimer « ${draft.name} » du portfolio ? Cette action est définitive.`)) return
    try {
      await deleteShowcase(draft.id)
      const list = await load()
      setDraft(null)
      setSelected(null)
      if (list[0]) open(list[0])
      toast.success('Projet supprimé')
    } catch (e) {
      toast.error('Suppression impossible', { description: (e as Error).message })
    }
  }

  // actions rapides dans la liste (enregistrées tout de suite)
  async function quick(p: ShowcaseProject, patch: Partial<ShowcaseProject>) {
    try {
      const saved = await saveShowcase({ ...p, ...patch })
      setItems((list) => list.map((x) => (x.id === saved.id ? saved : x)))
      if (draft?.id === saved.id) setDraft((d) => (d ? { ...d, ...patch } : d))
    } catch (e) {
      toast.error('Modification impossible', { description: (e as Error).message })
    }
  }

  async function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    try {
      await reorderShowcase(next.map((p) => p.id!).filter(Boolean))
    } catch (e) {
      toast.error('Ordre non enregistré', { description: (e as Error).message })
      void load()
    }
  }

  // ── captures ──
  const shots = draft?.screenshots ?? []
  const setShots = (list: ShowcaseProject['screenshots']) => set('screenshots', list)
  const moveShot = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= shots.length) return
    const next = [...shots]
    ;[next[i], next[j]] = [next[j], next[i]]
    setShots(next)
  }

  async function uploadShots(files: File[]) {
    const folder = `projets/${draft?.slug || slugify(draft?.name || 'projet') || 'projet'}`
    const added: ShowcaseProject['screenshots'] = []
    for (const f of files) {
      try {
        added.push({ url: await uploadMedia(f, folder), alt_fr: '', alt_en: '' })
      } catch (e) {
        toast.error(`Échec de l'envoi : ${f.name}`, { description: (e as Error).message })
      }
    }
    if (added.length) {
      setDraft((d) => (d ? { ...d, screenshots: [...d.screenshots, ...added] } : d))
      toast.success(`${added.length} capture${added.length > 1 ? 's' : ''} ajoutée${added.length > 1 ? 's' : ''}`, { description: 'Pense à enregistrer le projet.' })
    }
  }

  async function uploadIcon(files: File[]) {
    try {
      const url = await uploadMedia(files[0], `projets/${draft?.slug || 'icones'}`, { maxSide: 256 })
      set('icon_url', url)
    } catch (e) {
      toast.error("Échec de l'envoi de l'icône", { description: (e as Error).message })
    }
  }

  const featuredCount = items.filter((p) => p.is_featured && p.published).length

  return (
    <AdminLayout
      actions={
        <>
          <Button variant="on-shell" size="sm" onClick={() => setPickerOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" /></svg>
            Depuis GitHub
          </Button>
          <Button variant="on-shell" size="sm" onClick={() => open('new')}>
            {Icons.plus} Nouveau projet
          </Button>
        </>
      }
    >
      <GithubPicker open={pickerOpen} onClose={() => setPickerOpen(false)} existing={existing} onAdd={addFromRepo} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* ── Liste ── */}
        <aside className="shrink-0 border-adm-border bg-adm-surface lg:w-[320px] lg:overflow-y-auto lg:border-r">
          <div className="px-5 pb-2 pt-5">
            <h2 className="font-oswald text-[18px] font-bold text-adm-ink [font-stretch:108%]">Projets vitrine</h2>
            <p className="mt-1 text-[13px] leading-snug text-adm-ink-2">
              Projets présentés à la main sur le site. L'étoile les met en tête, dans le bloc « projets phares »
              ({featuredCount} actuellement).
            </p>
          </div>
          {loading && <p className="px-5 py-3 text-[13px] text-adm-ink-3" role="status">Chargement…</p>}
          {loadError && (
            <p role="alert" className="mx-5 my-3 rounded-lg bg-[oklch(0.50_0.17_25_/_0.09)] px-3 py-2.5 text-[13px] text-[oklch(0.42_0.15_25)]">
              {loadError}
            </p>
          )}
          <ol className="flex flex-col gap-1 p-3">
            {items.map((p, i) => (
              <li key={p.id}>
                <div
                  className={cn(
                    'group flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors duration-150',
                    selected === p.id ? 'border-adm-accent bg-adm-card' : 'border-transparent hover:bg-adm-card',
                  )}
                >
                  <button type="button" onClick={() => open(p)} className="adm-focus min-w-0 flex-1 rounded px-1.5 py-1 text-left">
                    <span className={cn('block truncate text-[14px] font-semibold', p.published ? 'text-adm-ink' : 'text-adm-ink-3 line-through')}>
                      {p.name || 'Sans nom'}
                    </span>
                    <span className="block truncate text-[12px] text-adm-ink-3">
                      {CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category} · {p.screenshots?.length ?? 0} capture(s)
                    </span>
                  </button>
                  <IconButton label={p.is_featured ? 'Retirer des projets phares' : 'Mettre en projet phare'} onClick={() => void quick(p, { is_featured: !p.is_featured })}>
                    <span className={p.is_featured ? 'text-adm-accent' : undefined}>{Icons.star(p.is_featured)}</span>
                  </IconButton>
                  <IconButton label={p.published ? 'Masquer du site' : 'Afficher sur le site'} onClick={() => void quick(p, { published: !p.published })}>
                    {Icons.eye(p.published)}
                  </IconButton>
                  <div className="flex flex-col">
                    <button type="button" aria-label={`Monter ${p.name}`} disabled={i === 0} onClick={() => void move(i, -1)} className="adm-focus grid h-4 w-6 place-items-center rounded text-adm-ink-3 hover:text-adm-ink disabled:opacity-25">{Icons.up}</button>
                    <button type="button" aria-label={`Descendre ${p.name}`} disabled={i === items.length - 1} onClick={() => void move(i, 1)} className="adm-focus grid h-4 w-6 place-items-center rounded text-adm-ink-3 hover:text-adm-ink disabled:opacity-25">{Icons.down}</button>
                  </div>
                </div>
              </li>
            ))}
            {selected === 'new' && (
              <li className="rounded-lg border border-dashed border-adm-accent bg-adm-card px-3.5 py-2.5 text-[14px] font-semibold text-adm-accent">
                {draft?.name || 'Nouveau projet'}
              </li>
            )}
          </ol>
          {!loading && !loadError && items.length === 0 && selected !== 'new' && (
            <div className="px-5 pb-5">
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm" onClick={() => setPickerOpen(true)}>Choisir dans GitHub</Button>
                <Button variant="outline" size="sm" onClick={() => open('new')}>{Icons.plus} Projet hors GitHub</Button>
              </div>
            </div>
          )}
        </aside>

        {/* ── Éditeur ── */}
        <section className="min-w-0 flex-1 lg:overflow-y-auto" aria-label="Édition du projet">
          {!draft ? (
            <div className="grid h-full place-items-center p-10 text-center text-[14px] text-adm-ink-2">
              Choisis un projet à gauche, ou crée-en un nouveau.
            </div>
          ) : (
            <form
              className="mx-auto flex max-w-[900px] flex-col gap-5 p-5 pb-28 sm:p-6 sm:pb-28"
              onSubmit={(e) => { e.preventDefault(); void save() }}
            >
              <Panel title="Identité">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    label="Nom du projet"
                    required
                    value={draft.name}
                    onChange={(v) => setDraft((d) => (d ? { ...d, name: v, slug: d.id ? d.slug : slugify(v) } : d))}
                  />
                  <TextInput
                    label="Adresse de l'étude de cas"
                    hint={`peterakilimali.site/projets/${draft.slug || slugify(draft.name) || '…'}`}
                    value={draft.slug}
                    onChange={(v) => set('slug', slugify(v))}
                  />
                  <Field label="Catégorie" htmlFor="sc-cat">
                    <select id="sc-cat" value={draft.category} onChange={(e) => set('category', e.target.value)} className={cn(inputClass, 'h-10')}>
                      {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </Field>
                  <TextInput label="Plateformes" placeholder="iOS · Android · Web" value={draft.platforms} onChange={(v) => set('platforms', v)} />
                  <div className="md:col-span-2">
                    <TextInput label="Stack" hint="Séparée par des virgules : React Native, Node.js, PostgreSQL" value={stackText} onChange={setStackText} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Toggle label="Projet phare" hint="Affiché en grand, dans le bloc en tête des projets." checked={draft.is_featured} onChange={(v) => set('is_featured', v)} />
                  <Toggle label="Publié" hint="Désactivé : le projet reste ici mais n'apparaît plus sur le site." checked={draft.published} onChange={(v) => set('published', v)} />
                </div>
              </Panel>

              <Panel title="Textes" description="Le résumé s'affiche partout ; le texte détaillé et ton rôle alimentent l'étude de cas. Laisse une ligne vide pour changer de paragraphe.">
                <Bilingual label="Résumé (une phrase)" fr={draft.tagline_fr} en={draft.tagline_en} onFr={(v) => set('tagline_fr', v)} onEn={(v) => set('tagline_en', v)} />
                <Bilingual label="Le projet" multiline rows={5} fr={draft.body_fr} en={draft.body_en} onFr={(v) => set('body_fr', v)} onEn={(v) => set('body_en', v)} />
                <Bilingual label="Mon rôle" multiline rows={4} hint="Ce que tu as fait concrètement : conception, développement, mise en ligne…" fr={draft.role_fr} en={draft.role_en} onFr={(v) => set('role_fr', v)} onEn={(v) => set('role_en', v)} />
              </Panel>

              <Panel title="Liens">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="Site web" type="url" placeholder="https://" value={draft.site_url} onChange={(v) => set('site_url', v)} />
                  <TextInput label="Code source (GitHub)" type="url" placeholder="https://github.com/…" value={draft.github_url} onChange={(v) => set('github_url', v)} />
                  <TextInput label="App Store" type="url" placeholder="https://apps.apple.com/…" value={draft.ios_url} onChange={(v) => set('ios_url', v)} />
                  <TextInput label="Google Play" type="url" placeholder="https://play.google.com/…" value={draft.android_url} onChange={(v) => set('android_url', v)} />
                </div>
              </Panel>

              <Panel
                title="Icône & captures d'écran"
                description="Les images sont réduites et converties en WebP avant l'envoi : le site reste léger. Les 3 premières captures apparaissent dans le bloc phare, toutes dans l'étude de cas."
              >
                <div className="flex flex-wrap items-center gap-4">
                  {draft.icon_url ? (
                    <img src={draft.icon_url} alt="" className="h-14 w-14 rounded-xl border border-adm-border object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-xl border border-dashed border-adm-border-strong text-[11px] text-adm-ink-3">Icône</span>
                  )}
                  <UploadButton label={draft.icon_url ? "Changer l'icône" : 'Ajouter une icône'} onFiles={uploadIcon} />
                  {draft.icon_url && (
                    <button type="button" onClick={() => set('icon_url', '')} className="adm-focus rounded text-[13px] font-medium text-adm-ink-2 underline-offset-4 hover:underline">
                      Retirer
                    </button>
                  )}
                </div>

                {shots.length > 0 && (
                  <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {shots.map((s, i) => (
                      <li key={s.url} className="flex flex-col gap-2 rounded-lg border border-adm-border bg-adm-bg p-2.5">
                        <div className="relative overflow-hidden rounded-md bg-adm-surface">
                          <img src={s.url} alt={s.alt_fr || `Capture ${i + 1}`} className="mx-auto h-56 w-auto object-contain" loading="lazy" />
                          <span className="absolute left-2 top-2 rounded-full bg-adm-ink px-2 py-0.5 text-[12px] font-semibold tabular-nums text-adm-bg">{i + 1}</span>
                        </div>
                        <input aria-label={`Description FR de la capture ${i + 1}`} placeholder="Description (FR)" value={s.alt_fr ?? ''} onChange={(e) => setShots(shots.map((x, k) => (k === i ? { ...x, alt_fr: e.target.value } : x)))} className={cn(inputClass, 'h-9 text-[13px]')} />
                        <input aria-label={`Description EN de la capture ${i + 1}`} placeholder="Description (EN)" value={s.alt_en ?? ''} onChange={(e) => setShots(shots.map((x, k) => (k === i ? { ...x, alt_en: e.target.value } : x)))} className={cn(inputClass, 'h-9 text-[13px]')} />
                        <div className="flex items-center justify-between">
                          <div className="flex">
                            <IconButton label="Déplacer avant" disabled={i === 0} onClick={() => moveShot(i, -1)}>{Icons.left}</IconButton>
                            <IconButton label="Déplacer après" disabled={i === shots.length - 1} onClick={() => moveShot(i, 1)}>{Icons.right}</IconButton>
                          </div>
                          <IconButton label={`Supprimer la capture ${i + 1}`} tone="danger" onClick={() => setShots(shots.filter((_, k) => k !== i))}>{Icons.trash}</IconButton>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
                <div>
                  <UploadButton label="Ajouter des captures" multiple onFiles={uploadShots} />
                </div>
              </Panel>

              {/* barre d'actions fixe */}
              <div className="sticky bottom-0 z-10 -mx-5 flex flex-wrap items-center gap-3 border-t border-adm-border bg-adm-bg px-5 py-3 sm:-mx-6 sm:px-6">
                <Button type="submit" variant="primary" size="md" disabled={saving || !dirty}>
                  {saving ? 'Enregistrement…' : dirty ? 'Enregistrer' : 'Enregistré'}
                </Button>
                {draft.id && draft.published && (
                  <a href={`/projets/${draft.slug}`} target="_blank" rel="noopener noreferrer" className="adm-focus rounded text-[14px] font-semibold text-adm-accent underline-offset-4 hover:underline">
                    Voir l'étude de cas
                  </a>
                )}
                {dirty && <span className="text-[13px] text-adm-ink-3" role="status">Modifications non enregistrées</span>}
                <span className="flex-1" />
                <Button type="button" variant="danger" size="sm" onClick={() => void remove()}>
                  {draft.id ? 'Supprimer le projet' : 'Annuler'}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}
