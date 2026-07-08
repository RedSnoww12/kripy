import { useMemo, useState } from 'react';
import {
  EXERCISE_CATALOG,
  TRAINING_STYLES,
  defaultPlannedExercise,
  exerciseGroupsByMuscle,
} from '@/data/exercises';
import { toast } from '@/components/ui/toastStore';
import { sanitizeInteger } from '@/lib/numericInput';
import type {
  CustomExercise,
  PlannedExercise,
  SessionTemplate,
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
  'Combien de séances par semaine ?',
  'Construis tes séances',
] as const;

function newTemplate(index: number): SessionTemplate {
  return {
    id: `tpl_${Date.now()}_${index}`,
    name: `Séance ${index}`,
    exercises: [],
  };
}

export default function TrainingSetupWizard({
  initial,
  onDone,
  onCancel,
}: Props) {
  const [step, setStep] = useState(0);
  const [style, setStyle] = useState<TrainingStyle>(
    initial?.style ?? 'hypertrophy',
  );
  const [freq, setFreq] = useState(initial?.sessionsPerWeek ?? 3);
  const [templates, setTemplates] = useState<SessionTemplate[]>(
    initial?.sessionTemplates ?? [],
  );
  const [customs, setCustoms] = useState<CustomExercise[]>(
    initial?.customExercises ?? [],
  );
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customBw, setCustomBw] = useState(false);

  const groups = useMemo(() => exerciseGroupsByMuscle(), []);

  const resolveName = (id: string) =>
    EXERCISE_CATALOG.find((e) => e.id === id)?.name ??
    customs.find((c) => c.id === id)?.name ??
    id;

  const addTemplate = () => {
    setTemplates((prev) => [...prev, newTemplate(prev.length + 1)]);
  };

  const removeTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (pickerFor === id) setPickerFor(null);
  };

  const renameTemplate = (id: string, name: string) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  const toggleExerciseInTemplate = (templateId: string, exerciseId: string) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        const exists = t.exercises.some((e) => e.exerciseId === exerciseId);
        return {
          ...t,
          exercises: exists
            ? t.exercises.filter((e) => e.exerciseId !== exerciseId)
            : [...t.exercises, defaultPlannedExercise(exerciseId, style)],
        };
      }),
    );
  };

  const updatePlanned = (
    templateId: string,
    exerciseId: string,
    patch: Partial<PlannedExercise>,
  ) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          exercises: t.exercises.map((e) =>
            e.exerciseId === exerciseId ? { ...e, ...patch } : e,
          ),
        };
      }),
    );
  };

  const addCustom = () => {
    if (!pickerFor) return;
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
    toggleExerciseInTemplate(pickerFor, custom.id);
    setCustomName('');
    setCustomBw(false);
  };

  const finish = () => {
    const withExercises = templates.filter((t) => t.exercises.length > 0);
    if (withExercises.length === 0) {
      toast('Crée au moins une séance avec un exercice', 'error');
      return;
    }
    const finalTemplates = withExercises.map((t, i) => ({
      ...t,
      name: t.name.trim() || `Séance ${i + 1}`,
    }));
    onDone({
      style,
      sessionsPerWeek: freq,
      sessionTemplates: finalTemplates,
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
      )}

      {step === 2 && (
        <>
          {templates.map((t) => (
            <div key={t.id} className="kl-tpl-card">
              <div className="kl-tpl-head">
                <input
                  type="text"
                  className="kl-tpl-name-inp"
                  value={t.name}
                  placeholder="Nom de la séance (ex : Upper A)"
                  onChange={(e) => renameTemplate(t.id, e.target.value)}
                  aria-label="Nom de la séance"
                />
                <button
                  type="button"
                  className="kl-tpl-del"
                  onClick={() => removeTemplate(t.id)}
                  aria-label={`Supprimer la séance ${t.name}`}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>

              {t.exercises.length > 0 && (
                <div className="kl-tpl-exos">
                  {t.exercises.map((pe) => (
                    <div key={pe.exerciseId} className="kl-tpl-exo-row">
                      <span className="kl-tpl-exo-name">
                        {resolveName(pe.exerciseId)}
                      </span>
                      <div className="kl-tpl-exo-fields">
                        <label className="kl-tpl-field">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={pe.sets}
                            onChange={(e) =>
                              updatePlanned(t.id, pe.exerciseId, {
                                sets:
                                  parseInt(
                                    sanitizeInteger(e.target.value),
                                    10,
                                  ) || 1,
                              })
                            }
                            aria-label={`${resolveName(pe.exerciseId)} nombre de séries`}
                          />
                          <span>séries</span>
                        </label>
                        <label className="kl-tpl-field kl-tpl-field-reps">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={pe.repsMin}
                            onChange={(e) =>
                              updatePlanned(t.id, pe.exerciseId, {
                                repsMin:
                                  parseInt(
                                    sanitizeInteger(e.target.value),
                                    10,
                                  ) || 1,
                              })
                            }
                            aria-label={`${resolveName(pe.exerciseId)} reps minimum`}
                          />
                          <span>—</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={pe.repsMax}
                            onChange={(e) =>
                              updatePlanned(t.id, pe.exerciseId, {
                                repsMax:
                                  parseInt(
                                    sanitizeInteger(e.target.value),
                                    10,
                                  ) || 1,
                              })
                            }
                            aria-label={`${resolveName(pe.exerciseId)} reps maximum`}
                          />
                          <span>reps</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        className="kl-tpl-exo-del"
                        onClick={() =>
                          toggleExerciseInTemplate(t.id, pe.exerciseId)
                        }
                        aria-label={`Retirer ${resolveName(pe.exerciseId)}`}
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="kl-tpl-add-exo"
                onClick={() => setPickerFor(pickerFor === t.id ? null : t.id)}
                aria-expanded={pickerFor === t.id}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {pickerFor === t.id ? 'expand_less' : 'add'}
                </span>
                {pickerFor === t.id ? 'Fermer' : 'Ajouter un exercice'}
              </button>

              {pickerFor === t.id && (
                <div className="kl-tpl-picker">
                  {groups.map(([muscle, exos]) => (
                    <div key={muscle}>
                      <div className="kl-tpl-picker-lbl">
                        {muscle.toUpperCase()}
                      </div>
                      <div className="kl-sport-muscles kl-wiz-exos">
                        {exos.map((e) => {
                          const on = t.exercises.some(
                            (pe) => pe.exerciseId === e.id,
                          );
                          return (
                            <button
                              key={e.id}
                              type="button"
                              className={`kl-sport-muscle ${on ? 'on' : ''}`}
                              onClick={() =>
                                toggleExerciseInTemplate(t.id, e.id)
                              }
                              aria-pressed={on}
                            >
                              {e.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {customs.length > 0 && (
                    <>
                      <div className="kl-tpl-picker-lbl">PERSO</div>
                      <div className="kl-sport-muscles kl-wiz-exos">
                        {customs.map((c) => {
                          const on = t.exercises.some(
                            (pe) => pe.exerciseId === c.id,
                          );
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className={`kl-sport-muscle ${on ? 'on' : ''}`}
                              onClick={() =>
                                toggleExerciseInTemplate(t.id, c.id)
                              }
                              aria-pressed={on}
                            >
                              {c.name}
                              {c.bodyweight ? ' · PDC' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div className="kl-wiz-custom">
                    <input
                      type="text"
                      className="kl-sport-notes-inp"
                      placeholder="Créer un exercice (ex : Planche)"
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
                </div>
              )}
            </div>
          ))}

          <button type="button" className="kl-tpl-new" onClick={addTemplate}>
            <span className="material-symbols-outlined" aria-hidden>
              add
            </span>
            Nouvelle séance
          </button>
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
