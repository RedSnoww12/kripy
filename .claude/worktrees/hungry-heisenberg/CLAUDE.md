# NutriCoach — Agent Instructions

## Project Overview

PWA de coaching nutritionnel mobile-first avec tracking IA (photo/audio) et moteur de decision algorithmique.

**Stack** : React 18 + Vite + TypeScript + Tailwind CSS v4 + Zustand + Recharts + vite-plugin-pwa
**Backend** : Supabase (PostgreSQL + Auth)
**IA** : OpenAI GPT-4o Vision + Whisper

## Launch

```bash
cd nutricoach
npm run dev        # lance sur http://localhost:5173 + reseau local (--host)
npm run build      # build production
```

Le serveur est configure dans `.claude/launch.json` sous le nom `nutricoach-dev`.

## Project Structure

```
src/
  components/
    layout/       # AppShell, BottomNav, FAB
    dashboard/    # CalorieGauge, WeightCard, AlgorithmStatus, MacroBreakdown
    tracking/     # CameraCapture, AudioCapture, MealBottomSheet, ManualEntry
    charts/       # WeightChart
  pages/          # Dashboard, History, Charts, Profile, Settings
  lib/            # algorithm.ts, openai.ts, supabase.ts
  stores/         # appStore.ts (Zustand + persist)
  types/          # index.ts (types centraux)
```

## Code Conventions

### TypeScript

- Strict mode active, pas de `any` sauf cas justifie
- Types dans `src/types/index.ts` — pas de types inline repetes
- Preferer `interface` pour les objets, `type` pour les unions/aliases
- Imports avec `import type` quand seul le type est utilise
- Pas de `enum` runtime, utiliser `as const` ou union types

### React

- Composants fonctionnels uniquement, pas de classes
- Un composant par fichier, exporte en named export (pas de `export default` sauf `App.tsx`)
- Props typees via interface dediee nommee `{ComponentName}Props`
- Hooks personnalises dans `src/hooks/`, prefixe `use`
- Pas de `useEffect` pour de la logique derivee — utiliser des calculs directs dans le render
- Etat local (`useState`) pour l'UI, Zustand pour les donnees persistees

### Styling (Tailwind CSS v4)

- Classes utilitaires Tailwind uniquement, pas de CSS custom sauf animations dans `index.css`
- Couleurs du theme definies dans `@theme` de `index.css` — les utiliser via `text-dark-*`, `bg-dark-*`, `text-accent`, etc.
- Mode sombre par defaut (pas de toggle light/dark)
- Pas de `style={{}}` inline sauf pour les valeurs dynamiques (ex: `width: ${pct}%`)

### Fichiers

- Nommage PascalCase pour les composants : `CalorieGauge.tsx`
- Nommage camelCase pour les utilitaires : `algorithm.ts`
- Pas de fichiers barrel (`index.ts` qui re-exporte) — imports directs

## UX/UI Conventions

### Mobile-First

- Tout le design est optimise pour smartphone (375px de large min)
- Max width `max-w-lg` (512px) centre sur desktop
- Navigation par onglets en bas (`BottomNav`) — 5 onglets max
- Zone de pouce : boutons principaux en bas de l'ecran, min 44px de hauteur touch
- `pb-24` sur le contenu principal pour ne pas etre cache par la nav

### Composants UI

- Cards : `bg-dark-800 rounded-2xl p-4`
- Modales : fond `bg-black/60` + contenu `bg-dark-800 rounded-2xl`
- Bottom sheets : `fixed bottom-0` + `rounded-t-3xl` + `animate-slide-up`
- Inputs : `bg-dark-700 rounded-xl px-4 py-3 text-white outline-none`
- Boutons primaires : `bg-accent text-dark-900 font-semibold rounded-xl`
- Boutons secondaires : `bg-dark-700 text-dark-400 rounded-xl`
- Texte labels : `text-xs text-dark-500`
- Nombres : toujours `tabular-nums` + cacher les spinners natifs

### Couleurs semantiques

