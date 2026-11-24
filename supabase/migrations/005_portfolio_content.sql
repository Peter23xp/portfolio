-- 005 — Contenu du portfolio éditable depuis l'admin.
--
--   portfolio_showcase  : projets « vitrine » ajoutés à la main (hors GitHub),
--                         avec captures, liens stores, étude de cas FR/EN.
--                         is_featured = affiché dans le bloc « projets phares ».
--   portfolio_timeline  : étapes du parcours.
--   portfolio_settings  : textes et réglages (clé → JSON) : profil, accroches,
--                         contact, expertise, stack.
--   bucket portfolio-media : captures d'écran et CV (lecture publique).
--
-- Écriture réservée au compte admin (même règle que la migration 004).
-- Les données de départ reprennent exactement le contenu actuel du site.

-- ── Qui est admin ─────────────────────────────────────────────────────────────
create or replace function public.is_portfolio_admin()
returns boolean
language sql stable
as $$ select coalesce(auth.jwt() ->> 'email', '') = 'peter23xp@gmail.com' $$;

-- ── Projets vitrine ───────────────────────────────────────────────────────────
create table if not exists portfolio_showcase (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  category      text not null default 'livre',
  tagline_fr    text default '',
  tagline_en    text default '',
  body_fr       text default '',
  body_en       text default '',
  role_fr       text default '',
  role_en       text default '',
  platforms     text default '',
  stack         text[] default '{}',
  site_url      text default '',
  ios_url       text default '',
  android_url   text default '',
  github_url    text default '',
  icon_url      text default '',
  -- [{ "url": "...", "alt_fr": "...", "alt_en": "..." }]
  screenshots   jsonb not null default '[]'::jsonb,
  is_featured   boolean not null default false,
  published     boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

drop trigger if exists portfolio_showcase_updated_at on portfolio_showcase;
create trigger portfolio_showcase_updated_at
  before update on portfolio_showcase
  for each row execute function update_updated_at_column();

alter table portfolio_showcase enable row level security;
drop policy if exists "Showcase public read" on portfolio_showcase;
create policy "Showcase public read" on portfolio_showcase for select using (published);
drop policy if exists "Showcase admin all" on portfolio_showcase;
create policy "Showcase admin all" on portfolio_showcase for all to authenticated
  using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

-- ── Parcours ──────────────────────────────────────────────────────────────────
create table if not exists portfolio_timeline (
  id            uuid primary key default gen_random_uuid(),
  period_fr     text not null default '',
  period_en     text not null default '',
  title_fr      text not null default '',
  title_en      text not null default '',
  detail_fr     text default '',
  detail_en     text default '',
  published     boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

drop trigger if exists portfolio_timeline_updated_at on portfolio_timeline;
create trigger portfolio_timeline_updated_at
  before update on portfolio_timeline
  for each row execute function update_updated_at_column();

alter table portfolio_timeline enable row level security;
drop policy if exists "Timeline public read" on portfolio_timeline;
create policy "Timeline public read" on portfolio_timeline for select using (published);
drop policy if exists "Timeline admin all" on portfolio_timeline;
create policy "Timeline admin all" on portfolio_timeline for all to authenticated
  using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

-- ── Réglages & textes ─────────────────────────────────────────────────────────
create table if not exists portfolio_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

drop trigger if exists portfolio_settings_updated_at on portfolio_settings;
create trigger portfolio_settings_updated_at
  before update on portfolio_settings
  for each row execute function update_updated_at_column();

alter table portfolio_settings enable row level security;
drop policy if exists "Settings public read" on portfolio_settings;
create policy "Settings public read" on portfolio_settings for select using (true);
drop policy if exists "Settings admin all" on portfolio_settings;
create policy "Settings admin all" on portfolio_settings for all to authenticated
  using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

-- ── Stockage des médias (captures, icônes, CV) ───────────────────────────────
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Portfolio media admin insert" on storage.objects;
create policy "Portfolio media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());
drop policy if exists "Portfolio media admin update" on storage.objects;
create policy "Portfolio media admin update" on storage.objects for update to authenticated
  using (bucket_id = 'portfolio-media' and public.is_portfolio_admin());
drop policy if exists "Portfolio media admin delete" on storage.objects;
create policy "Portfolio media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

-- ── Données de départ (= contenu actuel du site) ─────────────────────────────
insert into portfolio_showcase
  (slug, name, category, tagline_fr, tagline_en, body_fr, body_en, platforms, stack,
   site_url, ios_url, android_url, icon_url, screenshots, is_featured, display_order)
values
  ('chadito', 'Chadito', 'livre',
   'L’application de petites annonces du Tchad.',
   'The classifieds app for Chad.',
   'Voitures, logements, terrains, emplois, services : on publie gratuitement et on contacte directement le vendeur. Comptes particuliers et comptes commerciaux.',
   'Cars, housing, land, jobs, services: post for free and contact the seller directly. Personal and business accounts.',
   'iOS · Android · Web', '{React Native}',
   'https://chadito.net', 'https://apps.apple.com/rw/app/chadito/id6757854742',
   'https://play.google.com/store/apps/details?id=com.chadito.app',
   '/chadito/chadito-icon.webp',
   '[{"url":"/chadito/chadito-1.webp","alt_fr":"Écran d’accueil de Chadito","alt_en":"Chadito welcome screen"},
     {"url":"/chadito/chadito-2.webp","alt_fr":"Choix du type de compte, standard ou commercial","alt_en":"Account type choice, standard or business"},
     {"url":"/chadito/chadito-3.webp","alt_fr":"Accueil du catalogue avec les catégories d’annonces","alt_en":"Catalogue home with listing categories"}]'::jsonb,
   true, 0),
  ('progress-business', 'Progress Business', 'livre',
   'Application de gestion d’entreprise : ERP et CRM.',
   'Business management application: ERP and CRM.',
   '', '', 'Web', '{React}',
   'https://progress-business.vercel.app/', '', '', '', '[]'::jsonb, false, 1),
  ('forever-united', 'Forever United', 'livre',
   'Plateforme web pour le bénévolat et les œuvres caritatives.',
   'Web platform for volunteering and charity work.',
   '', '', 'Web', '{}',
   'https://forever-united.vercel.app/', '', '', '', '[]'::jsonb, false, 2)
on conflict (slug) do nothing;

insert into portfolio_timeline (period_fr, period_en, title_fr, title_en, detail_fr, detail_en, display_order)
select * from (values
  ('Avant 2021', 'Before 2021', 'Diplôme commercial & gestion', 'Business & management diploma',
   'Économie, comptabilité : les bases du métier de mes clients.', 'Economics and accounting: the groundwork of my clients’ trade.', 0),
  ('2021 – 2023', '2021 – 2023', 'Support technique & systèmes', 'Technical support & systems',
   'Maintenance, optimisation, terrain.', 'Maintenance, optimisation, field work.', 1),
  ('Depuis 2023', 'Since 2023', 'Ingénierie logicielle — ULK', 'Software engineering — ULK',
   'Kigali. Architecture système et développement.', 'Kigali. System architecture and development.', 2),
  ('Aujourd’hui', 'Today', 'Consultant logiciel', 'Software consultant',
   'Projets clients, freelance, ouvert aux postes.', 'Client projects, freelance, open to roles.', 3)
) as v
where not exists (select 1 from portfolio_timeline);

insert into portfolio_settings (key, value) values
  ('profile', '{
     "available": true,
     "role_fr": "Ingénieur logiciel full-stack", "role_en": "Full-stack software engineer",
     "location_fr": "Gisenyi, Rwanda · Goma, RDC · remote", "location_en": "Gisenyi, Rwanda · Goma, DRC · remote"
   }'::jsonb),
  ('hero', '{
     "lede_fr": {
       "neutral": "Je conçois et livre des produits complets — web, iOS, Android — et les systèmes de gestion qui les font tourner.",
       "recruit": "React, React Native, Node.js, PostgreSQL, Solidity. Formé en ingénierie logicielle à l’ULK, disponible en remote.",
       "client": "Une application mobile, un site ou un ERP pour votre structure : je le conçois, je le construis et je le mets en ligne."
     },
     "lede_en": {
       "neutral": "I design and ship complete products — web, iOS, Android — and the management systems that run behind them.",
       "recruit": "React, React Native, Node.js, PostgreSQL, Solidity. Software engineering at ULK, available for remote work.",
       "client": "A mobile app, a website or an ERP for your organisation: I design it, build it and put it live."
     }
   }'::jsonb),
  ('contact', '{
     "email": "peter23xp@gmail.com",
     "whatsapp": "https://wa.me/243902238740", "whatsapp_label": "+243 902 238 740",
     "linkedin": "https://www.linkedin.com/in/peter-akilimali-1a7016282/",
     "github": "https://github.com/Peter23xp",
     "cv_url": "/peterCv.pdf"
   }'::jsonb),
  ('expertise', '{
     "stack": ["React / Next.js", "React Native", "Node.js", "PostgreSQL / MySQL", "Solidity"],
     "domains": [
       {"key": "apps", "title_fr": "Applications web & mobile", "title_en": "Web & mobile apps",
        "body_fr": "Des produits complets, de l’architecture au déploiement en store : interfaces, API, bases de données.",
        "body_en": "Complete products, from architecture to store release: interfaces, APIs, databases.",
        "tags": ["React / Next.js", "React Native", "Node.js", "API"]},
       {"key": "web3", "title_fr": "Blockchain & Web3", "title_en": "Blockchain & Web3",
        "body_fr": "Smart contracts et applications décentralisées, avec un souci de sécurité et de transparence des données.",
        "body_en": "Smart contracts and decentralised apps, built with security and data transparency in mind.",
        "tags": ["Solidity", "Smart contracts", "dApps"]},
       {"key": "erp", "title_fr": "Systèmes de gestion", "title_en": "Management systems",
        "body_fr": "ERP et CRM sur mesure, analyse des systèmes existants, audit numérique.",
        "body_en": "Custom ERP and CRM, analysis of existing systems, digital audits.",
        "tags": ["ERP / CRM", "PostgreSQL / MySQL", "Audit"]},
       {"key": "strategy", "title_fr": "Analyse stratégique", "title_en": "Strategic analysis",
        "body_fr": "Structurer l’activité, mesurer le retour sur investissement, optimiser les processus avant d’écrire du code.",
        "body_en": "Structuring the business, measuring ROI, optimising processes before writing code.",
        "tags": ["Processus", "ROI", "Stratégie tech"]}
     ]
   }'::jsonb)
on conflict (key) do nothing;
