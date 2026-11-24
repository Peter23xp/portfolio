// src/components/ui/button.tsx
// Bouton admin — monde « peau à chromatophores » (DESIGN.md), version outil.
// primary = iridophore (seule couleur d'accent, réservée à l'action principale).

import * as React from 'react'

import { cn } from '../../lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'on-shell' | 'ghost-shell'
type Size = 'sm' | 'md' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-adm-iris text-adm-ink font-semibold hover:bg-adm-iris-hi active:translate-y-px',
  outline:
    'border border-adm-border-strong bg-adm-card text-adm-ink hover:border-adm-accent hover:text-adm-accent',
  ghost:
    'text-adm-ink-2 hover:text-adm-ink hover:bg-adm-surface',
  danger:
    'border border-[oklch(0.55_0.17_25)] text-[oklch(0.45_0.16_25)] hover:bg-[oklch(0.55_0.17_25_/_0.08)]',
  // sur la coque à l'encre
  'on-shell':
    'border border-adm-on-shell/40 text-adm-on-shell hover:bg-adm-on-shell hover:text-adm-shell',
  'ghost-shell':
    'text-adm-on-shell-2 hover:text-adm-on-shell hover:bg-adm-on-shell/10',
}

const SIZES: Record<Size, string> = {
  sm:   'h-8 px-3 text-[13px] gap-1.5',
  md:   'h-9 px-4 text-[14px] gap-2',
  icon: 'h-8 w-8',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'outline', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'adm-focus inline-flex items-center justify-center rounded-full font-space font-medium',
        'transition-[background-color,color,border-color,transform] duration-150',
        'disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
