// src/components/ui/button.tsx
// Bouton admin — thème dark violet-tinted, style Linear.

import * as React from 'react'

import { cn } from '../../lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-adm-accent text-adm-ink hover:bg-adm-accent-bright active:opacity-90',
  outline:
    'border border-adm-border text-adm-ink-2 hover:border-adm-border-strong hover:text-adm-ink hover:bg-adm-card',
  ghost:
    'text-adm-ink-2 hover:text-adm-ink hover:bg-adm-card',
  danger:
    'border border-red-900/50 text-red-400 hover:bg-red-950/40 hover:border-red-700/60',
}

const SIZES: Record<Size, string> = {
  sm:   'h-7 px-2.5 text-xs gap-1.5',
  md:   'h-8 px-3 text-sm gap-2',
  icon: 'h-7 w-7',
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
        'adm-focus inline-flex items-center justify-center rounded-md font-space font-medium',
        'transition-colors duration-100',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
