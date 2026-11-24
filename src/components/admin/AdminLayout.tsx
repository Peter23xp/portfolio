// src/components/admin/AdminLayout.tsx
// Coque de l'admin : barre à l'encre (comme le héro du site) avec les onglets,
// zone de travail en manteau pigmenté. L'action principale de chaque page est
// la seule en iridophore.

import type { ReactNode } from 'react'
import { Navigate, NavLink } from 'react-router-dom'
import { Toaster } from 'sonner'

import { GitHubSyncButton } from './GitHubSyncButton'
import { Button } from '../ui/button'
import { signOut, useSession } from '../../lib/auth-client'
import { cn } from '../../lib/utils'
import { OPT_OUT_KEY } from '../../lib/analytics.js'

interface AdminLayoutProps {
  children: ReactNode
  /** Page des dépôts : bouton de synchronisation GitHub */
  isSyncing?: boolean
  onSync?: () => void
  repoCount?: number
  /** Action principale d'une autre page (ex. « Nouveau projet ») */
  actions?: ReactNode
}

const TABS = [
  { to: '/admin', label: 'Dépôts GitHub', end: true },
  { to: '/admin/vitrine', label: 'Projets vitrine', end: false },
  { to: '/admin/parcours', label: 'Parcours', end: false },
  { to: '/admin/contenu', label: 'Contenu', end: false },
  { to: '/admin/analytics', label: 'Analytics', end: false },
]

// même marque que la navigation du site : un amas de chromatophores
export function PigmentMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={className} fill="currentColor">
      <circle cx="8" cy="8" r="4" />
      <circle cx="19" cy="7" r="2.6" />
      <circle cx="9" cy="19" r="2.2" />
      <circle cx="19.5" cy="18.5" r="5" />
    </svg>
  )
}

function LoadingShell() {
  return (
    <div className="admin-root">
      <div className="adm-shell h-14 shrink-0 bg-adm-shell" />
      <div className="flex flex-1 items-center justify-center" role="status" aria-label="Chargement de la session">
        <div className="h-1.5 w-28 rounded-full bg-adm-surface motion-safe:animate-pulse" />
      </div>
    </div>
  )
}

export function AdminLayout({ children, isSyncing = false, onSync, repoCount, actions }: AdminLayoutProps) {
  const { data: session, isPending } = useSession()

  if (isPending) return <LoadingShell />
  if (!session) return <Navigate to="/login" replace />
  // tes propres visites ne comptent pas dans les statistiques
  localStorage.setItem(OPT_OUT_KEY, '1')

  return (
    <div className="admin-root">
      <Toaster
        theme="light"
        toastOptions={{
          classNames: {
            toast: 'bg-adm-card border border-adm-border text-adm-ink font-space text-[14px]',
            description: 'text-adm-ink-2',
            actionButton: 'bg-adm-ink text-adm-bg',
          },
        }}
        position="bottom-right"
      />

      <header className="adm-shell sticky top-0 z-40 shrink-0 bg-adm-shell text-adm-on-shell">
        <div className="flex h-14 items-center justify-between gap-4 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <a href="/" className="adm-focus rounded-md" aria-label="Voir le site public">
              <PigmentMark className="h-7 w-7" />
            </a>
            <h1 className="font-oswald text-[17px] font-bold leading-none tracking-[-0.01em] [font-stretch:112%]">Admin</h1>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="adm-focus hidden rounded-full px-3 py-1.5 text-[13px] text-adm-on-shell-2 underline-offset-4 hover:text-adm-on-shell hover:underline md:inline"
            >
              Voir le site
            </a>
            {onSync && <GitHubSyncButton isSyncing={isSyncing} onSync={onSync} count={repoCount} />}
            {actions}
            <span className="mx-1 hidden h-5 w-px bg-adm-on-shell/25 sm:block" aria-hidden />
            <span className="hidden max-w-[16ch] truncate text-[12px] text-adm-on-shell-2 lg:block" title={session.user.email ?? ''}>
              {session.user.email}
            </span>
            <Button variant="ghost-shell" size="sm" onClick={() => void signOut()}>
              Déconnexion
            </Button>
          </div>
        </div>

        <nav aria-label="Sections de l'admin" className="flex gap-1 overflow-x-auto px-4">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'adm-focus shrink-0 rounded-t-lg px-3.5 py-2 text-[14px] font-medium transition-colors duration-150',
                  isActive ? 'bg-adm-bg text-adm-ink' : 'text-adm-on-shell-2 hover:text-adm-on-shell',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}
