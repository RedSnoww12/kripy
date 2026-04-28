import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import { MEAL_LABELS } from '@/data/constants';
import { getUnitPresets, type UnitPreset } from '@/data/unitPresets';
import { sanitizeDecimal } from '@/lib/numericInput';
import type { FoodTuple, MealEntryUnit, MealSlot } from '@/types';

interface Props {
  open: boolean;
  food: string | null;
  tuple: FoodTuple | null;
  initialQty?: number;
  initialUnit?: MealEntryUnit;
  initialSlot?: MealSlot;
  extraUnits?: UnitPreset[];
  onClose: () => void;
  onConfirm: (qty: number, unit?: MealEntryUnit, slot?: MealSlot) => void;
}

const GRAM_PRESETS = [50, 100, 150, 200, 250];
const GRAM_UNIT: UnitPreset = { label: 'g', grams: 1 };

function pluralize(label: string, count: number): string {
  if (count <= 1) return label;
  if (label.endsWith('s') || label.endsWith('x')) return label;
  return `${label}s`;
}

function formatCount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default function QuantityModal({
  open,
  food,
  tuple,
  initialQty = 100,
  initialUnit,
  initialSlot,
  extraUnits,
  onClose,
  onConfirm,
}: Props) {
  const presets = useMemo<UnitPreset[]>(() => {
    if (!food) return [GRAM_UNIT];
    const matched = [...(extraUnits ?? []), ...getUnitPresets(food)];
    const seen = new Set<string>();
    const deduped: UnitPreset[] = [];
    for (const p of matched) {
      const k = `${p.label}:${p.grams}`;
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(p);
    }
    return [GRAM_UNIT, ...deduped];
  }, [food, extraUnits]);

  const [unitIdx, setUnitIdx] = useState(0);
  const [input, setInput] = useState(String(initialQty));
  const [slot, setSlot] = useState<MealSlot | null>(initialSlot ?? null);

  useEffect(() => {
    if (!open) return;
    if (initialUnit) {
      const idx = presets.findIndex(
        (p) => p.label === initialUnit.label && p.grams === initialUnit.grams,
      );
      if (idx >= 0) {
        setUnitIdx(idx);
        setInput(formatCount(initialUnit.count));
      } else {
        setUnitIdx(0);
        setInput(String(initialQty));
      }
    } else {
      setUnitIdx(0);
      setInput(String(initialQty));
    }
    setSlot(initialSlot ?? null);
  }, [open, initialQty, initialUnit, initialSlot, presets]);

  if (!food || !tuple) return null;

  const unit = presets[unitIdx] ?? GRAM_UNIT;
  const isGram = unitIdx === 0;
  const parsed = parseFloat(input.replace(',', '.'));
  const validInput = Number.isFinite(parsed) && parsed > 0;
  const totalGrams = validInput ? parsed * unit.grams : 0;

  const [kcal, p, g, l, f] = tuple;
  const ratio = totalGrams / 100;
  const ckcal = Math.round(kcal * ratio);
  const cp = Math.round(p * ratio);
  const cg = Math.round(g * ratio);
  const cl = Math.round(l * ratio);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validInput) return;
    if (isGram) {
      onConfirm(parsed, undefined, slot ?? undefined);
    } else {
      onConfirm(
        +(parsed * unit.grams).toFixed(1),
        { label: unit.label, count: parsed, grams: unit.grams },
        slot ?? undefined,
      );
    }
  };

  const pickUnit = (idx: number) => {
    if (idx === unitIdx) return;
    const next = presets[idx];
    if (!next) return;
    if (idx === 0) {
      const grams = totalGrams > 0 ? Math.round(totalGrams) : 100;
      setInput(String(grams));
    } else {
      const count = totalGrams > 0 ? +(totalGrams / next.grams).toFixed(2) : 1;
      setInput(formatCount(count));
    }
    setUnitIdx(idx);
  };

  const pickPreset = (v: number) => {
    setInput(String(v));
  };

  const adjust = (delta: number) => {
    const base = validInput ? parsed : 0;
    const step = isGram ? (delta < 0 ? -10 : 10) : delta;
    const next = Math.max(0, +(base + step).toFixed(2));
    setInput(formatCount(next));
  };

  const gramPresetActive =
    isGram && validInput && GRAM_PRESETS.includes(parsed) ? parsed : null;

  const inputSuffix = isGram
    ? 'g'
    : pluralize(unit.label, validInput ? parsed : 1);

  const equivalent =
    !isGram && validInput
      ? `≈ ${Math.round(totalGrams)} g`
      : isGram && validInput
        ? `${Math.round(totalGrams)} g`
        : '';

  return (
    <Modal open={open} onClose={onClose}>
      <p className="meal-qm-cap">Ajouter</p>
      <h3 className="meal-qm-t">{food}</h3>
      <p className="meal-qm-sub mono">
        {kcal} kcal · P{p}g · G{g}g · L{l}g · F{f ?? 0}g / 100g
      </p>

      <form onSubmit={handleSubmit}>
        {slot !== null && (
          <>
            <div className="meal-qm-lbl">Repas</div>
            <div className="meal-qm-presets">
              {MEAL_LABELS.map((label, idx) => {
                const value = idx as MealSlot;
                const active = slot === value;
                return (
                  <button
                    key={label}
                    type="button"
                    className={`meal-qm-preset${active ? ' active' : ''}`}
                    onClick={() => setSlot(value)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="meal-qm-lbl">Unité</div>
        <div className="meal-qm-presets">
          {presets.map((preset, idx) => {
            const active = idx === unitIdx;
            const label =
              idx === 0
                ? 'g'
                : `${preset.label} (${Math.round(preset.grams)}g)`;
            return (
              <button
                key={`${preset.label}-${preset.grams}`}
                type="button"
                className={`meal-qm-preset${active ? ' active' : ''}`}
                onClick={() => pickUnit(idx)}
              >
                {label}
              </button>
            );
          })}
        </div>

        {isGram && (
          <div className="meal-qm-presets">
            {GRAM_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                className={`meal-qm-preset${gramPresetActive === v ? ' active' : ''}`}
                onClick={() => pickPreset(v)}
              >
                {v}g
              </button>
            ))}
          </div>
        )}

        <div className="meal-qm-lbl">
          Quantité {equivalent && <span className="mono">· {equivalent}</span>}
        </div>
        <div className="meal-qm-qty-row">
          <button
            type="button"
            className="meal-qm-step"
            aria-label="Diminuer"
            onClick={() => adjust(-1)}
          >
            −
          </button>
          <div className="meal-qm-qty-input">
            <input
              type="text"
              inputMode="decimal"
              className="inp meal-qm-inp"
              value={input}
              onChange={(e) => setInput(sanitizeDecimal(e.target.value))}
              placeholder="Quantité"
            />
            <span className="meal-qm-qty-suffix mono">{inputSuffix}</span>
          </div>
          <button
            type="button"
            className="meal-qm-step"
            aria-label="Augmenter"
            onClick={() => adjust(1)}
          >
            +
          </button>
        </div>

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
          <button type="submit" className="btn btn-p" disabled={!validInput}>
            Ajouter · {ckcal} kcal
          </button>
        </div>
      </form>
    </Modal>
  );
}
