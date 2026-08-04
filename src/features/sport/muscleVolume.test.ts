import { describe, expect, it } from 'vitest';
import type { StrengthSession, TrainingProfile } from '@/types';
import { buildMuscleVolume } from './muscleVolume';

const TODAY = '2026-03-20';

const resolveMuscle = (id: string): string | null => {
  const map: Record<string, string> = {
    pullup: 'Dos',
    barbell_row: 'Dos',
    bench: 'Pecs',
    ohp: 'Épaules',
    squat: 'Jambes',
  };
  return map[id] ?? null;
};

function profile(
  muscleTargets?: TrainingProfile['muscleTargets'],
  sessionsPerWeek = 4,
): TrainingProfile {
  return {
    style: 'hypertrophy',
    sessionsPerWeek,
    sessionTemplates: [],
    customExercises: [],
    ...(muscleTargets ? { muscleTargets } : {}),
  };
}

/** Séance avec, par exercice, un nombre de séries. */
function session(
  id: number,
  date: string,
  exercises: Record<string, number>,
): StrengthSession {
  return {
    id,
    date,
    label: 'Séance',
    exercises: Object.entries(exercises).map(([exerciseId, count]) => ({
      exerciseId,
      sets: Array.from({ length: count }, () => ({ w: 60, r: 8 })),
    })),
  };
}

describe('buildMuscleVolume', () => {
  it('additionne les séries par groupe musculaire sur la semaine glissante', () => {
    const sessions = [
      session(1, '2026-03-18', { pullup: 4, barbell_row: 3 }),
      session(2, '2026-03-20', { bench: 4 }),
    ];
    const report = buildMuscleVolume(profile(), sessions, resolveMuscle, TODAY);

    const dos = report.rows.find((r) => r.muscle === 'Dos')!;
    expect(dos.sets).toBe(7);
    expect(dos.sessions).toBe(1);
    expect(report.rows.find((r) => r.muscle === 'Pecs')!.sets).toBe(4);
    expect(report.totalSets).toBe(11);
  });

  it('compte la fréquence en séances distinctes, pas en exercices', () => {
    const sessions = [
      session(1, '2026-03-16', { pullup: 3, barbell_row: 3 }),
      session(2, '2026-03-19', { pullup: 4 }),
    ];
    const report = buildMuscleVolume(profile(), sessions, resolveMuscle, TODAY);
    const dos = report.rows.find((r) => r.muscle === 'Dos')!;
    expect(dos.sets).toBe(10);
    expect(dos.sessions).toBe(2);
  });

  it('exclut les séances hors de la fenêtre de 7 jours', () => {
    const sessions = [
      session(1, '2026-03-10', { pullup: 10 }), // trop ancienne
      session(2, '2026-03-19', { pullup: 3 }),
    ];
    const report = buildMuscleVolume(profile(), sessions, resolveMuscle, TODAY);
    expect(report.rows.find((r) => r.muscle === 'Dos')!.sets).toBe(3);
  });

  it('situe le volume par rapport à la fourchette de l’objectif', () => {
    const sessions = [
      session(1, '2026-03-18', { pullup: 2, bench: 8, squat: 25 }),
    ];
    const report = buildMuscleVolume(
      profile({ Dos: 'priority', Pecs: 'moderate', Jambes: 'maintenance' }),
      sessions,
      resolveMuscle,
      TODAY,
    );

    // Dos : 2 séries pour une cible 12-20 → sous l'objectif
    expect(report.rows.find((r) => r.muscle === 'Dos')).toMatchObject({
      sets: 2,
      range: [12, 20],
      status: 'under',
    });
    // Pecs : 8 séries dans la fourchette 6-12
    expect(report.rows.find((r) => r.muscle === 'Pecs')!.status).toBe('in');
    // Jambes : 25 séries pour une maintenance 3-5 → au-dessus
    expect(report.rows.find((r) => r.muscle === 'Jambes')!.status).toBe('over');
  });

  it('laisse le statut « none » à un groupe sans objectif fixé', () => {
    const report = buildMuscleVolume(
      profile(),
      [session(1, '2026-03-19', { bench: 5 })],
      resolveMuscle,
      TODAY,
    );
    const pecs = report.rows.find((r) => r.muscle === 'Pecs')!;
    expect(pecs.tier).toBeNull();
    expect(pecs.range).toBeNull();
    expect(pecs.status).toBe('none');
  });

  it('affiche un groupe visé même sans aucune série faite', () => {
    const report = buildMuscleVolume(
      profile({ Dos: 'moderate' }),
      [],
      resolveMuscle,
      TODAY,
    );
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]).toMatchObject({
      muscle: 'Dos',
      sets: 0,
      sessions: 0,
      status: 'under',
    });
  });

  it('classe les manques en premier', () => {
    const sessions = [
      session(1, '2026-03-18', { bench: 8, pullup: 1, squat: 4 }),
    ];
    const report = buildMuscleVolume(
      profile({ Pecs: 'moderate', Dos: 'moderate', Jambes: 'maintenance' }),
      sessions,
      resolveMuscle,
      TODAY,
    );
    expect(report.rows[0].muscle).toBe('Dos'); // seul groupe sous l'objectif
  });

  it('ignore un exercice dont le muscle est inconnu', () => {
    const report = buildMuscleVolume(
      profile(),
      [session(1, '2026-03-19', { exo_fantome: 5 })],
      resolveMuscle,
      TODAY,
    );
    expect(report.rows).toEqual([]);
    expect(report.totalSets).toBe(0);
  });

  it('signale un programme dont les objectifs dépassent la capacité des séances', () => {
    // 6 groupes en priorité = 72 séries minimum, pour 2 séances (44 max)
    const targets = {
      Dos: 'priority',
      Pecs: 'priority',
      Jambes: 'priority',
      Épaules: 'priority',
      Bras: 'priority',
      Tronc: 'priority',
    } as const;
    const report = buildMuscleVolume(
      profile({ ...targets }, 2),
      [],
      resolveMuscle,
      TODAY,
    );
    expect(report.targetMinSets).toBe(72);
    expect(report.capacitySets).toBe(44);
    expect(report.overCapacity).toBe(true);
  });

  it('ne signale rien quand le programme tient dans les séances prévues', () => {
    const report = buildMuscleVolume(
      profile({ Dos: 'moderate', Pecs: 'moderate' }, 4),
      [],
      resolveMuscle,
      TODAY,
    );
    expect(report.targetMinSets).toBe(12);
    expect(report.overCapacity).toBe(false);
  });
});
