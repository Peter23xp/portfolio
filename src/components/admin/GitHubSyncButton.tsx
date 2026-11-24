// src/components/admin/GitHubSyncButton.tsx
// Action principale de l'admin : synchroniser les dépôts GitHub.

import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface GitHubSyncButtonProps {
  isSyncing: boolean
  onSync: () => void
  count?: number
}

function SyncIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('shrink-0', spinning && 'motion-safe:animate-spin')}
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
    </svg>
  )
}

export function GitHubSyncButton({ isSyncing, onSync }: GitHubSyncButtonProps) {
  return (
    <Button
      variant="primary"
      size="sm"
      onClick={onSync}
      disabled={isSyncing}
      aria-live="polite"
      className="disabled:opacity-80"
    >
      <SyncIcon spinning={isSyncing} />
      {isSyncing ? 'Synchronisation…' : 'Synchroniser GitHub'}
    </Button>
  )
}
