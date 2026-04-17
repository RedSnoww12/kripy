import { useState, type FormEvent } from 'react';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePalierStore } from '@/store/usePalierStore';
import { toast } from '@/components/ui/toastStore';
import { todayISO } from '@/lib/date';
import type { WeightEntry } from '@/types';

const MIN_KG = 20;
const MAX_KG = 300;

export default function WeightQuickAdd() {
  const weights = useTrackingStore((s) => s.weights);
  const setWeights = useTrackingStore((s) => s.setWeights);
  const targets = useSettingsStore((s) => s.targets);
  const phase = useSettingsStore((s) => s.phase);
  const extendPalier = usePalierStore((s) => s.extend);
  const recompute = usePalierStore((s) => s.recompute);

  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseFloat(value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < MIN_KG || parsed > MAX_KG) {
      setInvalid(true);
      setTimeout(() => setInvalid(false), 600);
      toast('Poids invalide', 'error');
      return;
    }

    const date = todayISO();
    const entry: WeightEntry = {
      date,
      w: +parsed.toFixed(1),
      tgKcal: targets.kcal,
      phase,
    };
    const next = [...weights.filter((w) => w.date !== date), entry].sort(
      (a, b) => a.date.localeCompare(b.date),
    );
    setWeights(next);
    extendPalier(date, targets.kcal, phase);
    recompute(targets.kcal, phase, next);
    setValue('');
    toast(`Poids ${entry.w} kg enregistré`, 'success');
  };

  return (
    <section className="stat-add">
      <form className="stat-add-wrap" onSubmit={handleSubmit}>
        <span className="material-symbols-outlined stat-add-ico">
          monitor_weight
        </span>
        <input
          type="text"
          inputMode="decimal"
          className="stat-add-in"
          placeholder="Ajouter un poids (kg)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={invalid ? { borderColor: 'var(--red)' } : undefined}
        />
        <button type="submit" className="stat-add-btn" aria-label="Ajouter">
          <span className="material-symbols-outlined">add</span>
        </button>
      </form>
    </section>
  );
}
