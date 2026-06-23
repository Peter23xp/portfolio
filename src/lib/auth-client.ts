// src/lib/auth-client.ts
// Authentification via Supabase Auth (côté client, sans serveur dédié).
// La session est persistée par supabase-js (localStorage) et son JWT est
// automatiquement joint aux requêtes → la RLS `auth.role() = 'authenticated'`
// de portfolio_projects s'applique pour l'admin connecté.

import { useEffect, useState } from 'react'
import type { AuthError, Session } from '@supabase/supabase-js'

import { supabase } from './supabase'

interface UseSessionReturn {
  data: Session | null
  isPending: boolean
}

// Hook compatible avec l'ancienne API : { data: session, isPending }.
export function useSession(): UseSessionReturn {
  const [data, setData] = useState<Session | null>(null)
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setData(session)
      setIsPending(false)
    })

    // Mise à jour en temps réel (login/logout/refresh de token).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setData(session)
      setIsPending(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { data, isPending }
}

// Connexion email / mot de passe.
export function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: AuthError | null }> {
  return supabase.auth
    .signInWithPassword({ email, password })
    .then(({ error }) => ({ error }))
}

// Déconnexion.
export function signOut(): Promise<{ error: AuthError | null }> {
  return supabase.auth.signOut().then(({ error }) => ({ error }))
}
