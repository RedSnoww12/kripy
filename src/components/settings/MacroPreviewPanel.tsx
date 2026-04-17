import { breakdownTargets } from '@/features/settings/macroDistribution';
import { MACRO_COLORS } from '@/features/analysis/charts/chartDefaults';
import type { Targets } from '@/types';

interface Props {
  targets: Targets;
}

function segmentStyle(pct: number, color: string): React.CSSProperties {
  return { width: `${pct}%`, background: color };
}

export default function MacroPreviewPanel({ targets }: Props) {
  const b = breakdownTargets(targets);

  const diffLabel =
    Math.abs(b.diff) <= 10
      ? `Macros = ${b.macroKcal} kcal ✓`
      : b.diff > 0
        ? `Macros = ${b.macroKcal} kcal (${b.diff} kcal non répartis)`
        : `Macros = ${b.macroKcal} kcal (${Math.abs(b.diff)} kcal en trop)`;

  const diffTone =
    Math.abs(b.diff) <= 10
      ? 'var(--grn)'
      : b.diff > 0
        ? 'var(--org)'
        : 'var(--red)';

  return (
    <div className="set-macro-preview">
      <div className="set-macro-preview-bar">
        <div style={segmentStyle(b.pPct, MACRO_COLORS.p)} />
        <div style={segmentStyle(b.gPct, MACRO_COLORS.g)} />
        <div style={segmentStyle(b.lPct, MACRO_COLORS.l)} />
      </div>
      <div className="set-macro-preview-grid">
        <div>
          <span className="set-mp-l">Prot</span>
          <span className="set-mp-v" style={{ color: MACRO_COLORS.p }}>
            {targets.prot}g
          </span>
          <span className="set-mp-s">
            {b.pKcal} kcal · {b.pPct}%
          </span>
        </div>
        <div>
          <span className="set-mp-l">Gluc</span>
          <span className="set-mp-v" style={{ color: MACRO_COLORS.g }}>
            {targets.gluc}g
          </span>
          <span className="set-mp-s">
            {b.gKcal} kcal · {b.gPct}%
          </span>
        </div>
        <div>
          <span className="set-mp-l">Lip</span>
          <span className="set-mp-v" style={{ color: MACRO_COLORS.l }}>
            {targets.lip}g
          </span>
          <span className="set-mp-s">
            {b.lKcal} kcal · {b.lPct}%
          </span>
        </div>
      </div>
      <div className="set-mp-diff" style={{ color: diffTone, marginTop: 6 }}>
        {diffLabel}
      </div>
    </div>
  );
}
