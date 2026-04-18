# AGENTS.md — Kripy

Guide opérationnel pour les agents IA (Claude Code, etc.) et les contributeurs humains qui touchent au code. Ce fichier couvre **comment bosser sur le repo**. Pour le produit, voir [`README.md`](./README.md).

---

## 1. Stack en un coup d'œil

| Couche          | Techno                                            |
| --------------- | ------------------------------------------------- |
| UI              | React 19 + TypeScript 5 strict                    |
| Build           | Vite 6 (+ `vite-plugin-pwa`)                      |
| Tests           | Vitest 2 + @testing-library/react + jsdom         |
| Router          | React Router 7                                    |
| State           | Zustand 5 (+ middleware `persist`)                |
| Backend         | Firebase 11 modular SDK (Auth Google + Firestore) |
| Charts          | Chart.js 4 via `react-chartjs-2`                  |
| Lint/Format     | ESLint 9 flat + Prettier 3                        |
| Package manager | Yarn 4 (Berry), verrouillé via `packageManager`   |

**PWA** : manifest + service worker générés par `vite-plugin-pwa`. App installable, offline-first.

**Node ≥ 20.**

---

## 2. Commandes

```bash
yarn install          # install deps (Corepack active Yarn 4)
yarn dev              # serveur Vite + HMR sur :5173 (host: true pour mobile)
yarn build            # typecheck + build prod dans dist/
yarn preview          # sert dist/ en local
yarn test             # Vitest watch
yarn test:run         # Vitest single-run (CI)
yarn lint             # ESLint
yarn typecheck        # tsc --noEmit
yarn format           # Prettier write
```

**Avant toute PR** : `yarn lint && yarn typecheck && yarn test:run`.

**Hooks Git** : `husky` installe un `pre-commit` qui lance `lint-staged` (ESLint `--fix` + Prettier sur les fichiers staged uniquement). Le hook est activé automatiquement à `yarn install` via le script `prepare`. Pour contourner ponctuellement : `git commit --no-verify` (à éviter).

---

## 3. Arborescence

```
src/
├── app/              # entrypoint React + router
│   ├── main.tsx
│   ├── App.tsx
│   └── routes.tsx
├── components/
│   ├── ui/           # primitives génériques (Button, Card, Dialog, Input…)
│   ├── layout/       # AppLayout, Header, BottomNav
│   └── charts/       # wrappers react-chartjs-2
├── features/         # logique métier par domaine
│   ├── auth/
│   ├── nutrition/
│   ├── tracking/
│   ├── analysis/     # trend 72j, palier, recommandations
│   └── scanner/
├── pages/            # une page = une route
├── store/            # Zustand stores par domaine
├── hooks/            # useCloudSync, useStepUrlParam, useTheme…
├── lib/              # firebase.ts, storage.ts, date.ts (pas de JSX)
├── types/            # types TS partagés, re-exportés depuis index.ts
├── data/             # constantes & datasets (foods.ts, constants.ts)
├── styles/           # CSS importé une fois dans main.tsx
└── test/setup.ts     # matchers jest-dom pour Vitest

public/icons/         # PWA icons (à fournir en prod)
```

**Import alias** : `@/` → `src/`. Utiliser systématiquement `@/components/...` plutôt que des chemins relatifs profonds.

---

## 4. Contrat de données (critique, ne pas casser)

### LocalStorage — clés `nt_*`

Toutes centralisées dans `src/lib/storage.ts` → `STORAGE_KEYS`. Ne jamais ajouter un `localStorage.setItem('nt_xxx', ...)` ailleurs.

### Firestore

Document unique par user : `users/{uid}`.

Les **18 clés** listées dans `SYNC_KEYS` (`src/lib/storage.ts`) sont stockées **en string JSON brute** (pas en objets Firestore structurés), avec les métadonnées : `updatedAt`, `displayName`, `email`, `photoURL`.

**Pourquoi ce format ?** Compat stricte avec le legacy vanilla. Un user qui utilisait l'ancienne version doit retrouver ses données intactes dans la V2. Ne jamais changer ce format sans migration explicite.

### Clés locales NON sync (intentionnellement)

- `nt_gtoken` — token Google Fitness (sensible)
- `nt_aikey` — clé API IA du user (jamais cloud)
- Variables de config Firebase custom

---

## 5. State management (Zustand)

Un store par domaine dans `src/store/`. Pattern :

```ts
// store/useNutritionStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NutritionState {
  /* … */
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set) => ({
      /* … */
    }),
    { name: 'nt_log' }, // clé localStorage = contrat Firestore
  ),
);
```

Le middleware `persist` remplace les vieux `ld`/`sv` du legacy. Le hook `useCloudSync` (dans `src/hooks/`) observera les changements et déclenchera le push Firestore avec debounce.

**Règle d'or** : les clés `persist.name` doivent correspondre aux `STORAGE_KEYS`. Un test dans `src/lib/storage.test.ts` garantit la stabilité du namespace.

---

## 6. Firebase

- Init dans `src/lib/firebase.ts`, lecture des `VITE_FIREBASE_*` via `import.meta.env`.
- Export : `auth`, `db`, `googleProvider`, `isFirebaseConfigured`, `firebaseApp`.
- Tous peuvent être `null` si les env vars sont absentes → afficher un état "Firebase non configuré" plutôt que crasher.
- **Modular SDK v11** : `import { getAuth } from 'firebase/auth'`, **pas** `firebase.auth()`.

### Env vars (préfixe obligatoire `VITE_`)

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Template dans `.env.example`. Valeurs réelles dans `.env.local` (gitignored).

