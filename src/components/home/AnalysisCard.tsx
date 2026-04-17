import { useSettingsStore } from '@/store/useSettingsStore';
import type { HomeAnalysis } from '@/features/analysis/home-analysis';
import type { WeightStats } from '@/types';

interface Props {
  analysis: HomeAnalysis;
  stats: WeightStats | null;
}

function rateColor(rate: number): string {
  if (rate < 0) return 'var(--grn)';
  if (rate > 0) return 'var(--red)';
  return 'var(--acc)';
}

export default function AnalysisCard({ analysis, stats }: Props) {
  const targets = useSettingsStore((s) => s.targets);
  const setTargets = useSettingsStore((s) => s.setTargets);

  const applyDelta = (delta: number) => {
    const nextGluc = Math.max(0, targets.gluc + delta);
    const nextKcal = targets.prot * 4 + nextGluc * 4 + targets.lip * 9;
    setTargets({ ...targets, gluc: nextGluc, kcal: nextKcal });
  };

  const trendSubParts: string[] = [];
  if (analysis.trend && analysis.trend.dir !== 'observing') {
    trendSubParts.push(`Fenêtre ${analysis.trend.window}j`);
    trendSubParts.push(`conf ${analysis.trend.confidence}`);
    if (analysis.trend.adherence !== null) {
      trendSubParts.push(`adhérence ${analysis.trend.adherence}%`);
    }
  }

  const ctaDelta =
    analysis.variant === 'increase'
      ? 50
      : analysis.variant === 'decrease'
        ? -50
        : 0;

  return (
    <section className={`an-card ${analysis.variant}`}>
      <div className="an-head">
        <div className="an-ico">
          <span className="material-symbols-outlined">analytics</span>
        </div>
        <div className="an-hx">
          <h3>Analyse du Lab</h3>
          <p>{analysis.reason}</p>
          {trendSubParts.length > 0 && (
            <div className="an-sub">{trendSubParts.join(' · ')}</div>
          )}
        </div>
      </div>

      {analysis.headline && (
        <div className="an-quote">
          <p>«&nbsp;{analysis.headline}&nbsp;»</p>
        </div>
      )}

      {ctaDelta !== 0 && (
        <button
          type="button"
          className="an-cta"
          onClick={() => applyDelta(ctaDelta)}
        >
          Appliquer la recommandation
        </button>
      )}

      <div className="an-g">
        <div className="an-s">
          <div className="al">Moy cal {analysis.winDays}j</div>
          <div className="av" style={{ color: 'var(--org)' }}>
            {analysis.avgKcal}
          </div>
        </div>
        <div className="an-s">
          <div className="al">Moy prot</div>
          <div className="av" style={{ color: 'var(--acc)' }}>
            {analysis.avgProt}g
          </div>
        </div>
        <div className="an-s">
          <div className="al">Évol {analysis.winDays}j</div>
          <div
            className="av"
            style={{ color: rateColor(analysis.weightChange) }}
          >
            {analysis.weightChange > 0 ? '+' : ''}
            {analysis.weightChange.toFixed(1)}
          </div>
        </div>
        <div className="an-s">
          <div className="al">Trackés</div>
          <div className="av">
            {analysis.trackedDays}/{analysis.winDays}
          </div>
        </div>
      </div>

      {stats && stats.count >= 2 && (
        <div className="an-g an-g2">
          <div className="an-s">
            <div className="al">Moy 7j</div>
            <div className="av" style={{ color: 'var(--acc)' }}>
              {stats.avg7}
            </div>
          </div>
          <div className="an-s">
            <div className="al">Moy 30j</div>
            <div className="av" style={{ color: 'var(--pur)' }}>
              {stats.avg30}
            </div>
          </div>
          <div className="an-s">
            <div className="al">Rythme</div>
            <div className="av" style={{ color: rateColor(stats.rate) }}>
              {stats.rate > 0 ? '+' : ''}
              {stats.rate}/sem
            </div>
          </div>
          <div className="an-s">
            <div className="al">
              {stats.estDays ? 'Objectif' : 'Régularité'}
            </div>
            <div className="av" style={{ color: 'var(--org)' }}>
              {stats.estDays ? `~${stats.estDays}j` : `${stats.reg}%`}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
