import { useMemo, useState } from 'react';
import SessionPicker from '@/components/sport/SessionPicker';
import SessionRecap from '@/components/sport/SessionRecap';
import { exerciseGroupsByMuscle, makeExerciseResolver } from '@/data/exercises';
import {
  formatSuggestion,
  suggestNext,
  type NextSuggestion,
} from '@/features/sport/nextSession';
import { toast } from '@/components/ui/toastStore';
import { todayISO } from '@/lib/date';
import { sanitizeDecimal, sanitizeInteger } from '@/lib/numericInput';
import { useSportStore } from '@/store/useSportStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import type {
  CustomExercise,
  SessionExercise,
  SessionTemplate,
  StrengthSession,
  StrengthSet,
  TrainingProfile,
  Workout,
} from '@/types';

interface Props {
  profile: TrainingProfile;
}

type Mode =
  | { kind: 'idle' }
  | { kind: 'picking' }
  | { kind: 'template'; template: SessionTemplate }
  | { kind: 'free' };

interface SetDraft {
  w: string;
  r: string;
  rpe: string;
}

interface Objective {
  text: string;
  sets: number;
}

const RPE_OPTIONS = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'];
const FEELS = [
  { value: 1, emoji: '😖', label: 'Épuisé' },
  { value: 2, emoji: '😕', label: 'Difficile' },
  { value: 3, emoji: '😐', label: 'Correct' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '🔥', label: 'Excellent' },
] as const;

const EST_MIN_PER_SET = 4;
const DEFAULT_FREE_LABEL = 'Séance libre';

function formatSet(s: StrengthSet, bodyweight: boolean): string {
  const load = bodyweight ? (s.w > 0 ? `+${s.w}` : 'PDC') : String(s.w);
  return `${load}×${s.r}`;
}

