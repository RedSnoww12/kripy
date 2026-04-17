# PWA Icons

Le manifest de l'application (`vite.config.ts` → `VitePWA.manifest.icons`)
référence trois fichiers à fournir dans ce dossier avant toute release
production :

| Fichier                 | Taille  | Usage                                       |
| ----------------------- | ------- | ------------------------------------------- |
| `icon-192.png`          | 192×192 | Icône standard (iOS home screen, install)   |
| `icon-512.png`          | 512×512 | Icône haute résolution (Play Store, splash) |
| `icon-maskable-512.png` | 512×512 | Icône adaptative Android (safe zone 80%)    |

## Generation rapide

### Option 1 — En ligne (recommandé)

1. Ouvrir [realfavicongenerator.net](https://realfavicongenerator.net).
2. Uploader un logo source carré ≥ 1024×1024 (PNG avec fond transparent).
3. Configurer : thème color `#121317`, background `#121317`, padding
   maskable : respecter la safe zone (icône centrée à ~80% du canvas).
4. Télécharger le ZIP, extraire les 3 PNG dans ce dossier avec les noms
   exacts ci-dessus.

### Option 2 — CLI (`pwa-asset-generator`)

```bash
npx pwa-asset-generator ./logo.png ./public/icons \
  --icon-only \
  --type png \
  --background "#121317" \
  --padding "15%"
```

Puis renommer les sorties pour coller aux noms attendus.

## Vérification

Après avoir ajouté les PNG :

```bash
yarn build && yarn preview
```

Ouvrir l'app en mode standalone (installée) sur Android / iOS pour
vérifier :

- Icône affichée correcte dans le launcher
- Splash screen (iOS) utilisant `icon-512.png`
- Pas de warning dans la console PWA de Chrome DevTools → Application

## Design tokens à respecter

- Palette : couleur primaire `#6AEFAF` (gradient `#6AEFAF → #4AD295`)
- Fond : `#121317` (même que `theme_color` du manifest)
- Style : dense tech, pas de gradient soft, pas de style "app store
  générique" (cf. règles Kinetic Lab dans le README).
