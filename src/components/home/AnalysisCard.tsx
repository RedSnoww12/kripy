import { useSettingsStore } from '@/store/useSettingsStore';
import type { HomeAnalysis } from '@/features/analysis/home-analysis';
import type { Phase, WeightStats } from '@/types';

interface Props {
  analysis: HomeAnalysis;
  stats: WeightStats | null;
  hideRecommendation?: boolean;
}

const PHASE_TARGET_RATE: Record<Phase, number> = {
  A: 0,
  B: -0.5,
  C: 0,
  D: 0.3,
  E: -0.5,
  F: 0,
};

const VARIANT_PILL: Record<
  HomeAnalysis['variant'],
  { label: string; color: string; bg: string }
> = {
  increase: { label: 'TREND ↑', color: 'var(--acc)', bg: 'var(--grnG)' },
  decrease: { label: 'TREND ↓', color: 'var(--org)', bg: 'var(--orgG)' },
  maintain: { label: 'STABLE', color: 'var(--cyan)', bg: 'var(--cyanG)' },
};

function rateColor(r: number): string {
  if (r < -0.05) return 'var(--acc)';
  if (r > 0.05) return 'var(--red)';
  return 'var(--t1)';
}

function buildVerdict(phase: Phase, rate: number, target: number): string {
  const gap = rate - target;
  const abs = Math.abs(gap);
  if (abs < 0.05) {
    return phase === 'A' || phase === 'C'
      ? 'Poids stable, sur la cible'
      : 'Pile sur ta cible';
  }
  const expectingLoss = target < 0;
  const expectingGain = target > 0;
  if (expectingLoss) {
    return gap > 0
      ? `Sous ta cible de ${abs.toFixed(2)} kg/sem`
      : `Au-delà de la cible de ${abs.toFixed(2)} kg/sem`;
  }
  if (expectingGain) {
    return gap < 0
      ? `Sous ta cible de ${abs.toFixed(2)} kg/sem`
      : `Au-delà de la cible de ${abs.toFixed(2)} kg/sem`;
  }
  return rate > 0
    ? `Hausse de ${abs.toFixed(2)} kg/sem hors cible`
    : `Baisse de ${abs.toFixed(2)} kg/sem hors cible`;
}

