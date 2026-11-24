// src/components/admin/CategoryGlyph.tsx
// Glyphe de pigment par catégorie — le même vocabulaire que les projets du
// site public (src/portfolio/Pigment.jsx) : la structure des points dit la
// catégorie. Au survol de dépôt (`active`), le pigment se dilate.

import { useMemo } from 'react'

import { cn } from '../../lib/utils'
import type { ProjectCategory } from '../../types/portfolio'

type Dot = [number, number, number]

function dots(category: ProjectCategory): Dot[] {
  const out: Dot[] = []
  switch (category) {
    case 'livre': // dense : livré
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) out.push([4 + x * 6.4 + (y % 2) * 3.2, 4 + y * 5.6, 2.3])
      break
    case 'hackathon': // anneau : hackathon & Web3
      out.push([12, 12, 3])
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2
        out.push([12 + Math.cos(a) * 8, 12 + Math.sin(a) * 8, 1.9])
      }
      break
    case 'personnel': // ondes
      for (let row = 0; row < 3; row++)
        for (let x = 0; x < 6; x++) out.push([2.5 + x * 3.8, 6 + row * 6 + Math.sin(x * 0.9 + row) * 2, 1.6])
      break
    case 'contribution': // épars
      ;[[4, 5, 1.8], [12, 3, 1.2], [19, 7, 2.1], [7, 13, 1.4], [15, 12, 2.2], [21, 17, 1.3], [4, 20, 1.6], [12, 20, 1.1]].forEach((d) =>
        out.push(d as Dot),
      )
      break
    case 'cache': // pigment contracté : masqué du site
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) out.push([4.5 + x * 5, 4.5 + y * 5, 0.8])
      break
    default: // non classé : grille lâche
      for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) out.push([5 + x * 7, 5 + y * 7, 1.4])
  }
  return out
}

export function CategoryGlyph({
  category,
  active = false,
  className,
}: {
  category: ProjectCategory
  active?: boolean
  className?: string
}) {
  const list = useMemo(() => dots(category), [category])
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={cn('h-6 w-6 shrink-0 overflow-visible', active ? 'fill-adm-accent' : 'fill-adm-ink-2', className)}
    >
      {list.map(([cx, cy, r], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          className="adm-glyph-dot"
          style={{ transform: active ? 'scale(1.45)' : undefined, transitionDelay: `${(i % 6) * 15}ms` }}
        />
      ))}
    </svg>
  )
}
