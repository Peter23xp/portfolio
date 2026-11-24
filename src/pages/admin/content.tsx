// src/pages/admin/content.tsx
// Textes & réglages du site : profil, accroches par contexte, contact + CV,
// expertise et stack. Enregistrés dans portfolio_settings (clé → JSON).

import { useEffect, useState } from 'react'

/** Liste séparée par des virgules : texte libre pendant la saisie, appliquée en quittant le champ. */
function ListField({ label, hint, value, onChange }: { label: string; hint?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(', '))
  useEffect(() => { setText(value.join(', ')) }, [value])
  const commit = () => onChange(text.split(',').map((x) => x.trim()).filter(Boolean))
  return (
    <div onBlur={commit}>
      <TextInput label={label} hint={hint} value={text} onChange={setText} />
    </div>
  )
}
import { toast } from 'sonner'

import { AdminLayout } from '../../components/admin/AdminLayout'
import { Bilingual, IconButton, Icons, Panel, TextInput, Toggle, UploadButton } from '../../components/admin/forms'
import { Button } from '../../components/ui/button'
import { getSettings, saveSetting, uploadMedia } from '../../lib/admin-content'
import { DEFAULT_CONTENT } from '../../lib/content.js'

interface Domain { key: string; title_fr: string; title_en: string; body_fr: string; body_en: string; tags: string[] }
interface Settings {
  profile: { available: boolean; role_fr: string; role_en: string; location_fr: string; location_en: string }
  hero: { lede_fr: Record<Ctx, string>; lede_en: Record<Ctx, string> }
  contact: { email: string; whatsapp: string; whatsapp_label: string; linkedin: string; github: string; cv_url: string }
  expertise: { stack: string[]; domains: Domain[] }
}
type Ctx = 'neutral' | 'recruit' | 'client'
const CONTEXTS: { id: Ctx; label: string; hint: string }[] = [
  { id: 'neutral', label: 'Accroche — par défaut', hint: 'Avant que le visiteur choisisse.' },
  { id: 'recruit', label: 'Accroche — « Je recrute »', hint: 'Pour les recruteurs.' },
  { id: 'client', label: 'Accroche — « J’ai un projet »', hint: 'Pour les clients.' },
]
const KEYS = ['profile', 'hero', 'contact', 'expertise'] as const

const mergeDefaults = (remote: Record<string, unknown>): Settings => {
  const d = DEFAULT_CONTENT.settings as Settings
  const r = remote as Partial<Settings>
  return {
    profile: { ...d.profile, ...(r.profile ?? {}) },
    hero: {
      lede_fr: { ...d.hero.lede_fr, ...(r.hero?.lede_fr ?? {}) },
      lede_en: { ...d.hero.lede_en, ...(r.hero?.lede_en ?? {}) },
    },
    contact: { ...d.contact, ...(r.contact ?? {}) },
    expertise: { stack: r.expertise?.stack ?? d.expertise.stack, domains: r.expertise?.domains ?? d.expertise.domains },
  }
}

