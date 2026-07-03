import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { todayISO } from '@/lib/date';
import { useSportStore } from '@/store/useSportStore';
import { useTrackingStore } from '@/store/useTrackingStore';

function last7Dates(todayIso: string): string[] {
  const arr: string[] = [];
  const today = new Date(todayIso + 'T00:00:00');
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
}

export default function TrainingBento() {
  const navigate = useNavigate();
  const workouts = useTrackingStore((s) => s.workouts);
  const profile = useSportStore((s) => s.profile);

  const target = profile?.sessionsPerWeek ?? 3;

  const { count, bars } = useMemo(() => {
    const today = todayISO();
    const byDate = new Map<string, number>();
    workouts.forEach((w) => {
      byDate.set(w.date, (byDate.get(w.date) ?? 0) + w.dur);
    });
    const dates = last7Dates(today);
    const values = dates.map((d) => byDate.get(d) ?? 0);
    const max = Math.max(...values, 45);
    return {
      count: values.filter((v) => v > 0).length,
      bars: dates.map((d, i) => ({
        date: d,
        ratio: values[i] > 0 ? Math.max(0.2, values[i] / max) : 0,
        active: values[i] > 0,
      })),
    };
  }, [workouts]);

  const pct =
    target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;

  return (
    <div
      className="kl-bento kl-bento-steps"
      role="button"
      tabIndex={0}
      aria-label="Voir la page Sport"
      onClick={() => navigate('/sport')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate('/sport');
        }
      }}
    >
      <div className="kl-bento-head">
        <span className="kl-bento-lbl">SPORT</span>
        <span className="kl-bento-pill kl-bento-pill--acc">{pct}%</span>
      </div>
      <div className="kl-bento-num">{count}</div>
      <div className="kl-bento-sub">/ {target} séances · 7j</div>
      <div className="kl-bento-weekbars" aria-hidden>
        {bars.map((b) => (
          <span
            key={b.date}
            className={`kl-bento-weekbar ${b.active ? 'reached' : ''}`}
            style={{ height: `${Math.max(6, b.ratio * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
