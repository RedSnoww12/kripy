import { weekdayIndexISO } from '@/lib/date';

export interface HeaderDay {
  date: string;
  /** Une séance (quel que soit le type) a été loguée ce jour. */
  active: boolean;
  /** Au moins une séance de musculation ce jour. */
  strength: boolean;
}

interface Props {
  weekCount: number;
  target: number;
  /** Semaines calendaires consécutives à l'objectif de séances. */
  weekStreak: number;
  /** Les 7 derniers jours, du plus ancien à aujourd'hui. */
  days: HeaderDay[];
  programLabel: string;
  onEdit: () => void;
}

const WEEKDAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function SportHeader({
  weekCount,
  target,
  weekStreak,
  days,
  programLabel,
  onEdit,
}: Props) {
  const reached = weekCount >= target && target > 0;
  return (
    <section className="kl-sport-head kl-sport-head-row">
      <div className="kl-sport-head-main">
        <div className="kl-sport-head-tag">
          <span className="kl-sport-head-led" aria-hidden />
          {programLabel.toUpperCase()}
        </div>
        <h1 className="kl-sport-head-title">Sport</h1>
        <div className="kl-sport-head-sub">
          <span className={`kl-sport-head-count ${reached ? 'reached' : ''}`}>
            {weekCount}/{target}
          </span>{' '}
          séances · 7j
          {weekStreak > 0 && (
            <span className="kl-sport-head-streak">
              <span className="material-symbols-outlined" aria-hidden>
                local_fire_department
              </span>
              {weekStreak} sem. à l'objectif
            </span>
          )}
        </div>
        <div
          className="kl-week-dots"
          role="img"
          aria-label={`${weekCount} jour${weekCount > 1 ? 's' : ''} d'entraînement sur les 7 derniers`}
        >
          {days.map((d, i) => (
            <span
              key={d.date}
              className={`kl-week-dot ${d.active ? 'on' : ''} ${
                d.strength ? 'strength' : ''
              } ${i === days.length - 1 ? 'today' : ''}`}
            >
              <span className="kl-week-dot-cell" />
              <span className="kl-week-dot-lbl">
                {WEEKDAY_LETTERS[weekdayIndexISO(d.date)]}
              </span>
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="kl-sport-head-edit"
        onClick={onEdit}
        aria-label="Modifier mon programme"
      >
        <span className="material-symbols-outlined">tune</span>
      </button>
    </section>
  );
}
