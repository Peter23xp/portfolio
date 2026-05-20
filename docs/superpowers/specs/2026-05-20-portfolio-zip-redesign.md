# Portfolio Redesign — ZIP Theme Migration

**Date:** 2026-05-20  
**Status:** Approved  

---

## Objectif

Migrer le portfolio actuel (`index.html` Vanilla JS) vers le design du fichier `Job-Board-Landing-Page-Template.zip` à 100% — structure, animations, typographie, couleurs identiques — en substituant les données TalentHub par les données de Peter Akilimali.

---

## Stack Cible

| Aspect | Actuel | Cible |
|--------|--------|-------|
| Framework | Vanilla JS | React 18 + Vite 5 |
| Styles | Tailwind CDN | Tailwind 3 (PostCSS) |
| Icônes | Phosphor Icons | Iconify-icon (Solar duotone) |
| Fonts | Outfit | Space Grotesk + Oswald + Bricolage Grotesque |
| Déploiement | Vercel (statique) | Vercel (Vite build) |

**Règle absolue : zéro emoji dans le code ou l'interface — uniquement des icônes Iconify/Solar.**

---

## Architecture

```
D:/PORTFOLIO P/
├── index.html              # Point d'entrée Vite (remplace l'actuel)
├── src/
│   ├── main.jsx            # Entrée React (remplace main.js)
│   ├── App.jsx             # Composant principal (basé sur ZIP App.jsx)
│   └── index.css           # Styles globaux (basé sur ZIP index.css)
├── public/
│   ├── peter.jpeg          # Photo (existante)
│   └── peterCv.pdf         # CV (existant)
├── tailwind.config.js      # Config ZIP (avec plugin rotate-x/y/z + perspective)
├── vite.config.js          # Config Vite + React plugin
├── package.json            # Dépendances ZIP
├── postcss.config.js       # PostCSS
└── vercel.json             # Config déploiement (conserver l'existant)
```

**Fichiers archivés (git, pas supprimés) :**
- `index.html` → renommé `index.html.bak` avant écrasement
- `src/main.js`, `src/style.css`, `src/translations.js`, `src/counter.js` → conservés dans git

---

## Sections & Contenu

### 1. Hero (structure 100% ZIP)

**Structure ZIP conservée :**
- Container principal : `bg-neutral-950`, `xl:rounded-[3.5rem]`, `border-gradient`, `xl:shadow-2xl`
- Image background droite : `w-1/2 h-[960px]` → remplacée par `/peter.jpeg`
- Lignes verticales décoratives : identiques
- Animations `animate-on-scroll` avec IntersectionObserver : identiques

**Données Peter substituées :**
- Logo : icône Iconify personnalisée (même position ZIP)
- Nav links : `Projets · Expertise · Parcours · Contact` (+ bouton `CV PDF`)
- Badge avatars : "Ouvert aux stages 2026 · Gisenyi, Rwanda"
- Floating labels : `Remote Friendly` · `ULK 2027` · `Full-Stack`
- Typo massive : **"Your Creative Journey"** — conservée telle quelle (texte ZIP)
- CTA beam button : `Me Contacter` + `Voir GitHub`
- 3 feature cards marquee :
  - Card 1 : Stack tech (React, Node.js, Web3, Solidity, PostgreSQL)
  - Card 2 : Projets (GitHub, Vercel, ULK)
  - Card 3 : Contacts (Email, LinkedIn, WhatsApp, GitHub)

### 2. Expertise (remplace "Matching Engine" du ZIP)

**Structure ZIP conservée :** titre uppercase, 2 grandes cards `h-[600px]` avec grille de fond, SVG/noodles animés, floating tech pills, 2 cards secondaires.

**Données Peter :**
- Card 1 : Ingénierie d'Application — icône `solar:code-square-bold-duotone` (vert), flow tags Full-Stack → React/Node → API Design, pills React/Node.js/PostgreSQL
- Card 2 : Expertise Blockchain — icône `solar:layers-bold-duotone` (bleu), UI mockup "Smart Contract Deploy" style Filter Rules ZIP
- Card 3 : Informatique en Gestion — icône `solar:monitor-bold-duotone` (violet), tags ERP/CRM/Audit
- Card 4 : Analyse Stratégique — icône `solar:chart-2-bold-duotone` (purple), tags Business/ROI/Stratégie

