import { useState, type FormEvent } from 'react';
import type { MealSlot } from '@/types';

interface Props {
  open: boolean;
  slot: MealSlot;
  onClose: () => void;
  onConfirm: (entry: {
    name: string;
    kcal: number;
    p: number;
    g: number;
    l: number;
    f: number;
  }) => void;
}

export default function ManualEntryModal({ open, onClose, onConfirm }: Props) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [g, setG] = useState('');
  const [l, setL] = useState('');
  const [f, setF] = useState('');
  const [error, setError] = useState(false);

  if (!open) return null;

  const parseNum = (v: string) => {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const reset = () => {
    setName('');
    setKcal('');
    setP('');
    setG('');
    setL('');
    setF('');
    setError(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = {
      kcal: parseNum(kcal),
      p: parseNum(p),
      g: parseNum(g),
      l: parseNum(l),
      f: parseNum(f),
    };
    if (!parsed.kcal && !parsed.p && !parsed.g && !parsed.l) {
      setError(true);
      setTimeout(() => setError(false), 600);
      return;
    }
    onConfirm({
      name: name.trim() || 'Saisie manuelle',
      ...parsed,
    });
    reset();
  };

  const cancel = () => {
    reset();
    onClose();
  };

  return (
    <div className="modal show" onClick={cancel}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <h3>Saisie manuelle</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="inp"
            placeholder="Nom de l'aliment"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="irow">
            <input
              type="number"
              inputMode="decimal"
              className="inp"
              placeholder="kcal"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              style={{ borderColor: error ? 'var(--red)' : undefined }}
            />
            <input
              type="number"
              inputMode="decimal"
              className="inp"
              placeholder="Prot (g)"
              value={p}
              onChange={(e) => setP(e.target.value)}
            />
          </div>
          <div className="irow">
            <input
              type="number"
              inputMode="decimal"
              className="inp"
              placeholder="Gluc (g)"
              value={g}
              onChange={(e) => setG(e.target.value)}
            />
            <input
              type="number"
              inputMode="decimal"
              className="inp"
              placeholder="Lip (g)"
              value={l}
              onChange={(e) => setL(e.target.value)}
            />
          </div>
          <input
            type="number"
            inputMode="decimal"
            className="inp"
            placeholder="Fibres (g)"
            value={f}
            onChange={(e) => setF(e.target.value)}
          />
          <div className="modal-row">
            <button type="button" className="btn btn-o" onClick={cancel}>
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
