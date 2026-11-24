import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import Icon from './Icon.jsx';
import { DEFAULT_CONTENT, fetchContent } from '../lib/content.js';
import { translations } from '../i18n.js';
import { track } from '../lib/analytics.js';
import { washOut } from './wash.js';
import './portfolio.css';

// Le CV s'affiche dans le site (rien ne se télécharge sans action du visiteur).
// Rendu par pdf.js sur des <canvas> : fonctionne aussi sur mobile, où les
// navigateurs téléchargent souvent les PDF au lieu de les afficher.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

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

function Pages({ url, t, onState }) {
  const holder = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let doc = null;
    const el = holder.current;
    el.replaceChildren();
    onState('loading');
    (async () => {
      try {
        doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const cssWidth = Math.min(el.clientWidth || 800, 880);
          const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = 'cv__page';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `${t.cv.page} ${n} / ${doc.numPages}`);
          el.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        }
        if (!cancelled) onState('ready');
      } catch {
        if (!cancelled) onState('error');
      }
    })();
    return () => {
      cancelled = true;
      doc?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  return <div className="cv__pages" ref={holder} />;
}

export default function CvPage() {
  const [lang, setLang] = useLang();
  const t = translations[lang];
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [state, setState] = useState('loading');
  const url = content.settings.contact.cv_url;

  useEffect(() => {
    document.body.classList.add('portfolio');
    window.scrollTo(0, 0);
    washOut();
    track('cv_view');
    return () => document.body.classList.remove('portfolio');
  }, []);
  useEffect(() => {
    let alive = true;
    fetchContent().then((c) => alive && setContent(c)).catch(() => {});
    return () => { alive = false; };
  }, []);
  useEffect(() => { document.title = `${t.cv.title} — Peter Akilimali`; }, [t.cv.title]);

  return (
    <div className="site cv">
      <a className="skip" href="#cv-main">{t.nav.skip}</a>
      <header className="case__hero cv__hero">
        <nav className="case__bar wrap" aria-label="Navigation">
          <Link className="case__back" to="/"><Icon name="ph:arrow-left-bold" /> {t.case.back}</Link>
          <div className="lang" role="group" aria-label={t.nav.lang}>
            {['fr', 'en'].map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l}>{l.toUpperCase()}</button>
            ))}
          </div>
        </nav>
        <div className="wrap cv__heroin">
          <h1 className="cv__title">{t.cv.title}</h1>
          <p className="case__tagline">{t.cv.lede}</p>
          <div className="feature__links">
            <a className="btn-primary" href={url} download onClick={() => track('cv_download')}>
              <Icon name="ph:file-arrow-down-bold" /> {t.cv.download}
            </a>
            <Link className="link-action link-action--on-ink" to="/#contact">{t.cv.contact}</Link>
          </div>
        </div>
      </header>

      <main id="cv-main" tabIndex={-1} className="cv__main">
        <div className="wrap">
          {state === 'loading' && <p className="muted cv__status" role="status">{t.cv.loading}</p>}
          {state === 'error' && (
            <p className="notice cv__status" role="alert">
              {t.cv.error}{' '}
              <a href={url} target="_blank" rel="noopener noreferrer">{t.cv.openPdf}</a>
            </p>
          )}
          <Pages url={url} t={t} onState={setState} />
        </div>
      </main>
    </div>
  );
}