export default function ContentPage() {
  const [s, setS] = useState<Settings | null>(null)
  const [savedJson, setSavedJson] = useState('')
  const [stackText, setStackText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings()
      .then((remote) => {
        const merged = mergeDefaults(remote)
        setS(merged)
        setSavedJson(JSON.stringify(merged))
        setStackText(merged.expertise.stack.join(', '))
      })
      .catch((e) => {
        setError((e as Error).message)
        const merged = mergeDefaults({})
        setS(merged)
        setSavedJson(JSON.stringify(merged))
        setStackText(merged.expertise.stack.join(', '))
      })
  }, [])

  if (!s) {
    return (
      <AdminLayout>
        <p role="status" className="p-6 text-[14px] text-adm-ink-3">Chargement…</p>
      </AdminLayout>
    )
  }

  const current: Settings = {
    ...s,
    expertise: { ...s.expertise, stack: stackText.split(',').map((x) => x.trim()).filter(Boolean) },
  }
  const dirty = JSON.stringify(current) !== savedJson

  const patch = <K extends keyof Settings>(key: K, value: Partial<Settings[K]>) =>
    setS((prev) => (prev ? { ...prev, [key]: { ...prev[key], ...value } } : prev))
  const setLede = (lang: 'fr' | 'en', ctx: Ctx, v: string) =>
    setS((prev) => (prev ? { ...prev, hero: { ...prev.hero, [`lede_${lang}`]: { ...prev.hero[`lede_${lang}`], [ctx]: v } } } : prev))
  const setDomain = (i: number, value: Partial<Domain>) =>
    patch('expertise', { domains: s.expertise.domains.map((d, k) => (k === i ? { ...d, ...value } : d)) })

  async function save() {
    setSaving(true)
    try {
      const before = JSON.parse(savedJson) as Settings
      const changed = KEYS.filter((k) => JSON.stringify(current[k]) !== JSON.stringify(before[k]))
      for (const k of changed) await saveSetting(k, current[k])
      setSavedJson(JSON.stringify(current))
      setError(null)
      toast.success('Contenu enregistré', { description: 'Visible sur le site au prochain chargement.' })
    } catch (e) {
      toast.error("Impossible d'enregistrer", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function uploadCv(files: File[]) {
    const f = files[0]
    if (f.type !== 'application/pdf') return void toast.error('Le CV doit être un fichier PDF.')
    try {
      const url = await uploadMedia(f, 'cv')
      patch('contact', { cv_url: url })
      toast.success('CV envoyé', { description: 'Pense à enregistrer.' })
    } catch (e) {
      toast.error("Échec de l'envoi du CV", { description: (e as Error).message })
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
        <div className="mx-auto flex max-w-[900px] flex-col gap-5 p-5 sm:p-6">
          <div>
            <h2 className="font-oswald text-[22px] font-bold text-adm-ink [font-stretch:110%]">Contenu du site</h2>
            <p className="mt-1 text-[14px] text-adm-ink-2">Textes du haut de page, contact, expertise. Tout est en français et en anglais.</p>
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-[oklch(0.50_0.17_25_/_0.09)] px-3.5 py-2.5 text-[14px] text-[oklch(0.42_0.15_25)]">
              {error} Les valeurs affichées sont celles du site actuel.
            </p>
          )}

          <Panel title="Profil">
            <Toggle
              label="Disponible"
              hint="Affiche le signal « Disponible » en haut de page et dans le contact."
              checked={s.profile.available}
              onChange={(v) => patch('profile', { available: v })}
            />
            <Bilingual label="Rôle (sous le nom)" fr={s.profile.role_fr} en={s.profile.role_en} onFr={(v) => patch('profile', { role_fr: v })} onEn={(v) => patch('profile', { role_en: v })} />
            <Bilingual label="Localisation" fr={s.profile.location_fr} en={s.profile.location_en} onFr={(v) => patch('profile', { location_fr: v })} onEn={(v) => patch('profile', { location_en: v })} />
          </Panel>

          <Panel title="Accroches du haut de page" description="Le texte sous le sélecteur change selon ce que le visiteur choisit.">
            {CONTEXTS.map((c) => (
              <Bilingual
                key={c.id}
                label={c.label}
                hint={c.hint}
                multiline
                rows={2}
                fr={s.hero.lede_fr[c.id]}
                en={s.hero.lede_en[c.id]}
                onFr={(v) => setLede('fr', c.id, v)}
                onEn={(v) => setLede('en', c.id, v)}
              />
            ))}
          </Panel>

          <Panel title="Contact & CV">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Email" type="email" value={s.contact.email} onChange={(v) => patch('contact', { email: v })} />
              <TextInput label="LinkedIn" type="url" value={s.contact.linkedin} onChange={(v) => patch('contact', { linkedin: v })} />
              <TextInput label="Lien WhatsApp" type="url" hint="Format : https://wa.me/243…" value={s.contact.whatsapp} onChange={(v) => patch('contact', { whatsapp: v })} />
              <TextInput label="Numéro affiché" value={s.contact.whatsapp_label} onChange={(v) => patch('contact', { whatsapp_label: v })} />
              <TextInput label="GitHub" type="url" value={s.contact.github} onChange={(v) => patch('contact', { github: v })} />
              <TextInput label="Lien du CV (PDF)" value={s.contact.cv_url} onChange={(v) => patch('contact', { cv_url: v })} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <UploadButton label="Envoyer un nouveau CV (PDF)" accept="application/pdf" onFiles={uploadCv} />
              <a href={s.contact.cv_url} target="_blank" rel="noopener noreferrer" className="adm-focus rounded text-[13px] font-semibold text-adm-accent underline-offset-4 hover:underline">
                Ouvrir le CV actuel
              </a>
            </div>
          </Panel>

          <Panel
            title="Expertise"
            description="Les domaines de la section « Ce que je fais »."
            aside={
              <Button
                variant="outline"
                size="sm"
                onClick={() => patch('expertise', { domains: [...s.expertise.domains, { key: `d${Date.now()}`, title_fr: '', title_en: '', body_fr: '', body_en: '', tags: [] }] })}
              >
                {Icons.plus} Ajouter un domaine
              </Button>
            }
          >
            {s.expertise.domains.map((d, i) => (
              <fieldset key={d.key} className="flex flex-col gap-4 rounded-lg border border-adm-border bg-adm-bg p-4">
                <div className="flex items-center justify-between">
                  <legend className="text-[13px] font-semibold text-adm-ink-2">Domaine {i + 1}</legend>
                  <div className="flex">
                    <IconButton label="Monter" disabled={i === 0} onClick={() => { const l = [...s.expertise.domains]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; patch('expertise', { domains: l }) }}>{Icons.up}</IconButton>
                    <IconButton label="Descendre" disabled={i === s.expertise.domains.length - 1} onClick={() => { const l = [...s.expertise.domains]; [l[i + 1], l[i]] = [l[i], l[i + 1]]; patch('expertise', { domains: l }) }}>{Icons.down}</IconButton>
                    <IconButton label="Supprimer le domaine" tone="danger" onClick={() => { if (window.confirm('Supprimer ce domaine ?')) patch('expertise', { domains: s.expertise.domains.filter((_, k) => k !== i) }) }}>{Icons.trash}</IconButton>
                  </div>
                </div>
                <Bilingual label="Titre" fr={d.title_fr} en={d.title_en} onFr={(v) => setDomain(i, { title_fr: v })} onEn={(v) => setDomain(i, { title_en: v })} />
                <Bilingual label="Description" multiline rows={2} fr={d.body_fr} en={d.body_en} onFr={(v) => setDomain(i, { body_fr: v })} onEn={(v) => setDomain(i, { body_en: v })} />
                <ListField label="Mots-clés" hint="Séparés par des virgules." value={d.tags} onChange={(tags) => setDomain(i, { tags })} />
              </fieldset>
            ))}
            <TextInput label="Stack (ligne sous les domaines)" hint="Séparée par des virgules." value={stackText} onChange={setStackText} />
          </Panel>
        </div>
      </div>
    </AdminLayout>
  )
}
