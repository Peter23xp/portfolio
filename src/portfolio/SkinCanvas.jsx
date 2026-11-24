import React, { useEffect, useRef } from 'react';

// Peau à chromatophores.
// - Le portrait est une trame de pigment : quatre encres du monde seulement
//   (crête, pigment profond, pigment clair, manteau), et c'est la TAILLE des
//   points qui porte l'image. La couleur réelle de la photo n'apparaît que là
//   où le pigment se dilate (pointeur, onde) — la peau « montre » alors l'image.
// - Le champ autour est un motif vivant qui change avec le contexte du
//   visiteur : taches (neutre) → bandes (recrute) → anneaux (projet).
// - Toutes les cellules sont en maillage hexagonal légèrement irrégulier, pas
//   en grille orthogonale : on lit une peau, pas un mur de LED.
//
// Le <img> placé dessous reste le contenu de repli (sans JS, avant le premier
// dessin) ; le canvas est décoratif (aria-hidden).

// Portrait détouré (alpha), dérivé de peter.jpeg. Deux cadrages : en pied
// (desktop) et buste seul (mobile, la bande n'en montre que le haut). AVIF en
// priorité, WebP en repli.
const PHOTO_SRC = {
  full: { avif: '/portrait/peter-full.avif', webp: '/portrait/peter-full.webp', frac: 1 },
  bust: { avif: '/portrait/peter-bust.avif', webp: '/portrait/peter-bust.webp', frac: 0.62 },
};
const PHOTO_RATIO = 756 / 1198; // proportions du portrait entier
const HEX = Math.sqrt(3) / 2;

// Encres du monde (sRGB, dérivées des tokens OKLCH de portfolio.css)
const INK = '#7a3a2e';
const TONES = ['#2b1e1a', '#4f241c', '#b0634a', '#f6e4df']; // crête, pigment profond, pigment clair, manteau
const FIELD_LIGHT = '#b0634a';
const FIELD_DEEP = '#4f241c';

