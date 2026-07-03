import { useMemo, useState } from 'react';
import {
  EXERCISE_CATALOG,
  SPLIT_TYPES,
  TRAINING_STYLES,
} from '@/data/exercises';
import { toast } from '@/components/ui/toastStore';
import type {
  CustomExercise,
  SplitType,
  TrainingProfile,
  TrainingStyle,
} from '@/types';

interface Props {
  initial: TrainingProfile | null;
  onDone: (profile: TrainingProfile) => void;
  onCancel?: () => void;
}

const STEP_TITLES = [
  'Comment tu t’entraînes ?',
  'Ton organisation',
  'Tes exercices à suivre',
] as const;

export default function TrainingSetupWizard({
  initial,
  onDone,
  onCancel,
}: Props) {
  const [step, setStep] = useState(0);
  const [style, setStyle] = useState<TrainingStyle>(
    initial?.style ?? 'hypertrophy',
  );
  const [split, setSplit] = useState<SplitType>(initial?.split ?? 'ppl');
  const [freq, setFreq] = useState(initial?.sessionsPerWeek ?? 3);
  const [tracked, setTracked] = useState<string[]>(
    initial?.trackedExercises ?? [],
  );
  const [customs, setCustoms] = useState<CustomExercise[]>(
    initial?.customExercises ?? [],
  );
  const [customName, setCustomName] = useState('');
  const [customBw, setCustomBw] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, typeof EXERCISE_CATALOG>();
    for (const exo of EXERCISE_CATALOG) {
      const list = map.get(exo.muscle) ?? [];
      map.set(exo.muscle, [...list, exo]);
    }
    return [...map.entries()];
  }, []);

  const toggleExercise = (id: string) => {
    setTracked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    const exists =
      customs.some((c) => c.name.toLowerCase() === name.toLowerCase()) ||
      EXERCISE_CATALOG.some((e) => e.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast('Cet exercice existe déjà', 'error');
      return;
    }
    const custom: CustomExercise = {
      id: `custom_${Date.now()}`,
      name,
      bodyweight: customBw,
    };
    setCustoms((prev) => [...prev, custom]);
    setTracked((prev) => [...prev, custom.id]);
    setCustomName('');
    setCustomBw(false);
  };

  const removeCustom = (id: string) => {
    setCustoms((prev) => prev.filter((c) => c.id !== id));
    setTracked((prev) => prev.filter((x) => x !== id));
  };

  const finish = () => {
    if (tracked.length === 0) {
      toast('Choisis au moins un exercice à suivre', 'error');
      return;
    }
    onDone({
      style,
      split,
      sessionsPerWeek: freq,
      trackedExercises: tracked,
      customExercises: customs,
    });
  };

  return (
    <div className="tp active">
      <section className="kl-sport-head">
        <div className="kl-sport-head-tag">
          <span className="kl-sport-head-led" aria-hidden />
          SETUP · {step + 1}/3
        </div>
        <h1 className="kl-sport-head-title">{STEP_TITLES[step]}</h1>
        <div className="kl-sport-head-sub">
          Ton programme sert à personnaliser le suivi de ta surcharge
          progressive.
        </div>
      </section>

      {step === 0 && (
        <div className="kl-wiz-styles">
          {TRAINING_STYLES.map((s) => {
            const on = s.key === style;
            return (
              <button
                key={s.key}
                type="button"
                className={`kl-wiz-style ${on ? 'on' : ''}`}
                onClick={() => setStyle(s.key)}
                aria-pressed={on}
              >
                <span className="material-symbols-outlined kl-wiz-style-ico">
                  {s.icon}
                </span>
                <span className="kl-wiz-style-name">{s.label}</span>
                <span className="kl-wiz-style-desc">{s.desc}</span>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <>
          <div className="kl-sport-section-lbl">
            <span className="kl-sport-section-bar" aria-hidden />
            TYPE DE SÉANCE
          </div>
          <div className="kl-wiz-splits">
            {SPLIT_TYPES.map((s) => {
              const on = s.key === split;
              return (
                <button
                  key={s.key}
                  type="button"
                  className={`kl-wiz-split ${on ? 'on' : ''}`}
                  onClick={() => setSplit(s.key)}
                  aria-pressed={on}
                >
                  <span className="kl-wiz-split-name">{s.label}</span>
                  <span className="kl-wiz-split-desc">{s.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="kl-sport-section-lbl">
            <span className="kl-sport-section-bar" aria-hidden />
            SÉANCES PAR SEMAINE
          </div>
          <div className="kl-wiz-freq">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                className={`kl-wiz-freq-btn ${n === freq ? 'on' : ''}`}
                onClick={() => setFreq(n)}
                aria-pressed={n === freq}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {groups.map(([muscle, exos]) => (
            <div key={muscle}>
              <div className="kl-sport-section-lbl">
                <span className="kl-sport-section-bar" aria-hidden />
                {muscle.toUpperCase()}
              </div>
              <div className="kl-sport-muscles kl-wiz-exos">
                {exos.map((e) => {
                  const on = tracked.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className={`kl-sport-muscle ${on ? 'on' : ''}`}
                      onClick={() => toggleExercise(e.id)}
                      aria-pressed={on}
                    >
                      {e.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="kl-sport-section-lbl">
            <span className="kl-sport-section-bar" aria-hidden />
            PERSO
          </div>
          {customs.length > 0 && (
            <div className="kl-sport-muscles kl-wiz-exos">
              {customs.map((c) => {
                const on = tracked.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`kl-sport-muscle ${on ? 'on' : ''}`}
                    onClick={() => toggleExercise(c.id)}
                    onDoubleClick={() => removeCustom(c.id)}
                    aria-pressed={on}
                  >
                    {c.name}
                    {c.bodyweight ? ' · PDC' : ''}
                  </button>
                );
              })}
            </div>
          )}
          <div className="kl-wiz-custom">
            <input
              type="text"
              className="kl-sport-notes-inp"
              placeholder="Ajouter un exercice (ex : Planche)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <button
              type="button"
              className={`kl-wiz-custom-bw ${customBw ? 'on' : ''}`}
              onClick={() => setCustomBw((v) => !v)}
              aria-pressed={customBw}
              title="Exercice au poids du corps"
            >
              PDC
            </button>
            <button
              type="button"
              className="kl-wiz-custom-add"
              onClick={addCustom}
              aria-label="Ajouter l'exercice personnalisé"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          {tracked.length > 0 && (
            <div className="kl-wiz-count">
              {tracked.length} exercice{tracked.length > 1 ? 's' : ''} suivi
              {tracked.length > 1 ? 's' : ''}
            </div>
          )}
        </>
      )}

      <div className="kl-wiz-nav">
        {step > 0 ? (
          <button
            type="button"
            className="btn btn-o"
            onClick={() => setStep((s) => s - 1)}
          >
            Retour
          </button>
        ) : onCancel ? (
          <button type="button" className="btn btn-o" onClick={onCancel}>
            Annuler
          </button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <button
            type="button"
            className="btn btn-p"
            onClick={() => setStep((s) => s + 1)}
          >
            Continuer
          </button>
        ) : (
          <button type="button" className="btn btn-p" onClick={finish}>
            Valider mon programme
          </button>
        )}
      </div>
    </div>
  );
}
