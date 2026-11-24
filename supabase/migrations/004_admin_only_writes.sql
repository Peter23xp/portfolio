-- 004 — Écriture réservée au seul compte admin.
--
-- Avant : la policy "Admin full access" autorisait tout utilisateur connecté
-- (auth.role() = 'authenticated'). Comme les inscriptions sont ouvertes sur le
-- projet et que la clé anon est publique (bundle du site), n'importe qui
-- pouvait créer un compte puis modifier, masquer ou supprimer les projets.
--
-- Après : seul l'email admin peut écrire. La lecture publique (policy
-- "Portfolio public read", migration 003) est inchangée.
--
-- À compléter côté tableau de bord Supabase :
--   Authentication → Sign In / Providers → désactiver « Allow new users to sign up ».

drop policy if exists "Admin full access" on portfolio_projects;

create policy "Admin full access"
  on portfolio_projects
  for all
  to authenticated
  using ((auth.jwt() ->> 'email') = 'peter23xp@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'peter23xp@gmail.com');
