import React from 'react';

// Cadre de téléphone dessiné en CSS : un seul écran, présenté comme un objet
// (référence : posts.design, présentations d'apps mobiles de Granola et Claude).
// Le cadre se dimensionne par sa largeur (--w) ; rayon, bordure et encoche suivent.
export default function Device({ src, alt, className = '', width, eager = false }) {
  return (
    <span className={`device ${className}`} style={width ? { '--w': width } : undefined}>
      <span className="device__screen">
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      </span>
    </span>
  );
}
