// src/components/admin/AdminLayout.tsx

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

import { GitHubSyncButton } from './GitHubSyncButton'
import { Button } from '../ui/button'
import { signOut, useSession } from '../../lib/auth-client'
import { cn } from '../../lib/utils'

interface AdminLayoutProps {
  children: ReactNode
  isSyncing: boolean
  onSync: () => void
  repoCount: number
}

function LoadingSkeleton() {
  return (
    <div className="admin-root flex items-center justify-center">
      <div className="h-1 w-24 rounded-full bg-adm-border animate-pulse" />
    </div>
  )
}

export function AdminLayout({ children, isSyncing, onSync, repoCount }: AdminLayoutProps) {
  const { data: session, isPending } = useSession()

  if (isPending) return <LoadingSkeleton />
  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="admin-root">
      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast: 'bg-adm-card border-adm-border text-adm-ink font-space text-[13px]',
            description: 'text-adm-ink-2',
            actionButton: 'bg-adm-accent text-adm-ink',
          },
        }}
        position="bottom-right"
        richColors
      />

      <header
        className={cn(
          'sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-4 px-4',
          'border-b border-adm-border bg-adm-bg/95 backdrop-blur-md',
        )}
      >
        {/* ── Branding ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-adm-accent text-[11px] font-bold text-white tracking-tight"
            aria-hidden
          >
            PA
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-oswald text-[14px] font-semibold tracking-tight text-adm-ink leading-none">
              Admin
            </span>
            <span className="text-adm-border-strong text-[13px] leading-none">/</span>
            <span className="hidden sm:block text-[12px] text-adm-ink-3 leading-none truncate">
              Portfolio
            </span>
          </div>
          {repoCount > 0 && (
            <span className="hidden sm:inline-flex items-center rounded-full border border-adm-border bg-adm-surface px-2 py-0.5 text-[10px] tabular-nums text-adm-ink-3 leading-none">
              {repoCount}
            </span>
          )}
        </div>

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5">
          <GitHubSyncButton isSyncing={isSyncing} onSync={onSync} count={repoCount} />
          <div className="mx-1 h-4 w-px bg-adm-border" aria-hidden />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void signOut()}
            className="text-adm-ink-3 hover:text-adm-ink"
          >
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
