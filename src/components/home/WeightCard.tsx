import { useState, type FormEvent } from 'react';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePalierStore } from '@/store/usePalierStore';
import { toast } from '@/components/ui/toastStore';
import { todayISO } from '@/lib/date';
import type { WeightEntry } from '@/types';

export default function WeightCard() {
  const weights = useTrackingStore((s) => s.weights);
  const setWeights = useTrackingStore((s) => s.setWeights);
  const targets = useSettingsStore((s) => s.targets);
  const phase = useSettingsStore((s) => s.phase);
  const extendPalier = usePalierStore((s) => s.extend);
  const recomputePalier = usePalierStore((s) => s.recompute);

  const today = todayISO();
  const todayEntry = weights.find((x) => x.date === today);
  const [value, setValue] = useState<string>(
    todayEntry ? String(todayEntry.w) : '',
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseFloat(value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 400) {
      toast('Poids invalide', 'error');
      return;
    }

    const entry: WeightEntry = {
      date: today,
      w: +parsed.toFixed(1),
      tgKcal: targets.kcal,
      phase,
    };
    const next = [...weights.filter((x) => x.date !== today), entry].sort(
      (a, b) => a.date.localeCompare(b.date),
    );
    setWeights(next);
    extendPalier(today, targets.kcal, phase);
    recomputePalier(targets.kcal, phase, next);
    toast(`Poids ${entry.w} kg enregistré`, 'success');
  };

  return (
    <section className="weight-home">
      <div className="wh-h">
        <div className="wh-hl">
          <span className="material-symbols-outlined wh-ico">
            monitor_weight
          </span>
          <span className="wh-l">Poids actuel</span>
        </div>
        <span className="wh-v">{todayEntry ? `${todayEntry.w} kg` : '--'}</span>
      </div>
      <form className="wh-f" onSubmit={handleSubmit}>
        <input
          type="text"
          inputMode="decimal"
          className="wh-in"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Entrer nouveau poids..."
        />
        <button type="submit" className="wh-btn" aria-label="Valider poids">
          Update
        </button>
      </form>
    </section>
  );
}
