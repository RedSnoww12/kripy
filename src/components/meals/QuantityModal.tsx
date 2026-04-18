import { useEffect, useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import { sanitizeDecimal } from '@/lib/numericInput';
import type { FoodTuple } from '@/types';

interface Props {
  open: boolean;
  food: string | null;
  tuple: FoodTuple | null;
  initialQty?: number;
  onClose: () => void;
  onConfirm: (qty: number) => void;
}

const PRESETS = [50, 100, 150, 200, 250];

export default function QuantityModal({
  open,
  food,
  tuple,
  initialQty = 100,
  onClose,
  onConfirm,
}: Props) {
  const [qty, setQty] = useState(String(initialQty));

  useEffect(() => {
    if (open) setQty(String(initialQty));
  }, [open, initialQty]);

  if (!food || !tuple) return null;

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
    onConfirm(parsed);
  };

  const preset = PRESETS.includes(parsed) ? parsed : null;

  return (
    <Modal open={open} onClose={onClose}>
      <p className="meal-qm-cap">Ajouter</p>
      <h3 className="meal-qm-t">{food}</h3>
      <p className="meal-qm-sub mono">
        {kcal} kcal · P{p}g · G{g}g · L{l}g · F{f ?? 0}g / 100g
      </p>

      <form onSubmit={handleSubmit}>
        <div className="meal-qm-lbl">Quantité (g)</div>
        <div className="meal-qm-presets">
          {PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              className={`meal-qm-preset${preset === v ? ' active' : ''}`}
              onClick={() => setQty(String(v))}
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
          onChange={(e) => setQty(sanitizeDecimal(e.target.value))}
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
