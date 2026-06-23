// src/lib/utils.ts
// Helper `cn` standard shadcn/ui : fusionne les classes Tailwind sans conflit.

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Tronque une chaîne à `max` caractères avec une ellipse.
export function truncate(value: string | null | undefined, max: number): string {
  if (!value) return ''
  return value.length > max ? `${value.slice(0, max).trimEnd()}…` : value
}

// Couleurs indicatives par langage (alignées sur le portfolio public).
export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#fbbf24',
  TypeScript: '#60a5fa',
  HTML: '#fb923c',
  CSS: '#818cf8',
  Python: '#4ade80',
  Solidity: '#a78bfa',
  Java: '#fb923c',
  'C++': '#60a5fa',
  Rust: '#fb923c',
  Go: '#4ade80',
}

export function languageColor(language: string | null): string {
  if (!language) return '#94a3b8'
  return LANGUAGE_COLORS[language] ?? '#94a3b8'
}
