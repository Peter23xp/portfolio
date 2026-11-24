import React from 'react';
import { phIcons, simpleIcons } from './icons.js';

// Icônes en SVG inline à partir des données embarquées (pas de runtime Iconify).
const ICON_SETS = { ph: phIcons, 'simple-icons': simpleIcons };

export default function Icon({ name, label }) {
  const [prefix, key] = name.split(':');
  const set = ICON_SETS[prefix];
  const icon = set?.icons[key];
  if (!icon) return null;
  const w = icon.width ?? set.width ?? 24, h = icon.height ?? set.height ?? 24;
  return (
    <svg
      className="icon"
      viewBox={`0 0 ${w} ${h}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}
