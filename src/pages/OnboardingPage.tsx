import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  computeTargetsFromKcal,
  DEFAULT_PROFILE,
  PHASE_COLORS,
  PHASE_DESCRIPTIONS,
  PHASE_NAMES,
} from '@/data/constants';
import type { Phase } from '@/types';

const PHASE_ORDER: readonly Phase[] = ['A', 'B', 'F', 'C', 'D', 'E'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const [weight, setWeight] = useState(String(DEFAULT_PROFILE.startWeight));
  const [height, setHeight] = useState(String(DEFAULT_PROFILE.height));
  const [kcal, setKcal] = useState('2200');
  const [phase, setPhase] = useState<Phase>(DEFAULT_PROFILE.phase);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const w =
      parseFloat(weight.replace(',', '.')) || DEFAULT_PROFILE.startWeight;
    const h = parseInt(height, 10) || DEFAULT_PROFILE.height;
    const k = parseInt(kcal, 10) || 2200;
    const targets = computeTargetsFromKcal(k, w);

    completeOnboarding(
      {
        height: h,
        startWeight: w,
        phase,
        stepsGoal: DEFAULT_PROFILE.stepsGoal,
        activity: DEFAULT_PROFILE.activity,
        theme: DEFAULT_PROFILE.theme,
      },
      targets,
    );

    navigate('/', { replace: true });
  };

  return (
    <form className="ob" onSubmit={handleSubmit}>
      <div className="brand brand-g" style={{ fontSize: '1.8rem' }}>
        Kripy
      </div>
      <p>Configure tes objectifs</p>

      <div className="ob-f">
        <label htmlFor="obW">Poids cible (kg)</label>
        <p
          style={{
            margin: '-2px 0 8px',
            fontSize: '.68rem',
            color: 'var(--t3)',
            fontWeight: 500,
          }}
        >
          Le poids que tu veux atteindre — sert de référence pour l'objectif.
        </p>
        <input
          id="obW"
          className="inp"
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="70"
        />

        <label htmlFor="obH">Taille (cm)</label>
        <input
          id="obH"
          className="inp"
          type="number"
          inputMode="numeric"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="175"
        />

        <label htmlFor="obK">Calories</label>
        <input
          id="obK"
          className="inp"
          type="number"
          inputMode="numeric"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          placeholder="2200"
        />

        <label>Quel est ton objectif&nbsp;?</label>
        <div className="set-ph-grid" role="radiogroup" aria-label="Phase">
          {PHASE_ORDER.map((key) => {
            const color = PHASE_COLORS[key];
            const selected = key === phase;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`set-ph-card${selected ? ' sel' : ''}`}
                style={{ ['--ph-color' as string]: color }}
                onClick={() => setPhase(key)}
              >
                <span className="ph-letter">{key}</span>
                <span className="ph-name">{PHASE_NAMES[key]}</span>
                <span className="ph-desc">{PHASE_DESCRIPTIONS[key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-p"
        style={{
          width: '100%',
          maxWidth: 360,
          padding: 14,
          fontSize: '.92rem',
          marginTop: 22,
        }}
      >
        C'est parti
      </button>
    </form>
  );
}
