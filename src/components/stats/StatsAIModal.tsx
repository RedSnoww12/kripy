import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { analyzeStats } from '@/features/ai/client';
import {
  describeAiError,
  type AiError,
  type AiStatsResult,
} from '@/features/ai/types';
import { buildStatsAiContext } from '@/features/analysis/statsAiContext';
import { trend72, weightStats } from '@/features/analysis/trend';
import { PHASE_NAMES } from '@/data/constants';
import { todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { usePalierStore } from '@/store/usePalierStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; error: AiError }
  | { kind: 'result'; result: AiStatsResult };

export default function StatsAIModal({ open, onClose }: Props) {
  const weights = useTrackingStore((s) => s.weights);
  const log = useNutritionStore((s) => s.log);
  const phase = useSettingsStore((s) => s.phase);
  const targets = useSettingsStore((s) => s.targets);
  const startWeight = useSettingsStore((s) => s.startWeight);
  const height = useSettingsStore((s) => s.height);
  const palier = usePalierStore((s) => s.palier);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus({ kind: 'loading' });

    const today = todayISO();
    const stats = weightStats({
      weights,
      heightCm: height,
      startWeight,
      today,
    });
    const trend = palier
      ? trend72({
          weights,
          palier,
          currentKcal: targets.kcal,
          currentPhase: phase,
          log,
          today,
        })
      : null;

    const context = buildStatsAiContext({
      weights,
      log,
      phase,
      targets,
      goalWeight: startWeight,
      today,
      trend,
      stats,
    });

    void analyzeStats(context).then((result) => {
      if (cancelled) return;
      if ('reason' in result) setStatus({ kind: 'error', error: result });
      else setStatus({ kind: 'result', result });
    });

    return () => {
      cancelled = true;
    };
  }, [open, weights, log, phase, targets, startWeight, height, palier]);

  const close = () => {
    setStatus({ kind: 'idle' });
    onClose();
  };

  return (
    <Modal open={open} onClose={close}>
      <h3>✨ Coach IA — {PHASE_NAMES[phase]}</h3>

      {status.kind === 'loading' && (
        <div className="kl-ai-coach-loading">
          Analyse de tes statistiques en cours…
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
          {status.result.bilan && (
            <div className="kl-ai-coach-block">
              <div className="kl-ai-coach-lbl">BILAN</div>
              <p className="kl-ai-coach-text">{status.result.bilan}</p>
            </div>
          )}

          {status.result.recommandations.length > 0 && (
            <div className="kl-ai-coach-block">
              <div className="kl-ai-coach-lbl">RECOMMANDATIONS</div>
              <ul className="kl-ai-coach-list">
                {status.result.recommandations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {status.result.ajustementKcal !== null && (
            <div className="kl-ai-coach-block">
              <div className="kl-ai-coach-lbl">CIBLE CALORIQUE SUGGÉRÉE</div>
              <div className="stat-ai-kcal">
                <span className="stat-ai-kcal-before mono">
                  {targets.kcal} kcal
                </span>
                <span
                  className="material-symbols-outlined stat-ai-kcal-arrow"
                  aria-hidden
                >
                  arrow_forward
                </span>
                <span className="stat-ai-kcal-after mono">
                  {targets.kcal + status.result.ajustementKcal} kcal
                </span>
                <span className="stat-ai-kcal-delta mono">
                  ({status.result.ajustementKcal > 0 ? '+' : ''}
                  {status.result.ajustementKcal})
                </span>
              </div>
              <p className="stat-ai-kcal-note">
                À ajuster manuellement dans Réglages si tu valides ce conseil.
              </p>
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