const MODE_INDEX = { neutral: 0, recruit: 1, client: 2 };
const LENS_MAX = 130; // rayon max de la loupe (px CSS)

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// t borné : l'horodatage rAF peut précéder légèrement introStart
const easeOutExpo = (t) => (t >= 1 ? 1 : t <= 0 ? 0 : 1 - Math.pow(2, -10 * t));
// bruit déterministe par cellule (jitter, irrégularité de taille)
const noise = (i, j, k = 0) => {
  let h = (i * 374761393 + j * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

export default function SkinCanvas({ mode, pulse, onReady }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ mode, weights: [1, 0, 0], ripples: [] });

  useEffect(() => {
    stateRef.current.mode = mode;
    stateRef.current.wake?.();
  }, [mode]);

  useEffect(() => {
    if (!pulse) return;
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    s.ripples.push({ x: pulse.x - rect.left, y: pulse.y - rect.top, t0: performance.now() });
    if (s.ripples.length > 3) s.ripples.shift();
    s.wake?.();
  }, [pulse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const s = stateRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const lowPower =
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      navigator.connection?.saveData;

    let img = null;
    let imgKind = null;   // 'full' | 'bust'
    let imgFrac = 1;      // part de la hauteur du portrait couverte par l'image chargée
    // écran tactile : pas de curseur pour révéler la photo → la trame se
    // « développe » en photo nette au chargement (les chromatophores se rétractent)
    const touch = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let W = 0, H = 0, dpr = 1, desktop = true;
    // champ
    let cell = 10, fcols = 0, frows = 0, fieldPts = null; // [x, y, tailleJitter] par cellule
    // portrait
    let photo = { x: 0, y: 0, w: 0, h: 0, fx: 0, fy: 0 };
    let pcell = 5, pcols = 0, prows = 0;
    let pts = null;      // [x, y] par cellule du portrait
    let figure = null;   // 1 = cellule de la silhouette (masque alpha du détourage)
    let halo = null;     // 1 = proche de la silhouette (le champ s'y tait)
    let lum = null;      // luminance 0..1 (lissée, étirée)
    let tone = null;     // encre par cellule
    let restR = null;    // rayon au repos par cellule
    let face = null;     // 1 = visage (tonalité dédiée)
    let fade = null;     // dissolution verticale (bas de bande, mobile)
    let cutoutLayer = null; // photo nette détourée, révélée par la loupe
    let lens = null, lensCtx = null;
    let photoLayer = null;
    let raf = 0, running = false, visible = true, readySent = false;
    // en dev, StrictMode monte l’effet deux fois : une instance nettoyée ne doit
    // jamais relancer sa boucle (sinon elle redessine par-dessus la vivante)
    let disposed = false;
    let introStart = 0, lastFrame = 0, idleUntil = 0;
    let pointer = null;

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      desktop = W >= 768;

      // champ : maillage hexagonal irrégulier
      cell = desktop ? (lowPower ? 12 : 10) : (lowPower ? 10 : 9);
      const rowH = cell * HEX;
      fcols = Math.ceil(W / cell) + 2;
      frows = Math.ceil(H / rowH) + 2;
      fieldPts = new Float32Array(fcols * frows * 3);
      for (let j = 0; j < frows; j++)
        for (let i = 0; i < fcols; i++) {
          const k = (j * fcols + i) * 3;
          fieldPts[k] = (i + (j % 2) * 0.5) * cell + (noise(i, j, 1) - 0.5) * cell * 0.35;
          fieldPts[k + 1] = j * rowH + (noise(i, j, 2) - 0.5) * cell * 0.35;
          fieldPts[k + 2] = 0.7 + noise(i, j, 3) * 0.6;
        }

      // portrait : desktop en pied à droite ; mobile en buste dans la bande
      const ph = desktop ? H * 0.96 : H * 1.6;
      const pw = ph * PHOTO_RATIO;
      const px = desktop ? W - pw - Math.max(W * 0.05, 24) : (W - pw) / 2;
      const py = desktop ? H - ph : H * 0.05;
      photo = { x: px, y: py, w: pw, h: ph, fx: px + pw * 0.47, fy: py + ph * 0.25 };
      pcell = desktop ? (lowPower ? 5 : 4) : (lowPower ? 4.5 : 3.6);
      pcols = Math.ceil(pw / pcell) + 1;
      prows = Math.ceil(ph / (pcell * HEX)) + 1;
      sample();
      buildPhotoLayer();
    };

    const sample = () => {
      const n = pcols * prows;
      pts = new Float32Array(n * 2);
      figure = new Uint8Array(n);
      lum = new Float32Array(n);
      fade = new Float32Array(n);
      if (!img || !n) return;
      const off = document.createElement('canvas');
      off.width = pcols;
      off.height = prows;
      const octx = off.getContext('2d', { willReadFrequently: true });
      octx.drawImage(img, 0, 0, pcols, Math.round(prows * imgFrac));
      const data = octx.getImageData(0, 0, pcols, prows).data;
      const raw = new Uint8Array(n);
      for (let j = 0; j < prows; j++)
        for (let i = 0; i < pcols; i++) {
          const idx = j * pcols + i;
          const r = data[idx * 4], g = data[idx * 4 + 1], b = data[idx * 4 + 2];
          const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          // silhouette : alpha du détourage (fait une fois, hors navigateur)
          raw[idx] = data[idx * 4 + 3] > 140 ? 1 : 0;
          lum[idx] = l;
          pts[idx * 2] = photo.x + (i + (j % 2) * 0.5) * pcell + (noise(i, j, 4) - 0.5) * pcell * 0.25;
          pts[idx * 2 + 1] = photo.y + j * pcell * HEX + (noise(i, j, 5) - 0.5) * pcell * 0.25;
          const y = pts[idx * 2 + 1];
          fade[idx] = desktop ? 1 : 1 - smooth(H * 0.62, H * 0.98, y);
        }
      figure = raw;
      // visage : ellipse en fractions de la photo (centre 0.48 / 0.27)
      face = new Uint8Array(n);
      for (let j = 0; j < prows; j++)
        for (let i = 0; i < pcols; i++) {
          const fx = (i / pcols - 0.48) / 0.13, fy = (j / prows - 0.27) / 0.085;
          if (fx * fx + fy * fy <= 1) face[j * pcols + i] = 1;
        }
      // luminance lissée (3×3) hors visage : plus de mouchetures isolées ;
      // le visage garde son détail (yeux, sourire)
      const blurred = new Float32Array(n);
      for (let j = 0; j < prows; j++)
        for (let i = 0; i < pcols; i++) {
          let sum = 0, cnt = 0;
          for (let dj = -1; dj <= 1; dj++)
            for (let di = -1; di <= 1; di++) {
              const jj = j + dj, ii = i + di;
              if (jj < 0 || ii < 0 || jj >= prows || ii >= pcols) continue;
              const k = jj * pcols + ii;
              if (!raw[k]) continue;
              sum += lum[k]; cnt++;
            }
          const at = j * pcols + i;
          blurred[at] = face[at] || !cnt ? lum[at] : sum / cnt;
        }
      lum = blurred;
      // étirement séparé : le visage d'un côté, le reste de la silhouette de l'autre
      const stretch = (pick) => {
        const vals = [];
        for (let idx = 0; idx < n; idx++) if (figure[idx] && pick(idx)) vals.push(lum[idx]);
        if (vals.length < 20) return;
        vals.sort((a, b) => a - b);
        const lo = vals[Math.floor(vals.length * 0.04)], hi = vals[Math.floor(vals.length * 0.96)];
        for (let idx = 0; idx < n; idx++)
          if (pick(idx)) lum[idx] = Math.min(1, Math.max(0, (lum[idx] - lo) / Math.max(0.05, hi - lo)));
      };
      stretch((idx) => face[idx]);
      stretch((idx) => !face[idx]);
      // encre et rayon au repos, une fois pour toutes
      tone = new Uint8Array(n);
      restR = new Float32Array(n);
      for (let idx = 0; idx < n; idx++) {
        const l = lum[idx];
        if (face[idx]) {
          // visage : jamais de manteau. Ombres en crête, lumières (dents,
          // blanc des yeux, pommettes) en pigment clair, tons moyens contractés.
          if (l < 0.38) { tone[idx] = 0; restR[idx] = pcell * 0.5 * (0.55 + 0.9 * (0.38 - l) / 0.38); }
          else if (l > 0.62) { tone[idx] = 2; restR[idx] = pcell * 0.5 * (0.55 + 0.9 * (l - 0.62) / 0.38); }
          else { tone[idx] = 1; restR[idx] = pcell * 0.5 * 0.42; }
          restR[idx] *= fade[idx];
        } else {
          tone[idx] = l < 0.26 ? 0 : l < 0.5 ? 1 : l < 0.8 ? 2 : 3;
          const density = 0.42 + 0.58 * Math.min(1, Math.abs(l - 0.5) * 2.1);
          restR[idx] = pcell * 0.5 * (0.2 + 1.05 * density) * fade[idx];
        }
      }
      // halo : silhouette dilatée (~22 px)
      halo = new Uint8Array(n);
      const reach = Math.ceil(22 / pcell);
      for (let j = 0; j < prows; j++)
        for (let i = 0; i < pcols; i++) {
          if (!figure[j * pcols + i]) continue;
          for (let dj = -reach; dj <= reach; dj += 2)
            for (let di = -reach; di <= reach; di += 2) {
              const jj = j + dj, ii = i + di;
              if (jj >= 0 && ii >= 0 && jj < prows && ii < pcols) halo[jj * pcols + ii] = 1;
            }
        }
    };

    const buildPhotoLayer = () => {
      if (!img || !figure) { photoLayer = null; return; }
      photoLayer = document.createElement('canvas');
      photoLayer.width = canvas.width;
      photoLayer.height = canvas.height;
      const c = photoLayer.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const paths = TONES.map(() => new Path2D());
      for (let idx = 0; idx < figure.length; idx++) {
        if (!figure[idx]) continue;
        const rad = restR[idx];
        if (rad < 0.3) continue;
        const x = pts[idx * 2], y = pts[idx * 2 + 1];
        const p = paths[tone[idx]];
        p.moveTo(x + rad, y);
        p.arc(x, y, rad, 0, Math.PI * 2);
      }
      paths.forEach((p, k) => { c.fillStyle = TONES[k]; c.fill(p); });

      // couche photo nette (résolution écran) pour la loupe ; sur mobile elle
      // se dissout au bas de la bande comme la trame.
      cutoutLayer = document.createElement('canvas');
      cutoutLayer.width = canvas.width;
      cutoutLayer.height = canvas.height;
      const cc = cutoutLayer.getContext('2d');
      cc.setTransform(dpr, 0, 0, dpr, 0, 0);
      cc.imageSmoothingQuality = 'high';
      cc.drawImage(img, photo.x, photo.y, photo.w, photo.h * imgFrac);
      if (!desktop) {
        const g = cc.createLinearGradient(0, H * 0.62, 0, H * 0.98);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        cc.globalCompositeOperation = 'destination-in';
        cc.fillStyle = g;
        cc.fillRect(0, 0, W, H);
        cc.globalCompositeOperation = 'source-over';
      }
      const L = Math.ceil(LENS_MAX * 2 * dpr) + 4;
      lens = document.createElement('canvas');
      lens.width = L;
      lens.height = L;
      lensCtx = lens.getContext('2d');
    };

    // 0 = hors portrait, 1 = halo, 2 = silhouette
    const figureAt = (x, y) => {
      if (!figure || !halo || x < photo.x || y < photo.y || x >= photo.x + photo.w || y >= photo.y + photo.h) return 0;
      const j = Math.round((y - photo.y) / (pcell * HEX));
      const i = Math.round((x - photo.x) / pcell - (j % 2) * 0.5);
      if (i < 0 || j < 0 || i >= pcols || j >= prows) return 0;
      const idx = j * pcols + i;
      if (figure[idx] && fade[idx] > 0.35) return 2;
      return halo[idx] ? 1 : 0;
    };

    const draw = (now) => {
      const still = reduceMotion.matches;
      const t = still ? 0 : now;
      const intro = still ? 1 : easeOutExpo(Math.min(1, (now - introStart) / 1500));

      const target = [0, 0, 0];
      target[MODE_INDEX[s.mode] ?? 0] = 1;
      let settling = false;
      for (let k = 0; k < 3; k++) {
        const d = target[k] - s.weights[k];
        s.weights[k] = still ? target[k] : s.weights[k] + d * 0.06;
        if (Math.abs(d) > 0.002) settling = true;
      }
      const [w0, w1, w2] = s.weights;
      s.ripples = s.ripples.filter((r) => now - r.t0 < 2200);

      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, W, H);

      const R = desktop ? 130 : 90;
      const R2 = 2 * R * R;
      const half = cell / 2;
      const light = new Path2D();
      const deep = new Path2D();

      for (let j = 0; j < frows; j++)
        for (let i = 0; i < fcols; i++) {
          const k = (j * fcols + i) * 3;
          const cx = fieldPts[k], cy = fieldPts[k + 1];
          const fig = figureAt(cx, cy);
          if (fig === 2) continue;

          let expand = 0;
          if (pointer) {
            const dx = cx - pointer.x, dy = cy - pointer.y;
            expand += Math.exp(-(dx * dx + dy * dy) / R2) * pointer.strength;
          }
          for (const r of s.ripples) {
            const age = now - r.t0;
            const d = Math.hypot(cx - r.x, cy - r.y) - age * 0.85;
            expand += Math.exp(-(d * d) / 1800) * (1 - age / 2200) * 0.9;
          }

          const spots =
            0.5 + 0.5 * Math.sin(cx * 0.017 + t * 0.00035 + Math.sin(cy * 0.021 + t * 0.0002) * 1.6) *
              Math.cos(cy * 0.016 - t * 0.00028 + Math.sin(cx * 0.011) * 1.2);
          const bands = 0.5 + 0.5 * Math.sin((cx * 0.55 + cy) * 0.028 - t * 0.0011);
          const ring = 0.5 + 0.5 * Math.sin(Math.hypot(cx - photo.fx, cy - photo.fy) * 0.042 - t * 0.0015);
          const p = spots * w0 + bands * w1 + ring * w2;

          const quiet = (desktop ? 0.12 + 0.88 * smooth(W * 0.36, W * 0.6, cx) : 1) * (fig === 1 ? 0.18 : 1);
          const amt = Math.pow(p, 1.6) * quiet + expand * 0.75;
          const rad = half * Math.min(1.15, (0.06 + 0.8 * amt) * fieldPts[k + 2]) * intro;
          if (rad < 0.45) continue;
          const path = p > 0.62 ? light : deep;
          path.moveTo(cx + rad, cy);
          path.arc(cx, cy, rad, 0, Math.PI * 2);
        }
      ctx.fillStyle = FIELD_DEEP;
      ctx.fill(deep);
      ctx.fillStyle = FIELD_LIGHT;
      ctx.fill(light);

      if (photoLayer && touch && cutoutLayer) {
        // tactile : la trame se dissout en photo nette (~1,3 s), puis reste nette
        const develop = still ? 1 : smooth(0, 1, (now - introStart - 350) / 1300);
        if (develop > 0) {
          ctx.globalAlpha = develop;
          ctx.drawImage(cutoutLayer, 0, 0, W, H);
          ctx.globalAlpha = 1;
        }
        if (develop < 1) {
          ctx.save();
          ctx.globalAlpha = 1 - develop;
          if (intro < 1) {
            ctx.beginPath();
            ctx.arc(photo.fx, photo.fy, intro * Math.hypot(photo.w, photo.h), 0, Math.PI * 2);
            ctx.clip();
          }
          ctx.drawImage(photoLayer, 0, 0, W, H);
          ctx.restore();
        }
      } else if (photoLayer) {
        const lensR = pointer ? (desktop ? 120 : 84) * Math.min(1, pointer.strength) : 0;
        const lensOn = lensR > 6 && !!cutoutLayer;

        if (intro < 1) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(photo.fx, photo.fy, intro * Math.hypot(photo.w, photo.h), 0, Math.PI * 2);
          ctx.clip();
        }
        if (lensOn) {
          // la trame partout, sauf dans la loupe
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, W, H);
          ctx.arc(pointer.x, pointer.y, lensR, 0, Math.PI * 2);
          ctx.clip('evenodd');
          ctx.drawImage(photoLayer, 0, 0, W, H);
          ctx.restore();

          // la loupe : la vraie photo, nette, détourée, à bord doux
          const D = lensR * 2;
          const sd = D * dpr;
          lensCtx.setTransform(1, 0, 0, 1, 0, 0);
          lensCtx.globalCompositeOperation = 'source-over';
          lensCtx.clearRect(0, 0, lens.width, lens.height);
          lensCtx.drawImage(cutoutLayer, (pointer.x - lensR) * dpr, (pointer.y - lensR) * dpr, sd, sd, 0, 0, sd, sd);
          lensCtx.globalCompositeOperation = 'destination-in';
          const g = lensCtx.createRadialGradient(sd / 2, sd / 2, sd * 0.28, sd / 2, sd / 2, sd / 2);
          g.addColorStop(0, 'rgba(0,0,0,1)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          lensCtx.fillStyle = g;
          lensCtx.fillRect(0, 0, sd, sd);
          ctx.drawImage(lens, 0, 0, sd, sd, pointer.x - lensR, pointer.y - lensR, D, D);

          // dans la loupe, le pigment se contracte vers le centre (les
          // chromatophores se ferment) : pleine taille au bord, nul au centre
          const rowH = pcell * HEX;
          const jStart = Math.max(0, Math.floor((pointer.y - lensR - photo.y) / rowH));
          const jEnd = Math.min(prows, Math.ceil((pointer.y + lensR - photo.y) / rowH) + 1);
          const iStart = Math.max(0, Math.floor((pointer.x - lensR - photo.x) / pcell) - 1);
          const iEnd = Math.min(pcols, Math.ceil((pointer.x + lensR - photo.x) / pcell) + 1);
          for (let j = jStart; j < jEnd; j++)
            for (let i = iStart; i < iEnd; i++) {
              const idx = j * pcols + i;
              if (!figure[idx]) continue;
              const x = pts[idx * 2], y = pts[idx * 2 + 1];
              const d = Math.hypot(x - pointer.x, y - pointer.y);
              if (d > lensR) continue;
              const rad = restR[idx] * smooth(lensR * 0.45, lensR, d);
              if (rad < 0.3) continue;
              ctx.fillStyle = TONES[tone[idx]];
              ctx.beginPath();
              ctx.arc(x, y, rad, 0, Math.PI * 2);
              ctx.fill();
            }
        } else {
          ctx.drawImage(photoLayer, 0, 0, W, H);
        }
        if (intro < 1) ctx.restore();
      }

      // ondes (changement de contexte, toucher) : le pigment se dilate au
      // passage. Sur la photo nette (tactile), les points n'existent que dans l'onde.
      if (photoLayer && s.ripples.length) {
        const overClear = touch && !!cutoutLayer;
        for (let idx = 0; idx < figure.length; idx++) {
          if (!figure[idx]) continue;
          const x = pts[idx * 2], y = pts[idx * 2 + 1];
          let expand = 0;
          for (const r of s.ripples) {
            const age = now - r.t0;
            const d = Math.hypot(x - r.x, y - r.y) - age * 0.85;
            expand += Math.exp(-(d * d) / 1800) * (1 - age / 2200) * 0.9;
          }
          if (expand < 0.05) continue;
          const e = Math.min(1, expand);
          const rad = (overClear ? 0 : restR[idx] * (1 - e)) + pcell * 0.72 * e * fade[idx];
          if (rad < 0.3) continue;
          ctx.fillStyle = TONES[tone[idx]];
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!readySent && img) {
        readySent = true;
        onReady?.();
      }
      if (pointer && pointer.fading) {
        pointer.strength *= 0.9;
        if (pointer.strength < 0.02) pointer = null;
      }
      return settling || s.ripples.length > 0 || !!pointer || now - introStart < (touch ? 2100 : 1600);
    };

    const loop = (now) => {
      raf = 0;
      if (!running) return;
      // actif (pointeur, onde, transition) : pleine cadence ; au repos le
      // champ dérive lentement à cadence réduite.
      const active = now < idleUntil;
      const interval = active ? (lowPower ? 33 : 16) : (lowPower ? 90 : 50);
      if (now - lastFrame >= interval - 1) {
        lastFrame = now;
        if (draw(now)) idleUntil = now + 400;
      }
      if (reduceMotion.matches && !active) { running = false; return; }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (disposed || !visible || document.hidden || running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
    s.wake = () => {
      if (reduceMotion.matches) { draw(performance.now()); return; }
      idleUntil = performance.now() + 400;
      start();
    };

    const host = canvas.parentElement;
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top, strength: 1, fading: false };
      s.wake();
    };
    const onLeave = () => { if (pointer) pointer.fading = true; s.wake(); };
    const onDown = (e) => {
      if (e.pointerType === 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      s.ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t0: performance.now() });
      s.wake();
    };
    if (!reduceMotion.matches) {
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);
      host.addEventListener('pointerdown', onDown);
    }

    const ro = new ResizeObserver(() => { layout(); loadPhoto(); if (reduceMotion.matches) draw(performance.now()); else s.wake(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start(); else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);

    // charge le cadrage adapté (buste < 768 px, en pied au-delà), AVIF puis WebP
    const loadPhoto = () => {
      const kind = canvas.getBoundingClientRect().width >= 768 ? 'full' : 'bust';
      if (kind === imgKind) return;
      imgKind = kind;
      const src = PHOTO_SRC[kind];
      const tryLoad = (url, fallback) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => {
          if (disposed || imgKind !== kind) return;
          img = im;
          imgFrac = src.frac;
          layout();
          introStart = performance.now();
          if (reduceMotion.matches) draw(introStart);
          else { idleUntil = introStart + (touch ? 2100 : 1600); start(); }
        };
        im.onerror = () => { if (fallback && !disposed) tryLoad(fallback, null); };
        im.src = url;
      };
      tryLoad(src.avif, src.webp);
    };
    layout();
    loadPhoto();

    return () => {
      disposed = true;
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerdown', onDown);
      s.wake = null;
    };
  }, [onReady]);

  return <canvas ref={canvasRef} className="skin-canvas" aria-hidden="true" />;
}
