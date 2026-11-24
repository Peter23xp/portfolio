import React, { useMemo } from 'react';

// Motifs de pigment en SVG : chaque projet porte un glyphe dont la
// structure dit sa catégorie (dense = livré, anneau = hackathon/Web3,
// ondes = personnel, épars = contribution, grille lâche = dépôt).

const hash = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const rng = (seed) => {
  let s = seed || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
};

function glyphDots(kind, seed) {
  const r = rng(hash(seed));
  const dots = [];
  if (kind === 'livre') {
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 5; x++) {
        const cx = 6 + x * 9 + (y % 2) * 4.5, cy = 6 + y * 9;
        if (cx > 44) continue;
        dots.push([cx, cy, 2.6 + r() * 1.6]);
      }
  } else if (kind === 'hackathon' || kind === 'web3') {
    dots.push([24, 24, 4.2]);
    for (let ring = 1; ring <= 2; ring++) {
      const n = ring * 7, rad = ring * 10;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + r() * 0.2;
        dots.push([24 + Math.cos(a) * rad, 24 + Math.sin(a) * rad, 3.2 - ring * 0.8 + r() * 0.6]);
      }
    }
  } else if (kind === 'personnel') {
    for (let row = 0; row < 4; row++)
      for (let x = 0; x < 8; x++) {
        const cx = 4 + x * 5.7;
        const cy = 9 + row * 10 + Math.sin(x * 0.9 + row) * 3;
        dots.push([cx, cy, 1.4 + r() * 1.4]);
      }
  } else if (kind === 'contribution') {
    for (let k = 0; k < 16; k++) dots.push([4 + r() * 40, 4 + r() * 40, 1 + r() * 2.4]);
  } else {
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) dots.push([8 + x * 10.5, 8 + y * 10.5, 1 + r() * 1.5]);
  }
  return dots;
}

export function PigmentGlyph({ kind, seed }) {
  const dots = useMemo(() => glyphDots(kind, seed), [kind, seed]);
  return (
    <svg className="glyph" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {dots.map(([cx, cy, rad], i) => (
        <circle key={i} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={rad.toFixed(2)} style={{ '--i': i % 7 }} />
      ))}
    </svg>
  );
}

// Bandes de texture pour les domaines d'expertise (320 × 88).
function swatchDots(key) {
  const r = rng(hash(key));
  const dots = [];
  if (key === 'apps') {
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < 33; x++) {
        const cx = 5 + x * 10 + (y % 2) * 5, cy = 5 + y * 10;
        const v = 0.5 + 0.5 * Math.sin(x * 0.35 + Math.sin(y * 0.6) * 2);
        dots.push([cx, cy, 0.8 + v * 3.6]);
      }
  } else if (key === 'web3') {
    const centers = [[70, 44], [210, 30], [290, 70]];
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < 33; x++) {
        const cx = 5 + x * 10, cy = 5 + y * 10;
        let v = 0;
        for (const [ox, oy] of centers) v = Math.max(v, 0.5 + 0.5 * Math.cos(Math.hypot(cx - ox, cy - oy) * 0.16));
        dots.push([cx, cy, 0.6 + Math.pow(v, 2) * 4]);
      }
  } else if (key === 'erp') {
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < 33; x++) {
        const cx = 5 + x * 10, cy = 5 + y * 10;
        const v = 0.5 + 0.5 * Math.sin(cy * 0.22 + Math.sin(cx * 0.03) * 2.4);
        dots.push([cx, cy, 0.6 + Math.pow(v, 3) * 4.2]);
      }
  } else {
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < 33; x++) {
        const cx = 5 + x * 10, cy = 5 + y * 10;
        const v = 0.5 + 0.5 * Math.sin((cx * 0.7 - cy) * 0.06 + r() * 0.4);
        dots.push([cx, cy, 0.6 + Math.pow(v, 4) * 4.4]);
      }
  }
  return dots;
}

export function PigmentSwatch({ name }) {
  const dots = useMemo(() => swatchDots(name), [name]);
  return (
    <svg className="swatch" viewBox="0 0 330 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {dots.map(([cx, cy, rad], i) => (rad > 0.7 ? <circle key={i} cx={cx} cy={cy} r={rad.toFixed(2)} /> : null))}
    </svg>
  );
}
