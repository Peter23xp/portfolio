import React, { useState } from 'react';

// Cadres des captures d'écran.
//  - Device  : téléphone (captures mobiles, portrait)
//  - Browser : fenêtre de navigateur (captures d'ordinateur, paysage)
//  - Screen  : choisit le bon cadre selon shot.kind ('mobile' | 'desktop') ;
//              sans kind (anciennes captures), il le déduit des proportions
//              de l'image une fois chargée.
// Référence : posts.design — un écran présenté comme un objet (Granola, Claude).

export default function Device({ src, alt, className = '', width, eager = false, onLoad }) {
  return (
    <span className={`device ${className}`} style={width ? { '--w': width } : undefined}>
      <span className="device__screen">
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={onLoad} />
      </span>
    </span>
  );
}

export function Browser({ src, alt, className = '', host, eager = false, onLoad }) {
  return (
    <span className={`browser ${className}`}>
      <span className="browser__bar" aria-hidden="true">
        <span className="browser__dots"><i /><i /><i /></span>
        {host && <span className="browser__url">{host}</span>}
      </span>
      <span className="browser__screen">
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={onLoad} />
      </span>
    </span>
  );
}

/** Type d'une capture : celui enregistré, sinon celui déduit à l'affichage. */
export const shotKind = (shot, detected) => shot?.kind || detected || 'mobile';

export function Screen({ shot, alt, className = '', host, eager = false, onKind }) {
  const [detected, setDetected] = useState(null);
  const kind = shotKind(shot, detected);
  const handleLoad = (e) => {
    if (shot.kind) return;
    const img = e.currentTarget;
    const k = img.naturalWidth > img.naturalHeight * 1.05 ? 'desktop' : 'mobile';
    if (k !== detected) {
      setDetected(k);
      onKind?.(k);
    }
  };
  return kind === 'desktop'
    ? <Browser src={shot.url} alt={alt} className={className} host={host} eager={eager} onLoad={handleLoad} />
    : <Device src={shot.url} alt={alt} className={className} eager={eager} onLoad={handleLoad} />;
}

/**
 * Type de chaque capture (mobile / desktop) : celui enregistré, sinon déduit
 * en préchargeant l'image (proportions). Renvoie kindOf(shot).
 */
export function useShotKinds(shots) {
  const [detected, setDetected] = useState({});
  React.useEffect(() => {
    let alive = true;
    (shots || []).forEach((s) => {
      if (!s?.url || s.kind || detected[s.url]) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (!alive) return;
        const k = img.naturalWidth > img.naturalHeight * 1.05 ? 'desktop' : 'mobile';
        setDetected((prev) => (prev[s.url] ? prev : { ...prev, [s.url]: k }));
      };
      img.src = s.url;
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shots]);
  return (shot) => shotKind(shot, detected[shot?.url]);
}

/** Domaine affiché dans la barre d'adresse du cadre navigateur. */
export const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
};
