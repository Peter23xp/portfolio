// src/components/admin/GitHubSyncButton.tsx
// Bouton de sync GitHub — spinner inline pendant la synchronisation.

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
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('shrink-0 transition-transform', spinning && 'animate-spin')}
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
    </svg>
  )
}

export function GitHubSyncButton({ isSyncing, onSync, count }: GitHubSyncButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onSync}
      disabled={isSyncing}
      aria-label={isSyncing ? 'Synchronisation en cours' : 'Synchroniser les repos GitHub'}
    >
      <SyncIcon spinning={isSyncing} />
      {isSyncing ? 'Sync…' : (
        <span>
          Sync
          {typeof count === 'number' && (
            <span className="ml-1 tabular-nums text-adm-ink-3">({count})</span>
          )}
        </span>
      )}
    </Button>
  )
}
