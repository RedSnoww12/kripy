import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { makeExerciseResolver } from '@/data/exercises';
import { analyzeTraining } from '@/features/ai/client';
import {
  describeAiError,
  type AiCoachResult,
  type AiError,
} from '@/features/ai/types';
import { buildCoachContext } from '@/features/sport/coachContext';
import { todayISO } from '@/lib/date';
import { PHASE_NAMES } from '@/data/constants';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSportStore } from '@/store/useSportStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import type { TrainingProfile } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  profile: TrainingProfile;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; error: AiError }
  | { kind: 'result'; result: AiCoachResult };

export default function SportAIModal({ open, onClose, profile }: Props) {
  const sessions = useSportStore((s) => s.sessions);
  const phase = useSettingsStore((s) => s.phase);
  const weights = useTrackingStore((s) => s.weights);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const resolve = useMemo(
    () => makeExerciseResolver(profile.customExercises),
    [profile.customExercises],
  );

  useEffect(() => {
    if (!open) return;
    if (sessions.length === 0) return;
    let cancelled = false;
    setStatus({ kind: 'loading' });

    const currentWeight =
      weights.length > 0 ? weights[weights.length - 1].w : undefined;
    const context = buildCoachContext(profile, sessions, resolve, todayISO(), {
      objectifNutrition: PHASE_NAMES[phase],
      poids: currentWeight,
    });

    void analyzeTraining(context).then((result) => {
      if (cancelled) return;
      if ('reason' in result) setStatus({ kind: 'error', error: result });
      else setStatus({ kind: 'result', result });
    });

    return () => {
      cancelled = true;
    };
  }, [open, sessions, profile, resolve, phase, weights]);

  const close = () => {
    setStatus({ kind: 'idle' });
    onClose();
  };

  return (
    <Modal open={open} onClose={close}>
      <h3>✨ Coach IA</h3>

      {status.kind === 'loading' && (
        <div className="kl-ai-coach-loading">
          Analyse de ta progression en cours…
        </div>
      )}

      {status.kind === 'error' && (
        <div className="kl-ai-coach-error">
          <div className="kl-ai-coach-error-title">
            {describeAiError(status.error).title}
          </div>
          <div>{describeAiError(status.error).msg}</div>
        </div>
      )}

      {status.kind === 'result' && (
        <div className="kl-ai-coach">
          {status.result.analyse && (
            <div className="kl-ai-coach-block">
              <div className="kl-ai-coach-lbl">BILAN</div>
              <p className="kl-ai-coach-text">{status.result.analyse}</p>
            </div>
          )}

          {status.result.ajustements.length > 0 && (
            <div className="kl-ai-coach-block">
              <div className="kl-ai-coach-lbl">AJUSTEMENTS</div>
              {status.result.ajustements.map((a, i) => (
                <div key={i} className="kl-ai-coach-adj">
                  <span className="kl-ai-coach-adj-exo">{a.exercice}</span>
                  <span className="kl-ai-coach-adj-action">{a.action}</span>
                </div>
              ))}
            </div>
          )}

          {status.result.conseils.length > 0 && (
            <div className="kl-ai-coach-block">
              <div className="kl-ai-coach-lbl">CONSEILS</div>
              <ul className="kl-ai-coach-list">
                {status.result.conseils.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="acts kl-ai-coach-acts">
        <button type="button" className="btn btn-o" onClick={close}>
          Fermer
        </button>
      </div>
    </Modal>
  );
}
