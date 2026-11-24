import { useEffect } from 'react';

// Inclinaison 3D qui suit la souris (inspiration : posts.design, présentations
// « Center Stage » de David Haz : téléphones inclinés avec profondeur).
// `zoneRef` reçoit les mouvements, `targetRef` reçoit --rx / --ry (en degrés).
// Souris uniquement, jamais en mouvement réduit.
export function useTilt(zoneRef, targetRef, max = 7) {
  useEffect(() => {
    const zone = zoneRef.current, target = targetRef.current;
    if (!zone || !target) return undefined;
    const ok = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!ok.matches) return undefined;
    let raf = 0, nx = 0, ny = 0;
    const apply = () => {
      raf = 0;
      target.style.setProperty('--ry', `${(nx * max).toFixed(2)}deg`);
      target.style.setProperty('--rx', `${(-ny * max * 0.8).toFixed(2)}deg`);
    };
    const onMove = (e) => {
      const r = zone.getBoundingClientRect();
      nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => { nx = 0; ny = 0; if (!raf) raf = requestAnimationFrame(apply); };
    zone.addEventListener('pointermove', onMove);
    zone.addEventListener('pointerleave', onLeave);
    return () => {
      zone.removeEventListener('pointermove', onMove);
      zone.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [zoneRef, targetRef, max]);
}
