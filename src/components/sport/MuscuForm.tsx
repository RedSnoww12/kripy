import { useMemo, useState } from 'react';
import { ALL_MUSCLES, SPLITS, SPLIT_MUSCLES } from '@/data/constants';
import { useTrackingStore } from '@/store/useTrackingStore';
import { toast } from '@/components/ui/toastStore';
import { todayISO } from '@/lib/date';
import type { MuscleVolume, Split, Workout } from '@/types';

export default function MuscuForm() {
  const addWorkout = useTrackingStore((s) => s.addWorkout);

  const [split, setSplit] = useState<Split | ''>('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  const muscles = useMemo(() => {
    if (!split) return ALL_MUSCLES;
    return SPLIT_MUSCLES[split];
  }, [split]);

  const handleSave = () => {
    const type = split || 'Séance';
    const dur = parseInt(duration, 10) || 0;
    const volList: MuscleVolume[] = Object.entries(volumes)
      .filter(([, v]) => v > 0)
      .map(([name, sets]) => ({ name, sets }));

    const workout: Workout = {
      id: Date.now(),
      date: todayISO(),
      type,
      dur,
      muscles: volList,
      notes: notes.trim() || undefined,
    };
    addWorkout(workout);
    toast(`Séance ${type} enregistrée`, 'success');
    setSplit('');
    setDuration('');
    setNotes('');
    setVolumes({});
  };

  return (
    <>
      <div className="stitle">Nouvelle séance muscu</div>
      <div className="card">
        <div className="stitle" style={{ marginBottom: 6 }}>
          Type de split
        </div>
        <div className="split-grid">
          {SPLITS.map((s) => (
            <div
              key={s}
              className={`split-btn${split === s ? ' sel' : ''}`}
              onClick={() => setSplit(split === s ? '' : s)}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="irow">
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
            type="text"
            className="inp"
            placeholder="Notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="stitle">Volume par muscle (séries/sem)</div>
        <div>
          {muscles.map((m) => (
            <div key={m} className="vol-item">
              <span className="vn">{m}</span>
              <input
                type="number"
                inputMode="numeric"
                className="inp"
                value={volumes[m] ?? ''}
                onChange={(e) =>
                  setVolumes((prev) => ({
                    ...prev,
                    [m]: parseInt(e.target.value, 10) || 0,
                  }))
                }
                placeholder="0"
                style={{ width: 50, padding: 5, textAlign: 'center' }}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-p"
          onClick={handleSave}
          style={{ width: '100%', marginTop: 8 }}
        >
          Enregistrer
        </button>
      </div>
    </>
  );
}
