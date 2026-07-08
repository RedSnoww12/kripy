import type {
  AiSessionAdjustment,
  AiSessionAnalysisResult,
} from '@/features/ai/types';
import type { ExerciseResolver } from './coach';
import type { SessionTemplate, TrainingProfile } from '@/types';

export interface AdjustmentPreviewRow {
  exerciseId: string;
  name: string;
  before: { sets: number; repsMin: number; repsMax: number };
  after: { sets: number; repsMin: number; repsMax: number; weight: number };
  note: string;
}

/**
 * Met en correspondance les ajustements renvoyés par l'IA (identifiés par
 * nom d'exercice) avec les exercices planifiés du template, pour affichage
 * avant/après. Un ajustement dont le nom ne correspond à aucun exercice du
 * template est ignoré (l'IA n'a pas le droit d'inventer un exercice).
 */
export function buildAdjustmentPreview(
  template: SessionTemplate,
  result: AiSessionAnalysisResult,
  resolve: ExerciseResolver,
): AdjustmentPreviewRow[] {
  const byName = new Map<string, AiSessionAdjustment>();
  for (const a of result.ajustements) byName.set(a.exercice, a);

  return template.exercises.flatMap((pe): AdjustmentPreviewRow[] => {
    const def = resolve(pe.exerciseId);
    if (!def) return [];
    const adj = byName.get(def.name);
    if (!adj) return [];
    return [
      {
        exerciseId: pe.exerciseId,
        name: def.name,
        before: { sets: pe.sets, repsMin: pe.repsMin, repsMax: pe.repsMax },
        after: {
          sets: adj.sets,
          repsMin: adj.repsMin,
          repsMax: adj.repsMax,
          weight: adj.poids,
        },
        note: adj.note,
      },
    ];
  });
}

/**
 * Applique les lignes d'ajustement validées à la séance type correspondante
 * du profil : nouvelles séries/reps cibles, et poids de départ recommandé
 * (valable jusqu'à la prochaine séance réelle sur cet exercice, voir
 * `suggestNext`). Ne modifie aucune autre séance type.
 */
export function applySessionAdjustments(
  profile: TrainingProfile,
  templateId: string,
  sourceSessionId: number,
  rows: AdjustmentPreviewRow[],
): TrainingProfile {
  const rowsById = new Map(rows.map((r) => [r.exerciseId, r]));
  return {
    ...profile,
    sessionTemplates: profile.sessionTemplates.map((t) => {
      if (t.id !== templateId) return t;
      return {
        ...t,
        exercises: t.exercises.map((pe) => {
          const row = rowsById.get(pe.exerciseId);
          if (!row) return pe;
          return {
            ...pe,
            sets: row.after.sets,
            repsMin: row.after.repsMin,
            repsMax: row.after.repsMax,
            aiTargetWeight: row.after.weight,
            aiTargetSourceSessionId: sourceSessionId,
          };
        }),
      };
    }),
  };
}