export default function SessionLogger({ profile }: Props) {
  const sessions = useSportStore((s) => s.sessions);
  const addSession = useSportStore((s) => s.addSession);
  const setProfile = useSportStore((s) => s.setProfile);
  const addWorkout = useTrackingStore((s) => s.addWorkout);

  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [drafts, setDrafts] = useState<Record<string, SetDraft[]>>({});
  const [feel, setFeel] = useState<number | null>(null);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [recap, setRecap] = useState<StrengthSession | null>(null);
  const [freeExerciseIds, setFreeExerciseIds] = useState<string[]>([]);
  const [freeLabel, setFreeLabel] = useState(DEFAULT_FREE_LABEL);
  const [freePickerOpen, setFreePickerOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customBw, setCustomBw] = useState(false);

  const groups = useMemo(() => exerciseGroupsByMuscle(), []);

  const resolve = useMemo(
    () => makeExerciseResolver(profile.customExercises),
    [profile.customExercises],
  );

  const exerciseIds = useMemo(() => {
    if (mode.kind === 'template') {
      return mode.template.exercises.map((e) => e.exerciseId);
    }
    if (mode.kind === 'free') return freeExerciseIds;
    return [];
  }, [mode, freeExerciseIds]);

  const label =
    mode.kind === 'template'
      ? mode.template.name
      : freeLabel.trim() || DEFAULT_FREE_LABEL;

  const lastSets = useMemo(() => {
    const map = new Map<string, StrengthSet[]>();
    for (let i = sessions.length - 1; i >= 0; i--) {
      for (const entry of sessions[i].exercises) {
        if (!map.has(entry.exerciseId)) map.set(entry.exerciseId, entry.sets);
      }
    }
    return map;
  }, [sessions]);

  const suggestions = useMemo(() => {
    const map = new Map<string, NextSuggestion>();
    for (const exerciseId of exerciseIds) {
      const def = resolve(exerciseId);
      if (!def) continue;
      const s = suggestNext(profile, sessions, exerciseId, def.bodyweight);
      if (s) map.set(exerciseId, s);
    }
    return map;
  }, [exerciseIds, profile, sessions, resolve]);

  const objectiveFor = (exerciseId: string): Objective | null => {
    const def = resolve(exerciseId);
    if (!def) return null;
    const target = suggestions.get(exerciseId);
    if (target)
      return {
        text: formatSuggestion(target, def.bodyweight),
        sets: target.sets,
      };
    if (mode.kind === 'template') {
      const planned = mode.template.exercises.find(
        (e) => e.exerciseId === exerciseId,
      );
      if (planned) {
        return {
          text: `${planned.repsMin}-${planned.repsMax} reps`,
          sets: planned.sets,
        };
      }
    }
    return null;
  };

  const addSet = (exerciseId: string) => {
    setDrafts((prev) => {
      const cur = prev[exerciseId] ?? [];
      const template =
        cur.length > 0
          ? cur[cur.length - 1]
          : (() => {
              const target = suggestions.get(exerciseId);
              if (target) {
                return {
                  w: target.w > 0 ? String(target.w) : '',
                  r: String(target.repsMin),
                  rpe: '',
                };
              }
              const last = lastSets.get(exerciseId)?.[0];
              return last
                ? {
                    w: last.w ? String(last.w) : '',
                    r: String(last.r),
                    rpe: '',
                  }
                : { w: '', r: '', rpe: '' };
            })();
      return { ...prev, [exerciseId]: [...cur, { ...template, rpe: '' }] };
    });
  };

  const updateSet = (
    exerciseId: string,
    index: number,
    patch: Partial<SetDraft>,
  ) => {
    setDrafts((prev) => {
      const cur = [...(prev[exerciseId] ?? [])];
      cur[index] = { ...cur[index], ...patch };
      return { ...prev, [exerciseId]: cur };
    });
  };

  const removeSet = (exerciseId: string, index: number) => {
    setDrafts((prev) => {
      const cur = (prev[exerciseId] ?? []).filter((_, i) => i !== index);
      return { ...prev, [exerciseId]: cur };
    });
  };

  const toggleFreeExercise = (exerciseId: string) => {
    setFreeExerciseIds((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId],
    );
  };

  const addCustomForFree = () => {
    const name = customName.trim();
    if (!name) return;
    const exists = profile.customExercises.some(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      toast('Cet exercice existe déjà', 'error');
      return;
    }
    const custom: CustomExercise = {
      id: `custom_${Date.now()}`,
      name,
      bodyweight: customBw,
    };
    setProfile({
      ...profile,
      customExercises: [...profile.customExercises, custom],
    });
    setFreeExerciseIds((prev) => [...prev, custom.id]);
    setCustomName('');
    setCustomBw(false);
  };

  const reset = () => {
    setDrafts({});
    setFeel(null);
    setDuration('');
    setNotes('');
    setFreeExerciseIds([]);
    setFreeLabel(DEFAULT_FREE_LABEL);
    setFreePickerOpen(false);
    setMode({ kind: 'idle' });
  };

  const handleSave = () => {
    const exercises: SessionExercise[] = [];
    for (const exerciseId of exerciseIds) {
      const sets = (drafts[exerciseId] ?? [])
        .map((d): StrengthSet => {
          const w = parseFloat(d.w.replace(',', '.')) || 0;
          const r = parseInt(d.r, 10) || 0;
          const rpe = parseFloat(d.rpe) || 0;
          return rpe > 0 ? { w, r, rpe } : { w, r };
        })
        .filter((s) => s.r > 0);
      if (sets.length > 0) exercises.push({ exerciseId, sets });
    }

    if (exercises.length === 0) {
      toast('Ajoute au moins une série', 'error');
      return;
    }

    const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);
    const dur =
      parseInt(duration, 10) || Math.max(20, totalSets * EST_MIN_PER_SET);
    const id = Date.now();
    const date = todayISO();

    const session: StrengthSession = {
      id,
      date,
      label,
      templateId: mode.kind === 'template' ? mode.template.id : undefined,
      exercises,
      feel: feel ?? undefined,
      dur,
      notes: notes.trim() || undefined,
    };
    addSession(session);

    const workout: Workout = { id, date, type: label, dur };
    addWorkout(workout);

    setRecap(session);
  };

  if (recap) {
    return (
      <SessionRecap
        session={recap}
        profile={profile}
        onClose={() => {
          setRecap(null);
          reset();
        }}
      />
    );
  }

  if (mode.kind === 'idle') {
    return (
      <button
        type="button"
        className="kl-sport-save kl-log-start"
        onClick={() => setMode({ kind: 'picking' })}
      >
        <span className="material-symbols-outlined" aria-hidden>
          add
        </span>
        Démarrer une séance
      </button>
    );
  }

  if (mode.kind === 'picking') {
    return (
      <SessionPicker
        templates={profile.sessionTemplates}
        onPickTemplate={(template) => setMode({ kind: 'template', template })}
        onPickFree={() => setMode({ kind: 'free' })}
        onCancel={() => setMode({ kind: 'idle' })}
      />
    );
  }

  return (
    <section className="kl-log">
      <div className="kl-sport-section-lbl kl-sport-section-inline">
        <span className="kl-sport-section-bar" aria-hidden />
        {mode.kind === 'template'
          ? mode.template.name.toUpperCase()
          : 'SÉANCE LIBRE'}
      </div>

      {mode.kind === 'free' && (
        <>
          <input
            type="text"
            className="kl-log-free-name"
            value={freeLabel}
            onChange={(e) => setFreeLabel(e.target.value)}
            placeholder={DEFAULT_FREE_LABEL}
            aria-label="Nom de la séance"
          />

          {exerciseIds.length > 0 && (
            <div className="kl-log-free-chips">
              {exerciseIds.map((id) => {
                const def = resolve(id);
                if (!def) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    className="kl-sport-muscle on"
                    onClick={() => toggleFreeExercise(id)}
                  >
                    {def.name}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="kl-tpl-add-exo"
            onClick={() => setFreePickerOpen((v) => !v)}
            aria-expanded={freePickerOpen}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {freePickerOpen ? 'expand_less' : 'add'}
            </span>
            {freePickerOpen ? 'Fermer' : 'Choisir des exercices'}
          </button>

          {freePickerOpen && (
            <div className="kl-tpl-picker">
              {groups.map(([muscle, exos]) => (
                <div key={muscle}>
                  <div className="kl-tpl-picker-lbl">
                    {muscle.toUpperCase()}
                  </div>
                  <div className="kl-sport-muscles kl-wiz-exos">
                    {exos.map((e) => {
                      const on = freeExerciseIds.includes(e.id);
                      return (
                        <button
                          key={e.id}
                          type="button"
                          className={`kl-sport-muscle ${on ? 'on' : ''}`}
                          onClick={() => toggleFreeExercise(e.id)}
                          aria-pressed={on}
                        >
                          {e.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {profile.customExercises.length > 0 && (
                <>
                  <div className="kl-tpl-picker-lbl">PERSO</div>
                  <div className="kl-sport-muscles kl-wiz-exos">
                    {profile.customExercises.map((c) => {
                      const on = freeExerciseIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`kl-sport-muscle ${on ? 'on' : ''}`}
                          onClick={() => toggleFreeExercise(c.id)}
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
                  onClick={addCustomForFree}
                  aria-label="Ajouter l'exercice personnalisé"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {exerciseIds.map((exerciseId) => {
        const def = resolve(exerciseId);
        if (!def) return null;
        const sets = drafts[exerciseId] ?? [];
        const prev = lastSets.get(exerciseId);
        const objective = objectiveFor(exerciseId);
        return (
          <div key={exerciseId} className="kl-log-exo">
            <div className="kl-log-exo-head">
              <div className="kl-log-exo-title">
                <span className="kl-log-exo-name">{def.name}</span>
                {prev && (
                  <span className="kl-log-exo-prev">
                    dern.{' '}
                    {prev.map((s) => formatSet(s, def.bodyweight)).join(' · ')}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="kl-log-addset"
                onClick={() => addSet(exerciseId)}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  add
                </span>
                Série
              </button>
            </div>

            {objective && (
              <div className="kl-log-exo-goal">
                <span
                  className="material-symbols-outlined kl-log-exo-goal-ico"
                  aria-hidden
                >
                  flag
                </span>
                <span className="kl-log-exo-goal-text">
                  Objectif · {objective.sets} série
                  {objective.sets > 1 ? 's' : ''} · {objective.text}
                </span>
                <span className="kl-log-exo-goal-count">
                  {sets.length}/{objective.sets}
                </span>
              </div>
            )}

            {sets.length > 0 && (
              <div className="kl-log-sets">
                <div className="kl-log-set-cols" aria-hidden>
                  <span />
                  <span>{def.bodyweight ? 'LEST KG' : 'KG'}</span>
                  <span>REPS</span>
                  <span>RPE</span>
                  <span />
                </div>
                {sets.map((s, i) => (
                  <div key={i} className="kl-log-set">
                    <span className="kl-log-set-idx">{i + 1}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="kl-log-inp"
                      placeholder={def.bodyweight ? '0' : '—'}
                      value={s.w}
                      onChange={(e) =>
                        updateSet(exerciseId, i, {
                          w: sanitizeDecimal(e.target.value),
                        })
                      }
                      aria-label={`${def.name} série ${i + 1} charge`}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      className="kl-log-inp"
                      placeholder="—"
                      value={s.r}
                      onChange={(e) =>
                        updateSet(exerciseId, i, {
                          r: sanitizeInteger(e.target.value),
                        })
                      }
                      aria-label={`${def.name} série ${i + 1} répétitions`}
                    />
                    <select
                      className="kl-log-rpe"
                      value={s.rpe}
                      onChange={(e) =>
                        updateSet(exerciseId, i, { rpe: e.target.value })
                      }
                      aria-label={`${def.name} série ${i + 1} RPE`}
                    >
                      <option value="">—</option>
                      {RPE_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="kl-log-delset"
                      onClick={() => removeSet(exerciseId, i)}
                      aria-label={`Supprimer la série ${i + 1}`}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="kl-sport-section-lbl">
        <span className="kl-sport-section-bar" aria-hidden />
        RESSENTI GLOBAL
      </div>
      <div className="kl-log-feels">
        {FEELS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`kl-log-feel ${feel === f.value ? 'on' : ''}`}
            onClick={() => setFeel(feel === f.value ? null : f.value)}
            aria-pressed={feel === f.value}
            title={f.label}
          >
            {f.emoji}
          </button>
        ))}
      </div>

      <div className="kl-sport-stats">
        <div className="kl-sport-stat">
          <div className="kl-sport-stat-lbl">DURÉE · MIN</div>
          <input
            type="text"
            inputMode="numeric"
            className="kl-sport-stat-inp"
            placeholder="60"
            value={duration}
            onChange={(e) => setDuration(sanitizeInteger(e.target.value))}
          />
        </div>
        <div className="kl-sport-stat">
          <div className="kl-sport-stat-lbl">NOTES</div>
          <input
            type="text"
            className="kl-sport-stat-inp kl-log-notes"
            placeholder="Optionnel"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="kl-log-acts">
        <button type="button" className="btn btn-o" onClick={reset}>
          Annuler
        </button>
        <button
          type="button"
          className="kl-sport-save kl-log-save"
          onClick={handleSave}
        >
          Enregistrer la séance
        </button>
      </div>
    </section>
  );
}
