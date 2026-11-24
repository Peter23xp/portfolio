// src/lib/content.js
// Contenu éditable du portfolio (admin → Supabase), lu par le site public via
// l'API REST (sans supabase-js). Chaque partie a une valeur par défaut = le
// contenu d'origine du site : si Supabase ne répond pas ou si la migration 005
// n'est pas encore appliquée, le site reste complet.

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const DEFAULT_CONTENT = {
  showcase: [
    {
      slug: 'chadito', name: 'Chadito', category: 'livre',
      tagline_fr: 'L’application de petites annonces du Tchad.',
      tagline_en: 'The classifieds app for Chad.',
      body_fr: 'Voitures, logements, terrains, emplois, services : on publie gratuitement et on contacte directement le vendeur. Comptes particuliers et comptes commerciaux.',
      body_en: 'Cars, housing, land, jobs, services: post for free and contact the seller directly. Personal and business accounts.',
      role_fr: '', role_en: '',
      platforms: 'iOS · Android · Web', stack: ['React Native'],
      site_url: 'https://chadito.net',
      ios_url: 'https://apps.apple.com/rw/app/chadito/id6757854742',
      android_url: 'https://play.google.com/store/apps/details?id=com.chadito.app',
      github_url: '', icon_url: '/chadito/chadito-icon.webp',
      screenshots: [
        { url: '/chadito/chadito-1.webp', alt_fr: 'Écran d’accueil de Chadito', alt_en: 'Chadito welcome screen' },
        { url: '/chadito/chadito-2.webp', alt_fr: 'Choix du type de compte, standard ou commercial', alt_en: 'Account type choice, standard or business' },
        { url: '/chadito/chadito-3.webp', alt_fr: 'Accueil du catalogue avec les catégories d’annonces', alt_en: 'Catalogue home with listing categories' },
      ],
      is_featured: true, display_order: 0,
    },
    {
      slug: 'progress-business', name: 'Progress Business', category: 'livre',
      tagline_fr: 'Application de gestion d’entreprise : ERP et CRM.',
      tagline_en: 'Business management application: ERP and CRM.',
      body_fr: '', body_en: '', role_fr: '', role_en: '',
      platforms: 'Web', stack: ['React'],
      site_url: 'https://progress-business.vercel.app/', ios_url: '', android_url: '', github_url: '', icon_url: '',
      screenshots: [], is_featured: false, display_order: 1,
    },
    {
      slug: 'forever-united', name: 'Forever United', category: 'livre',
      tagline_fr: 'Plateforme web pour le bénévolat et les œuvres caritatives.',
      tagline_en: 'Web platform for volunteering and charity work.',
      body_fr: '', body_en: '', role_fr: '', role_en: '',
      platforms: 'Web', stack: [],
      site_url: 'https://forever-united.vercel.app/', ios_url: '', android_url: '', github_url: '', icon_url: '',
      screenshots: [], is_featured: false, display_order: 2,
    },
  ],
  timeline: [
    { period_fr: 'Avant 2021', period_en: 'Before 2021', title_fr: 'Diplôme commercial & gestion', title_en: 'Business & management diploma', detail_fr: 'Économie, comptabilité : les bases du métier de mes clients.', detail_en: 'Economics and accounting: the groundwork of my clients’ trade.' },
    { period_fr: '2021 – 2023', period_en: '2021 – 2023', title_fr: 'Support technique & systèmes', title_en: 'Technical support & systems', detail_fr: 'Maintenance, optimisation, terrain.', detail_en: 'Maintenance, optimisation, field work.' },
    { period_fr: 'Depuis 2023', period_en: 'Since 2023', title_fr: 'Ingénierie logicielle — ULK', title_en: 'Software engineering — ULK', detail_fr: 'Kigali. Architecture système et développement.', detail_en: 'Kigali. System architecture and development.' },
    { period_fr: 'Aujourd’hui', period_en: 'Today', title_fr: 'Consultant logiciel', title_en: 'Software consultant', detail_fr: 'Projets clients, freelance, ouvert aux postes.', detail_en: 'Client projects, freelance, open to roles.' },
  ],
  settings: {
    profile: {
      available: true,
      role_fr: 'Ingénieur logiciel full-stack', role_en: 'Full-stack software engineer',
      location_fr: 'Gisenyi, Rwanda · Goma, RDC · remote', location_en: 'Gisenyi, Rwanda · Goma, DRC · remote',
    },
    hero: {
      lede_fr: {
        neutral: 'Je conçois et livre des produits complets — web, iOS, Android — et les systèmes de gestion qui les font tourner.',
        recruit: 'React, React Native, Node.js, PostgreSQL, Solidity. Formé en ingénierie logicielle à l’ULK, disponible en remote.',
        client: 'Une application mobile, un site ou un ERP pour votre structure : je le conçois, je le construis et je le mets en ligne.',
      },
      lede_en: {
        neutral: 'I design and ship complete products — web, iOS, Android — and the management systems that run behind them.',
        recruit: 'React, React Native, Node.js, PostgreSQL, Solidity. Software engineering at ULK, available for remote work.',
        client: 'A mobile app, a website or an ERP for your organisation: I design it, build it and put it live.',
      },
    },
    contact: {
      email: 'peter23xp@gmail.com',
      whatsapp: 'https://wa.me/243902238740', whatsapp_label: '+243 902 238 740',
      linkedin: 'https://www.linkedin.com/in/peter-akilimali-1a7016282/',
      github: 'https://github.com/Peter23xp',
      cv_url: '/peterCv.pdf',
    },
    expertise: {
      stack: ['React / Next.js', 'React Native', 'Node.js', 'PostgreSQL / MySQL', 'Solidity'],
      domains: [
        { key: 'apps', title_fr: 'Applications web & mobile', title_en: 'Web & mobile apps', body_fr: 'Des produits complets, de l’architecture au déploiement en store : interfaces, API, bases de données.', body_en: 'Complete products, from architecture to store release: interfaces, APIs, databases.', tags: ['React / Next.js', 'React Native', 'Node.js', 'API'] },
        { key: 'web3', title_fr: 'Blockchain & Web3', title_en: 'Blockchain & Web3', body_fr: 'Smart contracts et applications décentralisées, avec un souci de sécurité et de transparence des données.', body_en: 'Smart contracts and decentralised apps, built with security and data transparency in mind.', tags: ['Solidity', 'Smart contracts', 'dApps'] },
        { key: 'erp', title_fr: 'Systèmes de gestion', title_en: 'Management systems', body_fr: 'ERP et CRM sur mesure, analyse des systèmes existants, audit numérique.', body_en: 'Custom ERP and CRM, analysis of existing systems, digital audits.', tags: ['ERP / CRM', 'PostgreSQL / MySQL', 'Audit'] },
        { key: 'strategy', title_fr: 'Analyse stratégique', title_en: 'Strategic analysis', body_fr: 'Structurer l’activité, mesurer le retour sur investissement, optimiser les processus avant d’écrire du code.', body_en: 'Structuring the business, measuring ROI, optimising processes before writing code.', tags: ['Processus', 'ROI', 'Stratégie tech'] },
      ],
    },
  },
};