### 3. Projets GitHub (remplace "Venture Backed" du ZIP)

**Structure ZIP conservée :** 4 cards lévitation avec décalage alterné (`lg:mt-12`), icône large en fond (opacity 40%), border `border-white/5`, hover `border-white/20`, animations `animate-levitate` et `animate-levitate-delayed`.

**Données dynamiques :** API GitHub `https://api.github.com/users/Peter23xp/repos?sort=updated&per_page=100`

Chaque card affiche :
- Langage (badge top-left)
- Étoiles (top-right, icône `solar:star-bold-duotone`)
- Icône repo en fond (opacity 40%)
- Nom du repo (grand, bas)
- Description courte (ou lien README)
- Lien vers GitHub (flèche)

Grille responsive : 1 col mobile → 2 col md → 4 col lg (ou adapté au nombre de repos).

### 4. Parcours (remplace "Statistics" du ZIP)

**Structure ZIP conservée :** layout `lg:grid-cols-12`, col-5 dark avec dot pattern + texte, col-7 blanc avec lignes horizontales séparant les items.

**Données Peter :**
- Panel gauche dark : "Mon évolution, Simplifiée." + lien "Voir CV complet"
- Panel droit blanc : 4 milestones avec icônes Solar + badges colorés
  1. ULK 2023–2027 — `solar:graduation-cap-bold-duotone` — badge "Présent" vert
  2. Support Technique 2021–2023 — `solar:cpu-bolt-bold-duotone` — badge "Expérience" bleu
  3. Diplôme Commercial Avant 2021 — `solar:chart-2-bold-duotone` — badge "Fondation" violet
  4. Stage 2026 — `solar:rocket-bold-duotone` — badge "Ouvert" orange animé (pulse)

### 5. Contact (adapté du ZIP Footer CTA)

- Badge "Ouvert aux Opportunités Professionnelles"
- Titre : "Bâtissons la Prochaine Grande Solution"
- Description Peter (stage 2026, ULK, Gisenyi/Goma)
- 4 boutons pills style ZIP : Email (`peter23xp@gmail.com`) · LinkedIn · WhatsApp (`+243902238740`) · CV PDF

### 6. Footer (structure ZIP conservée)

- 4 colonnes : Brand+réseaux sociaux · Navigation · Stack tech · Status Stage 2026
- Barre bas : logos tech grayed out (Vercel, React, Tailwind, Ethereum) + copyright "2025 Peter Akilimali · Gisenyi, Rwanda / Goma, RDC"

---

## Animations (identiques au ZIP)

- `IntersectionObserver` avec `animate-on-scroll` : `animate-up`, `animate-left`, `animate-right`, `animate-fade`
- `marquee-up` : cartes feature hero (scroll vertical infini)
- `beam-spin` : bouton CTA principal (border animée)
- `dots-move` : texture dots dans CTA
- `levitate` + `levitate-delayed` : cards projets GitHub
- `flow-noodle` : SVG animés dans cards Expertise

---

## SEO & Meta

Conserver toutes les balises meta du `index.html` actuel :
- `<title>Peter Akilimali | Ingénieur Logiciel & Architecte Business</title>`
- Open Graph, Twitter Card, canonical, sitemap, robots
- Google Fonts : Space Grotesk + Oswald + Bricolage Grotesque (remplace Outfit)

---

## Dépendances (package.json ZIP)

```json
{
  "dependencies": {
    "iconify-icon": "^2.1.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "tailwindcss": "^3.4.10",
    "vite": "^5.4.1",
    "postcss": "^8.4.41"
  }
}
```

---

## Contraintes

- Zéro emoji dans le code ou l'interface — icônes Iconify/Solar uniquement
- `vercel.json` conservé tel quel
- `public/peter.jpeg` et `public/peterCv.pdf` conservés
- `.gitignore` mis à jour pour inclure `.superpowers/`
- L'ancien `index.html` archivé dans git avant écrasement

---

## Critères de Succès

- Rendu visuel identique au ZIP à 100%
- API GitHub charge les repos de `Peter23xp` dynamiquement
- Toutes les animations du ZIP fonctionnent (marquee, beam, levitate, flow-noodle)
- Déploiement Vercel réussi (`npm run build` sans erreur)
- SEO meta tags préservés
