import { MACRO_COLORS } from '@/features/analysis/charts/chartDefaults';
import type { MacroAverages } from '@/features/analysis/charts/macroAverages';

interface Props {
  averages: MacroAverages;
  targetProtein: number;
}

export default function MacroAveragesGrid({ averages, targetProtein }: Props) {
  return (
    <div className="sum-row">
      <div className="sum-box">
        <div className="sl">Prot moy</div>
        <div className="sv" style={{ color: MACRO_COLORS.p }}>
          {averages.p}g
        </div>
      </div>
      <div className="sum-box">
        <div className="sl">Obj</div>
        <div className="sv" style={{ color: 'var(--t3)' }}>
          {targetProtein}g
        </div>
      </div>
      <div className="sum-box">
        <div className="sl">Gluc moy</div>
        <div className="sv" style={{ color: MACRO_COLORS.g }}>
          {averages.g}g
        </div>
      </div>
      <div className="sum-box">
        <div className="sl">Lip moy</div>
        <div className="sv" style={{ color: MACRO_COLORS.l }}>
          {averages.l}g
        </div>
      </div>
    </div>
  );
}
