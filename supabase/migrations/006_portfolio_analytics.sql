-- 006 — Mesure d'audience du portfolio (page Analytics de l'admin).
--
-- Aucune donnée personnelle : pas d'adresse IP, pas de cookie. Un identifiant
-- de visite aléatoire (sessionStorage) permet de compter les visites.
-- Les visiteurs peuvent seulement AJOUTER un évènement (types et tailles
-- contrôlés) ; seul le compte admin peut LIRE ou supprimer.
-- Nécessite la migration 005 (fonction is_portfolio_admin).

create table if not exists portfolio_events (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  type          text not null,
  label         text,
  path          text,
  session_id    text,
  referrer_host text,
  device        text,
  lang          text
);

create index if not exists idx_portfolio_events_created on portfolio_events (created_at desc);
create index if not exists idx_portfolio_events_type on portfolio_events (type, created_at desc);

alter table portfolio_events enable row level security;

drop policy if exists "Events public insert" on portfolio_events;
create policy "Events public insert" on portfolio_events for insert to anon, authenticated
  with check (
    type in ('page_view', 'cv_view', 'cv_download', 'contact_click', 'case_view', 'context_select', 'project_click')
    and coalesce(length(label), 0) <= 80
    and coalesce(length(path), 0) <= 120
    and coalesce(length(session_id), 0) <= 40
    and coalesce(length(referrer_host), 0) <= 80
    and coalesce(device, 'desktop') in ('mobile', 'desktop')
    and coalesce(length(lang), 0) <= 5
  );

drop policy if exists "Events admin read" on portfolio_events;
create policy "Events admin read" on portfolio_events for select to authenticated
  using (public.is_portfolio_admin());

drop policy if exists "Events admin delete" on portfolio_events;
create policy "Events admin delete" on portfolio_events for delete to authenticated
  using (public.is_portfolio_admin());

-- Nettoyage optionnel : garder 13 mois d'historique
-- delete from portfolio_events where created_at < now() - interval '13 months';
