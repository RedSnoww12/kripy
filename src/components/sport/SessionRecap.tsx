import { useMemo, useState } from 'react';
import { makeExerciseResolver } from '@/data/exercises';
import { analyzeSessionAdjustments } from '@/features/ai/client';
import {
  describeAiError,
  type AiError,
  type AiSessionAnalysisResult,
} from '@/features/ai/types';
import {
  applySessionAdjustments,
  buildAdjustmentPreview,
  type AdjustmentPreviewRow,
} from '@/features/sport/applySessionAdjustments';
import {
  formatSuggestion,
  suggestNext,
  type SuggestionKind,
} from '@/features/sport/nextSession';
import { summarizeExercise } from '@/features/sport/progression';
import { buildSessionAdjustContext } from '@/features/sport/sessionAdjustContext';
import { toast } from '@/components/ui/toastStore';
import { useSportStore } from '@/store/useSportStore';
import type { StrengthSession, TrainingProfile } from '@/types';

interface Props {
  session: StrengthSession;
  profile: TrainingProfile;
  onClose: () => void;
}

const KIND_META: Record<SuggestionKind, { icon: string; label: string }> = {
  up: { icon: 'trending_up', label: 'MONTE' },
  reps: { icon: 'add', label: 'REPS' },
  keep: { icon: 'check', label: 'GARDE' },
  deload: { icon: 'south', label: 'ALLÈGE' },
  ai: { icon: 'auto_awesome', label: 'IA' },
};

type AiSessionState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; error: AiError }
  | {
      kind: 'preview';
      result: AiSessionAnalysisResult;
      rows: AdjustmentPreviewRow[];
    }
  | { kind: 'applied' };

function formatWeight(w: number, bodyweight: boolean): string {
  const load = String(w).replace('.', ',');
  if (bodyweight) return w > 0 ? `+${load} kg` : 'poids du corps';
  return `${load} kg`;
}

