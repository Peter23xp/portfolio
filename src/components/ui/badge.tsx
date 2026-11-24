// src/components/ui/badge.tsx
// Badge compact : langage, statut.

import * as React from 'react'

import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  dot?: string // couleur CSS du point indicateur (optionnel)
}

export function Badge({ className, dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-space text-[12px] font-medium leading-none',
        'px-2 py-1 bg-adm-surface text-adm-ink-2',
        className,
      )}
      {...props}
    >
      {dot && (
        <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
      )}
      {children}
    </span>
  )
}
