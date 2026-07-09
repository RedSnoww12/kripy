# Rapport de fiabilité — IA Groq (calcul calories/macros)

**Date du test** : 9 juillet 2026
**Modèle testé** : `llama-3.3-70b-versatile` (chemin texte de `src/features/ai/groqClient.ts`)
**Méthode** : `scripts/groq-reliability-test.ts` — réutilise le vrai system prompt et le parsing de l'app (aucune logique dupliquée). 11 cas (6 « exacts » calculables sans ambiguïté depuis la base de valeurs du system prompt, 5 « connus » avec fourchette donnée par le prompt lui-même), 3 répétitions chacun, 2.5s entre chaque appel = 33 appels au total, exécutés avec une clé Groq gratuite.

## Résultat principal : la clé gratuite ne tient pas la charge, à cause du rate-limit

- **12 % de succès (4 appels sur 33)**. Les 29 autres ont échoué avec une erreur `quota` (HTTP 429).
- Ces échecs répondent en **30-70 ms** — bien trop rapide pour un vrai aller-retour réseau vers l'inférence (les appels réussis prennent 550-990 ms). Le rejet se fait donc côté passerelle Groq, avant même le traitement du prompt.
- Le system prompt de l'app fait ~12 700 caractères (~3 500-4 000 tokens), et `max_tokens` est fixé à 2048. Un seul appel consomme donc plusieurs milliers de tokens — suffisant pour épuiser le quota tokens/minute d'une clé gratuite en un ou deux appels.
- **Le code actuel ne relance pas automatiquement les erreurs 429** : dans `client.ts` → `runWithRetry`, seules les erreurs réseau et 5xx sont marquées `retryable`. `groqClient.ts` renvoie `err('quota')` (non retryable) sur un 429. Conséquence concrète : un utilisateur qui analyse deux repas rapprochés (petit-déj puis déjeuner dans la même session) a de fortes chances de voir le second échouer avec « Quota dépassé », sans nouvelle tentative automatique.

## Sur les 4 appels qui ont abouti : JSON valide, mais le calcul interne se trompe parfois

| Cas | Attendu | Obtenu | Écart | Constat |
|---|---|---|---|---|
| `poulet_riz` (150g poulet rôti + 200g riz cuit) | 507,5 kcal | 407 kcal | **-19,8 %** | Erreur d'addition visible dans le `details` renvoyé par le modèle lui-même : il calcule correctement poulet=247,5 et riz=260, mais écrit ensuite « 247,5 + 160 = 407,5 » — la contribution du riz est tronquée dans l'addition finale malgré un calcul correct juste avant. |
| `saumon_pates` (100g saumon + 150g pâtes) | 425 kcal | 365 kcal | **-14,1 %** | Le modèle utilise 165 kcal pour les pâtes au lieu de 225 kcal (150g × 150 kcal/100g selon la base du prompt) — une valeur ~27 % trop basse, proche de celle du couscous (110 kcal/100g) plutôt que des pâtes. |
| `soda_33cl` | 140 kcal | 140 kcal | 0 % | Exact — cas trivial, valeur directement donnée dans le prompt. |
| `couscous_royal` | 700-850 kcal | 740 kcal | dans la fourchette | Cohérent, détail plausible. |

Déviation Atwater moyenne sur ces 4 réponses (cohérence interne prot×4+gluc×4+lip×9 ≈ kcal) : **11,6 %** — juste au-dessus de la tolérance ±10 % que le system prompt impose pourtant explicitement au modèle.

⚠️ Échantillon bien trop petit (4 réponses) pour conclure statistiquement sur la précision « pure » du modèle. Mais les deux erreurs observées (`poulet_riz`, `saumon_pates`) montrent que **le calcul en plusieurs étapes n'est pas fiable à 100 %, même quand les valeurs unitaires sont correctement identifiées** — le modèle « perd » parfois un composant en cours d'addition.

## Conclusion

Le vrai goulot d'étranglement de fiabilité observé ici n'est pas tant la justesse du modèle (échantillon trop petit pour trancher), mais **le taux d'échec opérationnel dû au rate-limit** : avec ce system prompt volumineux, une clé Groq gratuite ne supporte en pratique qu'environ 1 analyse par minute avant d'enchaîner les 429, sans retry automatique côté app.

## Recommandations

1. **Rendre les 429 retryables** avec backoff (idéalement en respectant un éventuel en-tête `Retry-After`) dans `groqClient.ts` / `client.ts`, au lieu d'échouer immédiatement.
2. **Réduire la taille du system prompt texte** (~4000 tokens actuellement) pour laisser plus de marge au budget tokens/minute d'une clé gratuite.
3. Le choix déjà présent dans le code de mettre **Gemini par défaut** (`DEFAULT_PROVIDER` dans `src/features/ai/config.ts`) est cohérent avec ce constat empirique : Groq en clé gratuite est nettement moins fiable en usage réel à cause du rate-limit, indépendamment de la qualité du modèle.
4. Propager le `detail` du corps de réponse Groq sur les erreurs 429 (actuellement jeté silencieusement dans `groqClient.ts`) pour afficher un message plus utile à l'utilisateur (ex. temps d'attente suggéré par l'API).

---
Généré à partir d'une exécution réelle (clé Groq gratuite, 9 juillet 2026). Données brutes de cette exécution : voir la conversation associée (le fichier `scripts/results/*.json` n'est pas versionné, régénérable via `scripts/groq-reliability-test.ts`).
