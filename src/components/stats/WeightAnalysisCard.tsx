import { useMemo } from 'react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { usePalierStore } from '@/store/usePalierStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { trend72, weightStats } from '@/features/analysis/trend';
import {
  computeVariance,
  describeVariance,
  rateMessageFor,
} from '@/features/analysis/weightAnalysis';
import { todayISO } from '@/lib/date';
import { PHASE_COLORS, PHASE_MULTIPLIERS, PHASE_NAMES } from '@/data/constants';

export default function WeightAnalysisCard() {
  const weights = useTrackingStore((s) => s.weights);
  const height = useSettingsStore((s) => s.height);
  const startWeight = useSettingsStore((s) => s.startWeight);
  const phase = useSettingsStore((s) => s.phase);
  const targets = useSettingsStore((s) => s.targets);
  const log = useNutritionStore((s) => s.log);
  const palier = usePalierStore((s) => s.palier);

  const today = todayISO();
  const stats = useMemo(
    () =>
      weightStats({
        weights,
        heightCm: height,
        startWeight,
        today,
      }),
    [weights, height, startWeight, today],
  );

  const trend = useMemo(() => {
    if (!palier) return null;
    return trend72({
      weights,
      palier,
      currentKcal: targets.kcal,
      currentPhase: phase,
      log,
      today,
    });
  }, [weights, palier, targets.kcal, phase, log, today]);

  const variance = useMemo(() => computeVariance(weights), [weights]);
  const varianceDetails = describeVariance(variance);

  if (!stats || stats.count < 3) {
    return (
      <div className="alt info">
        <span>3 pesées minimum pour l'analyse</span>
      </div>
    );
  }

  const rate = rateMessageFor({ phase, trend, stats });
  const phaseColor = PHASE_COLORS[phase];
  const phaseInfo = `Phase ${phase} (${PHASE_NAMES[phase]}) — x${PHASE_MULTIPLIERS[phase]}`;

  const trendSub =
    trend && trend.dir !== 'observing'
      ? [
          `Fenêtre ${trend.window}j`,
          `conf ${trend.confidence}`,
          trend.adherence !== null ? `adhérence ${trend.adherence}%` : null,
        ].filter((x): x is string => x !== null)
      : null;

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <span
          className="chip"
          style={{ background: `${phaseColor}20`, color: phaseColor }}
        >
          {phaseInfo}
        </span>
      </div>

      {trendSub && (
        <div
          style={{
            fontSize: '.62rem',
            color: 'var(--t3)',
            marginBottom: 6,
          }}
        >
          {trendSub.join(' · ')}
        </div>
      )}

      <div className={`alt ${rate.tone}`} style={{ marginBottom: 6 }}>
        <span>{rate.message}</span>
      </div>

      <div className="sum-row">
        <div className="sum-box">
          <div className="sl">Départ</div>
          <div className="sv">{stats.start}</div>
        </div>
        <div className="sum-box">
          <div className="sl">Min</div>
          <div className="sv" style={{ color: 'var(--grn)' }}>
            {stats.mn}
          </div>
        </div>
        <div className="sum-box">
          <div className="sl">Max</div>
          <div className="sv" style={{ color: 'var(--red)' }}>
            {stats.mx}
          </div>
        </div>
        <div className="sum-box">
          <div className="sl">Total</div>
          <div
            className="sv"
            style={{
              color: stats.total < 0 ? 'var(--grn)' : 'var(--red)',
            }}
          >
            {stats.total > 0 ? '+' : ''}
            {stats.total}
          </div>
        </div>
      </div>

      <div className="sum-row" style={{ marginTop: 5 }}>
        <div className="sum-box">
          <div className="sl">Moy 30j</div>
          <div className="sv" style={{ color: 'var(--pur)' }}>
            {stats.avg30}
          </div>
        </div>
        <div className="sum-box">
          <div className="sl">Pesées</div>
          <div className="sv">{stats.count}</div>
        </div>
        <div className="sum-box">
          <div className="sl">Régularité</div>
          <div className="sv" style={{ color: 'var(--org)' }}>
            {stats.reg}%
          </div>
        </div>
        <div className="sum-box">
          <div className="sl">Fluctuation</div>
          <div className="sv" style={{ color: varianceDetails.color }}>
            {variance.toFixed(1)}
          </div>
        </div>
      </div>

      {stats.estDays && (
        <div className="alt info" style={{ marginTop: 8, marginBottom: 0 }}>
          <span>
            À ce rythme, objectif {startWeight} kg atteint dans ~
            <strong>{stats.estDays} jours</strong>
          </span>
        </div>
      )}
    </div>
  );
}