export default function AnalysisCard({
  analysis,
  stats,
  hideRecommendation = false,
}: Props) {
  const phase = useSettingsStore((s) => s.phase);
  const targets = useSettingsStore((s) => s.targets);
  const setTargets = useSettingsStore((s) => s.setTargets);

  const pill = VARIANT_PILL[analysis.variant];
  const rate = analysis.trend?.rate ?? stats?.rate ?? 0;
  const target = PHASE_TARGET_RATE[phase];
  const rateAbs = Math.abs(rate);
  const targetAbs = Math.abs(target);
  const max = Math.max(rateAbs, targetAbs, 0.2) * 1.15;

  const verdict = buildVerdict(phase, rate, target);

  const subline = analysis.trend
    ? `Palier stabilisé depuis ${analysis.trend.daysOnPalier}j`
    : `Analyse sur ${analysis.winDays}j`;

  const rec = analysis.recommendation;
  const recKcalDelta =
    rec?.act === '+200' ? 200 : rec?.act === '-200' ? -200 : 0;

  const applyRec = () => {
    if (!recKcalDelta) return;
    const glucDelta = Math.round(recKcalDelta / 4);
    const nextGluc = Math.max(0, targets.gluc + glucDelta);
    const nextKcal = targets.prot * 4 + nextGluc * 4 + targets.lip * 9;
    setTargets({ ...targets, gluc: nextGluc, kcal: nextKcal });
  };

  return (
    <section className="kl-analysis">
      <div className="kl-analysis-head">
        <div className="kl-analysis-sectlbl">
          ▸ ANALYSE · {analysis.winDays} JOURS
        </div>
        <span
          className="kl-analysis-pill"
          style={{ color: pill.color, background: pill.bg }}
        >
          {pill.label}
        </span>
      </div>

      <div className="kl-analysis-head-text">
        <div className="kl-analysis-verdict">{verdict}</div>
        <div className="kl-analysis-subline">{subline}</div>
      </div>

      <div className="kl-slope-box">
        <SlopeRow
          label="Pente actuelle"
          value={rate}
          max={max}
          color={rateColor(rate)}
        />
        <SlopeRow
          label="Cible"
          value={target}
          max={max}
          color="var(--acc)"
          dashed
        />
      </div>

      {recKcalDelta !== 0 && !hideRecommendation && (
        <div className="kl-reco-strip">
          <div className="kl-reco-ico" aria-hidden>
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <div className="kl-reco-msg">
            Envisage{' '}
            <b>
              {recKcalDelta > 0 ? '+' : '−'}
              {Math.abs(recKcalDelta)} kcal
            </b>{' '}
            pour {recKcalDelta < 0 ? 'relancer la pente' : 'rééquilibrer'}.
          </div>
          <button type="button" className="kl-reco-apply" onClick={applyRec}>
            APPLIQUER
          </button>
        </div>
      )}

      <div className="kl-analysis-grid">
        <div className="kl-stat-cell">
          <div className="kl-stat-lbl">KCAL MOY</div>
          <div className="kl-stat-val" style={{ color: 'var(--org)' }}>
            {analysis.avgKcal}
          </div>
        </div>
        <div className="kl-stat-cell">
          <div className="kl-stat-lbl">PROT MOY</div>
          <div className="kl-stat-val" style={{ color: 'var(--acc)' }}>
            {analysis.avgProt}g
          </div>
        </div>
        <div className="kl-stat-cell">
          <div className="kl-stat-lbl">POIDS Δ</div>
          <div
            className="kl-stat-val"
            style={{ color: rateColor(analysis.weightChange) }}
          >
            {analysis.weightChange > 0 ? '+' : ''}
            {analysis.weightChange.toFixed(1)} kg
          </div>
        </div>
        <div className="kl-stat-cell">
          <div className="kl-stat-lbl">TRACKÉS</div>
          <div className="kl-stat-val">
            {analysis.trackedDays}/{analysis.winDays}
          </div>
        </div>
      </div>

      {stats && stats.count >= 2 && (
        <div className="kl-analysis-grid">
          <div className="kl-stat-cell">
            <div className="kl-stat-lbl">MOY 7J</div>
            <div className="kl-stat-val" style={{ color: 'var(--acc)' }}>
              {stats.avg7}
            </div>
          </div>
          <div className="kl-stat-cell">
            <div className="kl-stat-lbl">MOY 30J</div>
            <div className="kl-stat-val" style={{ color: 'var(--pur)' }}>
              {stats.avg30}
            </div>
          </div>
          <div className="kl-stat-cell">
            <div className="kl-stat-lbl">RYTHME</div>
            <div
              className="kl-stat-val"
              style={{ color: rateColor(stats.rate) }}
            >
              {stats.rate > 0 ? '+' : ''}
              {stats.rate}/sem
            </div>
          </div>
          <div className="kl-stat-cell">
            <div className="kl-stat-lbl">
              {stats.estDays ? 'OBJECTIF' : 'RÉGULARITÉ'}
            </div>
            <div className="kl-stat-val" style={{ color: 'var(--org)' }}>
              {stats.estDays ? `~${stats.estDays}j` : `${stats.reg}%`}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface SlopeRowProps {
  label: string;
  value: number;
  max: number;
  color: string;
  dashed?: boolean;
}

function SlopeRow({ label, value, max, color, dashed }: SlopeRowProps) {
  const abs = Math.abs(value);
  const pct = Math.min(100, (abs / max) * 100);
  return (
    <div className="kl-slope-row">
      <div className="kl-slope-head">
        <span className="kl-slope-lbl">{label.toUpperCase()}</span>
        <span className="kl-slope-val" style={{ color }}>
          {value > 0 ? '+' : ''}
          {value.toFixed(2)}
          <span className="kl-slope-unit"> kg/sem</span>
        </span>
      </div>
      <div className="kl-slope-bar">
        <div
          className={`kl-slope-fill${dashed ? ' dashed' : ''}`}
          style={{
            width: `${pct}%`,
            ['--slope-color' as string]: color,
          }}
        />
      </div>
    </div>
  );
}
