# Product

## Register

product

## Users

Peter Akilimali — ingénieur logiciel full-stack, seul utilisateur de l'admin. Contexte : session privée, occasionnelle, depuis un poste de dev. L'interface doit disparaître dans la tâche : categoriser des repos GitHub via drag & drop sans friction.

## Product Purpose

Admin panel pour le portfolio peterakilimali.site. Permet de synchroniser les repos GitHub et de les classer par catégorie (Livré, Hackathon, Personnel, Contribution, Caché) via un tableau kanban drag & drop. Les catégories sont persistées dans Supabase et lues par le portfolio public.

## Brand Personality

Technique. Dense. Confiant. L'admin hérite de l'esthétique sombre du portfolio public (neutral-950, Satoshi + Clash Display), avec une couleur d'accent violet/indigo et une inspiration Linear : compact, orienté clavier, aucun chrome superflu.

## Anti-references

- Dashboards SaaS génériques (cream/sand/beige, bulles de gradients, cartes identiques en grille).
- Notions de "onboarding" — l'utilisateur unique connaît son outil.
- Motion orchestré au chargement de page.
- Toute forme de glassmorphism décoratif.

## Design Principles

1. **L'outil disparaît dans la tâche.** Chaque pixel justifié par une action ou une information. Aucune décoration.
2. **Consistance sur la surprise.** Le même vocabulaire visuel sur chaque composant. La délight vient de la fluidité, pas de l'ornement.
3. **Densité intentionnelle.** Compact comme Linear — voir plus de repos à l'écran est une feature.
4. **L'état parle.** Hover, drag, drop, syncing, featured : chaque état est lisible immédiatement, sans ambiguïté.
5. **Dark natif.** Le fond très sombre n'est pas un mode — c'est l'identité. Contraste texte minimum 7:1.

## Accessibility & Inclusion

WCAG AA minimum. Contraste ≥ 4.5:1 pour le corps, ≥ 7:1 visé pour les labels clés. prefers-reduced-motion respecté sur toutes les transitions. Focus visible sur tous les contrôles interactifs.
