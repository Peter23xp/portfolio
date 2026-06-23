-- supabase/migrations/003_fix_rls_private.sql
-- Corrige la politique RLS pour exclure les dépôts privés de la lecture publique.
-- is_private a été ajouté dans 002 mais la politique n'avait pas été mise à jour.

drop policy if exists "Portfolio public read" on portfolio_projects;

create policy "Portfolio public read"
  on portfolio_projects for select
  using (category != 'cache' AND is_private = false);
