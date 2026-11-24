import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { translations } from './i18n.js';
import { fetchPublicProjects } from './lib/supabase.ts';
import { fetchContributions, fetchRepoCommitCount } from './lib/github.ts';
import SkinCanvas from './portfolio/SkinCanvas.jsx';
import { PigmentGlyph, PigmentSwatch } from './portfolio/Pigment.jsx';
import './portfolio/portfolio.css';
import { addCollection } from 'iconify-icon';
import { phIcons, simpleIcons } from './portfolio/icons.js';

addCollection(phIcons);
addCollection(simpleIcons);

const GITHUB_USER = 'Peter23xp';
const LINKS = {
  email: 'mailto:peter23xp@gmail.com',
  emailLabel: 'peter23xp@gmail.com',
  whatsapp: 'https://wa.me/243902238740',
  whatsappLabel: '+243 902 238 740',
  linkedin: 'https://www.linkedin.com/in/peter-akilimali-1a7016282/',
  github: 'https://github.com/Peter23xp',
  cv: '/peterCv.pdf',
};
const CHADITO = {
  site: 'https://chadito.net',
  ios: 'https://apps.apple.com/rw/app/chadito/id6757854742',
  android: 'https://play.google.com/store/apps/details?id=com.chadito.app',
};

// Les autres produits livrés hors GitHub.
const SHIPPED = [
  { id: 'custom-progress-business', name: 'Progress Business', language: 'React', html_url: 'https://progress-business.vercel.app/', homepage: 'https://progress-business.vercel.app/', is_custom: true, kind: 'livre',
    description: { fr: 'Application de gestion d’entreprise : ERP et CRM.', en: 'Business management application: ERP and CRM.' } },
  { id: 'custom-forever-united', name: 'Forever United', language: 'Web', html_url: 'https://forever-united.vercel.app/', homepage: 'https://forever-united.vercel.app/', is_custom: true, kind: 'livre',
    description: { fr: 'Plateforme web pour le bénévolat et les œuvres caritatives.', en: 'Web platform for volunteering and charity work.' } },
];

const SECTION_ORDER = {
  neutral: ['work', 'expertise', 'journey', 'activity'],
  recruit: ['expertise', 'journey', 'work', 'activity'],
  client: ['work', 'expertise', 'journey', 'activity'],
};
const FILTERS = ['all', 'livre', 'hackathon', 'personnel', 'contribution', 'github'];
const PAGE = 8;

const ghFetch = (path, init) => fetch(`/api/github?path=${encodeURIComponent(path)}`, init);
const isWeb3 = (repo) => repo.language === 'Solidity' || (repo.topics || []).some((x) => /web3|blockchain|solidity|ethereum|smart-contract/i.test(x));

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Réordonner les sections avec une View Transition quand c'est possible.
const withTransition = (fn) => {
  if (!document.startViewTransition || prefersReducedMotion()) { fn(); return; }
  document.startViewTransition(() => flushSync(fn));
};

const Icon = ({ name, label }) => (
  <iconify-icon icon={name} noobserver="" aria-hidden={label ? undefined : 'true'} aria-label={label} class="icon"></iconify-icon>
);

/* ── README ─────────────────────────────────────────────────────────────── */
function RepoDialog({ repo, onClose, t }) {
  const ref = useRef(null);
  const [readme, setReadme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('readme');
  const hasDesc = !!repo.descriptionText;

  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  useEffect(() => {
    let alive = true;
    ghFetch(`/repos/${GITHUB_USER}/${repo.name}/readme`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        const encoded = json?.data?.content ?? '';
        if (!encoded) throw new Error('empty');
        const bytes = Uint8Array.from(atob(encoded.replace(/\n/g, '')), (c) => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      })
      .then((text) => alive && setReadme(text))
      .catch(() => alive && setReadme(null))
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => { alive = false; };
  }, [repo.name]);

  useEffect(() => {
    if (!loading && !readme && hasDesc) setTab('description');
  }, [loading, readme, hasDesc]);

  const showTabs = !!readme && hasDesc;
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}
    >
      <div className="dialog__frame">
        <header className="dialog__head">
          <h2 id="dialog-title" className="dialog__title">{repo.name}</h2>
          <button type="button" className="icon-btn" onClick={() => ref.current.close()} aria-label={t.modal.close}>
            <Icon name="ph:x-bold" />
          </button>
        </header>
        {showTabs && (
          <div className="tabs" role="tablist" aria-label={repo.name}>
            {['readme', 'description'].map((key) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} className="tab" onClick={() => setTab(key)}>
                {t.modal[key]}
              </button>
            ))}
          </div>
        )}
        <div className="dialog__body" tabIndex={0}>
          {loading ? (
            <p className="muted" role="status">{t.modal.loading}</p>
          ) : tab === 'readme' && readme ? (
            <pre className="readme">{readme}</pre>
          ) : hasDesc ? (
            <p className="dialog__desc">{repo.descriptionText}</p>
          ) : (
            <p className="muted">{t.modal.noDoc}</p>
          )}
        </div>
        <footer className="dialog__foot">
          <a className="link-action" href={repo.html_url} target="_blank" rel="noopener noreferrer">
            <Icon name="simple-icons:github" /> {t.modal.openGithub} <Icon name="ph:arrow-up-right-bold" />
          </a>
        </footer>
      </div>
    </dialog>
  );
}

