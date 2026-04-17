import { MACRO_COLORS } from '@/features/analysis/charts/chartDefaults';
import type { MacroAverages } from '@/features/analysis/charts/macroAverages';

interface Props {
  averages: MacroAverages;
}

interface LegendRowProps {
  color: string;
  label: string;
  pct: number;
}

function LegendRow({ color, label, pct }: LegendRowProps) {
  return (
    <div>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          marginRight: 6,
        }}
      />
      {label} <strong>{pct}%</strong>
    </div>
  );
}

export default function MacroLegend({ averages }: Props) {
  return (
    <div
      className="stat-macro-leg"
      style={{
        fontSize: '.68rem',
        lineHeight: 2,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <LegendRow color={MACRO_COLORS.p} label="Prot" pct={averages.pPct} />
      <LegendRow color={MACRO_COLORS.g} label="Gluc" pct={averages.gPct} />
      <LegendRow color={MACRO_COLORS.l} label="Lip" pct={averages.lPct} />
    </div>
  );
}
