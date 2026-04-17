import { useEffect, useState, type FormEvent } from 'react';
import type { FoodTuple } from '@/types';

interface Props {
  open: boolean;
  food: string | null;
  tuple: FoodTuple | null;
  initialQty?: number;
  onClose: () => void;
  onConfirm: (qty: number) => void;
}

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

  if (!open || !food || !tuple) return null;

  const [kcal, p, g, l, f] = tuple;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseFloat(qty.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onConfirm(parsed);
  };

  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <h3>{food}</h3>
        <p className="mono" style={{ fontSize: '.75rem', color: 'var(--t3)' }}>
          Pour 100g : {kcal} kcal | P{p} G{g} L{l} Fib{f ?? 0}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="decimal"
            className="inp"
            autoFocus
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Quantité (g)"
          />
          <div className="modal-row">
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