---

## 7. Tests

- **Vitest** en mode jsdom + globals (`describe`, `it`, `expect` sans import).
- Setup : `src/test/setup.ts` (importe `@testing-library/jest-dom/vitest`).
- Colocaliser les tests : `foo.ts` ↔ `foo.test.ts` dans le même dossier.
- **Priorité** : plomberie (storage, sync, trend, stores Zustand, pure data
  adapters) > composants UI (snapshots fragiles).

### Coverage actuelle (90 tests)

| Module                                     | Tests | Couvre                                              |
| ------------------------------------------ | ----- | --------------------------------------------------- |
| `lib/storage`                              | 4     | load/save/remove, listener, SYNC_KEYS               |
| `features/auth/cloudSync`                  | 4     | cloudSave, cloudLoad, mock Firestore                |
| `features/analysis/palier`                 | 15    | compute, extend, days, timeline, target             |
| `features/analysis/trend`                  | 16    | linReg, trend72, phaseTrend, weightStats, recommend |
| `features/analysis/weightAnalysis`         | 7     | variance, rate message par phase                    |
| `features/analysis/charts/ema`             | 4     | smoothing, edge cases                               |
| `features/analysis/charts/weightChartData` | 6     | slicing, EMA, objectif                              |
| `features/nutrition/foodSearch`            | 14    | search, accent-insensitive, compute, apply          |
| `features/nutrition/totals`                | 8     | sum, group, streak, grace period                    |
| `features/settings/tdeeCalc`               | 5     | BMR, activity, step bonus, phase mul                |
| `features/settings/macroDistribution`      | 6     | %→g, breakdown, validation                          |
| `store/useSettingsStore`                   | 4     | defaults, persist, rehydrate, onboarding            |

---

## 8. Styling

- Les 5 CSS du legacy (`base`, `layout`, `pages`, `components`, `legal`) sont importés dans `main.tsx` — **design system Kinetic Lab préservé**.
- Utiliser les classes CSS existantes (`btn btn-p`, `tp active`, `hdr`, `nav`…) plutôt que d'écrire du nouveau CSS.
- Si besoin d'un style ponctuel : variables CSS (`var(--accG)`, `var(--s2)`…) inline, **pas** de nouvelle règle CSS sans raison.
- Pas de CSS-in-JS, pas de Tailwind — cohérence avec le legacy.

---

## 9. Conventions de code

- **TypeScript strict**. Pas de `any` non justifié (commentaire `// intentional any: <why>`).
- **Composants** : `PascalCase.tsx`, un fichier = un composant, export default.
- **Hooks** : `useXxx.ts`, named export.
- **Fonctions pures / utils** : `lowerCamelCase`, named export.
- **Types** : dans `src/types/`, **jamais** de type métier dupliqué dans un composant.
- **Pas de commentaires descriptifs** sauf si le _pourquoi_ est non-évident.
- **Français** pour UI, commits, docs. Code (noms de variables, fonctions) reste en anglais.

### Git

- Commits en français, impératif (`feat: …`, `fix: …`, `refactor: …`).
- Un commit = un sujet cohérent.
- Ne pas committer `.env*` (sauf `.env.example`).

---

## 10. Design System — Kinetic Lab (résumé)

Détails complets dans `README.md`. Règles à respecter en codant :

1. **Tonal shifts** pour séparer des blocs : `--s1` → `--s2` → `--s3`. **Jamais** de `border:1px solid`.
2. **Chiffres en mono** : `font-family: var(--fmono)` + `font-variant-numeric: tabular-nums`.
3. **Métrique principale** = 3× la taille de son label.
4. **Primary accent** `#6AEFAF` en gradient 135°, jamais flat.
5. **Jamais `#FFFFFF` pur** — utiliser `--t1` (`#F5F7FA`).
6. **Safe-area** : respecter `env(safe-area-inset-*)` sur iOS.

---

## 10bis. Code splitting & perf

- Pages **eager** (chemin critique) : `/`, `/auth`, `/onboarding` + `AppLayout`.
- Pages **lazy** via `React.lazy` : Meals, Sport, Stats, Recipes, Settings,
  Terms, Privacy. Fallback global : `<RouteFallback />` dans `<Suspense>`.
- Vendors splittés via `build.rollupOptions.output.manualChunks` :
  - `react` (React + Router)
  - `firebase` (~108 KB gzip, chargé après login)
  - `charts` (Chart.js + react-chartjs-2, chargé avec /stats)
  - `zustand`
- **Règle** : une nouvelle page lourde (charts, modales externes, vendors
  > 20 KB) doit être lazy-loadée. Une page ≤ 10 KB peut rester eager.
- **Ne jamais** importer `firebase/*` ou `chart.js` depuis `HomePage` — elles
  sont sur le chemin critique.

---

## 11. Ce qu'il ne faut PAS faire

- Ajouter une dépendance sans justification (regarde déjà dans ce qui est installé).
- Changer le format des valeurs Firestore (strings JSON, clés `nt_*`).
- Remettre le Firebase compat SDK (`firebase/compat/*`).
- Ajouter Tailwind / styled-components / emotion.
- Committer `.env.local` ou toute clé privée.
- Toucher à `features/analysis` sans ajouter un test qui couvre le changement.
- Écrire du JSX dans `src/lib/` (ce dossier est agnostique React).

---

## 12. En cas de doute

- Checker si la donnée est déjà dans un store Zustand avant d'ajouter un `useEffect` qui lit localStorage.
- Checker les règles Firestore avant d'ajouter une nouvelle clé `nt_*`.
