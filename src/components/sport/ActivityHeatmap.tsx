import { useMemo } from 'react';
import { mondayOfISO, shiftISO, todayISO } from '@/lib/date';
import type { StrengthSession, Workout } from '@/types';

interface Props {
  workouts: Workout[];
  sessions: StrengthSession[];
}

interface DayCell {
  date: string;
  dur: number;
  strength: boolean;
  future: boolean;
  inWindow: boolean;
}

/** Jours réellement comptés dans le bilan (les cellules affichées complètent la grille). */
const WINDOW = 28;
const WEEKDAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function ActivityHeatmap({ workouts, sessions }: Props) {
  const { cells, totalMin, activeDays, strengthDays } = useMemo(() => {
    const today = todayISO();
    const windowStart = shiftISO(today, -(WINDOW - 1));
    const byDate = new Map<string, number>();
    workouts.forEach((w) => {
      byDate.set(w.date, (byDate.get(w.date) ?? 0) + w.dur);
    });
    const strengthDates = new Set(sessions.map((s) => s.date));

    // Grille alignée lundi → dimanche : de la semaine du premier jour de la
    // fenêtre jusqu'à la fin de la semaine en cours.
    const gridStart = mondayOfISO(windowStart);
    const gridEnd = shiftISO(mondayOfISO(today), 6);
    const arr: DayCell[] = [];
    for (let d = gridStart; d <= gridEnd; d = shiftISO(d, 1)) {
      arr.push({
        date: d,
        dur: byDate.get(d) ?? 0,
        strength: strengthDates.has(d),
        future: d > today,
        inWindow: d >= windowStart && d <= today,
      });
    }
    const counted = arr.filter((c) => c.inWindow);
    return {
      cells: arr,
      totalMin: counted.reduce((s, c) => s + c.dur, 0),
      activeDays: counted.filter((c) => c.dur > 0).length,
      strengthDays: counted.filter((c) => c.strength).length,
    };
  }, [workouts, sessions]);

  const max = Math.max(30, ...cells.map((c) => c.dur));

  return (
    <section className="kl-sport-heatmap">
      <div className="kl-sport-section-lbl kl-sport-section-inline">
        <span className="kl-sport-section-bar" aria-hidden />
        ACTIVITÉ · 28J
        <span className="kl-sport-heatmap-meta">
          {activeDays}j · {totalMin}min
        </span>
      </div>
      <div className="kl-heat-weekdays" aria-hidden>
        {WEEKDAY_LETTERS.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <div className="kl-sport-heatmap-grid" aria-hidden>
        {cells.map((c) => {
          const ratio = c.dur > 0 ? Math.min(1, c.dur / max) : 0;
          const tier =
            ratio > 0.7
              ? 'tier-3'
              : ratio > 0.4
                ? 'tier-2'
                : ratio > 0
                  ? 'tier-1'
                  : '';
          const kind = c.dur > 0 ? (c.strength ? 'strength' : 'other') : '';
          return (
            <span
              key={c.date}
              className={`kl-sport-heat-cell ${tier} ${kind} ${
                c.future ? 'future' : ''
              } ${!c.inWindow && !c.future ? 'outside' : ''} ${
                c.date === todayISO() ? 'today' : ''
              }`}
              title={`${c.date} · ${c.dur} min`}
            />
          );
        })}
      </div>
      <div className="kl-heat-legend" aria-hidden>
        <span className="kl-heat-legend-item">
          <span className="kl-heat-swatch strength" /> Musculation ·{' '}
          {strengthDays}j
        </span>
        <span className="kl-heat-legend-item">
          <span className="kl-heat-swatch other" /> Autres sports ·{' '}
          {activeDays - strengthDays}j
        </span>
      </div>
    </section>
  );
}
