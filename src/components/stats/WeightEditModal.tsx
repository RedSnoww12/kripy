import { useEffect, useState, type FormEvent } from 'react';
import PhaseSelector from './PhaseSelector';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { usePalierStore } from '@/store/usePalierStore';
import { toast } from '@/components/ui/toastStore';
import { formatShortDate } from '@/lib/date';
import type { MealEntry, Phase, WeightEntry } from '@/types';

interface Props {
  open: boolean;
  date: string | null;
  onClose: () => void;
}

const IMPORT_PREFIX = 'Import ';

function isSyntheticImport(entries: MealEntry[] | undefined): boolean {
  return (
    !!entries &&
    entries.length === 1 &&
    entries[0].food.startsWith(IMPORT_PREFIX)
  );
}

export default function WeightEditModal({ open, date, onClose }: Props) {
  const weights = useTrackingStore((s) => s.weights);
  const setWeights = useTrackingStore((s) => s.setWeights);
  const log = useNutritionStore((s) => s.log);
  const setDayLog = useNutritionStore((s) => s.setDayLog);
  const targets = useSettingsStore((s) => s.targets);
  const currentPhase = useSettingsStore((s) => s.phase);
  const extendPalier = usePalierStore((s) => s.extend);
  const recompute = usePalierStore((s) => s.recompute);

  const entry = date ? weights.find((w) => w.date === date) : null;
  const entries = date ? (log[date] ?? []) : [];
  const syntheticImport = isSyntheticImport(entries);
  const kcalLocked = entries.length > 0 && !syntheticImport;
  const existingActual = syntheticImport ? entries[0].kcal : 0;

  const [weightInput, setWeightInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [actualInput, setActualInput] = useState('');
  const [phase, setPhase] = useState<Phase>(currentPhase);

  useEffect(() => {
    if (!open || !entry || !date) return;
    setWeightInput(String(entry.w));
    setTargetInput(String(entry.tgKcal ?? targets.kcal));
    setActualInput(existingActual > 0 ? String(existingActual) : '');
    setPhase(entry.phase ?? currentPhase);
  }, [open, entry, date, targets.kcal, currentPhase, existingActual]);

  if (!open || !date || !entry) return null;

  const hint =
    entries.length === 0
      ? "Aucun repas tracké pour ce jour. Saisir un réel kcal créera une entrée d'import."
      : syntheticImport
        ? "Entrée d'import existante — la valeur sera mise à jour."
        : `${entries.length} repas trackés ce jour — le réel kcal est verrouillé (édite via l'onglet Repas).`;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const w = parseFloat(weightInput.replace(',', '.'));
    if (!Number.isFinite(w) || w < 20 || w > 300) {
      toast('Poids invalide', 'error');
      return;
    }

    const tgParsed = parseInt(targetInput, 10);
    const tgKcal =
      Number.isFinite(tgParsed) && tgParsed > 0
        ? tgParsed
        : (entry.tgKcal ?? targets.kcal);

    const updated: WeightEntry = {
      date: entry.date,
      w: +w.toFixed(1),
      tgKcal,
      phase,
    };

    const next = weights.map((item) => (item.date === date ? updated : item));
    setWeights(next);
    extendPalier(date, tgKcal, phase);
    recompute(targets.kcal, currentPhase, next);

    if (!kcalLocked) {
      const actual = parseInt(actualInput, 10);
      if (Number.isFinite(actual) && actual > 0) {
        if (syntheticImport) {
          const first = entries[0];
          const patched: MealEntry[] = [{ ...first, kcal: actual }];
          setDayLog(date, patched);
        } else if (entries.length === 0) {
          const synthetic: MealEntry = {
            id: Date.now(),
            food: `${IMPORT_PREFIX}${date}`,
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
      } else if (actualInput === '' && syntheticImport) {
        setDayLog(date, []);
      }
    }

    toast('Pesée mise à jour', 'success');
    onClose();
  };

  const handleDelete = () => {
    setWeights(weights.filter((w) => w.date !== date));
    toast('Pesée supprimée', 'info');
    onClose();
  };

  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <h3>Éditer pesée — {formatShortDate(date)}</h3>
        <form onSubmit={handleSubmit}>
          <label className="modal-label">Poids (kg)</label>
          <input
            type="text"
            inputMode="decimal"
            className="inp"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
          />

          <label className="modal-label">Objectif kcal</label>
          <input
            type="number"
            inputMode="numeric"
            className="inp"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
          />

          <label className="modal-label">Réel kcal</label>
          <input
            type="number"
            inputMode="numeric"
            className="inp"
            value={actualInput}
            onChange={(e) => setActualInput(e.target.value)}
            disabled={kcalLocked}
          />
          <div style={{ fontSize: '.65rem', color: 'var(--t3)', marginTop: 4 }}>
            {hint}
          </div>

          <label className="modal-label">Phase</label>
          <PhaseSelector value={phase} onChange={setPhase} />

          <div className="modal-row" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-d" onClick={handleDelete}>
              Supprimer
            </button>
            <button type="submit" className="btn btn-p">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
