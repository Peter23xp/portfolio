import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Icon from './Icon.jsx';
import { PigmentGlyph } from './Pigment.jsx';
import { DEFAULT_CONTENT, fetchContent, pick } from '../lib/content.js';
import { translations } from '../i18n.js';
import './portfolio.css';

// Étude de cas d'un projet vitrine (contenu géré dans l'admin).
// Signature : la galerie d'écrans défile à l'horizontale pendant qu'on fait
// défiler la page (section épinglée) sur grand écran ; rail glissable au doigt
// sur mobile et en mouvement réduit.

function useLang() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'fr' || saved === 'en') return saved;
    return /^en/i.test(navigator.language) ? 'en' : 'fr';
  });
  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);
  return [lang, setLang];
}

// Galerie épinglée : progression du défilement vertical → translation horizontale.
function ScreensRail({ shots, name, lang, t }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
    const update = () => setPinned(mq.matches && shots.length > 2);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [shots.length]);

  useEffect(() => {
    if (!pinned) return undefined;
    const section = sectionRef.current, track = trackRef.current;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const travel = section.offsetHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, travel)));
      const max = track.scrollWidth - track.parentElement.clientWidth;
      track.style.transform = `translate3d(${-progress * max}px, 0, 0)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      track.style.transform = '';
    };
  }, [pinned]);

  return (
    <section
      ref={sectionRef}
      className={`rail ${pinned ? 'rail--pinned' : ''}`}
      style={pinned ? { height: `${100 + shots.length * 38}vh` } : undefined}
      aria-labelledby="screens-title"
    >
      <div className="rail__stage">
        <div className="rail__head wrap">
          <h2 id="screens-title" className="h2">{t.case.screens}</h2>
          <p className="muted">{shots.length} · {t.case.scrollHint}</p>
        </div>
        <div className="rail__viewport" tabIndex={pinned ? -1 : 0} aria-label={`${t.case.screens} — ${name}`}>
          <ol className="rail__track" ref={trackRef}>
            {shots.map((s, i) => (
              <li key={s.url} className="rail__item">
                <img src={s.url} alt={pick(s, 'alt', lang) || `${name} — ${i + 1}`} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" />
                <span className="rail__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default function CaseStudy() {
  const { slug } = useParams();
  const [lang, setLang] = useLang();
  const t = translations[lang];
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.body.classList.add('portfolio');
    return () => document.body.classList.remove('portfolio');
  }, []);
  useEffect(() => {
    let alive = true;
    fetchContent().then((c) => alive && setContent(c)).catch(() => {}).finally(() => alive && setLoaded(true));
    return () => { alive = false; };
  }, []);

  const list = content.showcase;
  const index = list.findIndex((p) => p.slug === slug);
  const project = list[index];
  const next = useMemo(() => (list.length > 1 && index >= 0 ? list[(index + 1) % list.length] : null), [list, index]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  useEffect(() => {
    if (project) document.title = `${project.name} — Peter Akilimali`;
  }, [project]);

  const LangSwitch = () => (
    <div className="lang" role="group" aria-label={t.nav.lang}>
      {['fr', 'en'].map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l}>{l.toUpperCase()}</button>
      ))}
    </div>
  );

  if (!project) {
    return (
      <div className="site case">
        <header className="case__hero">
          <nav className="case__bar wrap">
            <Link className="case__back" to="/"><Icon name="ph:arrow-left-bold" /> {t.case.back}</Link>
          </nav>
          <div className="wrap case__heroin">
            <h1 className="case__name">{loaded ? '404' : '…'}</h1>
            {loaded && <p className="case__tagline">{t.case.notFound}</p>}
          </div>
        </header>
      </div>
    );
  }

  const shots = project.screenshots || [];
  const body = pick(project, 'body', lang);
  const role = pick(project, 'role', lang);

  return (
    <div className="site case">
      <a className="skip" href="#case-main">{t.nav.skip}</a>
      <header className="case__hero">
        <nav className="case__bar wrap" aria-label="Navigation">
          <Link className="case__back" to="/"><Icon name="ph:arrow-left-bold" /> {t.case.back}</Link>
          <LangSwitch />
        </nav>
        <div className="wrap case__heroin">
          <div className="case__id">
            {project.icon_url
              ? <img className="case__icon" src={project.icon_url} width="72" height="72" alt="" />
              : <span className="case__glyph"><PigmentGlyph kind="livre" seed={project.slug} /></span>}
          </div>
          <h1 className="case__name">{project.name}</h1>
          {pick(project, 'tagline', lang) && <p className="case__tagline">{pick(project, 'tagline', lang)}</p>}
          <dl className="case__facts">
            {project.platforms && <div><dt>{t.case.platforms}</dt><dd>{project.platforms}</dd></div>}
            {project.stack?.length > 0 && <div><dt>{t.case.stack}</dt><dd>{project.stack.join(' · ')}</dd></div>}
          </dl>
          <div className="feature__links">
            {project.ios_url && <a className="pill" href={project.ios_url} target="_blank" rel="noopener noreferrer"><Icon name="simple-icons:apple" /> App Store</a>}
            {project.android_url && <a className="pill" href={project.android_url} target="_blank" rel="noopener noreferrer"><Icon name="simple-icons:googleplay" /> Google Play</a>}
            {project.site_url && <a className="pill" href={project.site_url} target="_blank" rel="noopener noreferrer">{t.case.site} <Icon name="ph:arrow-up-right-bold" /></a>}
            {project.github_url && <a className="pill" href={project.github_url} target="_blank" rel="noopener noreferrer"><Icon name="simple-icons:github" /> {t.case.github}</a>}
          </div>
        </div>
      </header>

      <main id="case-main" tabIndex={-1}>
        {shots.length > 0 && <ScreensRail shots={shots} name={project.name} lang={lang} t={t} />}

        {(body || role) && (
          <section className="section case__story" aria-label={t.case.project}>
            <div className="wrap case__cols">
              {body && (
                <div>
                  <h2 className="h3">{t.case.project}</h2>
                  {body.split(/\n{2,}/).map((para, i) => <p key={i} className="case__text">{para}</p>)}
                </div>
              )}
              {role && (
                <div>
                  <h2 className="h3">{t.case.role}</h2>
                  {role.split(/\n{2,}/).map((para, i) => <p key={i} className="case__text">{para}</p>)}
                </div>
              )}
            </div>
          </section>
        )}

        {next && (
          <Link className="case__next" to={`/projets/${next.slug}`}>
            <span className="wrap case__nextin">
              <span className="case__nextlabel">{t.case.next}</span>
              <span className="case__nextname">{next.name}</span>
              <span className="case__nextglyph" aria-hidden="true"><PigmentGlyph kind="livre" seed={next.slug} /></span>
            </span>
          </Link>
        )}
      </main>

      <footer className="close close--case">
        <div className="wrap">
          <h2 className="close__title">{t.case.contact}</h2>
          <Link className="btn-primary" to="/#contact">{t.case.contactCta} <Icon name="ph:arrow-right-bold" /></Link>
          <div className="close__foot">
            <span>{t.footer.line}</span>
            <Link to="/">{t.case.back}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
