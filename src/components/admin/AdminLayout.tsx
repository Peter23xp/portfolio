// src/components/admin/AdminLayout.tsx
// Coque de l'admin : barre à l'encre (comme le héro du site), zone de travail
// en manteau pigmenté. L'action principale (Sync) est la seule en iridophore.

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

import { GitHubSyncButton } from './GitHubSyncButton'
import { Button } from '../ui/button'
import { signOut, useSession } from '../../lib/auth-client'

interface AdminLayoutProps {
  children: ReactNode
  isSyncing: boolean
  onSync: () => void
  repoCount: number
}

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

export function AdminLayout({ children, isSyncing, onSync, repoCount }: AdminLayoutProps) {
  const { data: session, isPending } = useSession()

  if (isPending) return <LoadingShell />
  if (!session) return <Navigate to="/login" replace />

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

      <header className="adm-shell sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 bg-adm-shell px-5 text-adm-on-shell">
        <div className="flex min-w-0 items-center gap-3">
          <a href="/" className="adm-focus rounded-md" aria-label="Voir le site public">
            <PigmentMark className="h-7 w-7" />
          </a>
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="font-oswald text-[17px] font-bold leading-none tracking-[-0.01em] [font-stretch:112%]">
              Admin
            </h1>
            <span className="hidden truncate text-[13px] text-adm-on-shell-2 sm:block">
              Classement des projets{repoCount > 0 ? ` · ${repoCount} dépôts` : ''}
            </span>
          </div>
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
          <GitHubSyncButton isSyncing={isSyncing} onSync={onSync} count={repoCount} />
          <span className="mx-1 hidden h-5 w-px bg-adm-on-shell/25 sm:block" aria-hidden />
          <span className="hidden max-w-[16ch] truncate text-[12px] text-adm-on-shell-2 lg:block" title={session.user.email ?? ''}>
            {session.user.email}
          </span>
          <Button variant="ghost-shell" size="sm" onClick={() => void signOut()}>
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}
