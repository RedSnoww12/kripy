# Kripy — Precision Lab

![Status](https://img.shields.io/badge/status-V2%20stable-6AEFAF) ![Tests](https://img.shields.io/badge/tests-90%20passing-6AEFAF) ![Stack](https://img.shields.io/badge/React%2019-%2B%20Vite%206-4DD0E1) ![PWA](https://img.shields.io/badge/PWA-offline--first-FFB347)

Application web **mobile-first** de suivi nutritionnel, pondéral et sportif, pensée pour les personnes qui gèrent leur poids sur la durée et qui enchaînent plusieurs phases (sèche, prise de masse, reverse diet, reset…). PWA installable, React + TypeScript + Firebase.

> « Un seul outil pour manger, peser, bouger et comprendre où tu en es — sans se noyer dans les tableurs. »

---

## Sommaire

- [C'est quoi Kripy ?](#cest-quoi-kripy-)
- [Quel problème ça résout ?](#quel-problème-ça-résout-)
- [Fonctionnalités](#fonctionnalités)
- [Design System — Kinetic Lab](#design-system--kinetic-lab)
- [Architecture technique](#architecture-technique)
- [Installation & lancement en local](#installation--lancement-en-local)
- [Déploiement](#déploiement)
- [Données & vie privée](#données--vie-privée)
- [Contribuer](#contribuer)
- [Licence](#licence)

---

## C'est quoi Kripy ?

Kripy est une **PWA mobile-first** (React + Vite + TypeScript) installable sur iOS et Android via "Ajouter à l'écran d'accueil", avec mode standalone et offline-first. Elle se décompose en 6 onglets :

1. **Accueil** — tableau de bord du jour (calories restantes, macros, eau, pas, alertes tendance)
2. **Repas** — ajout d'aliments par recherche, photo IA, dictée vocale ou code-barres
3. **Favoris / Recettes** — aliments épinglés et repas composés réutilisables
4. **Sport** — entraînements muscu (par split + groupes musculaires) et cardio / sports / combat
5. **Graphes** — évolution poids, palier calorique, historique des phases
6. **Réglages** — profil, phase en cours, presets macros, synchro cloud, thèmes

L'application se veut **offline-first** : tout ce qui est essentiel (suivi poids, repas, sport, graphes) fonctionne sans réseau. Les fonctionnalités « intelligentes » (IA photo, scan code-barres, synchro cloud) sont **opt-in**.

---

## Quel problème ça résout ?

Les applis de tracking classiques (MyFitnessPal & co) ont quatre limites récurrentes :

1. **Elles traitent chaque journée isolément**, sans vraiment comprendre la dynamique sur 1–3 mois.
2. **Elles ne savent pas ce qu'est une « phase »** (sèche, reverse, prise de masse…) et encore moins la transition entre deux phases.
3. **Elles enferment les données** dans leur cloud, avec pub et abonnement premium.
4. **Elles sont lourdes** : écrans chargés, temps de chargement, formulaires à rallonge sur mobile.

Kripy répond à ça par quatre partis pris :

### 1. Notion de **palier** (kcal + phase + date de démarrage)

Un palier combine un **objectif calorique**, une **phase** (multiplicateur) et une **date de début**. Tant que tu restes sur ce palier, la progression est analysée par rapport à ce point de départ. Dès que tu changes d'objectif kcal ou de phase, un nouveau palier démarre — l'historique est horodaté et les anciens paliers restent visibles dans les graphes.

Phases disponibles :

| Code | Nom      | Multiplicateur | Usage typique             |
| ---- | -------- | -------------- | ------------------------- |
| A    | Pre-prep | ×1.00          | Maintenance / préparation |
| B    | Deficit  | ×0.85          | Sèche / perte de poids    |
| F    | Remonte  | ×0.92          | Fin de sèche contrôlée    |
| C    | Reverse  | ×0.90          | Reverse diet              |
| D    | PDM      | ×1.075         | Prise de masse            |
| E    | Reset    | ×0.88          | Reset métabolique court   |

### 2. **Analyse de tendance adaptative** (régression linéaire 72 j)

Plutôt que de te montrer ton poids brut (qui fluctue de ±1 kg par jour selon l'eau, le sel, le cycle, etc.), Kripy calcule une **tendance** via régression linéaire sur une fenêtre glissante, et la compare à l'évolution _attendue_ pour ta phase. Le module `analysis/trend.js` produit :

- la pente pondérale réelle (kg/semaine)
- l'écart avec l'objectif théorique de la phase
- une **recommandation d'action** (ex. « maintien calorique », « baisser de 100 kcal », « changer de phase »)
- des alertes anti-yoyo si la variance explose

### 3. **Saisie ultra-rapide sur mobile**

- **Recherche d'aliment** : base FOODS embarquée + recherche incrémentale
- **Photo IA** : envoie une photo d'assiette à Groq (Llama 4 Scout) qui extrait les aliments et estime les portions (opt-in, clé API configurable)
- **Dictée vocale** : reconnaissance vocale native du navigateur pour décrire le repas
- **Code-barres** : scanner ZXing branché sur OpenFoodFacts
- **URL scheme steps** : ouvrir l'app avec `?steps=12345` pour synchroniser les pas depuis Raccourcis iOS / Tasker

### 4. **Données chez toi, pas chez nous**

- Tout est stocké dans **localStorage** par défaut.
- La synchronisation cloud est **optionnelle** via Firebase Auth + Firestore, et tu peux rester en mode invité.
- Rien n'est envoyé à un tiers sans action explicite de ta part.

---

## Fonctionnalités

### Nutrition

- Suivi calories + macros (protéines, glucides, lipides, fibres)
- 4 types de repas : Petit-déj, Déjeuner, Dîner, Collation
- Base d'aliments embarquée + ajout manuel
- Favoris et recettes (repas composés réutilisables)
- Presets macros (Équilibre, High Prot, Keto, Low Fat, Zone)
- Scan de code-barres (OpenFoodFacts)
- Analyse d'un repas par photo (Groq / Llama 4 Scout)
- Dictée vocale

### Poids, hydratation, pas

- Saisie quotidienne du poids avec historique
- Compteur d'eau rapide (+/- au verre)
- Synchro des pas via paramètre URL (pour Shortcuts iOS / Tasker)

### Analyse

- Graphique poids avec courbe de tendance
- Graphique palier calorique dans le temps
- Historique des phases (stries colorées)
- Statistiques de poids (moyenne glissante, variance, pente hebdo)
- Alertes automatiques sur la home (« Tu dérives de l'objectif », « Palier stabilisé », etc.)
- Recommandations d'action basées sur la tendance 72 jours

### Sport

- Muscu par **split** (Upper / Lower / Push / Pull / Legs / Full Body)
- Sélection du groupe musculaire travaillé
- Cardio, sports collectifs, sports de combat
- Historique des séances

### Personnalisation

- Thème clair / sombre
- Profil utilisateur (taille, poids, objectif)
- Phase configurable avec sélecteur dédié
- Avatar Google si connecté

### Multi-appareils

- Auth Google (Firebase)
- Sync Firestore automatique si connecté
- Fonctionne sans compte (mode invité, localStorage uniquement)

---

## Design System — Kinetic Lab

Kripy rejette l'esthétique "lifestyle" des applis fitness génériques au profit d'un **Deep Tech** inspiré des outils dev haut de gamme (Linear, Raycast). L'interface doit ressembler à un **terminal d'ingénierie pour le corps humain**, pas à un carnet de coach.

### Principes

1. **Intentional Asymmetry** — layouts éditoriaux alignés à gauche, pas de centrage automatique.
2. **Tonal Depth** — la profondeur vient du shift de surface, pas des shadows noires.
3. **High-Precision Data** — les chiffres sont des composants, toujours en JetBrains Mono `tabular-nums`.
4. **No-Line Rule** — les bordures 1px classiques sont bannies. Le sectionnement se fait par background shift.

### Tonal Architecture

Le palette est stratifié comme un empilement de matériaux semi-conducteurs :

| Niveau | Token  | Hex       | Usage                              |
| ------ | ------ | --------- | ---------------------------------- |
| 0      | `--bg` | `#121317` | Base obsidienne — fond absolu      |
| 1      | `--s1` | `#1A1B20` | Sections, groupement de contenu    |
| 2      | `--s2` | `#1F1F24` | Cartes interactives standard       |
| 3      | `--s3` | `#2A2B31` | Inputs, chips, surfaces cliquables |
| 4      | `--s4` | `#343439` | États focus / hover / sélection    |

Pour séparer deux blocs dans une liste, alterner `--s2` et `--s0` (`#0E0F12`) sur les rangées paires. **Pas de divider horizontal.**

### Primary & LED accents

- **Primary** : `#6AEFAF` → `#4AD295` en gradient 135°, jamais en flat fill. Effet "machined".
- **LED accents** : Cyan `#4DD0E1`, Pink `#FF6B9D`, Purple `#9F9BFF`, Orange `#FFB347`, Yellow `#FFD93D`, Red `#FF6B6B`.
- Les dots/indicateurs ont un `box-shadow:0 0 8px currentColor` pour le rendu voyant sur serveur rack.
- **Halos** (`--accG`, `--grnG`…) à 10% d'opacité pour les fills d'alerte.

### Typographie duale

- **Inter** — UI labels, headlines, body (neutre, invisible). Headlines en `letter-spacing:-0.02em`.
- **JetBrains Mono / Space Grotesk** — **TOUS** les chiffres, timestamps, métriques, labels uppercase. Règle stricte : un chiffre = mono + `tabular-nums`.
- **Jamais `#FFFFFF` pur** — utiliser `--t1 #F5F7FA` pour éviter l'halation sur fond sombre.

### Élévation & Glass

- **Tonal layering** pour lever un élément : shift son token d'un niveau, ne pas ajouter de shadow.
- **Glow ambiant** pour les overlays : `0 0 32px rgba(88,222,160,.06)` au lieu d'une shadow noire.
- **Glassmorphism** sur nav flottante et modals : `backdrop-filter:blur(12px) saturate(160%)` avec un fond à 80% d'opacité.

### Data-First Hierarchy

La métrique principale (kcal restantes, poids, pace…) doit faire **3x la taille de son label**. Exemple : le ring calorique affiche `3rem` pour le chiffre et `.52rem` pour "RESTANTES".

### Règles "Do / Don't" en une phrase

**Do** : tonal shifts, gradient primary sur CTAs, chiffres mono `tabular-nums`, underline focus `inset 0 -1px`, safe-area gutter 24px, `letter-spacing` tracking serré sur headlines (-0.02em) et large sur labels uppercase (.16em→.22em).

**Don't** : `#FFFFFF`, `border:1px solid` en séparateur, `box-shadow:0 x y rgba(0,0,0,.x)` pour élever, fill coloré sur les tabs actifs (utiliser underline glow), chiffres en Inter, modals centrés sans shift de surface.

**Pour les détails d'implémentation, voir la section "Design System" dans [`AGENTS.md`](./AGENTS.md).**

---

## Architecture technique

**Stack** (versions stables avril 2026) :

- **React 19** + **TypeScript 5** strict
- **Vite 6** (dev server + build), **Vitest 2** (tests), **vite-plugin-pwa** (manifest + service worker)
- **React Router 7** pour le routing
- **Zustand 5** (+ middleware `persist`) pour l'état global & la persistance localStorage
- **Firebase 11** modular SDK (Auth Google + Firestore)
- **Chart.js 4** via `react-chartjs-2` pour les graphes
- **ESLint 9** (flat config) + **Prettier 3**
- **Yarn 4** (Berry) — `packageManager` verrouillé dans `package.json`

### Arborescence

```
kripy/
├── public/icons/           # PWA icons (192, 512, maskable)
├── src/
│   ├── app/                # main.tsx, App.tsx, routes.tsx (lazy)
│   ├── components/
│   │   ├── ui/             # Toast primitives
│   │   ├── layout/         # AppLayout, Header, BottomNav, RouteFallback
│   │   ├── charts/         # wrappers react-chartjs-2 (Weight/Palier/Phase/...)
│   │   ├── stats/          # composants stats-specific (grids, analysis)
│   │   ├── home/           # cards dashboard (Calorie, Macro, Water, Steps…)
│   │   ├── meals/          # DateNavigator, FoodSearch, MealEntriesList…
│   │   ├── sport/          # MuscuForm, OtherSportForm, WorkoutHistory
│   │   ├── recipes/        # RecipeForm, RecipeList
│   │   ├── settings/       # 8 cards modulaires (Profile, TDEE, Targets…)
│   │   └── legal/          # LegalLayout
│   ├── features/           # logique métier pure par domaine
│   │   ├── auth/           # useAuth, cloudSync
│   │   ├── nutrition/      # foodSearch, totals (+ tests)
│   │   ├── analysis/       # trend, palier, weightAnalysis, charts/* (+ tests)
│   │   ├── settings/       # tdeeCalc, macroDistribution (+ tests)
│   │   ├── scanner/        # useBarcodeScanner, openFoodFacts, ScannerModal
│   │   └── ai/             # groqClient, prompts, imageUtils, AIAnalysisModal
│   ├── pages/              # HomePage (eager), Meals/Sport/Stats/... (lazy)
│   ├── store/              # Zustand stores (session, settings, nutrition,
│   │                       #   tracking, palier)
│   ├── hooks/              # useCloudSync, useTween, useTheme, useStepUrlParam
│   ├── lib/                # firebase, storage, date
│   ├── types/              # analysis, nutrition, tracking, user, index
│   ├── data/               # foods (~500 aliments), constants
│   ├── styles/             # base, layout, pages, components, legal
│   └── test/setup.ts       # jest-dom matchers pour Vitest
├── index.html              # shell Vite, entry /src/app/main.tsx
├── vite.config.ts          # React + PWA + alias @/ + manual chunks
├── vitest.config.ts        # config tests séparée
├── tsconfig*.json          # TS strict bundler mode
├── eslint.config.js        # flat config
├── .env.example            # template VITE_FIREBASE_*
└── package.json            # scripts yarn
```

### Conventions

- **TypeScript strict** partout. Pas de `any` non justifié. Types dans `src/types/`.
- **Import alias** : `@/` pointe vers `src/` (configuré dans `tsconfig.app.json` et `vite.config.ts`).
- **Clés localStorage** : toutes préfixées `nt_*`, centralisées dans `src/lib/storage.ts` (`STORAGE_KEYS`). **Contrat Firestore** : mêmes clés, mêmes valeurs (JSON stringifiées) — garantit la compat avec les utilisateurs du legacy vanilla.
- **Français** : UI, commentaires, commits, docs.
- **Composants** : un fichier = un composant. `PascalCase.tsx`. Pas de `default` pour les utils.
- **CSS** : les fichiers `src/styles/*.css` sont importés une fois dans `main.tsx`. Les classes restent identiques au legacy (design system Kinetic Lab préservé).

Pour les détails opérationnels (data model, Firestore contract, testing), voir [`AGENTS.md`](./AGENTS.md).

---

## Installation & lancement en local

### Prérequis

- **Node ≥ 20**
- **Yarn 4** (Berry) — activé automatiquement via Corepack

### Démarrage

```bash
git clone <repo-url> kripy
cd kripy
corepack enable                 # active Yarn 4 si pas déjà fait
yarn install
cp .env.example .env.local      # puis colle tes clés Firebase
yarn dev
```

Le serveur Vite tourne sur [http://localhost:5173](http://localhost:5173) avec HMR. `server.host: true` dans `vite.config.ts` permet aussi de tester depuis un téléphone sur le même réseau Wi-Fi.

### Scripts disponibles

| Commande            | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `yarn dev`          | Serveur de dev Vite avec HMR                         |
| `yarn build`        | Typecheck (`tsc -b`) puis build de prod dans `dist/` |
| `yarn preview`      | Sert le build de prod en local                       |
| `yarn test`         | Vitest en mode watch                                 |
| `yarn test:run`     | Vitest single-run (CI)                               |
| `yarn test:ui`      | UI Vitest (navigateur)                               |
| `yarn lint`         | ESLint sur tout le repo                              |
| `yarn lint:fix`     | ESLint avec auto-fix                                 |
| `yarn format`       | Prettier écriture                                    |
| `yarn format:check` | Prettier vérification                                |
| `yarn typecheck`    | `tsc --noEmit`                                       |

### Variables d'environnement

Toutes les variables exposées au client doivent être préfixées `VITE_` (convention Vite). Elles sont documentées dans `.env.example`. Les clés Firebase Web SDK sont publiques par nature — la sécurité dépend des **règles Firestore**, pas du secret des clés.

---

## Performance & bundle

- **Code splitting** : les pages lourdes (Stats, Settings, Recipes, Meals, pages légales) sont chargées en `React.lazy` avec fallback Suspense. Le chemin critique (`/` + auth + onboarding) reste eager.
- **Manual chunks** dans `vite.config.ts` :

| Chunk          | Poids (prod, gzip) | Contenu                                           |
| -------------- | ------------------ | ------------------------------------------------- |
| `index`        | ~73 KB             | Shell app + Home + stores                         |
| `react`        | ~17 KB             | React, ReactDOM, React Router                     |
| `firebase`     | ~108 KB            | Auth + Firestore modular SDK (chargé après login) |
| `charts`       | ~61 KB             | Chart.js + react-chartjs-2 (chargé avec /stats)   |
| `MealsPage`    | ~24 KB             | Incluant scanner + AI modals                      |
| `StatsPage`    | ~9 KB              | Graphiques wrappers                               |
| `SettingsPage` | ~5 KB              | Cards settings                                    |

Bundle total précaché via service worker : ~1.1 MB (~320 KB gzip). Initial load ≤ 100 KB gzip sur route `/`.

### Lighthouse

```bash
yarn build && yarn preview &
# Chrome DevTools → Lighthouse → Mobile + Performance + PWA
```

Objectifs cibles : Performance ≥ 90, PWA ≥ 90, Accessibility ≥ 90. Les icônes PWA (voir `public/icons/README.md`) sont nécessaires pour un score PWA > 80.

---

## Déploiement

Toute plateforme static hosting compatible SPA convient (Vercel, Netlify, Cloudflare Pages, GitHub Pages avec fallback).

### Build

```bash
yarn build
```

Le contenu de `dist/` est prêt à être servi. Pense à configurer le **fallback SPA** (réécriture de toutes les routes vers `index.html`) sinon les deep-links React Router renverront 404.

### Checklist avant prod

1. Créer un projet Firebase dédié à la prod (éviter de partager le projet dev).
2. Remplir les `VITE_FIREBASE_*` dans l'environnement du hoster.
3. Autoriser le domaine final dans **Firebase Console → Authentication → Settings → Authorized domains**.
4. Écrire et déployer des **règles Firestore** restrictives (`users/{uid}` accessible uniquement à l'user correspondant).
5. Fournir les icônes PWA définitives dans `public/icons/` (192, 512, maskable-512).

---

## Données & vie privée

- **Stockage par défaut : local**. Toutes les données (poids, repas, sport, paliers) sont conservées dans `localStorage` du navigateur. Aucune télémétrie, aucun tracker.
- **Synchro cloud : opt-in**. Si tu te connectes avec Google, les données sont sauvegardées dans Firestore sous ton UID.
- **IA photo : opt-in**. Aucune image n'est envoyée tant que tu n'as pas explicitement utilisé le bouton « analyser par photo ».
- **Scan code-barres : opt-in**. Le flux caméra est demandé uniquement à l'ouverture du scanner.
- **Clés API côté client** : les clés Firebase Web SDK sont publiques par design (elles identifient le projet, ne donnent aucun pouvoir). La sécurité vient des **règles Firestore** et de la liste des domaines autorisés dans Firebase Auth. La clé IA (Groq) est stockée dans le localStorage du user (`nt_aikey`), jamais envoyée au cloud. Les variables `VITE_FIREBASE_*` sont à renseigner dans `.env.local` (gitignored).

---

## Contribuer

Le projet est petit et assumé comme tel. Avant de toucher au code, **lis [`AGENTS.md`](./AGENTS.md)** qui décrit les règles du jeu :

- Un commit = un sujet. Messages en français, impératif.
- `yarn lint` + `yarn typecheck` + `yarn test:run` doivent passer avant toute PR.
- Mobile-first : si ça ne tient pas sur un écran 375 px, c'est cassé.
- Contrat Firestore intouchable : les clés `nt_*` et le format string-JSON sont la garantie de compat avec les utilisateurs du legacy.
- Jamais de régression silencieuse sur `features/analysis` (trend 72j, paliers).

En cas de doute, ouvre une issue avant de merger.

---

## Licence

**Tous droits réservés — © 2026 Kripy — Precision Lab.**

Ce projet n'est distribué sous aucune licence open source. Aucune autorisation d'utilisation, de copie, de modification, de fusion, de publication, de distribution, de sous-licence ou de vente n'est accordée. Toute utilisation du code, en tout ou en partie, est strictement interdite sans l'accord écrit préalable de l'auteur.
