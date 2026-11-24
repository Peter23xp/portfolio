// Lavis de pigment entre la page d'accueil et une étude de cas.
// Inspiration : posts.design — transition « dynamic color gradient wash » de
// mymind (Tobias van Schneider) : l'écran se teinte de la couleur de ce qu'on
// ouvre. Ici : un cercle de la couleur du projet, tramé de points de pigment,
// part du clic, couvre l'écran, puis se retire sur la nouvelle page.

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
let overlay = null;
let safety = 0;

// Couleur dominante (saturée) d'une image, pour teinter le lavis.
const cache = new Map();
export function projectColor(src) {
  if (!src) return Promise.resolve(null);
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 24; c.height = 48;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 24, 48);
        const d = ctx.getImageData(0, 0, 24, 48).data;
        let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) {
          const max = Math.max(d[i], d[i + 1], d[i + 2]), min = Math.min(d[i], d[i + 1], d[i + 2]);
          const sat = max ? (max - min) / max : 0;
          const weight = sat * sat * (max / 255);
          r += d[i] * weight; g += d[i + 1] * weight; b += d[i + 2] * weight; w += weight;
        }
        if (w < 1) return resolve(null);
        // assombrie pour que le texte clair reste lisible pendant le lavis
        const k = 0.62;
        resolve(`rgb(${Math.round((r / w) * k)}, ${Math.round((g / w) * k)}, ${Math.round((b / w) * k)})`);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  cache.set(src, p);
  return p;
}

// Couvre l'écran depuis (x, y), puis appelle go() pour changer de page.
export function washTo(go, { x, y, color }) {
  if (reduced() || !document.body.animate) { go(); return; }
  washOut(true);
  overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '100', pointerEvents: 'none',
    backgroundColor: color || '#4f241c',
    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.22) 0 2.4px, transparent 2.8px)',
    backgroundSize: '13px 13px',
    clipPath: `circle(0px at ${x}px ${y}px)`,
  });
  document.body.appendChild(overlay);
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
  const anim = overlay.animate(
    [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)` }],
    { duration: 560, easing: EASE, fill: 'forwards' },
  );
  anim.onfinish = () => go();
  // filet de sécurité : le lavis ne reste jamais affiché
  clearTimeout(safety);
  safety = setTimeout(() => washOut(), 2600);
}

// Sur la nouvelle page : le lavis se retire (fondu + léger zoom des points).
export function washOut(immediate = false) {
  const el = overlay;
  if (!el) return;
  overlay = null;
  clearTimeout(safety);
  if (immediate || reduced()) { el.remove(); return; }
  const anim = el.animate(
    [{ opacity: 1, backgroundSize: '13px 13px' }, { opacity: 0, backgroundSize: '26px 26px' }],
    { duration: 520, easing: EASE, fill: 'forwards' },
  );
  anim.onfinish = () => el.remove();
}

// Gestionnaire de clic pour un lien interne : lavis puis navigation SPA.
// Les clics modifiés (nouvel onglet, etc.) gardent le comportement natif.
export function washClick(navigate, to, color) {
  return (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;
    washTo(() => navigate(to), { x, y, color });
  };
}
