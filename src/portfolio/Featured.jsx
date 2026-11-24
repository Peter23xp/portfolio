import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';

import Icon from './Icon.jsx';
import { useShotKinds } from './Device.jsx';
import ShotStage from './ShotStage.jsx';
import { PigmentGlyph } from './Pigment.jsx';
import { pick } from '../lib/content.js';
import { projectColor, washClick } from './wash.js';
import { useTilt } from './tilt.js';

// Bloc « projets phares » : un ou plusieurs projets vitrine (choisis dans
// l'admin), présentés un à la fois. Le changement de projet passe par une
// View Transition (le pigment de l'ancienne cellule cède la place à la nouvelle).

const swap = (fn) => {
  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { fn(); return; }
  document.startViewTransition(() => flushSync(fn));
};

export default function Featured({ projects, lang, t }) {
  const [idx, setIdx] = useState(0);
  const [colors, setColors] = useState({});
  const navigate = useNavigate();
  const zoneRef = useRef(null);
  // l'inclinaison s'applique au bloc : la scène (recréée à chaque projet) en hérite
  useTilt(zoneRef, zoneRef, 6);
  const count = projects.length;
  const current = projects[Math.min(idx, Math.max(0, count - 1))];
  const kindOf = useShotKinds(current?.screenshots);
  // couleur de chaque projet, prise sur sa première capture (ou son icône)
  useEffect(() => {
    projects.forEach((proj) => {
      const src = proj.screenshots?.[0]?.url || proj.icon_url;
      projectColor(src).then((c) => c && setColors((prev) => (prev[proj.slug] ? prev : { ...prev, [proj.slug]: c })));
    });
  }, [projects]);
  useEffect(() => { if (idx >= count) setIdx(0); }, [count, idx]);
  if (!count) return null;
  const p = projects[Math.min(idx, count - 1)];
  const go = (n) => swap(() => setIdx((n + count) % count));
  const shots = p.screenshots || [];

  return (
    <div className="featured" ref={zoneRef}>
      {count > 1 && (
        <div className="featured__nav">
          <div className="featured__tabs" role="tablist" aria-label={t.work.featuredLabel}>
            {projects.map((proj, i) => (
              <button
                key={proj.slug}
                type="button"
                role="tab"
                id={`feat-tab-${proj.slug}`}
                aria-selected={i === idx}
                aria-controls="feat-panel"
                className="featured__tab"
                onClick={() => go(i)}
              >
                {proj.name}
              </button>
            ))}
          </div>
          <div className="featured__arrows">
            <button type="button" className="round-btn" onClick={() => go(idx - 1)} aria-label={t.work.prevProject}>
              <Icon name="ph:caret-left-bold" />
            </button>
            <span className="featured__count" aria-hidden="true">{idx + 1} / {count}</span>
            <button type="button" className="round-btn" onClick={() => go(idx + 1)} aria-label={t.work.nextProject}>
              <Icon name="ph:caret-right-bold" />
            </button>
          </div>
        </div>
      )}

      <article
        className="feature"
        id="feat-panel"
        role={count > 1 ? 'tabpanel' : undefined}
        aria-labelledby={count > 1 ? `feat-tab-${p.slug}` : 'feat-title'}
        key={p.slug}
      >
        <div className="feature__text">
          <div className="feature__id">
            {p.icon_url
              ? <img src={p.icon_url} width="56" height="56" alt="" className="feature__icon" />
              : <span className="feature__glyph"><PigmentGlyph kind="livre" seed={p.slug} /></span>}
            <h3 id="feat-title" className="feature__name">{p.name}</h3>
          </div>
          {pick(p, 'tagline', lang) && <p className="feature__tagline">{pick(p, 'tagline', lang)}</p>}
          {pick(p, 'body', lang) && <p className="feature__body">{pick(p, 'body', lang)}</p>}
          <dl className="facts">
            {p.platforms && <div><dt>{t.work.platformsLabel}</dt><dd>{p.platforms}</dd></div>}
            {p.stack?.length > 0 && <div><dt>Stack</dt><dd>{p.stack.join(' · ')}</dd></div>}
          </dl>
          <div className="feature__links">
            {p.ios_url && <a className="pill" href={p.ios_url} target="_blank" rel="noopener noreferrer"><Icon name="simple-icons:apple" /> App Store</a>}
            {p.android_url && <a className="pill" href={p.android_url} target="_blank" rel="noopener noreferrer"><Icon name="simple-icons:googleplay" /> Google Play</a>}
            {p.site_url && <a className="pill" href={p.site_url} target="_blank" rel="noopener noreferrer">{t.work.site} <Icon name="ph:arrow-up-right-bold" /></a>}
            <Link className="link-action" to={`/projets/${p.slug}`} onClick={washClick(navigate, `/projets/${p.slug}`, colors[p.slug])}>
              {t.work.caseStudy}<span className="sr-only"> — {p.name}</span> <Icon name="ph:arrow-right-bold" />
            </Link>
          </div>
        </div>

        <figure className="feature__shots">
          {shots.length > 0 ? (
            <ShotStage shots={shots} kindOf={kindOf} name={p.name} lang={lang} siteUrl={p.site_url} />
          ) : (
            <div className="stage stage--empty" aria-hidden="true">
              <PigmentGlyph kind="livre" seed={p.slug + '-big'} />
            </div>
          )}
          {shots.length > 0 && <figcaption className="caption">{t.work.shotsCaption}</figcaption>}
        </figure>
      </article>
    </div>
  );
}
