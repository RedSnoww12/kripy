import type { CalorieSummary as CalorieSummaryData } from '@/features/analysis/charts/kcalBalanceData';

interface Props {
  summary: CalorieSummaryData;
}

export default function CalorieSummary({ summary }: Props) {
  const deficitColor =
    summary.deficit > 0
      ? 'var(--grn)'
      : summary.deficit < 0
        ? 'var(--red)'
        : 'var(--acc)';
  const deficitSign = summary.deficit > 0 ? '-' : '+';
  const deficitValue = Math.abs(summary.deficit);

  return (
    <div className="sum-row">
      <div className="sum-box">
        <div className="sl">Moy/jour</div>
        <div className="sv" style={{ color: 'var(--org)' }}>
          {summary.avgKcal}
        </div>
      </div>
      <div className="sum-box">
        <div className="sl">Déficit/Surplus</div>
        <div className="sv" style={{ color: deficitColor }}>
          {deficitSign}
          {deficitValue}
        </div>
      </div>
      <div className="sum-box">
        <div className="sl">Sous obj.</div>
        <div className="sv" style={{ color: 'var(--grn)' }}>
          {summary.underDays}j
        </div>
      </div>
      <div className="sum-box">
        <div className="sl">Au-dessus</div>
        <div className="sv" style={{ color: 'var(--red)' }}>
          {summary.overDays}j
        </div>
      </div>
    </div>
  );
}
