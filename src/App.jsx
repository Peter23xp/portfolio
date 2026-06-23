import React, { useEffect, useRef, useState } from 'react';
import { translations } from './i18n.js';
import { fetchPublicProjects } from './lib/supabase.ts';
import { fetchContributions, fetchRepoCommitCount } from './lib/github.ts';

const GITHUB_USER = 'Peter23xp';
// Les appels GitHub passent par /api/github (proxy serveur) — aucun token côté client.
const ghFetch = (url) => fetch(`/api/github?path=${encodeURIComponent(new URL(url).pathname + new URL(url).search)}`);

const langColors = {
  JavaScript: '#fbbf24',
  TypeScript: '#60a5fa',
  HTML: '#fb923c',
  CSS: '#818cf8',
  Python: '#4ade80',
  Solidity: '#a78bfa',
  Java: '#fb923c',
  'C++': '#60a5fa',
  Rust: '#fb923c',
  Go: '#4ade80',
};

function RepoModal({ repo, onClose, lang }) {
  const t = translations[lang].modal;
  const [readme, setReadme] = useState(null);
  const [readmeLoading, setReadmeLoading] = useState(true);
  // tab: 'readme' | 'description'
  const hasDesc = !!repo.description;
  const [tab, setTab] = useState('readme');

  useEffect(() => {
    fetch(`/api/github?path=${encodeURIComponent(`/repos/${GITHUB_USER}/${repo.name}/readme`)}`, {
      headers: { Accept: 'application/vnd.github.raw' }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => {
        const encoded = json?.data?.content ?? '';
        if (!encoded) throw new Error('no content');
        return decodeURIComponent(escape(atob(encoded.replace(/\n/g, ''))));
      })
      .then(text => setReadme(text))
      .catch(() => setReadme(null))
      .finally(() => setReadmeLoading(false));
  }, [repo.name]);

  // once loading done, default to whichever tab has content
  useEffect(() => {
    if (!readmeLoading) {
      if (readme) setTab('readme');
      else if (hasDesc) setTab('description');
    }
  }, [readmeLoading]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hasReadme = !!readme;
  const showTabs = hasReadme && hasDesc;

  return (
    <div
      style={{
        position:'fixed', inset:0, zIndex:999,
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'16px',
        background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        position:'relative',
        backgroundColor:'#0a0a0a',
        border:'1px solid #262626',
        borderRadius:'2rem',
        width:'100%',
        maxWidth:'48rem',
        height:'90vh',
        display:'flex',
        flexDirection:'column',
        boxShadow:'0 25px 60px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 32px', borderBottom:'1px solid #262626'}}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <iconify-icon icon="solar:document-bold-duotone" class="text-emerald-400" style={{fontSize:'1.25rem'}}></iconify-icon>
            <span style={{color:'white', fontWeight:600, fontSize:'0.875rem', textTransform:'uppercase', letterSpacing:'0.1em'}}>{repo.name}</span>
          </div>
          <button
            onClick={onClose}
            style={{width:'32px', height:'32px', borderRadius:'50%', background:'#171717', border:'1px solid #262626', display:'flex', alignItems:'center', justifyContent:'center', color:'#a3a3a3', cursor:'pointer'}}
          >
            <iconify-icon icon="solar:close-circle-bold-duotone" style={{fontSize:'1rem'}}></iconify-icon>
          </button>
        </div>

        {/* Tabs */}
        {showTabs && (
          <div style={{flexShrink:0, display:'flex', gap:'4px', padding:'16px 32px 0'}}>
            {[
              { key: 'readme', label: t.readme, icon: 'solar:document-bold-duotone' },
              { key: 'description', label: t.description, icon: 'solar:info-circle-bold-duotone' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display:'flex', alignItems:'center', gap:'6px',
                  padding:'8px 16px', borderRadius:'9999px',
                  fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
                  cursor:'pointer', transition:'all 0.15s',
                  background: tab === key ? '#262626' : 'transparent',
                  color: tab === key ? 'white' : '#737373',
                  border: tab === key ? '1px solid #404040' : '1px solid transparent',
                }}
              >
                <iconify-icon icon={icon} style={{fontSize:'0.875rem'}}></iconify-icon>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Body — scroll ici uniquement */}
        <div style={{
          flex:'1 1 0px',
          minHeight:0,
          overflowY:'auto',
          overflowX:'hidden',
          padding:'24px 32px',
        }}>
          {readmeLoading ? (
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 0'}}>
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : tab === 'readme' && hasReadme ? (
            <pre style={{
              color:'#d4d4d4',
              fontSize:'0.75rem',
              lineHeight:1.7,
              whiteSpace:'pre-wrap',
              wordBreak:'break-word',
              fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              margin:0,
            }}>{readme}</pre>
          ) : tab === 'description' && hasDesc ? (
            <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <p style={{color:'#d4d4d4', fontSize:'0.875rem', lineHeight:1.7}}>{repo.description}</p>
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px 0', gap:'12px', color:'#737373'}}>
              <iconify-icon icon="solar:document-bold-duotone" style={{fontSize:'2.5rem', opacity:0.3}}></iconify-icon>
              <p style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.1em'}}>{t.noDoc}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{flexShrink:0, padding:'16px 32px', borderTop:'1px solid #262626', display:'flex', justifyContent:'flex-end'}}>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'9999px', border:'1px solid #404040', fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#d4d4d4', textDecoration:'none'}}
          >
            <iconify-icon icon="simple-icons:github" style={{fontSize:'1rem'}}></iconify-icon>
            {t.openGithub}
            <iconify-icon icon="solar:arrow-right-bold-duotone" class="text-emerald-400" style={{fontSize:'0.875rem'}}></iconify-icon>
          </a>
        </div>
      </div>
    </div>
  );
}

const CUSTOM_PROJECTS = [
  {
    id: 'custom-chadito',
    name: 'Chadito',
    language: 'React Native',
    stargazers_count: '★',
    html_url: 'https://chadito.net',
    description: 'Solution Complète (Web, iOS, Android)',
    is_custom: true,
    ios_link: 'https://apps.apple.com/rw/app/chadito/id6757854742',
    android_link: 'https://play.google.com/store/apps/details?id=com.chadito.app'
  },
  {
    id: 'custom-progress-business',
    name: 'Progress Business',
    language: 'React',
    stargazers_count: '★',
    html_url: 'https://progress-business.vercel.app/',
    description: "Application de gestion d'entreprise (ERP/CRM).",
    is_custom: true
  },
  {
    id: 'custom-forever-united',
    name: 'Forever United',
    language: 'Web',
    stargazers_count: '★',
    html_url: 'https://forever-united.vercel.app/',
    description: 'Plateforme web pour le bénévolat et les œuvres caritatives.',
    is_custom: true
  }
];

function App() {
  const containerRef = useRef(null);
  const [lang, setLang] = useState('fr');
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });
  const t = translations[lang];
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [showAllRepos, setShowAllRepos] = useState(false);
  const [readmeRepo, setReadmeRepo] = useState(null);
  const [commitCounts, setCommitCounts] = useState({});
  const [contributions, setContributions] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categorizedRepos, setCategorizedRepos] = useState({ livre: [], hackathon: [], personnel: [], contribution: [] });

  const renderRepoCard = (repo, index) => (
    <div
      key={repo.id}
      className={`animate-on-scroll group relative flex flex-col justify-between h-[420px] bg-neutral-950/40 backdrop-blur-xl border border-white/5 hover:border-white/20 rounded-[2rem] p-8 transition-all duration-500 overflow-hidden ${index % 2 === 0 ? 'animate-levitate' : 'animate-levitate-delayed'} ${index % 2 === 1 ? 'lg:mt-12' : ''}`}
      data-animation="up"
      data-delay={String(200 + (index % 4) * 100)}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      {/* Top row: language + stars */}
      <div className="flex justify-between items-start z-10 relative">
        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-neutral-500 border border-white/5 px-2 py-1 rounded-md bg-neutral-900/50">
          {repo.language || 'Code'}
        </span>
        <div className="flex items-center gap-1">
          <iconify-icon icon="solar:star-bold-duotone" class="text-yellow-400" style={{fontSize:'0.875rem'}}></iconify-icon>
          <span className="text-sm font-medium" style={{color: langColors[repo.language] || '#a3a3a3'}}>
            {repo.stargazers_count}
          </span>
        </div>
      </div>
      {/* Center watermark: repo name */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden px-6">
        <span
          className="text-white font-bricolage font-bold text-center leading-none select-none transition-all duration-500 opacity-[0.06] group-hover:opacity-[0.14]"
          style={{fontSize:'clamp(1.5rem, 5vw, 3rem)', wordBreak:'break-word', textAlign:'center', textTransform:'uppercase', letterSpacing:'-0.04em'}}
        >{repo.name}</span>
      </div>
      {/* Bottom: commit count + description + actions */}
      <div className="z-10 relative flex flex-col gap-2 border-t border-white/5 pt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white font-bricolage group-hover:translate-x-1 transition-transform duration-300 leading-none">{repo.is_custom ? 'PRO' : (commitCounts[repo.name] ?? '—')}</span>
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-neutral-500">{repo.is_custom ? 'LIVRÉ' : 'commits'}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1.5 hover:text-white transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <iconify-icon icon={repo.is_custom ? "solar:global-bold-duotone" : "simple-icons:github"} style={{fontSize:'0.875rem'}}></iconify-icon>
              {repo.is_custom ? 'Visiter' : 'GitHub'}
              <iconify-icon icon="solar:arrow-right-bold-duotone" class="text-neutral-600 group-hover:text-white transition-colors" style={{fontSize:'0.75rem'}}></iconify-icon>
            </a>
            {repo.ios_link && (
              <a href={repo.ios_link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-neutral-500 hover:text-white transition-colors" title="Apple App Store"><iconify-icon icon="simple-icons:apple" style={{fontSize:'0.875rem'}}></iconify-icon></a>
            )}
            {repo.android_link && (
              <a href={repo.android_link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-neutral-500 hover:text-white transition-colors" title="Google Play Store"><iconify-icon icon="simple-icons:googleplay" style={{fontSize:'0.875rem'}}></iconify-icon></a>
            )}
          </div>
          <button
            onClick={() => setReadmeRepo(repo)}
            className="text-xs text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
          >
            <iconify-icon icon="solar:document-bold-duotone" style={{fontSize:'0.875rem'}}></iconify-icon>
            README
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const adaptRow = p => ({
      id: p.github_id,
      name: p.repo_name,
      full_name: p.full_name,
      description: p.description,
      html_url: p.html_url,
      homepage: p.homepage,
      language: p.language,
      stargazers_count: p.stars,
      forks_count: p.forks,
      topics: p.topics,
      is_featured: p.is_featured,
      category: p.category,
      is_private: p.is_private,
      updated_at: p.updated_at,
    });

    const fallbackToGitHub = () =>
      ghFetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&direction=desc&per_page=100`)
        .then(r => r.json())
        .then(ghData => {
          const rows = Array.isArray(ghData) ? ghData : (ghData?.data ?? []);
          if (!Array.isArray(rows)) return;
          setRepos(rows.filter(r => !r.fork && !r.archived && !r.private));
        })
        .catch(() => {})
        .finally(() => setReposLoading(false));

    fetchPublicProjects()
      .then(data => {
        if (data.length === 0) { fallbackToGitHub(); return; }

        // non_classé public → section GitHub
        const githubSection = data
          .filter(p => p.category === 'non_classe' && !p.is_private)
          .map(adaptRow);

        // catégories classées
        const bycat = { livre: [], hackathon: [], personnel: [], contribution: [] };
        data.filter(p => p.category !== 'non_classe').forEach(p => {
          if (bycat[p.category]) bycat[p.category].push(adaptRow(p));
        });

        // fallback GitHub pour la section repos si aucun non_classé public
        if (githubSection.length > 0) {
          setRepos(githubSection);
          setReposLoading(false);
        } else {
          fallbackToGitHub();
        }

        setCategorizedRepos(bycat);
      })
      .catch(fallbackToGitHub);
  }, []);

  // fetch commit counts only for currently visible repos (saves API quota)
  useEffect(() => {
    const visible = showAllRepos ? repos : repos.slice(0, 4);
    visible.forEach(repo => {
      if (repo.is_custom) return;
      if (commitCounts[repo.name] !== undefined) return;
      fetchRepoCommitCount(GITHUB_USER, repo.name)
        .then(count => setCommitCounts(prev => ({ ...prev, [repo.name]: count })))
        .catch(() => {});
    });
  }, [repos, showAllRepos]);

  useEffect(() => {
    fetchContributions(GITHUB_USER)
      .then(cal => { if (cal) setContributions(cal); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const type = el.dataset.animation || 'up';
          const delay = el.dataset.delay || 0;
          setTimeout(() => {
            if (type === 'left') el.classList.add('animate-left');
            else if (type === 'right') el.classList.add('animate-right');
            else if (type === 'fade') el.classList.add('animate-fade');
            else el.classList.add('animate-up');
          }, parseInt(delay));
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1 });

    if (containerRef.current) {
      containerRef.current
        .querySelectorAll('.animate-on-scroll:not(.animate-up):not(.animate-left):not(.animate-right):not(.animate-fade)')
        .forEach(el => observer.observe(el));
    }
    return () => observer.disconnect();
  }, [repos, showAllRepos]);

  return (
    <main ref={containerRef} className="border-gradient xl:rounded-[3.5rem] xl:p-12 overflow-hidden flex flex-col xl:max-w-[96rem] xl:shadow-2xl bg-neutral-900 w-full rounded-none pt-6 pr-6 pb-6 pl-6 relative shadow-none justify-between">

      {/* BG: peter.jpeg right half */}
      <img
        src="/peter.jpeg"
        alt="Peter Akilimali"
        className="w-1/2 h-[960px] object-cover object-top rounded-[40px] absolute top-4 right-4 bottom-0 pointer-events-none opacity-40 md:opacity-100 no-invert"
      />

      {/* Background gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-neutral-800/20 via-transparent to-blue-950/10 pointer-events-none"></div>

      {/* Vertical lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden xl:rounded-[3.5rem]">
        <div className="absolute top-0 bottom-0 left-[10%] w-px bg-gradient-to-b from-transparent via-neutral-700/30 to-transparent"></div>
        <div className="absolute top-0 bottom-0 left-[25%] w-px bg-gradient-to-b from-transparent via-neutral-700/20 to-transparent"></div>
        <div className="absolute top-0 bottom-0 left-[50%] w-px bg-gradient-to-b from-transparent via-neutral-700/30 to-transparent"></div>
        <div className="absolute top-0 bottom-0 left-[75%] w-px bg-gradient-to-b from-transparent via-neutral-700/20 to-transparent"></div>
        <div className="absolute top-0 bottom-0 left-[90%] w-px bg-gradient-to-b from-transparent via-neutral-700/30 to-transparent"></div>
      </div>

      {/* ===== NAV ===== */}
      <nav className="z-20 relative mb-12 md:mb-0">
        <div className="mix-blend-plus-lighter flex gap-x-6 gap-y-6 items-center justify-between">
          <div className="animate-on-scroll flex items-center group cursor-pointer" data-animation="left" data-delay="0">
            <iconify-icon icon="solar:code-bold-duotone" class="text-white group-hover:rotate-[22.5deg] transition-transform duration-500 ease-out" style={{fontSize:'2.5rem'}}></iconify-icon>
          </div>
          <div className="hidden md:flex items-center gap-12 text-xs font-medium tracking-widest uppercase text-neutral-400">
            <a href="#projets" className="animate-on-scroll hover:text-white transition-colors flex items-center gap-2" data-animation="up" data-delay="100">
              <div className="w-2 h-2 rounded-full bg-white"></div>{t.nav.projects}
            </a>
            <a href="#expertise" className="animate-on-scroll hover:text-white transition-colors flex items-center gap-2" data-animation="up" data-delay="150">
              <div className="w-2 h-2 rounded-full border border-neutral-600"></div>{t.nav.expertise}
            </a>
            <a href="#parcours" className="animate-on-scroll hover:text-white transition-colors mix-blend-hard-light" data-animation="up" data-delay="200">{t.nav.parcours}</a>
            <a href="#contact" className="animate-on-scroll hover:text-white transition-colors" data-animation="up" data-delay="250">{t.nav.contact}</a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="animate-on-scroll hidden md:flex items-center justify-center w-8 h-8 rounded-full border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all no-invert"
              data-animation="right"
              data-delay="25"
              title={theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
            >
              <iconify-icon icon={theme === 'dark' ? "solar:sun-bold-duotone" : "solar:moon-bold-duotone"} style={{fontSize:'1rem'}}></iconify-icon>
            </button>
            <button
              onClick={() => setLang(l => l === 'fr' ? 'en' : 'fr')}
              className="animate-on-scroll hidden md:flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all no-invert"
              data-animation="right"
              data-delay="50"
            >
              <iconify-icon icon="solar:global-bold-duotone" style={{fontSize:'0.875rem'}}></iconify-icon>
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <a
              href="/peterCv.pdf"
              download
              className="animate-on-scroll hidden uppercase hover:bg-neutral-800 transition-colors md:flex text-xs font-semibold tracking-widest bg-gradient-to-br from-white/10 to-white/0 rounded-full px-6 py-3"
              data-animation="right"
              data-delay="100"
              style={{ position: 'relative', '--border-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))', '--border-radius-before': '9999px' }}
            >
              {t.nav.cv}
            </a>
            <button
              className="md:hidden p-3 rounded-full bg-white text-neutral-950"
              onClick={() => setMobileMenuOpen(o => !o)}
            >
              <iconify-icon icon={mobileMenuOpen ? 'solar:close-circle-bold-duotone' : 'solar:hamburger-menu-bold-duotone'} style={{fontSize:'1.25rem'}}></iconify-icon>
            </button>
          </div>
        </div>
        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 flex flex-col gap-4 z-50">
            <a href="#projets" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium tracking-widest uppercase text-neutral-300 hover:text-white transition-colors flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white"></div>{t.nav.projects}
            </a>
            <a href="#expertise" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium tracking-widest uppercase text-neutral-300 hover:text-white transition-colors flex items-center gap-3">
              <div className="w-2 h-2 rounded-full border border-neutral-600"></div>{t.nav.expertise}
            </a>
            <a href="#parcours" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium tracking-widest uppercase text-neutral-300 hover:text-white transition-colors">{t.nav.parcours}</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium tracking-widest uppercase text-neutral-300 hover:text-white transition-colors">{t.nav.contact}</a>
            <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
              <button
                onClick={() => { setLang(l => l === 'fr' ? 'en' : 'fr'); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-neutral-700 text-neutral-400 hover:text-white transition-all"
              >
                <iconify-icon icon="solar:global-bold-duotone" style={{fontSize:'0.875rem'}}></iconify-icon>
                {lang === 'fr' ? 'EN' : 'FR'}
              </button>
              <a href="/peterCv.pdf" download onClick={() => setMobileMenuOpen(false)} className="text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-neutral-700 text-neutral-400 hover:text-white transition-all">
                {t.nav.cv}
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO CONTENT ===== */}
      <div className="z-10 flex-grow flex flex-col md:py-0 pt-10 pb-10 relative justify-center">
        {/* Badge */}
        <div className="animate-on-scroll flex md:mb-4 md:mt-12 mt-4 mb-6 gap-x-4 gap-y-4 items-center" data-animation="up" data-delay="300">
          <p className="text-xs md:text-sm uppercase tracking-widest text-neutral-300 md:text-neutral-500 max-w-md font-medium">
            {t.hero.badge}
          </p>
        </div>

        {/* Massive Typography with floating labels */}
        <div className="group relative pb-10">
          <div className="animate-on-scroll hidden lg:flex bg-neutral-900 z-20 border-neutral-700 border rounded-full px-5 py-2 absolute top-[0%] left-[38%] -top-4 shadow-sm gap-x-2 gap-y-2 items-center hover:scale-105 transition-transform cursor-default" data-animation="fade" data-delay="800">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-neutral-300">{t.hero.remoteLabel}</span>
          </div>
          <div className="animate-on-scroll hidden lg:flex bg-neutral-900 z-20 border-neutral-700 border rounded-full px-5 py-2 absolute top-[45%] right-[0%] shadow-sm gap-x-2 gap-y-2 items-center hover:scale-105 transition-transform cursor-default" data-animation="right" data-delay="900">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-neutral-300">Available</span>
          </div>
          <div className="animate-on-scroll hidden lg:flex z-20 gap-2 text-neutral-950 bg-emerald-400 rounded-full px-5 py-2 absolute top-[55%] left-[5%] shadow-lg gap-x-2 gap-y-2 items-center hover:scale-105 transition-transform cursor-default" data-animation="left" data-delay="1000">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest">{t.hero.fullstackLabel}</span>
          </div>
          <h1 className="text-[16vw] md:text-[14vw] lg:text-[12rem] leading-[0.8] uppercase select-none md:text-left font-medium text-white tracking-tighter font-oswald text-center mix-blend-normal max-w-4xl">
            <span className="animate-on-scroll inline-block" data-animation="up" data-delay="400">{t.hero.h1word1}</span>
            <span className="animate-on-scroll inline-block pl-0 md:pl-16" data-animation="up" data-delay="500">{t.hero.h1word2}</span>
            <span className="animate-on-scroll block text-neutral-600" data-animation="up" data-delay="600">{t.hero.h1word3}</span>
          </h1>
        </div>
      </div>

      {/* ===== HERO BOTTOM: Description + CTA + Feature Cards ===== */}
      <div className="z-20 flex flex-col lg:flex-row gap-12 mt-8 relative gap-x-12 gap-y-12 items-end justify-between">
        <div className="flex flex-col gap-6 max-w-lg">
          <div className="animate-on-scroll flex items-center gap-3 text-xs font-bold tracking-widest uppercase text-neutral-300 md:text-neutral-500" data-animation="up" data-delay="700">
            <span>{t.hero.subtitle1}</span>
            <span className="w-4 h-[1px] bg-neutral-500 md:bg-neutral-600 inline-block"></span>
            <span>{t.hero.subtitle2}</span>
          </div>
          <p className="animate-on-scroll text-sm md:text-base text-neutral-200 md:text-neutral-400 leading-relaxed font-normal uppercase tracking-wide" data-animation="up" data-delay="800">
            {t.hero.description}
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <a
              href="#contact"
              className="animate-on-scroll group flex overflow-hidden uppercase transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] text-sm font-medium text-white tracking-widest font-space rounded-full pt-5 pr-12 pb-5 pl-12 relative items-center justify-center"
              data-animation="up"
              data-delay="900"
            >
              <div className="absolute inset-0 -z-20 rounded-full overflow-hidden p-[1px]">
                <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#3b82f6_360deg)]" style={{ animation: 'beam-spin 3s linear infinite' }}></div>
                <div className="absolute inset-[1px] rounded-full bg-neutral-950"></div>
              </div>
              <div className="-z-10 overflow-hidden bg-neutral-950 rounded-full absolute top-[2px] right-[2px] bottom-[2px] left-[2px]">
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/60 to-transparent"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 bg-blue-500/10 blur-2xl rounded-full transition-colors duration-500 group-hover:bg-blue-500/30"></div>
              </div>
              <span className="relative z-10 text-white/90 group-hover:text-white">{t.hero.cta}</span>
              <iconify-icon icon="solar:arrow-right-bold-duotone" class="relative z-10 ml-2 transition-transform duration-300 group-hover:translate-x-1" style={{fontSize:'1rem'}}></iconify-icon>
            </a>
            <a
              href="https://github.com/Peter23xp"
              target="_blank"
              rel="noopener noreferrer"
              className="animate-on-scroll px-5 py-2 rounded-full border border-neutral-700 text-[0.7rem] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              data-animation="up"
              data-delay="1000"
            >
              {t.hero.github}
            </a>
          </div>
        </div>

        {/* Feature cards marquee */}
        <div className="lg:w-auto flex flex-col md:flex-row gap-4 w-full gap-x-4 gap-y-4">
          {/* Card: Stack Tech */}
          <div
            className="animate-on-scroll group flex-1 lg:flex-none lg:w-48 hover:bg-white hover:text-neutral-950 hover:border-white transition-all duration-300 cursor-pointer overflow-hidden bg-neutral-800/50 rounded-2xl pt-5 pr-5 pb-5 pl-5 backdrop-blur-lg"
            data-animation="up"
            data-delay="1100"
            style={{ position: 'relative', '--border-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))', '--border-radius-before': '16px' }}
          >
            <div className="relative h-28 mb-4 overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }}>
              <div className="marquee-content flex flex-col">
                {['solar:code-square-bold-duotone|#60a5fa|React', 'solar:server-bold-duotone|#4ade80|Node.js', 'solar:layers-bold-duotone|#a78bfa|Web3', 'solar:document-bold-duotone|#fb923c|Solidity', 'solar:database-bold-duotone|#818cf8|PostgreSQL', 'solar:code-square-bold-duotone|#60a5fa|React', 'solar:server-bold-duotone|#4ade80|Node.js', 'solar:layers-bold-duotone|#a78bfa|Web3', 'solar:document-bold-duotone|#fb923c|Solidity', 'solar:database-bold-duotone|#818cf8|PostgreSQL'].map((item, i) => {
                  const [icon, color, label] = item.split('|');
                  return (
                    <div key={i} className="flex items-center gap-2 pb-3">
                      <iconify-icon icon={icon} style={{color, fontSize:'1.25rem'}}></iconify-icon>
                      <span className="text-[0.6rem] uppercase tracking-wider opacity-70">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-1">{t.hero.cardStack}</h3>
            <p className="text-[0.65rem] leading-normal opacity-70 uppercase">{t.hero.cardStackSub}</p>
          </div>

          {/* Card: Projets */}
          <div
            className="animate-on-scroll group flex-1 lg:flex-none lg:w-48 hover:bg-white hover:text-neutral-950 hover:border-white transition-all duration-300 cursor-pointer overflow-hidden bg-neutral-800/50 rounded-2xl pt-5 pr-5 pb-5 pl-5 backdrop-blur-lg"
            data-animation="up"
            data-delay="1200"
            style={{ position: 'relative', '--border-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))', '--border-radius-before': '16px' }}
          >
            <div className="relative h-28 mb-4 overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', animationDuration: '25s' }}>
              <div className="marquee-content flex flex-col" style={{animationDuration:'25s'}}>
                {['G|GitHub', 'V|Vercel', 'U|ULK', 'G|GitHub', 'V|Vercel', 'U|ULK'].map((item, i) => {
                  const [letter, label] = item.split('|');
                  return (
                    <div key={i} className="flex items-center gap-2 pb-3">
                      <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[0.5rem] font-bold">{letter}</div>
                      <span className="text-[0.6rem] uppercase tracking-wider opacity-70">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-1">{t.hero.cardProjects}</h3>
            <p className="text-[0.65rem] leading-normal opacity-70 uppercase">{t.hero.cardProjectsSub}</p>
          </div>

          {/* Card: Contact */}
          <div
            className="animate-on-scroll group flex-1 lg:flex-none lg:w-48 hover:bg-white hover:text-neutral-950 hover:border-white transition-all duration-300 cursor-pointer overflow-hidden bg-neutral-800/50 rounded-2xl pt-5 pr-5 pb-5 pl-5 backdrop-blur-lg"
            data-animation="up"
            data-delay="1300"
            style={{ position: 'relative', '--border-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))', '--border-radius-before': '16px' }}
          >
            <div className="relative h-28 mb-4 overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }}>
              <div className="marquee-content flex flex-col" style={{animationDuration:'18s'}}>
                {['solar:letter-bold-duotone|#818cf8|Email', 'simple-icons:linkedin|#60a5fa|LinkedIn', 'solar:chat-round-bold-duotone|#4ade80|WhatsApp', 'solar:code-bold-duotone|#a3a3a3|GitHub', 'solar:letter-bold-duotone|#818cf8|Email', 'simple-icons:linkedin|#60a5fa|LinkedIn', 'solar:chat-round-bold-duotone|#4ade80|WhatsApp', 'solar:code-bold-duotone|#a3a3a3|GitHub'].map((item, i) => {
                  const [icon, color, label] = item.split('|');
                  return (
                    <div key={i} className="flex items-center gap-2 pb-3">
                      <iconify-icon icon={icon} style={{color, fontSize:'1.25rem'}}></iconify-icon>
                      <span className="text-[0.6rem] uppercase tracking-wider opacity-70">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-1">{t.hero.cardContact}</h3>
            <p className="text-[0.65rem] leading-normal opacity-70 uppercase">{t.hero.cardContactSub}</p>
          </div>
        </div>
      </div>

      {/* ===== EXPERTISE ===== */}
      <div id="expertise" className="flex flex-col md:px-0 z-20 w-full max-w-[90rem] border-white/5 border-t mt-32 mr-auto ml-auto pt-12 pr-4 pb-12 pl-4 relative gap-x-16 gap-y-16">
        <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
          <h2 className="animate-on-scroll md:text-5xl lg:text-6xl uppercase leading-[0.9] text-3xl font-medium text-white tracking-tight font-bricolage" data-animation="up" data-delay="0">
            {t.expertise.title} <span className="text-neutral-600">{t.expertise.titleAccent}</span> {t.expertise.titleEnd}
          </h2>
          <p className="animate-on-scroll text-sm md:text-base text-neutral-400 font-normal uppercase tracking-wide max-w-xl" data-animation="up" data-delay="100">
            {t.expertise.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Card 1: Ingénierie d'Application */}
          <div className="animate-on-scroll group relative bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 md:p-12 overflow-hidden flex flex-col min-h-[420px] sm:h-[600px] hover:border-neutral-700 transition-all duration-500" data-animation="left" data-delay="200">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-4 mb-12">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-2 border border-neutral-700" style={{boxShadow:'0 0 15px -3px rgba(52,211,153,0.3)'}}>
                <iconify-icon icon="solar:code-square-bold-duotone" class="text-emerald-400" style={{fontSize:'1.5rem'}}></iconify-icon>
              </div>
              <h3 className="uppercase text-2xl font-semibold text-white tracking-tight font-bricolage">{t.expertise.card1Title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-xs font-space">{t.expertise.card1Desc}</p>
              <div className="flex items-center gap-3 text-[0.6rem] font-bold uppercase tracking-widest text-neutral-500 mt-2">
                <span className="bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700">Full-Stack</span>
                <span className="w-8 h-[1px] bg-neutral-700 inline-block"></span>
                <span className="text-emerald-400">React/Node</span>
                <span className="w-8 h-[1px] bg-neutral-700 inline-block"></span>
                <span className="bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700">API Design</span>
              </div>
            </div>
            <div className="flex-1 w-full mt-4 relative" style={{perspective:'1000px'}}>
              <div className="flex absolute top-0 right-0 bottom-0 left-0 items-center justify-center" style={{transform:'rotateX(12deg)'}}>
                <svg className="pointer-events-none z-0 w-full h-full absolute top-0 right-0 bottom-0 left-0" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{overflow:'visible'}}>
                  <path d="M 200 150 L 200 80 Q 200 60 180 60 L 40 60" stroke="#262626" strokeWidth="1" fill="none"></path>
                  <path d="M 200 150 L 200 80 Q 200 60 180 60 L 40 60" stroke="#10b981" strokeWidth="1.5" fill="none" strokeDasharray="6 6" strokeLinecap="round" style={{animation:'flow-noodle 3s linear infinite'}}></path>
                  <path d="M 200 150 L 340 150 Q 360 150 360 130 L 360 80" stroke="#262626" strokeWidth="1" fill="none"></path>
                  <path d="M 200 150 L 340 150 Q 360 150 360 130 L 360 80" stroke="#10b981" strokeWidth="1.5" fill="none" strokeDasharray="6 6" strokeLinecap="round" style={{animation:'flow-noodle 4s linear infinite reverse'}}></path>
                  <path d="M 200 150 L 200 220 Q 200 240 180 240 L 60 240" stroke="#262626" strokeWidth="1" fill="none"></path>
                  <path d="M 200 150 L 200 220 Q 200 240 180 240 L 60 240" stroke="#10b981" strokeWidth="1.5" fill="none" strokeDasharray="6 6" strokeLinecap="round" style={{animation:'flow-noodle 3.5s linear infinite'}}></path>
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-emerald-500/20 bg-emerald-500/5 blur-3xl z-0"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="bg-neutral-950 border border-emerald-500/30 p-3 rounded-2xl cursor-pointer hover:border-emerald-500/60 transition-colors" style={{boxShadow:'0 0 30px -10px rgba(16,185,129,0.3)'}}>
                    <iconify-icon icon="solar:cpu-bold-duotone" class="text-emerald-400" style={{fontSize:'1.5rem'}}></iconify-icon>
                  </div>
                </div>
                <div className="hidden sm:block transition-transform duration-700 hover:-translate-y-2 absolute" style={{top:'20%',left:'10%',transform:'translate(-50%, -250%)'}}>
                  <div className="flex items-center gap-2 bg-neutral-800/90 backdrop-blur-md border border-neutral-700 pr-4 pl-3 py-2 rounded-full shadow-xl hover:border-blue-500/50 transition-all cursor-pointer">
                    <iconify-icon icon="simple-icons:react" class="text-blue-400" style={{fontSize:'1rem'}}></iconify-icon>
                    <span className="text-xs font-medium text-white">React Native</span>
                  </div>
                </div>
                <div className="hidden sm:block transition-transform duration-700 delay-100 hover:-translate-y-2 z-10 absolute" style={{top:'27%',right:'10%',transform:'translate(50%, -200%)'}}>
                  <div className="flex items-center gap-2 bg-neutral-800/90 backdrop-blur-md border border-neutral-700 pr-4 pl-3 py-2 rounded-full shadow-xl hover:border-purple-500/50 transition-all cursor-pointer">
                    <iconify-icon icon="solar:database-bold-duotone" class="text-purple-400" style={{fontSize:'1rem'}}></iconify-icon>
                    <span className="text-xs font-medium text-white">PostgreSQL</span>
                  </div>
                </div>
                <div className="hidden sm:block absolute transition-transform duration-700 delay-200 hover:-translate-y-2 z-10" style={{bottom:'20%',left:'15%',transform:'translate(-50%, 250%)'}}>
                  <div className="flex items-center gap-2 bg-neutral-800/90 backdrop-blur-md border border-neutral-700 pr-4 pl-3 py-2 rounded-full shadow-xl hover:border-green-500/50 transition-all cursor-pointer">
                    <iconify-icon icon="solar:server-bold-duotone" class="text-green-400" style={{fontSize:'1rem'}}></iconify-icon>
                    <span className="text-xs font-medium text-white">Node.js</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Blockchain */}
          <div className="animate-on-scroll group relative bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 md:p-12 overflow-hidden flex flex-col min-h-[420px] sm:h-[600px] hover:border-neutral-700 transition-all duration-500" data-animation="right" data-delay="300">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-4 mb-10">
              <div className="flex bg-neutral-800 w-12 h-12 border-neutral-700 border rounded-full mb-2 items-center justify-center">
                <iconify-icon icon="solar:layers-bold-duotone" class="text-blue-400" style={{fontSize:'1.5rem'}}></iconify-icon>
              </div>
              <h3 className="uppercase text-2xl font-semibold text-white tracking-tight font-bricolage">{t.expertise.card2Title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-xs font-space">{t.expertise.card2Desc}</p>
            </div>
            <div className="relative z-10 flex-1 w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden group-hover:border-neutral-700/50 transition-colors">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-2">
                <div className="flex items-center gap-2">
                  <iconify-icon icon="solar:shield-check-bold-duotone" class="text-neutral-400" style={{fontSize:'1rem'}}></iconify-icon>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">{t.expertise.card2Deploy}</span>
                </div>
                <span className="bg-blue-900/20 text-blue-300 border border-blue-800/50 text-[0.6rem] font-bold uppercase tracking-wider px-2 py-1 rounded">Solidity</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-neutral-500 w-10 text-right">Chain</span>
                <div className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-xs text-neutral-300 flex justify-between items-center cursor-pointer hover:border-neutral-600 transition-colors">
                  <div className="flex items-center gap-2">
                    <iconify-icon icon="simple-icons:ethereum" style={{fontSize:'1rem',color:'#a78bfa'}}></iconify-icon>
                    <span>Ethereum</span>
                  </div>
                  <iconify-icon icon="solar:alt-arrow-down-bold-duotone" style={{fontSize:'1rem'}}></iconify-icon>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-neutral-500 w-10 text-right">Type</span>
                <div className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-xs text-neutral-300 flex justify-between items-center cursor-pointer hover:border-neutral-600 transition-colors">
                  <div className="flex items-center gap-2">
                    <iconify-icon icon="solar:layers-bold-duotone" style={{fontSize:'1rem'}}></iconify-icon>
                    <span>dApp</span>
                  </div>
                  <iconify-icon icon="solar:alt-arrow-down-bold-duotone" style={{fontSize:'1rem'}}></iconify-icon>
                </div>
                <div className="w-14 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-xs text-white font-medium flex items-center justify-center">
                  <iconify-icon icon="solar:check-circle-bold-duotone" class="text-emerald-400" style={{fontSize:'1rem'}}></iconify-icon>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-neutral-500 w-10 text-right">Lang</span>
                <div className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-xs text-neutral-300 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <iconify-icon icon="solar:document-bold-duotone" style={{fontSize:'1rem',color:'#fb923c'}}></iconify-icon>
                    <span>Solidity</span>
                  </div>
                </div>
                <div className="w-24 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-xs text-white font-medium">Web3.js</div>
              </div>
              <button className="mt-2 flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors w-max py-2">
                <iconify-icon icon="solar:add-circle-bold-duotone" style={{fontSize:'1rem'}}></iconify-icon>
                <span>{t.expertise.card2ViewWeb3}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cards 3 & 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { id:'info', icon:'solar:monitor-bold-duotone', color:'#818cf8', glow:'rgba(99,102,241,0.1)', title:t.expertise.card3Title, desc:t.expertise.card3Desc, tags:['ERP','CRM','Audit Digital'], delay:'400' },
            { id:'strat', icon:'solar:chart-2-bold-duotone', color:'#c084fc', glow:'rgba(168,85,247,0.1)', title:t.expertise.card4Title, desc:t.expertise.card4Desc, tags:['Business','ROI','Stratégie'], delay:'500' },
          ].map(({ id, icon, color, glow, title, desc, tags, delay }) => (
            <div key={id} className="animate-on-scroll group relative bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8 overflow-hidden hover:border-neutral-700 transition-all duration-500" data-animation="up" data-delay={delay}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{background:glow}}></div>
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-6 border border-neutral-700">
                <iconify-icon icon={icon} style={{color,fontSize:'1.5rem'}}></iconify-icon>
              </div>
              <h3 className="uppercase text-xl font-semibold text-white tracking-tight font-bricolage mb-3">{title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed font-space mb-6">{desc}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700 text-[0.6rem] font-bold uppercase tracking-widest text-neutral-400">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== PROJETS LIVRÉS ===== */}
      {(() => {
        const livres = [...CUSTOM_PROJECTS, ...categorizedRepos.livre];
        return (
          <div id="projets" className="flex flex-col md:px-0 z-20 w-full max-w-[90rem] border-white/5 border-t mt-32 mr-auto ml-auto pt-12 pr-4 pb-12 pl-4 relative gap-y-16">
            <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
              <div className="animate-on-scroll flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-[0.65rem] uppercase tracking-widest text-neutral-400 font-semibold" data-animation="up" data-delay="0">
                <iconify-icon icon="solar:star-bold-duotone" class="text-yellow-400" style={{fontSize:'0.75rem'}}></iconify-icon>
                <span>{lang === 'fr' ? 'Production' : 'Production'}</span>
              </div>
              <h2 className="animate-on-scroll md:text-5xl lg:text-6xl uppercase leading-[0.9] text-3xl font-medium text-white tracking-tight font-bricolage" data-animation="up" data-delay="100">
                {lang === 'fr' ? 'Projets' : 'Delivered'} <span className="text-neutral-600">{lang === 'fr' ? 'Livrés' : 'Projects'}</span>
              </h2>
              <p className="animate-on-scroll text-sm md:text-base text-neutral-400 font-normal uppercase tracking-wide max-w-xl" data-animation="up" data-delay="150">
                {lang === 'fr' ? 'Solutions concrètes développées pour des clients et actuellement en production.' : 'Real-world solutions developed for clients and currently in production.'}
              </p>
            </div>
            <div className="w-full relative perspective-[2000px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                {livres.map((repo, index) => renderRepoCard(repo, index))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== HACKATHONS (affiché seulement si classés) ===== */}
      {categorizedRepos.hackathon.length > 0 && (
        <div className="flex flex-col md:px-0 z-20 w-full max-w-[90rem] border-white/5 border-t mt-16 mr-auto ml-auto pt-12 pr-4 pb-12 pl-4 relative gap-y-16">
          <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
            <div className="animate-on-scroll flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-[0.65rem] uppercase tracking-widest text-neutral-400 font-semibold" data-animation="up" data-delay="0">
              <iconify-icon icon="solar:cup-star-bold-duotone" class="text-amber-400" style={{fontSize:'0.75rem'}}></iconify-icon>
              <span>Hackathon</span>
            </div>
            <h2 className="animate-on-scroll md:text-5xl lg:text-6xl uppercase leading-[0.9] text-3xl font-medium text-white tracking-tight font-bricolage" data-animation="up" data-delay="100">
              {lang === 'fr' ? 'Projets' : 'Projects'} <span className="text-neutral-600">Hackathon</span>
            </h2>
            <p className="animate-on-scroll text-sm md:text-base text-neutral-400 font-normal uppercase tracking-wide max-w-xl" data-animation="up" data-delay="150">
              {lang === 'fr' ? 'Prototypes et solutions développés en compétition.' : 'Prototypes and solutions built in competition.'}
            </p>
          </div>
          <div className="w-full relative perspective-[2000px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-amber-900/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
              {categorizedRepos.hackathon.map((repo, index) => renderRepoCard(repo, index))}
            </div>
          </div>
        </div>
      )}

      {/* ===== PROJETS PERSONNELS (affiché seulement si classés) ===== */}
      {categorizedRepos.personnel.length > 0 && (
        <div className="flex flex-col md:px-0 z-20 w-full max-w-[90rem] border-white/5 border-t mt-16 mr-auto ml-auto pt-12 pr-4 pb-12 pl-4 relative gap-y-16">
          <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
            <div className="animate-on-scroll flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-[0.65rem] uppercase tracking-widest text-neutral-400 font-semibold" data-animation="up" data-delay="0">
              <iconify-icon icon="solar:user-bold-duotone" class="text-blue-400" style={{fontSize:'0.75rem'}}></iconify-icon>
              <span>{lang === 'fr' ? 'Personnel' : 'Personal'}</span>
            </div>
            <h2 className="animate-on-scroll md:text-5xl lg:text-6xl uppercase leading-[0.9] text-3xl font-medium text-white tracking-tight font-bricolage" data-animation="up" data-delay="100">
              {lang === 'fr' ? 'Projets' : 'Personal'} <span className="text-neutral-600">{lang === 'fr' ? 'Personnels' : 'Projects'}</span>
            </h2>
            <p className="animate-on-scroll text-sm md:text-base text-neutral-400 font-normal uppercase tracking-wide max-w-xl" data-animation="up" data-delay="150">
              {lang === 'fr' ? 'Expérimentations et apprentissages personnels.' : 'Personal experiments and learning projects.'}
            </p>
          </div>
          <div className="w-full relative perspective-[2000px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
              {categorizedRepos.personnel.map((repo, index) => renderRepoCard(repo, index))}
            </div>
          </div>
        </div>
      )}

      {/* ===== CONTRIBUTIONS OPEN SOURCE (affiché seulement si classés) ===== */}
      {categorizedRepos.contribution.length > 0 && (
        <div className="flex flex-col md:px-0 z-20 w-full max-w-[90rem] border-white/5 border-t mt-16 mr-auto ml-auto pt-12 pr-4 pb-12 pl-4 relative gap-y-16">
          <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
            <div className="animate-on-scroll flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-[0.65rem] uppercase tracking-widest text-neutral-400 font-semibold" data-animation="up" data-delay="0">
              <iconify-icon icon="solar:users-group-rounded-bold-duotone" class="text-teal-400" style={{fontSize:'0.75rem'}}></iconify-icon>
              <span>{lang === 'fr' ? 'Open Source' : 'Open Source'}</span>
            </div>
            <h2 className="animate-on-scroll md:text-5xl lg:text-6xl uppercase leading-[0.9] text-3xl font-medium text-white tracking-tight font-bricolage" data-animation="up" data-delay="100">
              {lang === 'fr' ? 'Contributions' : 'Open Source'} <span className="text-neutral-600">{lang === 'fr' ? 'Open Source' : 'Contributions'}</span>
            </h2>
            <p className="animate-on-scroll text-sm md:text-base text-neutral-400 font-normal uppercase tracking-wide max-w-xl" data-animation="up" data-delay="150">
              {lang === 'fr' ? 'Participations à des projets communautaires et open source.' : 'Contributions to community and open source projects.'}
            </p>
          </div>
          <div className="w-full relative perspective-[2000px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-teal-900/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
              {categorizedRepos.contribution.map((repo, index) => renderRepoCard(repo, index))}
            </div>
          </div>
        </div>
      )}

      {/* ===== PROJETS GITHUB ===== */}
      <div className="flex flex-col md:px-0 z-20 w-full max-w-[90rem] border-white/5 border-t mt-16 mr-auto ml-auto pt-12 pr-4 pb-12 pl-4 relative gap-y-16">
        <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
          <div className="animate-on-scroll flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-[0.65rem] uppercase tracking-widest text-neutral-400 font-semibold" data-animation="up" data-delay="0">
            <iconify-icon icon="solar:code-bold-duotone" class="text-emerald-400" style={{fontSize:'0.75rem'}}></iconify-icon>
            <span>{t.projects.badge}</span>
          </div>
          <h2 className="animate-on-scroll md:text-5xl lg:text-6xl uppercase leading-[0.9] text-3xl font-medium text-white tracking-tight font-bricolage" data-animation="up" data-delay="100">
            {t.projects.title} <span className="text-neutral-600">{t.projects.titleAccent}</span>
          </h2>
          <p className="animate-on-scroll text-sm md:text-base text-neutral-400 font-normal uppercase tracking-wide max-w-xl" data-animation="up" data-delay="150">
            {t.projects.subtitle}
          </p>
        </div>

        {reposLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`animate-pulse bg-neutral-900/40 border border-white/5 rounded-[2rem] h-[420px] ${i % 2 === 1 ? 'lg:mt-12' : ''}`}></div>
            ))}
          </div>
        ) : (
          <>
            <div className="w-full relative perspective-[2000px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                {(showAllRepos ? repos : repos.slice(0, 4)).map((repo, index) => renderRepoCard(repo, index))}
              </div>
            </div>
            {repos.length > 4 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowAllRepos(v => !v)}
                  className="group flex items-center gap-3 px-8 py-4 rounded-full border border-neutral-700 text-[0.7rem] font-bold uppercase tracking-widest text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600 transition-all duration-300"
                >
                  <iconify-icon icon="solar:code-square-bold-duotone" class="text-emerald-400" style={{fontSize:'1rem'}}></iconify-icon>
                  {showAllRepos ? t.projects.showLess : t.projects.showMore(repos.length - 4)}
                  <iconify-icon
                    icon="solar:alt-arrow-down-bold-duotone"
                    class="text-neutral-500 group-hover:text-white transition-all duration-300"
                    style={{fontSize:'1rem', transform: showAllRepos ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.3s'}}
                  ></iconify-icon>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== CONTRIBUTION GRAPH ===== */}
      {contributions && (() => {
        const weeks = contributions.weeks;
        const total = contributions.totalContributions;
        const allCounts = weeks.flatMap(w => w.contributionDays.map(d => d.contributionCount));
        const maxCount = Math.max(...allCounts, 1);
        const getColor = (count) => {
          if (count === 0) return '#161616';
          const intensity = count / maxCount;
          if (intensity < 0.25) return '#0d4429';
          if (intensity < 0.5)  return '#006d32';
          if (intensity < 0.75) return '#26a641';
          return '#39d353';
        };
        const months = [];
        weeks.forEach((week, wi) => {
          const firstDay = week.contributionDays[0];
          if (firstDay) {
            const d = new Date(firstDay.date);
            if (d.getDate() <= 7) {
              months.push({ label: d.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }), weekIndex: wi });
            }
          }
        });
        const days = lang === 'fr' ? ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        return (
          <div className="flex flex-col md:px-0 z-20 w-full max-w-[90rem] border-white/5 border-t mt-32 mr-auto ml-auto pt-12 pr-4 pb-12 pl-4 relative gap-y-8">
            <div className="flex flex-col items-center text-center gap-4 max-w-3xl mx-auto">
              <div className="animate-on-scroll flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-[0.65rem] uppercase tracking-widest text-neutral-400 font-semibold" data-animation="up" data-delay="0">
                <iconify-icon icon="solar:graph-bold-duotone" class="text-emerald-400" style={{fontSize:'0.75rem'}}></iconify-icon>
                <span>{t.contributions.badge}</span>
              </div>
              <h2 className="animate-on-scroll md:text-4xl lg:text-5xl uppercase leading-[0.9] text-2xl font-medium text-white tracking-tight font-bricolage" data-animation="up" data-delay="100">
                <span className="text-emerald-400">{t.contributions.title(total)}</span> <span className="text-neutral-600">{t.contributions.titleAccent}</span>
              </h2>
            </div>
            <div className="animate-on-scroll overflow-x-auto flex justify-center" data-animation="up" data-delay="150">
              <div className="inline-flex gap-3 p-6 bg-neutral-900/40 border border-white/5 rounded-[2rem]">
                {/* Day labels */}
                <div className="flex flex-col justify-between pt-6 pb-0 gap-0" style={{minWidth:'28px'}}>
                  {[1,3,5].map(i => (
                    <span key={i} className="text-[0.55rem] text-neutral-600 uppercase tracking-wider leading-none" style={{height:'13px', lineHeight:'13px'}}>{days[i]}</span>
                  ))}
                </div>
                {/* Grid */}
                <div className="flex flex-col flex-1 gap-1">
                  {/* Month labels */}
                  <div className="flex gap-[3px] mb-1" style={{paddingLeft:'0px'}}>
                    {weeks.map((_, wi) => {
                      const month = months.find(m => m.weekIndex === wi);
                      return (
                        <div key={wi} style={{width:'13px', flexShrink:0}}>
                          {month ? <span className="text-[0.55rem] text-neutral-500 uppercase tracking-wider whitespace-nowrap">{month.label}</span> : null}
                        </div>
                      );
                    })}
                  </div>
                  {/* Cells */}
                  <div className="flex gap-[3px]">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.contributionDays.map((day, di) => (
                          <div
                            key={di}
                            title={`${day.date} — ${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''}`}
                            className="rounded-[2px] transition-transform duration-150 hover:scale-125 cursor-default"
                            style={{width:'13px', height:'13px', background: getColor(day.contributionCount), border: '1px solid rgba(255,255,255,0.04)'}}
                          ></div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-3 pr-2">
                <span className="text-[0.6rem] text-neutral-600 uppercase tracking-wider">{t.contributions.less}</span>
                {['#161616','#0d4429','#006d32','#26a641','#39d353'].map(c => (
                  <div key={c} className="w-3 h-3 rounded-[2px]" style={{background:c, border:'1px solid rgba(255,255,255,0.04)'}}></div>
                ))}
                <span className="text-[0.6rem] text-neutral-600 uppercase tracking-wider">{t.contributions.more}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== PARCOURS ===== */}
      <div id="parcours" className="flex flex-col md:px-0 z-20 w-full max-w-[90rem] border-white/5 border-t mt-32 mr-auto ml-auto pt-12 pr-4 pb-12 pl-4 relative gap-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full">
          <div className="lg:col-span-5 relative flex flex-col justify-center p-6 lg:p-12 overflow-hidden rounded-[2.5rem] bg-neutral-900/50 border border-white/5">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage:'radial-gradient(#10b981 1.5px, transparent 1.5px)',backgroundSize:'32px 32px'}}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-transparent to-transparent"></div>
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <span className="h-px w-8 bg-emerald-500/50 inline-block"></span>
                <span className="text-emerald-400 text-xs font-bold tracking-[0.2em] uppercase font-space">{t.parcours.badge}</span>
              </div>
              <h2 className="animate-on-scroll text-4xl md:text-5xl font-medium text-white tracking-tight font-bricolage leading-[1.1]" data-animation="left" data-delay="0">
                {t.parcours.title}{' '}
                <span className="text-neutral-500">{t.parcours.titleAccent}</span>
              </h2>
              <p className="animate-on-scroll text-neutral-400 text-sm md:text-base leading-relaxed font-space max-w-md" data-animation="left" data-delay="100">
                {t.parcours.description}
              </p>
              <a href="/peterCv.pdf" download className="mt-4 group flex items-center gap-3 text-sm font-medium text-white w-max">
                <span className="border-b border-emerald-500 pb-0.5 group-hover:border-white transition-colors">{t.parcours.viewCV}</span>
                <iconify-icon icon="solar:arrow-right-bold-duotone" class="text-emerald-400 group-hover:translate-x-1 transition-transform" style={{fontSize:'1rem'}}></iconify-icon>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white text-neutral-950 rounded-[2.5rem] p-8 md:p-16 flex flex-col justify-between gap-12 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-100 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
            {t.parcours.milestones.map(({ period, title, subtitle }, i, arr) => (
              <React.Fragment key={title}>
                <div className="animate-on-scroll flex flex-col sm:flex-row gap-6 sm:gap-12 items-start sm:items-center relative z-10 group" data-animation="up" data-delay={String(i * 100)}>
                  <span className="text-6xl md:text-7xl font-medium tracking-tighter font-bricolage w-48 shrink-0 group-hover:scale-105 transition-transform duration-500 origin-left">{period}</span>
                  <div className="flex flex-col gap-2 max-w-xs">
                    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                    <p className="text-xs text-neutral-500 font-medium leading-relaxed uppercase tracking-wide">{subtitle}</p>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="h-px w-full bg-neutral-100"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ===== CONTACT ===== */}
      <div id="contact" className="flex flex-col md:px-0 z-20 w-full max-w-[90rem] border-white/5 border-t mt-32 mr-auto ml-auto pt-12 pr-4 pb-24 pl-4 relative gap-y-12 items-center text-center">
        <div className="flex flex-col items-center gap-6 max-w-3xl">
          <div className="animate-on-scroll flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-[0.65rem] uppercase tracking-widest text-neutral-400 font-semibold" data-animation="up" data-delay="0">
            <iconify-icon icon="solar:star-bold-duotone" class="text-emerald-400" style={{fontSize:'0.75rem'}}></iconify-icon>
            <span>{t.contact.badge}</span>
          </div>
          <h2 className="animate-on-scroll md:text-5xl lg:text-6xl uppercase leading-[0.9] text-3xl font-medium text-white tracking-tight font-bricolage" data-animation="up" data-delay="100">
            {t.contact.title1} <span className="text-neutral-600">{t.contact.titleAccent}</span> {t.contact.title2}
          </h2>
          <p className="animate-on-scroll text-sm md:text-base text-neutral-400 font-normal uppercase tracking-wide max-w-xl" data-animation="up" data-delay="150">
            {t.contact.description}
          </p>
          <div className="animate-on-scroll flex flex-wrap justify-center gap-4" data-animation="up" data-delay="200">
            <a href="mailto:peter23xp@gmail.com" className="group flex items-center gap-2 overflow-hidden uppercase transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] text-sm font-medium text-white tracking-widest rounded-full pt-5 pr-10 pb-5 pl-10 relative">
              <div className="absolute inset-0 -z-20 rounded-full overflow-hidden p-[1px]">
                <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#3b82f6_360deg)]" style={{animation:'beam-spin 3s linear infinite'}}></div>
                <div className="absolute inset-[1px] rounded-full bg-neutral-950"></div>
              </div>
              <div className="-z-10 overflow-hidden bg-neutral-950 rounded-full absolute top-[2px] right-[2px] bottom-[2px] left-[2px]">
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/60 to-transparent"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-colors"></div>
              </div>
              <iconify-icon icon="solar:letter-bold-duotone" class="relative z-10 text-blue-400" style={{fontSize:'1rem'}}></iconify-icon>
              <span className="relative z-10">{t.contact.email}</span>
            </a>
            <a href="https://www.linkedin.com/in/peter-akilimali-1a7016282/" target="_blank" rel="noopener noreferrer" className="animate-on-scroll px-6 py-4 rounded-full border border-neutral-700 text-[0.7rem] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-2" data-animation="up" data-delay="250">
              <iconify-icon icon="simple-icons:linkedin" class="text-blue-400" style={{fontSize:'1rem'}}></iconify-icon>
              LinkedIn
            </a>
            <a href="https://wa.me/243902238740" target="_blank" rel="noopener noreferrer" className="animate-on-scroll px-6 py-4 rounded-full border border-neutral-700 text-[0.7rem] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-2" data-animation="up" data-delay="300">
              <iconify-icon icon="solar:chat-round-bold-duotone" class="text-emerald-400" style={{fontSize:'1rem'}}></iconify-icon>
              {t.contact.whatsapp}
            </a>
            <a href="/peterCv.pdf" download className="animate-on-scroll px-6 py-4 rounded-full border border-neutral-700 text-[0.7rem] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-2" data-animation="up" data-delay="350">
              <iconify-icon icon="solar:download-bold-duotone" class="text-orange-400" style={{fontSize:'1rem'}}></iconify-icon>
              {t.contact.cvPdf}
            </a>
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="bg-neutral-950 w-full border-white/5 rounded-3xl border-t mt-0 pt-24 pb-12 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-gradient-to-t from-emerald-900/10 to-transparent blur-[100px] pointer-events-none"></div>
        <div className="max-w-[90rem] mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
            <div className="flex flex-col gap-6">
              <a href="#" className="text-2xl font-bold tracking-tight text-white">Peter<span className="text-indigo-400">.</span></a>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-xs font-space">
                {t.footer.tagline}
              </p>
              <div className="flex items-center gap-4 mt-2">
                {[
                  {href:'https://www.linkedin.com/in/peter-akilimali-1a7016282/',icon:'simple-icons:linkedin'},
                  {href:'tel:+243902238740',icon:'solar:phone-bold-duotone'},
                  {href:'mailto:peter23xp@gmail.com',icon:'solar:letter-bold-duotone'},
                ].map(({href,icon}) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-all duration-300">
                    <iconify-icon icon={icon} style={{fontSize:'1.25rem'}}></iconify-icon>
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-2">{t.footer.nav}</h4>
              {t.footer.navLinks.map(([href,label]) => (
                <a key={href} href={href} className="text-neutral-400 hover:text-emerald-400 text-sm transition-colors w-max">{label}</a>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-2">{t.footer.stack}</h4>
              {['React / Next.js','Node.js','PostgreSQL / MySQL','Solidity / Web3'].map(item => (
                <span key={item} className="text-neutral-400 text-sm">{item}</span>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-2">{t.footer.stage}</h4>
              <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 relative overflow-hidden">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-[0.65rem] mb-3 uppercase tracking-widest">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {t.footer.stageAvailable}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed font-medium">{t.footer.stageDesc}</p>
              </div>
            </div>
          </div>
          <div className="w-full border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <iconify-icon icon="simple-icons:vercel" class="text-white" style={{fontSize:'1.5rem'}}></iconify-icon>
              <iconify-icon icon="simple-icons:react" class="text-white" style={{fontSize:'1.5rem'}}></iconify-icon>
              <iconify-icon icon="simple-icons:tailwindcss" class="text-white" style={{fontSize:'1.5rem'}}></iconify-icon>
              <iconify-icon icon="simple-icons:ethereum" class="text-white" style={{fontSize:'1.5rem'}}></iconify-icon>
            </div>
            <p className="text-neutral-600 text-xs font-medium uppercase tracking-wider">
              {t.footer.copyright}
            </p>
          </div>
        </div>
      </footer>

      {/* Decorative spinning ring */}
      <div className="hidden lg:flex w-32 h-32 border-neutral-700/30 border rounded-full absolute right-[25%] bottom-[20%] items-center justify-center" style={{animation:'spin 10s linear infinite'}}>
        <div className="w-full h-[1px] bg-neutral-700/30"></div>
      </div>

      {/* README Modal */}
      {readmeRepo && (
        <RepoModal repo={readmeRepo} onClose={() => setReadmeRepo(null)} lang={lang} />
      )}
    </main>
  );
}

export default App;
