import { ACTIVITY_LEVELS } from '@/data/constants';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import NumInput from '@/components/ui/NumInput';
import SettingsSection from './SettingsSection';

export default function ProfileCard() {
  const height = useSettingsStore((s) => s.height);
  const stepsGoal = useSettingsStore((s) => s.stepsGoal);
  const activity = useSettingsStore((s) => s.activity);
  const goalWeight = useSettingsStore((s) => s.goalWeight);

  const setHeight = useSettingsStore((s) => s.setHeight);
  const setStepsGoal = useSettingsStore((s) => s.setStepsGoal);
  const setActivity = useSettingsStore((s) => s.setActivity);
  const setGoalWeight = useSettingsStore((s) => s.setGoalWeight);

  const weights = useTrackingStore((s) => s.weights);
  const latestWeight = weights.length ? weights[weights.length - 1].w : null;

  return (
    <SettingsSection icon="person" title="Profil & TDEE">
      <div className="set-grid-3">
        <div className="set-f">
          <label htmlFor="sH">Taille (cm)</label>
          <NumInput
            id="sH"
            className="set-in set-in-num"
            value={height}
            onCommit={setHeight}
          />
        </div>
        <div className="set-f">
          <label htmlFor="sW">Poids actuel (kg)</label>
          <input
            id="sW"
            type="text"
            className="set-in set-in-num"
            value={latestWeight != null ? latestWeight : '—'}
            readOnly
            tabIndex={-1}
            style={{ opacity: latestWeight != null ? 1 : 0.5 }}
          />
        </div>
        <div className="set-f">
          <label htmlFor="sSt">Pas / jour</label>
          <NumInput
            id="sSt"
            className="set-in set-in-num"
            value={stepsGoal}
            onCommit={setStepsGoal}
          />
        </div>
      </div>
      <div className="set-f">
        <label>Niveau d'activité</label>
        <div className="set-pills">
          {ACTIVITY_LEVELS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`set-pill${opt.key === activity ? ' sel' : ''}`}
              onClick={() => setActivity(opt.key)}
            >
              {opt.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="set-f">
        <label htmlFor="sPW">Poids objectif (kg)</label>
        <NumInput
          id="sPW"
          className="set-in set-in-num"
          value={goalWeight}
          onCommit={setGoalWeight}
          decimal
        />
      </div>
    </SettingsSection>
  );
}
