import { useTrackingStore } from '@/store/useTrackingStore';
import { formatShortDate } from '@/lib/date';

const HISTORY_LIMIT = 15;

export default function WorkoutHistory() {
  const workouts = useTrackingStore((s) => s.workouts);
  const removeWorkout = useTrackingStore((s) => s.removeWorkout);

  const recent = [...workouts].reverse().slice(0, HISTORY_LIMIT);

  if (recent.length === 0) {
    return (
      <>
        <div className="stitle" style={{ marginTop: 12 }}>
          Historique
        </div>
        <div className="card">
          <div className="empty" data-ico="🏋️">
            Aucune séance enregistrée
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="stitle" style={{ marginTop: 12 }}>
        Historique
      </div>
      {recent.map((w) => (
        <div key={w.id} className="whi">
          <div className="wt">
            <div>
              <span className="wtp">{w.type}</span>{' '}
              <span className="wdu mono">{w.dur}min</span>
            </div>
            <div>
              <span className="wdd">{formatShortDate(w.date)}</span>{' '}
              <button
                type="button"
                className="wdel"
                onClick={() => removeWorkout(w.id)}
                aria-label="Supprimer"
              >
                🗑
              </button>
            </div>
          </div>
          {w.muscles && w.muscles.length > 0 && (
            <div className="wm">
              {w.muscles.map((m) => (
                <span key={m.name} className="wmc">
                  {m.name} {m.sets}s
                </span>
              ))}
            </div>
          )}
          {w.cal ? (
            <div className="wm">
              <span
                className="wmc"
                style={{ background: 'var(--orgG)', color: 'var(--org)' }}
              >
                {w.cal} kcal
              </span>
            </div>
          ) : null}
          {w.notes && (
            <div
              style={{
                marginTop: 3,
                fontSize: '.62rem',
                color: 'var(--t3)',
                fontStyle: 'italic',
              }}
            >
              {w.notes}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