- Vert (`text-success`) : tout va bien, maintenir le cap
- Orange (`text-warning`) : attention, analyse en cours
- Bleu (`text-info`) : action requise, ajustement
- Rouge (`text-danger`) : depassement, erreur
- Cyan (`text-accent`) : elements interactifs, accents

### Icones

- Librairie : `lucide-react` exclusivement
- Taille standard : `size={20-22}` dans les cards, `size={16-18}` dans les boutons
- Pas d'emojis dans l'UI

## Data & State

### Zustand Store (`appStore.ts`)

- Persiste automatiquement dans `localStorage` via middleware `persist`
- Cle de stockage : `nutricoach-storage`
- Utiliser `generateId()` pour les IDs (pas `crypto.randomUUID()` directement — incompatible HTTP non-securise mobile)
- Methodes existantes a reutiliser :
  - `updateTodayLog(data)` — MAJ du jour courant
  - `updateLogByDate(date, data)` — MAJ d'une date arbitraire
  - `addMeal(meal)` — ajout repas + recalcul totaux automatique
  - `getRecentLogs(days)` — logs tries par date

### Base de donnees

- Schema dans `supabase/migrations/`
- Toujours ajouter les nouvelles colonnes avec `DEFAULT` pour compatibilite
- Index sur `(user_id, date)` pour les requetes frequentes

## Algorithme de Coaching (`lib/algorithm.ts`)

Le moteur est une pure function sans side effects. Ne pas le modifier sans comprendre la matrice de decision :

| Phase | Baisse | Stagnation 72h+ | Hausse |
|-------|--------|-----------------|--------|
| Pre-Prep | Maintenir | +200 kcal | Maintenir |
| Deficit | Maintenir | -200 kcal | Maintenir |
| Remontee | Maintenir | +200 kcal | Maintenir |
| Reverse Diet | +200 kcal | Maintenir | Maintenir |
| Prise de Masse | +200 kcal | Maintenir | Maintenir |

Les ajustements sont toujours de +/-50g de glucides, proteines et lipides stables.

## Conventional Commits

Format strict pour tous les commits :

```
<type>(<scope>): <description>

[body optionnel]

[footer optionnel]
```

### Types autorises

- `feat` : nouvelle fonctionnalite visible par l'utilisateur
- `fix` : correction de bug
- `refactor` : restructuration sans changement de comportement
- `style` : changements visuels/UI (pas de logique)
- `perf` : amelioration de performance
- `chore` : maintenance, deps, config, CI
- `docs` : documentation uniquement
- `test` : ajout ou correction de tests

### Scopes recommandes

- `dashboard`, `history`, `charts`, `profile`, `settings` — pages
- `tracking` — camera, audio, bottom sheet
- `algorithm` — moteur de decision
- `store` — Zustand store
- `ui` — composants UI partages
- `pwa` — service worker, manifest
- `db` — migrations, schema Supabase
- `ai` — integration OpenAI

### Regles

- Description en minuscules, pas de point final, max 72 caracteres
- Imperatif present : "add" pas "added" ni "adds"
- Un commit = un changement logique
- Breaking changes : ajouter `!` apres le scope — `feat(store)!: restructure daily log format`

### Exemples

```
feat(tracking): add audio meal capture via whisper
fix(algorithm): correct stagnation detection threshold
style(dashboard): adjust calorie gauge spacing on small screens
refactor(store): extract generateId helper for http compatibility
chore(deps): update recharts to 2.15
feat(history): add historical data entry modal
```

## Testing Checklist

Avant chaque PR / merge, verifier :

- [ ] `npx tsc --noEmit` — zero erreur TypeScript
- [ ] `npm run build` — build production sans erreur
- [ ] Preview mobile (375x812) — tous les ecrans s'affichent correctement
- [ ] Navigation par onglets fonctionne
- [ ] FAB > photo/audio/manuel > bottom sheet > validation
- [ ] Saisie poids + pas via modales
- [ ] Toggle seance jour fonctionne
- [ ] Historique : ajout + edition de donnees passees
- [ ] Algorithme affiche le bon statut selon la phase et la tendance
