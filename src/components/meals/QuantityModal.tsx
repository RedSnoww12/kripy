import { useEffect, useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import { getUnitPresets, type UnitPreset } from '@/data/unitPresets';
import { sanitizeDecimal } from '@/lib/numericInput';
import type { FoodTuple, MealEntryUnit } from '@/types';

interface Props {
  open: boolean;
  food: string | null;
  tuple: FoodTuple | null;
  initialQty?: number;
  initialUnit?: MealEntryUnit;
  extraUnits?: UnitPreset[];
  onClose: () => void;
  onConfirm: (qty: number, unit?: MealEntryUnit) => void;
}

const GRAM_PRESETS = [50, 100, 150, 200, 250];
const UNIT_COUNTS = [1, 2, 3];

function pluralize(label: string, count: number): string {
  if (count <= 1) return label;
  if (label.endsWith('s') || label.endsWith('x')) return label;
  return `${label}s`;
}

export default function QuantityModal({
  open,
  food,
  tuple,
  initialQty = 100,
  initialUnit,
  extraUnits,
  onClose,
  onConfirm,
}: Props) {
  const [qty, setQty] = useState(String(initialQty));
  const [unit, setUnit] = useState<MealEntryUnit | null>(initialUnit ?? null);

  useEffect(() => {
    if (open) {
      setQty(String(initialQty));
      setUnit(initialUnit ?? null);
    }
  }, [open, initialQty, initialUnit]);

  if (!food || !tuple) return null;

  const presets: UnitPreset[] = [
    ...(extraUnits ?? []),
    ...getUnitPresets(food),
  ];

  const [kcal, p, g, l, f] = tuple;
  const parsed = parseFloat(qty.replace(',', '.'));
  const ratio = Number.isFinite(parsed) && parsed > 0 ? parsed / 100 : 0;
  const ckcal = Math.round(kcal * ratio);
  const cp = Math.round(p * ratio);
  const cg = Math.round(g * ratio);
  const cl = Math.round(l * ratio);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onConfirm(parsed, unit ?? undefined);
  };

  const pickGrams = (v: number) => {
    setQty(String(v));
    setUnit(null);
  };

  const pickUnit = (preset: UnitPreset, count: number) => {
    const grams = +(preset.grams * count).toFixed(1);
    setQty(String(grams));
    setUnit({ label: preset.label, count, grams: preset.grams });
  };

  const gramPreset =
    unit === null && GRAM_PRESETS.includes(parsed) ? parsed : null;

  return (
    <Modal open={open} onClose={onClose}>
      <p className="meal-qm-cap">Ajouter</p>
      <h3 className="meal-qm-t">{food}</h3>
      <p className="meal-qm-sub mono">
        {kcal} kcal · P{p}g · G{g}g · L{l}g · F{f ?? 0}g / 100g
      </p>

      <form onSubmit={handleSubmit}>
        {presets.length > 0 && (
          <>
            <div className="meal-qm-lbl">Unités</div>
            <div className="meal-qm-presets">
              {presets.flatMap((preset) =>
                UNIT_COUNTS.map((count) => {
                  const active =
                    unit?.label === preset.label && unit.count === count;
                  return (
                    <button
                      key={`${preset.label}-${count}`}
                      type="button"
                      className={`meal-qm-preset${active ? ' active' : ''}`}
                      onClick={() => pickUnit(preset, count)}
                    >
                      {count} {pluralize(preset.label, count)}
                    </button>
                  );
                }),
              )}
            </div>
          </>
        )}

        <div className="meal-qm-lbl">Quantité (g)</div>
        <div className="meal-qm-presets">
          {GRAM_PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              className={`meal-qm-preset${gramPreset === v ? ' active' : ''}`}
              onClick={() => pickGrams(v)}
            >
              {v}g
            </button>
          ))}
        </div>

        <input
          type="text"
          inputMode="decimal"
          className="inp meal-qm-inp"
          value={qty}
          onChange={(e) => {
            setQty(sanitizeDecimal(e.target.value));
            setUnit(null);
          }}
          placeholder="Quantité"
        />

        <div className="meal-qm-stats">
          <div className="meal-qm-stat">
            <span className="meal-qm-stat-l">KCAL</span>
            <span
              className="meal-qm-stat-v mono"
              style={{ color: 'var(--org)' }}
            >
              {ckcal}
            </span>
          </div>
          <div className="meal-qm-stat">
            <span className="meal-qm-stat-l">PROT</span>
            <span
              className="meal-qm-stat-v mono"
              style={{ color: 'var(--acc)' }}
            >
              {cp}g
            </span>
          </div>
          <div className="meal-qm-stat">
            <span className="meal-qm-stat-l">GLUC</span>
            <span
              className="meal-qm-stat-v mono"
              style={{ color: 'var(--cyan)' }}
            >
              {cg}g
            </span>
          </div>
          <div className="meal-qm-stat">
            <span className="meal-qm-stat-l">LIP</span>
            <span
              className="meal-qm-stat-v mono"
              style={{ color: 'var(--pnk)' }}
            >
              {cl}g
            </span>
          </div>
        </div>

        <div className="acts">
          <button type="button" className="btn btn-o" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn btn-p">
            Ajouter · {ckcal} kcal
          </button>
        </div>
      </form>
    </Modal>
  );
}
