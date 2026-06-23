// src/components/ui/badge.tsx
// Badge compact pour langage, compteur de repos, statut.

import * as React from 'react'

import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  dot?: string  // couleur CSS du point indicateur (optionnel)
}

export function Badge({ className, dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded text-[10px] font-medium font-space leading-none',
        'px-1.5 py-0.5',
        'bg-adm-surface text-adm-ink-2 border border-adm-border',
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dot }}
        />
      )}
      {children}
    </span>
  )
}
