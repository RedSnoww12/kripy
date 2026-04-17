import { useSettingsStore } from '@/store/useSettingsStore';
import type { Recommendation, TrendResult } from '@/types';

interface Props {
  trend: TrendResult;
  recommendation: Recommendation;
}

export default function RecommendationAlert({ trend, recommendation }: Props) {
  const targets = useSettingsStore((s) => s.targets);
  const setTargets = useSettingsStore((s) => s.setTargets);

  const handleApply = (delta: number) => {
    const nextGluc = Math.max(0, targets.gluc + Math.round(delta / 4));
    const nextKcal = targets.prot * 4 + nextGluc * 4 + targets.lip * 9;
    setTargets({ ...targets, gluc: nextGluc, kcal: nextKcal });
  };

  const confBadge =
    trend.dir !== 'observing' && trend.confidence === 'low'
      ? ` (confiance basse, vise ${trend.idealDays}j)`
      : null;

  const subParts: string[] = [];
  if (trend.dir !== 'observing') {
    subParts.push(`Fenêtre ${trend.window}j`);
    subParts.push(`conf ${trend.confidence}`);
    if (trend.adherence !== null)
      subParts.push(`adhérence ${trend.adherence}%`);
  }

  let applyBtn: React.ReactNode = null;
  if (recommendation.act === '+200') {
    applyBtn = (
      <button
        type="button"
        className="btn btn-p btn-sm"
        style={{ marginTop: 6 }}
        onClick={() => handleApply(200)}
      >
        Appliquer +200
      </button>
    );
  } else if (recommendation.act === '-200') {
    applyBtn = (
      <button
        type="button"
        className="btn btn-d btn-sm"
        style={{ marginTop: 6 }}
        onClick={() => handleApply(-200)}
      >
        Appliquer -200
      </button>
    );
  }

  return (
    <div
      className={`alt ${recommendation.tp}`}
      style={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 4,
      }}
    >
      <span>
        {recommendation.msg}
        {confBadge && (
          <span
            style={{
              fontSize: '.55rem',
              color: 'var(--t3)',
              marginLeft: 4,
            }}
          >
            {confBadge}
          </span>
        )}
      </span>
      {subParts.length > 0 && (
        <span style={{ fontSize: '.58rem', color: 'var(--t3)' }}>
          {subParts.join(' · ')}
        </span>
      )}
      {applyBtn}
    </div>
  );
}
