-- supabase/migrations/002_add_is_private.sql
-- Ajoute le flag is_private pour distinguer les repos privés dans l'admin.

alter table portfolio_projects
  add column if not exists is_private boolean default false;
