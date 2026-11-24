// src/components/admin/forms.tsx
// Briques de formulaire de l'admin : champs standard, champ bilingue FR/EN,
// interrupteur, envoi d'image. Contrôles natifs, états visibles, labels reliés.

import { useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

export const inputClass = cn(
  'adm-focus w-full rounded-lg border bg-adm-card px-3 py-2 text-[14px] text-adm-ink font-space',
  'border-adm-border-strong placeholder:text-adm-ink-3 hover:border-adm-accent transition-colors duration-150',
)

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-adm-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] leading-snug text-adm-ink-3">{hint}</p>}
    </div>
  )
}

export function TextInput({
  label,
  hint,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, 'h-10')}
      />
    </Field>
  )
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, 'resize-y leading-relaxed')}
      />
    </Field>
  )
}

/** Deux champs côte à côte : français et anglais. */
export function Bilingual({
  label,
  hint,
  fr,
  en,
  onFr,
  onEn,
  multiline = false,
  rows = 3,
}: {
  label: string
  hint?: string
  fr: string
  en: string
  onFr: (v: string) => void
  onEn: (v: string) => void
  multiline?: boolean
  rows?: number
}) {
  const Comp = multiline ? TextArea : TextInput
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-[13px] font-semibold text-adm-ink">{label}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        <Comp label="Français" value={fr} onChange={onFr} {...(multiline ? { rows } : {})} />
        <Comp label="English" value={en} onChange={onEn} {...(multiline ? { rows } : {})} />
      </div>
      {hint && <p className="mt-1.5 text-[12px] leading-snug text-adm-ink-3">{hint}</p>}
    </fieldset>
  )
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'adm-focus relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150',
          checked ? 'bg-adm-accent' : 'bg-adm-border-strong',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-adm-card shadow-[0_1px_2px_oklch(0.2_0.03_35_/_0.3)] transition-transform duration-150',
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
          )}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-[14px] font-semibold text-adm-ink">{label}</span>
        {hint && <span className="block text-[12px] leading-snug text-adm-ink-3">{hint}</span>}
      </label>
    </div>
  )
}

/** Bouton d'envoi de fichier(s) avec état « envoi en cours ». */
export function UploadButton({
  label,
  accept = 'image/*',
  multiple = false,
  onFiles,
  className,
}: {
  label: string
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => Promise<void>
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (!files.length) return
          setBusy(true)
          try {
            await onFiles(files)
          } finally {
            setBusy(false)
          }
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className={cn(
          'adm-focus inline-flex h-9 items-center justify-center gap-2 rounded-full border border-dashed border-adm-accent px-4',
          'text-[13px] font-semibold text-adm-accent transition-colors duration-150 hover:bg-adm-accent-dim',
          'disabled:cursor-wait disabled:opacity-60',
          className,
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden className={busy ? 'motion-safe:animate-spin' : undefined}>
          {busy ? <path d="M21 12a9 9 0 1 1-6.219-8.56" /> : <path d="M12 16V4m0 0-5 5m5-5 5 5M4 20h16" />}
        </svg>
        {busy ? 'Envoi…' : label}
      </button>
    </>
  )
}

/** Bloc de formulaire titré. */
export function Panel({ title, description, children, aside }: { title: string; description?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-xl border border-adm-border bg-adm-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-oswald text-[18px] font-bold leading-tight text-adm-ink [font-stretch:108%]">{title}</h2>
          {description && <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-adm-ink-2">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  )
}

/** Petit bouton icône (monter / descendre / supprimer). */
export function IconButton({
  label,
  onClick,
  children,
  tone = 'default',
  disabled,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  tone?: 'default' | 'danger'
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'adm-focus inline-grid h-8 w-8 place-items-center rounded-full transition-colors duration-150 disabled:opacity-30',
        tone === 'danger'
          ? 'text-[oklch(0.45_0.16_25)] hover:bg-[oklch(0.55_0.17_25_/_0.1)]'
          : 'text-adm-ink-2 hover:bg-adm-surface hover:text-adm-ink',
      )}
    >
      {children}
    </button>
  )
}

export const Icons = {
  up: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 15 6-6 6 6" /></svg>,
  down: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>,
  left: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m15 6-6 6 6 6" /></svg>,
  right: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" /></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>,
  star: (filled: boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  eye: (on: boolean) => on
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A16.6 16.6 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /></svg>,
}
