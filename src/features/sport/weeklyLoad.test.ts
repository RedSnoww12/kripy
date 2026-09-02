import { describe, expect, it } from 'vitest';
import type { StrengthSession } from '@/types';
import {
  baselineOf,
  buildLoadWindows,
  currentWindow,
  pctDelta,
  previousWindow,
} from './weeklyLoad';

const TODAY = '2026-03-20';

const resolve = (id: string) => {
  if (id === 'pullup') return { name: 'Tractions', bodyweight: true };
  if (id === 'bench') return { name: 'Développé couché', bodyweight: false };
  if (id === 'squat') return { name: 'Squat', bodyweight: false };
  return null;
};

function session(
  id: number,
  date: string,
  exercises: Record<string, { w: number; r: number; rpe?: number }[]>,
  dur = 60,
): StrengthSession {
  return {
    id,
    date,
    label: 'Séance',
    dur,
    exercises: Object.entries(exercises).map(([exerciseId, sets]) => ({
      exerciseId,
      sets,
    })),
  };
}

describe('buildLoadWindows', () => {
  it('découpe en fenêtres glissantes de 7 jours alignées sur aujourd’hui', () => {
    const windows = buildLoadWindows([], resolve, TODAY, 3);
    expect(windows.map((w) => w.index)).toEqual([2, 1, 0]);
    expect(windows[2]).toMatchObject({
      start: '2026-03-14',
      end: '2026-03-20',
    });
    expect(windows[1]).toMatchObject({
      start: '2026-03-07',
      end: '2026-03-13',
    });
    expect(windows[0]).toMatchObject({
      start: '2026-02-28',
      end: '2026-03-06',
    });
  });

  it('agrège séances, séries, reps, tonnage, RPE et durée par fenêtre', () => {
    const sessions = [
      session(
        1,
        '2026-03-16',
        {
          bench: [
            { w: 80, r: 8, rpe: 8 },
            { w: 80, r: 7, rpe: 9 },
          ],
          pullup: [{ w: 0, r: 10, rpe: 7 }],
        },
        50,
      ),
      session(2, '2026-03-19', { squat: [{ w: 100, r: 5, rpe: 8.5 }] }, 40),
      // Hors fenêtre courante (fenêtre précédente).
      session(3, '2026-03-10', { bench: [{ w: 75, r: 8 }] }, 45),
    ];
    const cur = currentWindow(buildLoadWindows(sessions, resolve, TODAY))!;
    expect(cur.sessions).toBe(2);
    expect(cur.sets).toBe(4);
    expect(cur.reps).toBe(8 + 7 + 10 + 5);
    expect(cur.tonnage).toBe(80 * 8 + 80 * 7 + 100 * 5);
    expect(cur.ratedSets).toBe(4);
    expect(cur.hardSets).toBe(3);
    expect(cur.avgRpe).toBe(8.1);
    expect(cur.durationMin).toBe(90);
    expect(cur.exercises).toBe(3);

    const prev = previousWindow(buildLoadWindows(sessions, resolve, TODAY))!;
    expect(prev.sessions).toBe(1);
    expect(prev.sets).toBe(1);
    expect(prev.avgRpe).toBeNull();
  });

  it('compte un record quand le meilleur score de la fenêtre bat l’historique antérieur', () => {
    const sessions = [
      session(1, '2026-03-02', { bench: [{ w: 80, r: 8 }] }),
      session(2, '2026-03-09', { bench: [{ w: 80, r: 8 }] }),
      session(3, '2026-03-17', {
        bench: [{ w: 85, r: 8 }],
        // Premier passage sur le squat : rien à battre, pas un record.
        squat: [{ w: 100, r: 5 }],
      }),
    ];
    const windows = buildLoadWindows(sessions, resolve, TODAY);
    expect(currentWindow(windows)!.prCount).toBe(1);
    expect(previousWindow(windows)!.prCount).toBe(0);
  });

  it('ignore les séances datées après aujourd’hui', () => {
    const sessions = [session(1, '2026-03-25', { bench: [{ w: 80, r: 8 }] })];
    const cur = currentWindow(buildLoadWindows(sessions, resolve, TODAY))!;
    expect(cur.sessions).toBe(0);
  });

  it('ne compte pas de tonnage pour du poids du corps strict', () => {
    const sessions = [
      session(1, '2026-03-18', {
        pullup: [
          { w: 0, r: 12 },
          { w: 0, r: 10 },
        ],
      }),
    ];
    const cur = currentWindow(buildLoadWindows(sessions, resolve, TODAY))!;
    expect(cur.tonnage).toBe(0);
    expect(cur.reps).toBe(22);
  });
});

describe('baselineOf / pctDelta', () => {
  it('moyenne les fenêtres précédentes actives seulement', () => {
    const sessions = [
      session(1, '2026-03-18', { bench: [{ w: 80, r: 8 }] }),
      session(2, '2026-03-11', {
        bench: [
          { w: 80, r: 8 },
          { w: 80, r: 8 },
        ],
      }),
      // Fenêtre index 2 vide (vacances), fenêtre index 3 : 4 séries.
      session(3, '2026-02-26', {
        bench: [
          { w: 80, r: 8 },
          { w: 80, r: 8 },
          { w: 80, r: 8 },
          { w: 80, r: 8 },
        ],
      }),
    ];
    const windows = buildLoadWindows(sessions, resolve, TODAY);
    expect(baselineOf(windows, 'sets')).toBe(3);
  });

  it('renvoie null sans fenêtre précédente active', () => {
    const sessions = [session(1, '2026-03-18', { bench: [{ w: 80, r: 8 }] })];
    expect(
      baselineOf(buildLoadWindows(sessions, resolve, TODAY), 'sets'),
    ).toBeNull();
  });

  it('calcule une variation arrondie, null si la base est nulle', () => {
    expect(pctDelta(13, 10)).toBe(30);
    expect(pctDelta(7, 10)).toBe(-30);
    expect(pctDelta(5, 0)).toBeNull();
  });
});