/* ── Ligne de projet ────────────────────────────────────────────────────── */
function ProjectRow({ repo, t, commits, onReadme }) {
  const kindLabel = repo.web3 ? t.work.kinds.web3 : t.work.kinds[repo.kind];
  const stars = typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0;
  const site = repo.homepage && /^https?:/.test(repo.homepage) ? repo.homepage : null;
  return (
    <li className="project">
      <PigmentGlyph kind={repo.web3 ? 'web3' : repo.kind} seed={repo.name} />
      <div className="project__main">
        <h3 className="project__name">{repo.name}</h3>
        <p className={repo.descriptionText ? 'project__desc' : 'project__desc is-empty'}>
          {repo.descriptionText || t.work.noDescription}
        </p>
      </div>
      <p className="project__meta">
        <span className="project__kind">{kindLabel}</span>
        {repo.language && <span>{repo.language}</span>}
        {stars > 0 && <span>{t.work.stars(stars)}</span>}
        {typeof commits === 'number' && <span>{t.work.commits(commits)}</span>}
      </p>
      <div className="project__actions">
        {site && (
          <a className="link-action" href={site} target="_blank" rel="noopener noreferrer">
            {t.work.site}<span className="sr-only"> — {repo.name}</span> <Icon name="ph:arrow-up-right-bold" />
          </a>
        )}
        {!repo.is_custom && (
          <>
            <a className="link-action" href={repo.html_url} target="_blank" rel="noopener noreferrer">
              {t.work.github}<span className="sr-only"> — {repo.name}</span>
            </a>
            <button type="button" className="link-action" onClick={() => onReadme(repo)}>
              {t.work.readme}<span className="sr-only"> — {repo.name}</span>
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/* ── Application ────────────────────────────────────────────────────────── */
export default function App() {
  const [lang, setLang] = useState(() => {
    const saved = typeof localStorage !== 'undefined' && localStorage.getItem('lang');
    if (saved === 'fr' || saved === 'en') return saved;
    return typeof navigator !== 'undefined' && /^en/i.test(navigator.language) ? 'en' : 'fr';
  });
  const t = translations[lang];
  const [context, setContext] = useState('neutral');
  const [pulse, setPulse] = useState(null);
  const [skinReady, setSkinReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [categorized, setCategorized] = useState({ livre: [], hackathon: [], personnel: [], contribution: [], github: [] });
  const [reposState, setReposState] = useState('loading'); // loading | ready | error
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const [commitCounts, setCommitCounts] = useState({});
  const [contributions, setContributions] = useState(null);
  const [readmeRepo, setReadmeRepo] = useState(null);

  // classe de page : les styles du portfolio ne fuient pas vers /admin
  useEffect(() => {
    document.body.classList.add('portfolio');
    return () => document.body.classList.remove('portfolio');
  }, []);

  // langue : persistée, appliquée au document
  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.title = t.meta.title;
  }, [lang, t.meta.title]);

  // données : Supabase (classement de l'admin), repli GitHub
  useEffect(() => {
    const adapt = (p) => ({
      id: p.github_id, name: p.repo_name, description: p.description, html_url: p.html_url, homepage: p.homepage,
      language: p.language, stargazers_count: p.stars, topics: p.topics, category: p.category,
    });
    const fromGitHub = () =>
      ghFetch(`/users/${GITHUB_USER}/repos?sort=pushed&direction=desc&per_page=100`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((json) => {
          const rows = Array.isArray(json) ? json : json?.data;
          if (!Array.isArray(rows)) throw new Error('bad payload');
          return rows.filter((r) => !r.fork && !r.archived && !r.private);
        });

    let alive = true;
    fetchPublicProjects()
      .then(async (data) => {
        const by = { livre: [], hackathon: [], personnel: [], contribution: [], github: [] };
        data.forEach((p) => {
          const key = p.category === 'non_classe' ? 'github' : p.category;
          if (by[key]) by[key].push(adapt(p));
        });
        if (data.length === 0 || by.github.length === 0) {
          try { by.github = await fromGitHub(); } catch { if (data.length === 0) throw new Error('no data'); }
        }
        return by;
      })
      .catch(async () => ({ livre: [], hackathon: [], personnel: [], contribution: [], github: await fromGitHub() }))
      .then((by) => { if (alive) { setCategorized(by); setReposState('ready'); } })
      .catch(() => alive && setReposState('error'));

    fetchContributions(GITHUB_USER).then((cal) => alive && cal && setContributions(cal)).catch(() => {});
    return () => { alive = false; };
  }, []);

  // liste unifiée
  const projects = useMemo(() => {
    const seen = new Set(['chadito']);
    const out = [];
    const push = (repo, kind) => {
      const key = repo.name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const raw = typeof repo.description === 'object' && repo.description ? repo.description[lang] : repo.description;
      // les emoji de tête des descriptions GitHub ne servent pas d'icônes ici
      const descriptionText = raw ? raw.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '') : raw;
      out.push({ ...repo, kind, descriptionText, web3: kind !== 'livre' && isWeb3(repo) });
    };
    SHIPPED.forEach((p) => push(p, 'livre'));
    ['livre', 'hackathon', 'personnel', 'contribution', 'github'].forEach((k) => categorized[k].forEach((r) => push(r, k)));
    return out;
  }, [categorized, lang]);

  const filtered = useMemo(() => {
    if (filter === 'all') return projects;
    if (filter === 'hackathon') return projects.filter((p) => p.kind === 'hackathon' || p.web3);
    return projects.filter((p) => p.kind === filter);
  }, [projects, filter]);
  const visible = expanded ? filtered : filtered.slice(0, PAGE);
  const counts = useMemo(() => {
    const c = { all: projects.length };
    FILTERS.slice(1).forEach((f) => { c[f] = f === 'hackathon' ? projects.filter((p) => p.kind === 'hackathon' || p.web3).length : projects.filter((p) => p.kind === f).length; });
    return c;
  }, [projects]);

  // nombre de commits pour les lignes affichées uniquement
  useEffect(() => {
    visible.forEach((repo) => {
      if (repo.is_custom || commitCounts[repo.name] !== undefined) return;
      setCommitCounts((prev) => ({ ...prev, [repo.name]: null }));
      fetchRepoCommitCount(GITHUB_USER, repo.name)
        .then((n) => setCommitCounts((prev) => ({ ...prev, [repo.name]: n })))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onSkinReady = useCallback(() => setSkinReady(true), []);

  const chooseContext = (next, event) => {
    const value = context === next ? 'neutral' : next;
    const rect = event.currentTarget.getBoundingClientRect();
    setPulse({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, id: Date.now() });
    withTransition(() => {
      setContext(value);
      setFilter(value === 'client' ? 'livre' : 'all');
      setExpanded(false);
    });
  };

  const primary = {
    neutral: { href: '#contact', icon: 'ph:arrow-down-bold' },
    recruit: { href: LINKS.cv, icon: 'ph:file-arrow-down-bold', download: true },
    client: { href: LINKS.whatsapp, icon: 'simple-icons:whatsapp', external: true },
  }[context];
  const secondary = {
    neutral: { href: '#work' },
    recruit: { href: LINKS.email },
    client: { href: '#work' },
  }[context];

  const navLinks = [['#work', t.nav.work], ['#expertise', t.nav.expertise], ['#journey', t.nav.journey], ['#contact', t.nav.contact]];
  // L'ordre de la navigation suit l'ordre réel de la page.
  const navOrdered = [...SECTION_ORDER[context].filter((s) => s !== 'activity'), 'contact']
    .map((id) => navLinks.find(([href]) => href === `#${id}`))
    .filter(Boolean);

  const LangSwitch = ({ className = '' }) => (
    <div className={`lang ${className}`} role="group" aria-label={t.nav.lang}>
      {['fr', 'en'].map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  /* ── sections ── */
  const sections = {
    work: (
      <section id="work" className="section section--work" aria-labelledby="work-title" key="work">
        <div className="wrap">
          <h2 id="work-title" className="h2">{t.work.title[context]}</h2>

          <article className="feature" aria-labelledby="chadito-title">
            <div className="feature__text">
              <div className="feature__id">
                <img src="/chadito/chadito-icon.webp" width="56" height="56" alt="" className="feature__icon" />
                <h3 id="chadito-title" className="feature__name">Chadito</h3>
              </div>
              <p className="feature__tagline">{t.work.chadito.tagline}</p>
              <p className="feature__body">{t.work.chadito.body}</p>
              <dl className="facts">
                <div><dt>{t.work.chadito.platformsLabel}</dt><dd>{t.work.chadito.platforms}</dd></div>
                <div><dt>Stack</dt><dd>{t.work.chadito.stack}</dd></div>
              </dl>
              <div className="feature__links">
                <a className="pill" href={CHADITO.ios} target="_blank" rel="noopener noreferrer"><Icon name="simple-icons:apple" /> {t.work.chadito.appStore}</a>
                <a className="pill" href={CHADITO.android} target="_blank" rel="noopener noreferrer"><Icon name="simple-icons:googleplay" /> {t.work.chadito.playStore}</a>
                <a className="link-action" href={CHADITO.site} target="_blank" rel="noopener noreferrer">{t.work.chadito.site} <Icon name="ph:arrow-up-right-bold" /></a>
              </div>
            </div>
            <figure className="feature__shots">
              <div className="shots">
                {[1, 2, 3].map((n, i) => (
                  <img key={n} className={`shot shot--${n}`} src={`/chadito/chadito-${n}.webp`} width="480" height="1040" loading="lazy" decoding="async" alt={t.work.chadito.shotAlts[i]} />
                ))}
              </div>
              <figcaption className="caption">{t.work.chadito.caption}</figcaption>
            </figure>
          </article>

          <div className="filters" role="radiogroup" aria-label={t.work.filters.label}>
            {FILTERS.filter((f) => reposState !== 'ready' || f === 'all' || counts[f] > 0).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={filter === f}
                className="chip"
                onClick={() => { setFilter(f); setExpanded(false); }}
              >
                {t.work.filters[f]}
                {reposState === 'ready' && <span className="chip__count">{counts[f]}</span>}
              </button>
            ))}
          </div>

          {reposState === 'error' && projects.length <= SHIPPED.length && (
            <p className="notice" role="status">
              {t.work.error}{' '}
              <a href={LINKS.github} target="_blank" rel="noopener noreferrer">{t.work.errorAction}</a>
            </p>
          )}

          <ul className="projects" aria-busy={reposState === 'loading'}>
            {visible.map((repo) => (
              <ProjectRow key={repo.id ?? repo.name} repo={repo} t={t} commits={commitCounts[repo.name]} onReadme={setReadmeRepo} />
            ))}
            {reposState === 'loading' &&
              [0, 1, 2].map((i) => (
                <li key={`sk-${i}`} className="project project--skeleton" aria-hidden="true">
                  <span className="sk sk--glyph" /><span className="sk sk--line" /><span className="sk sk--short" />
                </li>
              ))}
          </ul>
          {reposState === 'loading' && <p className="sr-only" role="status">{t.work.loading}</p>}
          {reposState !== 'loading' && filtered.length === 0 && <p className="muted empty">{t.work.empty}</p>}
          {filtered.length > PAGE && (
            <button type="button" className="more" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
              {expanded ? t.work.less : t.work.more(filtered.length - PAGE)}
            </button>
          )}
        </div>
      </section>
    ),

    expertise: (
      <section id="expertise" className="section section--expertise" aria-labelledby="expertise-title" key="expertise">
        <div className="wrap">
          <div className="section__head">
            <h2 id="expertise-title" className="h2">{t.expertise.title[context]}</h2>
            <p className="lede">{t.expertise.intro}</p>
          </div>
          <ul className="domains">
            {t.expertise.domains.map((d) => (
              <li key={d.key} className="domain">
                <PigmentSwatch name={d.key} />
                <h3 className="domain__title">{d.title}</h3>
                <p className="domain__body">{d.body}</p>
                <p className="tags">{d.tags.map((tag) => <span key={tag}>{tag}</span>)}</p>
              </li>
            ))}
          </ul>
          <p className="stack">
            <span className="stack__label">{t.expertise.stackLabel}</span>
            React / Next.js · React Native · Node.js · PostgreSQL / MySQL · Solidity
          </p>
        </div>
      </section>
    ),

    journey: (
      <section id="journey" className="section section--journey" aria-labelledby="journey-title" key="journey">
        <div className="wrap">
          <div className="section__head">
            <h2 id="journey-title" className="h2">{t.journey.title}</h2>
            <p className="lede">{t.journey.intro}</p>
          </div>
          <ol className="journey">
            <svg className="journey__wave" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              {Array.from({ length: 101 }, (_, i) => {
                const x = i * 10;
                const y = 30 + Math.sin(i * 0.25) * 14;
                const rad = 1.2 + (i / 100) * 2.6;
                return <circle key={i} cx={x} cy={y.toFixed(1)} r={rad.toFixed(2)} />;
              })}
            </svg>
            {t.journey.steps.map((s, i) => (
              <li key={s.period} className={`step ${i === t.journey.steps.length - 1 ? 'step--now' : ''}`}>
                <span className="step__period">{s.period}</span>
                <h3 className="step__title">{s.title}</h3>
                <p className="step__detail">{s.detail}</p>
              </li>
            ))}
          </ol>
          <a className="link-action link-action--strong" href={LINKS.cv} download>
            <Icon name="ph:file-arrow-down-bold" /> {t.journey.cv}
          </a>
        </div>
      </section>
    ),

    activity: contributions ? (
      <section className="section section--activity" aria-labelledby="activity-title" key="activity">
        <div className="wrap">
          <h2 id="activity-title" className="h3">{t.activity.title(contributions.totalContributions)}</h2>
          <ContributionField cal={contributions} t={t} lang={lang} />
        </div>
      </section>
    ) : null,
  };

  return (
    <div className={`site ctx-${context}`}>
      <a className="skip" href="#main">{t.nav.skip}</a>

      <header className={`hero ${skinReady ? 'is-skin' : ''}`} id="top" aria-labelledby="hero-name">
        <img className="hero__portrait" src="/peter-cutout.webp" width="756" height="1198" alt={t.hero.portraitAlt} fetchpriority="high" />
        <SkinCanvas mode={context} pulse={pulse} onReady={onSkinReady} />

        <nav className="nav" aria-label="Navigation">
          <a className="nav__mark" href="#top" aria-label={t.nav.home}>
            <svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="8" cy="8" r="4" /><circle cx="19" cy="7" r="2.6" /><circle cx="9" cy="19" r="2.2" /><circle cx="19.5" cy="18.5" r="5" /></svg>
          </a>
          <ul className="nav__links">
            {navOrdered.map(([href, label]) => <li key={href}><a href={href}>{label}</a></li>)}
          </ul>
          <div className="nav__tools">
            <LangSwitch />
            <a className="nav__cv" href={LINKS.cv} download>{t.nav.cv}</a>
            <button type="button" className="nav__menu" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((v) => !v)}>
              <Icon name={menuOpen ? 'ph:x-bold' : 'ph:list-bold'} /> <span>{menuOpen ? t.nav.close : t.nav.menu}</span>
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div id="mobile-menu" className="sheet">
            <ul>
              {navOrdered.map(([href, label]) => <li key={href}><a href={href} onClick={() => setMenuOpen(false)}>{label}</a></li>)}
              <li><a href={LINKS.cv} download onClick={() => setMenuOpen(false)}>{t.nav.cv}</a></li>
            </ul>
            <LangSwitch className="lang--sheet" />
          </div>
        )}

        <div className="hero__copy">
          <h1 id="hero-name" className={`hero__name ${pulse ? 'is-pulse' : ''}`} key={pulse?.id ?? 'init'}>
            <span>Peter</span> <span>Akilimali</span>
          </h1>
          <p className="hero__role">{t.hero.role}</p>

          <div className="switch" role="group" aria-labelledby="switch-label">
            <span id="switch-label" className="switch__label">{t.hero.switchLabel}</span>
            <div className="switch__track">
              {['recruit', 'client'].map((c) => (
                <button key={c} type="button" className="switch__opt" aria-pressed={context === c} onClick={(e) => chooseContext(c, e)}>
                  <span className="switch__dot" aria-hidden="true" />
                  {t.hero[c]}
                </button>
              ))}
            </div>
          </div>

          <p className="hero__lede" aria-live="polite">{t.hero.lede[context]}</p>

          <div className="hero__actions">
            <a
              className="btn-primary"
              href={primary.href}
              {...(primary.download ? { download: true } : {})}
              {...(primary.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <Icon name={primary.icon} /> {t.hero.primary[context]}
            </a>
            <a className="link-action link-action--on-ink" href={secondary.href}>{t.hero.secondary[context]}</a>
          </div>
        </div>

        <p className="hero__status">
          <span className="signal" aria-hidden="true" /> <strong>{t.hero.available}</strong>
          <span className="hero__loc">{t.hero.location}</span>
        </p>
      </header>

      <main id="main" tabIndex={-1}>
        {SECTION_ORDER[context].map((id) => sections[id])}
      </main>

      <footer id="contact" className="close" aria-labelledby="contact-title">
        <div className="wrap">
          <h2 id="contact-title" className="close__title">{t.contact.title[context]}</h2>
          <p className="close__body">{t.contact.body}</p>
          <ul className="channels">
            <li className={context !== 'client' ? 'is-primary' : ''}>
              <a href={LINKS.email}><span className="channel__k">{t.contact.email}</span><span className="channel__v">{LINKS.emailLabel}</span><Icon name="ph:arrow-up-right-bold" /></a>
            </li>
            <li className={context === 'client' ? 'is-primary' : ''}>
              <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer"><span className="channel__k">{t.contact.whatsapp}</span><span className="channel__v">{LINKS.whatsappLabel}</span><Icon name="ph:arrow-up-right-bold" /></a>
            </li>
            <li>
              <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer"><span className="channel__k">{t.contact.linkedin}</span><span className="channel__v">Peter Akilimali</span><Icon name="ph:arrow-up-right-bold" /></a>
            </li>
            <li>
              <a href={LINKS.github} target="_blank" rel="noopener noreferrer"><span className="channel__k">{t.contact.github}</span><span className="channel__v">Peter23xp</span><Icon name="ph:arrow-up-right-bold" /></a>
            </li>
            <li>
              <a href={LINKS.cv} download><span className="channel__k">{t.contact.cv}</span><span className="channel__v">peterCv.pdf</span><Icon name="ph:file-arrow-down-bold" /></a>
            </li>
          </ul>
          <p className="close__status"><span className="signal" aria-hidden="true" /> {t.contact.available}</p>
          <div className="close__foot">
            <span>{t.footer.line}</span>
            <a href="#top">{t.footer.top}</a>
          </div>
        </div>
      </footer>

      {readmeRepo && <RepoDialog repo={readmeRepo} t={t} onClose={() => setReadmeRepo(null)} />}
    </div>
  );
}

/* ── Contributions : chaque jour est une cellule de pigment ─────────────── */
function ContributionField({ cal, t, lang }) {
  const weeks = cal.weeks || [];
  const max = Math.max(1, ...weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount)));
  const step = 14;
  const fmt = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' });
  return (
    <figure className="activity">
      <div className="activity__scroll">
        <svg viewBox={`0 0 ${weeks.length * step} ${7 * step}`} className="activity__svg" role="img" aria-label={t.activity.title(cal.totalContributions)}>
          {weeks.map((w, wi) =>
            w.contributionDays.map((d, di) => {
              const v = d.contributionCount / max;
              const r = d.contributionCount === 0 ? 1.4 : 2.4 + Math.sqrt(v) * 4.2;
              return (
                <circle key={d.date} cx={wi * step + step / 2} cy={di * step + step / 2} r={r.toFixed(2)} className={d.contributionCount === 0 ? 'is-zero' : ''}>
                  <title>{t.activity.day(d.contributionCount, fmt.format(new Date(d.date)))}</title>
                </circle>
              );
            }),
          )}
        </svg>
      </div>
      <figcaption className="activity__legend" aria-hidden="true">
        <span>{t.activity.less}</span>
        {[1.4, 3, 4.4, 6.6].map((r) => <svg key={r} viewBox="0 0 14 14" width="14" height="14"><circle cx="7" cy="7" r={r} /></svg>)}
        <span>{t.activity.more}</span>
      </figcaption>
    </figure>
  );
}
