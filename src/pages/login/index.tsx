// src/pages/login/index.tsx

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'

import { Button } from '../../components/ui/button'
import { signInWithEmail, useSession } from '../../lib/auth-client'
import { cn } from '../../lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session) navigate('/admin', { replace: true })
  }, [session, navigate])

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await signInWithEmail(email, password)
      if (error) {
        toast.error('Accès refusé', { description: error.message })
        return
      }
      navigate('/admin', { replace: true })
    } catch (err) {
      toast.error('Erreur de connexion', {
        description: err instanceof Error ? err.message : 'Erreur inattendue',
      })
    } finally {
      setLoading(false)
    }
  }

  const inputClass = cn(
    'adm-focus h-9 w-full rounded-lg border px-3 text-[13px] text-adm-ink',
    'bg-adm-card border-adm-border',
    'placeholder:text-adm-ink-3',
    'hover:border-adm-border-strong',
    'focus:border-adm-accent-border',
    'transition-colors duration-150',
    'outline-none',
  )

  return (
    <div className="admin-root flex items-center justify-center px-4">
      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast: 'bg-adm-card border-adm-border text-adm-ink font-space text-[13px]',
            description: 'text-adm-ink-2',
          },
        }}
        position="bottom-center"
        richColors
      />

      <div className="w-full max-w-[340px]">
        {/* ── Logo monogramme ─────────────────────────────────── */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-adm-accent text-[16px] font-bold text-white tracking-tight select-none">
            PA
          </div>
          <div className="text-center">
            <h1 className="font-oswald text-[22px] font-semibold leading-tight tracking-tight text-adm-ink">
              Accès admin
            </h1>
            <p className="mt-1 text-[12px] text-adm-ink-3 leading-none">
              peterakilimali.site
            </p>
          </div>
        </div>

        {/* ── Formulaire ──────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[11px] font-medium text-adm-ink-3 leading-none">
              Email
            </label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              spellCheck={false}
              className={inputClass}
              placeholder="peter@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[11px] font-medium text-adm-ink-3 leading-none">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={inputClass}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="mt-1 w-full h-9 text-[13px] font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Connexion…
              </span>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
