import { useEffect, useState, type FormEvent } from 'react';
import PhaseSelector from './PhaseSelector';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { usePalierStore } from '@/store/usePalierStore';
import { toast } from '@/components/ui/toastStore';
import { todayISO } from '@/lib/date';
import type { MealEntry, Phase, WeightEntry } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function WeightAddModal({ open, onClose }: Props) {
  const weights = useTrackingStore((s) => s.weights);
  const setWeights = useTrackingStore((s) => s.setWeights);
  const log = useNutritionStore((s) => s.log);
  const setDayLog = useNutritionStore((s) => s.setDayLog);
  const targets = useSettingsStore((s) => s.targets);
  const currentPhase = useSettingsStore((s) => s.phase);
  const extendPalier = usePalierStore((s) => s.extend);
  const recompute = usePalierStore((s) => s.recompute);

  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [actualInput, setActualInput] = useState('');
  const [phase, setPhase] = useState<Phase>(currentPhase);

  useEffect(() => {
    if (!open) return;
    setDate(todayISO());
    setWeight('');
    setTargetInput('');
    setActualInput('');
    setPhase(currentPhase);
  }, [open, currentPhase]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast('Date invalide', 'error');
      return;
    }
    const w = parseFloat(weight.replace(',', '.'));
    if (!Number.isFinite(w) || w < 20 || w > 300) {
      toast('Poids invalide', 'error');
      return;
    }
    const tgParsed = parseInt(targetInput, 10);
    const tgKcal =
      Number.isFinite(tgParsed) && tgParsed > 0 ? tgParsed : targets.kcal;

    const entry: WeightEntry = {
      date,
      w: +w.toFixed(1),
      tgKcal,
      phase,
    };

    const base = weights.filter((item) => item.date !== date);
    const next = [...base, entry].sort((a, b) => a.date.localeCompare(b.date));
    setWeights(next);
    extendPalier(date, tgKcal, phase);
    recompute(targets.kcal, currentPhase, next);

    const actual = parseInt(actualInput, 10);
    if (Number.isFinite(actual) && actual > 0) {
      const existing = log[date] ?? [];
      if (existing.length === 0) {
        const synthetic: MealEntry = {
          id: Date.now(),
          food: `Import ${date}`,
          meal: 1,
          qty: 0,
          kcal: actual,
          p: 0,
          g: 0,
          l: 0,
          f: 0,
        };
        setDayLog(date, [synthetic]);
      }
    }

    toast(`Pesée ${entry.w} kg ajoutée`, 'success');
    onClose();
  };

  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <h3>Ajouter une pesée</h3>
        <form onSubmit={handleSubmit}>
          <label className="modal-label">Date</label>
          <input
            type="date"
            className="inp"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label className="modal-label">Poids (kg)</label>
          <input
            type="text"
            inputMode="decimal"
            className="inp"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />

          <label className="modal-label">Objectif kcal</label>
          <input
            type="number"
            inputMode="numeric"
            className="inp"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder={`${targets.kcal} (auto)`}
          />

          <label className="modal-label">Réel kcal (optionnel)</label>
          <input
            type="number"
            inputMode="numeric"
            className="inp"
            value={actualInput}
            onChange={(e) => setActualInput(e.target.value)}
          />

          <label className="modal-label">Phase</label>
          <PhaseSelector value={phase} onChange={setPhase} />

          <div className="modal-row" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-o" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-p">
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
