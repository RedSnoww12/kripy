import { useMemo, useState } from 'react';
import {
  MUSCLE_TIERS,
  allMuscleGroups,
  makeMuscleResolver,
  tierMeta,
} from '@/data/exercises';
import {
  buildMuscleVolume,
  type MuscleVolumeRow,
  type VolumeStatus,
} from '@/features/sport/muscleVolume';
import { todayISO } from '@/lib/date';
import { useSportStore } from '@/store/useSportStore';
import type { MuscleTier, TrainingProfile } from '@/types';

interface Props {
  profile: TrainingProfile;
}

const STATUS_COLOR: Record<VolumeStatus, string> = {
  under: 'var(--org)',
  in: 'var(--acc)',
  over: 'var(--yel)',
  none: 'var(--t3)',
};

const STATUS_LABEL: Record<VolumeStatus, string> = {
  under: 'sous la cible',
  in: 'dans la cible',
  over: 'au-dessus',
  none: 'sans objectif',
};

/** Cycle — → maintenance → modéré → prioritaire → — */
function nextTier(current: MuscleTier | null): MuscleTier | null {
  if (current === null) return 'maintenance';
  if (current === 'maintenance') return 'moderate';
  if (current === 'moderate') return 'priority';
  return null;
}

/**
 * Largeur de la barre. L'échelle est bornée au haut de fourchette (ou à
 * 12 séries sans objectif) pour que les groupes restent comparables entre
 * eux, et le dépassement est visible par la couleur plutôt que par une barre
 * qui déborderait.
 */
function fillPct(row: MuscleVolumeRow): number {
  const max = row.range ? row.range[1] : 12;
  if (max <= 0) return 0;
  return Math.min(100, Math.round((row.sets / max) * 100));
}

function targetPct(row: MuscleVolumeRow): number | null {
  if (!row.range) return null;
  const [min, max] = row.range;
  if (max <= 0) return null;
  return Math.min(100, Math.round((min / max) * 100));
}

export default function MuscleVolumeCard({ profile }: Props) {
  const sessions = useSportStore((s) => s.sessions);
  const setProfile = useSportStore((s) => s.setProfile);
  /**
   * Ordre figé à l'entrée en mode objectifs. Hors édition la liste se trie par
   * urgence, mais pendant l'édition ce tri ferait sauter la ligne sous le doigt
   * à chaque changement de niveau : on garde l'ordre du moment où on est entré.
   * null = mode lecture.
   */
  const [order, setOrder] = useState<string[] | null>(null);
  const editing = order !== null;

  const resolveMuscle = useMemo(
    () => makeMuscleResolver(profile.customExercises),
    [profile.customExercises],
  );

  const report = useMemo(
    () => buildMuscleVolume(profile, sessions, resolveMuscle, todayISO()),
    [profile, sessions, resolveMuscle],
  );

  const cycleTier = (muscle: string, current: MuscleTier | null) => {
    const next = nextTier(current);
    const targets = { ...(profile.muscleTargets ?? {}) };
    if (next === null) delete targets[muscle];
    else targets[muscle] = next;
    setProfile({ ...profile, muscleTargets: targets });
  };

  // En mode édition, on montre aussi les groupes jamais entraînés pour
  // pouvoir leur fixer un objectif.
  const toggleEditing = () => {
    if (order !== null) {
      setOrder(null);
      return;
    }
    const known = new Set(report.rows.map((r) => r.muscle));
    setOrder([
      ...report.rows.map((r) => r.muscle),
      ...allMuscleGroups().filter((m) => !known.has(m)),
    ]);
  };

  const rows: MuscleVolumeRow[] = useMemo(() => {
    if (order === null) return report.rows;
    const byMuscle = new Map(report.rows.map((r) => [r.muscle, r]));
    const frozen = order.map(
      (muscle): MuscleVolumeRow =>
        byMuscle.get(muscle) ?? {
          muscle,
          sets: 0,
          sessions: 0,
          tier: null,
          range: null,
          status: 'none',
        },
    );
    const seen = new Set(order);
    return [...frozen, ...report.rows.filter((r) => !seen.has(r.muscle))];
  }, [order, report.rows]);

  return (
    <section className="kl-vol">
      <div className="kl-sport-section-lbl kl-sport-section-inline">
        <span className="kl-sport-section-bar" aria-hidden />
        VOLUME · {report.windowDays} DERNIERS JOURS
        <button
          type="button"
          className="kl-vol-edit"
          onClick={toggleEditing}
          aria-pressed={editing}
        >
          {editing ? 'Terminé' : 'Objectifs'}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="kl-sport-history-empty">
          ▸ Loggue une séance ou fixe des objectifs pour suivre ton volume
          hebdomadaire par muscle
        </div>
      ) : (
        <div className="kl-vol-list">
          {rows.map((row) => {
            const pct = fillPct(row);
            const marker = targetPct(row);
            const color = STATUS_COLOR[row.status];
            return (
              <div key={row.muscle} className="kl-vol-row">
                <div className="kl-vol-head">
                  <span className="kl-vol-name">{row.muscle}</span>
                  <span className="kl-vol-sets mono" style={{ color }}>
                    {row.sets}
                    <span className="kl-vol-sets-unit">
                      {row.range
                        ? ` / ${row.range[0]}-${row.range[1]}`
                        : ' sér.'}
                    </span>
                  </span>
                </div>

                <div className="kl-vol-track">
                  <div
                    className="kl-vol-fill"
                    style={{ width: `${pct}%`, background: color }}
                  />
                  {marker !== null && (
                    <span
                      className="kl-vol-marker"
                      style={{ left: `${marker}%` }}
                      aria-hidden
                    />
                  )}
                </div>

                <div className="kl-vol-foot">
                  {editing ? (
                    <button
                      type="button"
                      className={`kl-vol-tier editable ${row.tier ? 'on' : ''}`}
                      onClick={() => cycleTier(row.muscle, row.tier)}
                      aria-label={`Changer l'objectif de ${row.muscle}`}
                    >
                      {row.tier ? tierMeta(row.tier).short : 'AUCUN'}
                      <span
                        className="material-symbols-outlined kl-vol-tier-ico"
                        aria-hidden
                      >
                        change_circle
                      </span>
                    </button>
                  ) : (
                    <span className={`kl-vol-tier ${row.tier ? 'on' : ''}`}>
                      {row.tier ? tierMeta(row.tier).short : 'AUCUN'}
                    </span>
                  )}
                  <span className="kl-vol-meta mono">
                    {row.sessions > 0
                      ? `${row.sessions}× · ${STATUS_LABEL[row.status]}`
                      : STATUS_LABEL[row.status]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <p className="kl-vol-help">
          Touche le niveau pour le changer :{' '}
          {MUSCLE_TIERS.map(
            (t) => `${t.short} ${t.range[0]}-${t.range[1]}`,
          ).join(' · ')}{' '}
          séries/semaine.
        </p>
      )}

      {report.overCapacity && (
        <p className="kl-vol-warn">
          Tes objectifs demandent au moins {report.targetMinSets} séries par
          semaine, pour {profile.sessionsPerWeek} séance
          {profile.sessionsPerWeek > 1 ? 's' : ''} prévues (~
          {report.capacitySets} séries réalistes). Repasse quelques groupes en
          maintenance : tout prioriser, c'est ne rien prioriser.
        </p>
      )}
    </section>
  );
}