const rest = async (path) => {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
};

// Fusion profonde simple : les réglages en base complètent / remplacent les défauts.
const merge = (base, over) => {
  if (Array.isArray(base) || Array.isArray(over)) return over ?? base;
  if (base && typeof base === 'object' && over && typeof over === 'object') {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
    return out;
  }
  return over ?? base;
};

// Chaque partie échoue indépendamment et retombe sur sa valeur par défaut.
export async function fetchContent() {
  if (!url || !anonKey) return DEFAULT_CONTENT;
  const [showcase, timeline, settings] = await Promise.allSettled([
    rest('portfolio_showcase?select=*&published=eq.true&order=display_order.asc'),
    rest('portfolio_timeline?select=*&published=eq.true&order=display_order.asc'),
    rest('portfolio_settings?select=key,value'),
  ]);
  const content = { ...DEFAULT_CONTENT };
  if (showcase.status === 'fulfilled' && showcase.value.length) content.showcase = showcase.value;
  if (timeline.status === 'fulfilled' && timeline.value.length) content.timeline = timeline.value;
  if (settings.status === 'fulfilled' && settings.value.length) {
    const map = Object.fromEntries(settings.value.map((r) => [r.key, r.value]));
    content.settings = merge(DEFAULT_CONTENT.settings, map);
  }
  return content;
}

// Champ bilingue : prend la langue demandée, sinon l'autre.
export const pick = (obj, field, lang) => obj?.[`${field}_${lang}`] || obj?.[`${field}_${lang === 'fr' ? 'en' : 'fr'}`] || '';
