import { useState } from 'react';
import { SPORT_CATEGORIES } from '@/data/constants';
import { useTrackingStore } from '@/store/useTrackingStore';
import { toast } from '@/components/ui/toastStore';
import { todayISO } from '@/lib/date';
import type { SportCategory, Workout } from '@/types';

interface Props {
  category: Exclude<SportCategory, 'muscu'>;
}

export default function OtherSportForm({ category }: Props) {
  const addWorkout = useTrackingStore((s) => s.addWorkout);

  const [sport, setSport] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  const options = SPORT_CATEGORIES[category];

  const handleSave = () => {
    const dur = parseInt(duration, 10) || 0;
    if (!dur) {
      toast('Durée requise', 'error');
      return;
    }
    const type = sport || 'Sport';
    const cal = parseInt(calories, 10) || 0;

    const workout: Workout = {
      id: Date.now(),
      date: todayISO(),
      type,
      dur,
      cal: cal || undefined,
      notes: notes.trim() || undefined,
    };
    addWorkout(workout);
    toast(`${type} enregistré`, 'success');
    setSport('');
    setDuration('');
    setCalories('');
    setNotes('');
  };

  return (
    <>
      <div className="stitle">Nouvelle séance</div>
      <div className="card">
        <div className="stitle" style={{ marginBottom: 6 }}>
          Choisir un sport
        </div>
        <div className="split-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {options.map((s) => (
            <div
              key={s}
              className={`split-btn${sport === s ? ' sel' : ''}`}
              onClick={() => setSport(sport === s ? '' : s)}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="irow" style={{ marginTop: 8 }}>
          <input
            type="number"
            inputMode="numeric"
            className="inp"
            placeholder="Durée (min)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{ maxWidth: 90 }}
          />
          <input
            type="number"
            inputMode="numeric"
            className="inp"
            placeholder="Calories"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            style={{ maxWidth: 90 }}
          />
        </div>
        <div className="irow">
          <input
            type="text"
            className="inp"
            placeholder="Notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn btn-p"
          onClick={handleSave}
          style={{ width: '100%' }}
        >
          Enregistrer
        </button>
      </div>
    </>
  );
}
