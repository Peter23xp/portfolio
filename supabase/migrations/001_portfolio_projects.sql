-- supabase/migrations/001_portfolio_projects.sql
-- Table de persistance des projets du portfolio + catégorisation admin.
-- Le portfolio public lit cette table (RLS), l'admin la modifie (auth.role = authenticated).

create table if not exists portfolio_projects (
  id            uuid primary key default gen_random_uuid(),
  github_id     bigint unique not null,
  repo_name     varchar(255) not null,
  full_name     varchar(255) not null,
  description   text,
  html_url      varchar(500) not null,
  homepage      varchar(500),
  language      varchar(100),
  stars         int default 0,
  forks         int default 0,
  topics        text[] default '{}',
  category      varchar(50) not null default 'non_classe',
  display_order int default 0,
  is_featured   boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_portfolio_projects_category
  on portfolio_projects(category);

create index if not exists idx_portfolio_projects_order
  on portfolio_projects(category, display_order);

-- Trigger : met à jour updated_at à chaque UPDATE
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists portfolio_projects_updated_at on portfolio_projects;

create trigger portfolio_projects_updated_at
  before update on portfolio_projects
  for each row execute function update_updated_at_column();

-- RLS : lecture publique (hors 'cache'), écriture admin uniquement
alter table portfolio_projects enable row level security;

drop policy if exists "Portfolio public read" on portfolio_projects;
create policy "Portfolio public read"
  on portfolio_projects for select
  using (category != 'cache');

drop policy if exists "Admin full access" on portfolio_projects;
create policy "Admin full access"
  on portfolio_projects for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
