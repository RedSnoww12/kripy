import { useState } from 'react';
import { computeTdee, type TdeeResult } from '@/features/settings/tdeeCalc';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { toast } from '@/components/ui/toastStore';
import SettingsSection from './SettingsSection';

export default function TdeeCalcCard() {
  const height = useSettingsStore((s) => s.height);
  const startWeight = useSettingsStore((s) => s.startWeight);
  const stepsGoal = useSettingsStore((s) => s.stepsGoal);
  const activity = useSettingsStore((s) => s.activity);
  const phase = useSettingsStore((s) => s.phase);
  const setTargets = useSettingsStore((s) => s.setTargets);
  const confirmTdee = useSettingsStore((s) => s.confirmTdee);

  const weights = useTrackingStore((s) => s.weights);
  const currentWeight = weights.length
    ? weights[weights.length - 1].w
    : startWeight;

  const [result, setResult] = useState<TdeeResult | null>(null);

  const handleCalc = () => {
    const r = computeTdee({
      weight: currentWeight,
      heightCm: height,
      stepsGoal,
      activity,
      phase,
    });
    setResult(r);
  };

  const handleApply = () => {
    if (!result) return;
    setTargets(result.targets);
    confirmTdee();
    toast('Macros auto appliquées', 'success');
  };

  return (
    <SettingsSection id="tdee" icon="calculate" title="TDEE + macros auto">
      <button type="button" className="set-btn-ghost" onClick={handleCalc}>
        <span className="material-symbols-outlined">calculate</span>
        Calculer TDEE + macros
      </button>
      {result && (
        <div className="alt info" style={{ marginTop: 6 }}>
          <span>
            <strong>BMR</strong> = {result.bmr} × {result.activityMultiplier} (
            {activity.replace('_', ' ')}) = {result.tdeeBase}
            <br />+ Pas bonus : +{result.stepBonus} → {result.tdeeRaw}
            <br />× Phase {phase} ({result.phaseMultiplier}) ={' '}
            <strong>{result.tdee} kcal</strong>
            <br />
            <br />
            Prot : {currentWeight}×2 = <strong>{result.targets.prot}g</strong> (
            {result.targets.prot * 4} kcal)
            <br />
            Lip : {currentWeight}×1 = <strong>{result.targets.lip}g</strong> (
            {result.targets.lip * 9} kcal)
            <br />
            Gluc : reste = <strong>{result.targets.gluc}g</strong> (
            {result.targets.gluc * 4} kcal)
          </span>
        </div>
      )}
      {result && (
        <button
          type="button"
          className="btn btn-p"
          style={{ width: '100%', marginTop: 8 }}
          onClick={handleApply}
        >
          Appliquer ces cibles
        </button>
      )}
    </SettingsSection>
  );
}
