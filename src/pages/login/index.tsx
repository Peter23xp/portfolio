// src/pages/login/index.tsx
// Accès admin : connexion, mot de passe oublié, nouveau mot de passe (retour du
// lien email Supabase). Même monde que le site : champ d'encre pigmenté,
// carte en manteau, une seule action iridophore.

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { PigmentMark } from '../../components/admin/AdminLayout'
import { Button } from '../../components/ui/button'
import {
  authErrorMessage,
  requestPasswordReset,
  signInWithEmail,
  updatePassword,
  useRecoveryMode,
  useSession,
} from '../../lib/auth-client'
import { cn } from '../../lib/utils'

type Mode = 'signin' | 'forgot' | 'recovery'

const inputClass = cn(
  'adm-focus h-11 w-full rounded-lg border px-3.5 text-[15px] text-adm-ink font-space',
  'bg-adm-card border-adm-border-strong placeholder:text-adm-ink-3',
  'hover:border-adm-accent transition-colors duration-150',
  'aria-[invalid=true]:border-[oklch(0.50_0.17_25)]',
)

function Spinner() {
  return (
    <svg className="h-4 w-4 shrink-0 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const recovery = useRecoveryMode()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const firstField = useRef<HTMLInputElement>(null)

  // retour du lien email → formulaire « nouveau mot de passe »
  useEffect(() => {
    if (recovery) setMode('recovery')
  }, [recovery])

  // déjà connecté (hors récupération) → admin
  useEffect(() => {
    if (session && !recovery) navigate('/admin', { replace: true })
  }, [session, recovery, navigate])

  useEffect(() => {
    firstField.current?.focus()
    setError(null)
  }, [mode])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signin') {
        const { error: err } = await signInWithEmail(email.trim(), password)
        if (err) return setError(authErrorMessage(err))
        navigate('/admin', { replace: true })
      } else if (mode === 'forgot') {
        const { error: err } = await requestPasswordReset(email.trim())
        if (err) return setError(authErrorMessage(err))
        setNotice(
          `Si un compte existe pour ${email.trim()}, un lien de réinitialisation vient d'être envoyé. Ouvre-le sur cet appareil.`,
        )
      } else {
        if (password.length < 8) return setError('Mot de passe trop court : 8 caractères minimum.')
        const { error: err } = await updatePassword(password)
        if (err) return setError(authErrorMessage(err))
        window.history.replaceState(null, '', '/login')
        navigate('/admin', { replace: true })
      }
    } catch (err) {
      setError(authErrorMessage(err instanceof Error ? err : null))
    } finally {
      setLoading(false)
    }
  }

  const title = { signin: 'Accès admin', forgot: 'Mot de passe oublié', recovery: 'Nouveau mot de passe' }[mode]
  const lede = {
    signin: 'Classement des projets de peterakilimali.site.',
    forgot: 'Indique ton email : tu recevras un lien pour choisir un nouveau mot de passe.',
    recovery: 'Choisis ton nouveau mot de passe (8 caractères minimum).',
  }[mode]
  const submit = {
    signin: loading ? 'Connexion…' : 'Se connecter',
    forgot: loading ? 'Envoi…' : 'Envoyer le lien',
    recovery: loading ? 'Enregistrement…' : 'Enregistrer et entrer',
  }[mode]

  return (
    <div className="admin-root">
    <div className="adm-shell relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-adm-shell px-4 py-10">
      {/* champ de chromatophores, statique : la peau du site, au repos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, oklch(0.31 0.075 33) 0 2.6px, transparent 3px), radial-gradient(circle, oklch(0.56 0.115 40) 0 1.6px, transparent 2px)',
          backgroundSize: '14px 14px, 22px 22px',
          backgroundPosition: '0 0, 7px 9px',
          maskImage: 'radial-gradient(ellipse at 70% 40%, #000 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, #000 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-[400px]">
        <a href="/" className="adm-focus mb-6 inline-flex items-center gap-2.5 rounded-md text-adm-on-shell" aria-label="Retour au site">
          <PigmentMark className="h-8 w-8" />
          <span className="font-oswald text-[15px] font-semibold [font-stretch:110%]">Peter Akilimali</span>
        </a>

        <div className="rounded-2xl bg-adm-bg p-7 text-adm-ink sm:p-8">
          <h1 className="font-oswald text-[28px] font-bold leading-tight tracking-[-0.015em] [font-stretch:112%]">{title}</h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-adm-ink-2">{lede}</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            {mode !== 'recovery' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[13px] font-medium text-adm-ink">
                  Email
                </label>
                <input
                  id="email"
                  ref={firstField}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  spellCheck={false}
                  aria-invalid={!!error && mode === 'forgot'}
                  aria-describedby={error ? 'auth-error' : undefined}
                  className={inputClass}
                  placeholder="peter23xp@gmail.com"
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="password" className="text-[13px] font-medium text-adm-ink">
                    {mode === 'recovery' ? 'Nouveau mot de passe' : 'Mot de passe'}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setNotice(null) }}
                      className="adm-focus rounded text-[13px] font-medium text-adm-accent underline-offset-4 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  ref={mode === 'recovery' ? firstField : undefined}
                  type="password"
                  required
                  minLength={mode === 'recovery' ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'recovery' ? 'new-password' : 'current-password'}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'auth-error' : undefined}
                  className={inputClass}
                />
              </div>
            )}

            {error && (
              <p id="auth-error" role="alert" className="rounded-lg bg-[oklch(0.50_0.17_25_/_0.09)] px-3.5 py-2.5 text-[14px] leading-snug text-[oklch(0.42_0.15_25)]">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-lg bg-adm-surface px-3.5 py-2.5 text-[14px] leading-snug text-adm-ink">
                {notice}
              </p>
            )}

            <Button type="submit" variant="primary" size="md" disabled={loading} className="mt-1 h-11 w-full text-[15px]">
              {loading && <Spinner />}
              {submit}
            </Button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => { setMode('signin'); setNotice(null) }}
                className="adm-focus self-center rounded text-[13px] font-medium text-adm-ink-2 underline-offset-4 hover:text-adm-ink hover:underline"
              >
                Retour à la connexion
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
    </div>
  )
}