export default function SessionRecap({ session, profile, onClose }: Props) {
  const sessions = useSportStore((s) => s.sessions);
  const setProfile = useSportStore((s) => s.setProfile);
  const [aiState, setAiState] = useState<AiSessionState>({ kind: 'idle' });

  const resolve = useMemo(
    () => makeExerciseResolver(profile.customExercises),
    [profile.customExercises],
  );

  const template = useMemo(
    () => profile.sessionTemplates.find((t) => t.id === session.templateId),
    [profile.sessionTemplates, session.templateId],
  );

  const { totalSets, totalReps, volume, prCount } = useMemo(() => {
    let sets = 0;
    let reps = 0;
    let vol = 0;
    let prs = 0;
    for (const entry of session.exercises) {
      sets += entry.sets.length;
      for (const s of entry.sets) {
        reps += s.r;
        vol += s.w * s.r;
      }
      const def = resolve(entry.exerciseId);
      if (
        def &&
        summarizeExercise(sessions, entry.exerciseId, def.bodyweight).isPR
      ) {
        prs += 1;
      }
    }
    return {
      totalSets: sets,
      totalReps: reps,
      volume: Math.round(vol),
      prCount: prs,
    };
  }, [session, sessions, resolve]);

  const suggestions = useMemo(
    () =>
      session.exercises.flatMap((entry) => {
        const def = resolve(entry.exerciseId);
        if (!def) return [];
        const s = suggestNext(
          profile,
          sessions,
          entry.exerciseId,
          def.bodyweight,
        );
        if (!s) return [];
        return [{ id: entry.exerciseId, def, s }];
      }),
    [session, sessions, profile, resolve],
  );

  const runAiAnalysis = async () => {
    if (!template) return;
    setAiState({ kind: 'loading' });
    const context = buildSessionAdjustContext(
      session,
      template,
      sessions,
      resolve,
    );
    const result = await analyzeSessionAdjustments(context);
    if ('reason' in result) {
      setAiState({ kind: 'error', error: result });
      return;
    }
    const rows = buildAdjustmentPreview(template, result, resolve);
    setAiState({ kind: 'preview', result, rows });
  };

  const applyAdjustments = () => {
    if (!template || aiState.kind !== 'preview') return;
    const updated = applySessionAdjustments(
      profile,
      template.id,
      session.id,
      aiState.rows,
    );
    setProfile(updated);
    setAiState({ kind: 'applied' });
    toast(`Objectifs mis à jour pour « ${template.name} »`, 'success');
  };

  return (
    <section className="kl-recap">
      <div className="kl-recap-hero">
        <span className="kl-recap-check" aria-hidden>
          <span className="material-symbols-outlined">check</span>
        </span>
        <div className="kl-recap-title">Séance {session.label} enregistrée</div>
        <div className="kl-recap-sub">
          {session.dur ? `${session.dur} min` : ''}
          {prCount > 0 && (
            <span className="kl-recap-pr">
              {' '}
              · {prCount} record{prCount > 1 ? 's' : ''} 🏆
            </span>
          )}
        </div>
      </div>

      <div className="kl-recap-stats">
        <div className="kl-recap-stat">
          <div className="kl-recap-stat-val">{session.exercises.length}</div>
          <div className="kl-recap-stat-lbl">EXOS</div>
        </div>
        <div className="kl-recap-stat">
          <div className="kl-recap-stat-val">{totalSets}</div>
          <div className="kl-recap-stat-lbl">SÉRIES</div>
        </div>
        <div className="kl-recap-stat">
          <div className="kl-recap-stat-val">{totalReps}</div>
          <div className="kl-recap-stat-lbl">REPS</div>
        </div>
        <div className="kl-recap-stat">
          <div className="kl-recap-stat-val">
            {volume > 0 ? volume.toLocaleString('fr-FR') : '—'}
          </div>
          <div className="kl-recap-stat-lbl">VOLUME KG</div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <>
          <div className="kl-sport-section-lbl">
            <span className="kl-sport-section-bar" aria-hidden />
            PROCHAINE SÉANCE
          </div>
          <div className="kl-recap-next">
            {suggestions.map(({ id, def, s }) => (
              <div key={id} className={`kl-recap-row kind-${s.kind}`}>
                <span
                  className="material-symbols-outlined kl-recap-row-ico"
                  aria-hidden
                >
                  {KIND_META[s.kind].icon}
                </span>
                <div className="kl-recap-row-body">
                  <div className="kl-recap-row-head">
                    <span className="kl-recap-row-name">{def.name}</span>
                    <span className="kl-recap-row-target">
                      {formatSuggestion(s, def.bodyweight)}
                      <span className="kl-recap-row-sets">
                        {' '}
                        · {s.sets} série{s.sets > 1 ? 's' : ''}
                      </span>
                    </span>
                  </div>
                  <div className="kl-recap-row-why">{s.why}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {template && (
        <>
          <div className="kl-sport-section-lbl">
            <span className="kl-sport-section-bar" aria-hidden />
            ANALYSE IA DE LA SÉANCE
          </div>

          {aiState.kind === 'idle' && (
            <button
              type="button"
              className="kl-recap-ai-btn"
              onClick={() => void runAiAnalysis()}
            >
              <span className="material-symbols-outlined" aria-hidden>
                auto_awesome
              </span>
              Analyser la séance avec l'IA
            </button>
          )}

          {aiState.kind === 'loading' && (
            <div className="kl-ai-coach-loading">
              Analyse de ta séance en cours…
            </div>
          )}

          {aiState.kind === 'error' && (
            <div className="kl-ai-coach-error">
              <div className="kl-ai-coach-error-title">
                {describeAiError(aiState.error).title}
              </div>
              <div>{describeAiError(aiState.error).msg}</div>
            </div>
          )}

          {aiState.kind === 'preview' && (
            <div className="kl-recap-ai-preview">
              {aiState.result.resume && (
                <p className="kl-recap-ai-resume">{aiState.result.resume}</p>
              )}
              {aiState.rows.length === 0 ? (
                <div className="kl-sport-history-empty">
                  ▸ Aucun ajustement à proposer pour cette séance.
                </div>
              ) : (
                aiState.rows.map((row) => {
                  const bodyweight =
                    resolve(row.exerciseId)?.bodyweight ?? false;
                  return (
                    <div key={row.exerciseId} className="kl-recap-ai-row">
                      <div className="kl-recap-ai-row-name">{row.name}</div>
                      <div className="kl-recap-ai-row-cmp">
                        <span className="kl-recap-ai-before">
                          {row.before.sets} × {row.before.repsMin}-
                          {row.before.repsMax}
                        </span>
                        <span
                          className="material-symbols-outlined kl-recap-ai-arrow"
                          aria-hidden
                        >
                          arrow_forward
                        </span>
                        <span className="kl-recap-ai-after">
                          {row.after.sets} × {row.after.repsMin}-
                          {row.after.repsMax} ·{' '}
                          {formatWeight(row.after.weight, bodyweight)}
                        </span>
                      </div>
                      {row.note && (
                        <div className="kl-recap-ai-note">{row.note}</div>
                      )}
                    </div>
                  );
                })
              )}
              <div className="kl-log-acts">
                <button
                  type="button"
                  className="btn btn-o"
                  onClick={() => setAiState({ kind: 'idle' })}
                >
                  Ignorer
                </button>
                <button
                  type="button"
                  className="kl-sport-save kl-log-save"
                  onClick={applyAdjustments}
                  disabled={aiState.rows.length === 0}
                >
                  Appliquer pour la prochaine fois
                </button>
              </div>
            </div>
          )}

          {aiState.kind === 'applied' && (
            <div className="alt success">
              <span>
                Objectifs mis à jour pour « {template.name} ». Tu les
                retrouveras à ta prochaine séance de ce type.
              </span>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        className="kl-sport-save kl-recap-cta"
        onClick={onClose}
      >
        C'est noté 💪
      </button>
    </section>
  );
}
