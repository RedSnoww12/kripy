import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/toastStore';
import { useTweenInt } from '@/hooks/useTween';
import { todayISO } from '@/lib/date';
import { sanitizeInteger } from '@/lib/numericInput';
import { useTrackingStore } from '@/store/useTrackingStore';

interface Props {
  steps: number;
  goal: number;
}

const formatFr = (n: number) =>
  n.toLocaleString('fr-FR').replace(/\u202F/g, ' ');

function last7Dates(todayIso: string): string[] {
  const arr: string[] = [];
  const today = new Date(todayIso + 'T00:00:00');
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
}

export default function StepsCard({ steps, goal }: Props) {
  const valueRef = useTweenInt<HTMLDivElement>(steps, 450);
  const stepsMap = useTrackingStore((s) => s.steps);
  const setStepsForDate = useTrackingStore((s) => s.setStepsForDate);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const pct = goal ? Math.min(100, Math.round((steps / goal) * 100)) : 0;

  const weekBars = useMemo(() => {
    const today = todayISO();
    const dates = last7Dates(today);
    const values = dates.map((d) => stepsMap[d] ?? 0);
    const max = Math.max(...values, Math.round(goal * 0.4));
    return dates.map((d, i) => ({
      date: d,
      value: values[i],
      ratio: max > 0 ? values[i] / max : 0,
      reached: goal > 0 && values[i] >= goal,
    }));
  }, [stepsMap, goal]);

  useEffect(() => {
    if (open) setValue(steps > 0 ? String(steps) : '');
  }, [open, steps]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed >= 200_000) {
      toast('Nombre de pas invalide', 'error');
      return;
    }
    setStepsForDate(todayISO(), parsed);
    toast(`${formatFr(parsed)} pas enregistrés`, 'success');
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <div
        className="kl-bento kl-bento-steps"
        role="button"
        tabIndex={0}
        aria-label="Modifier les pas du jour"
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      >
        <div className="kl-bento-head">
          <span className="kl-bento-lbl">STEPS</span>
          <span className="kl-bento-pill kl-bento-pill--acc">{pct}%</span>
        </div>
        <div ref={valueRef} className="kl-bento-num">
          {formatFr(steps)}
        </div>
        <div className="kl-bento-sub">/ {formatFr(goal)} goal</div>
        <div className="kl-bento-weekbars" aria-hidden>
          {weekBars.map((b) => (
            <span
              key={b.date}
              className={`kl-bento-weekbar ${b.reached ? 'reached' : ''}`}
              style={{
                height: `${Math.max(4, b.ratio * 100)}%`,
              }}
            />
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h3>Pas aujourd'hui</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            className="inp"
            value={value}
            onChange={(e) => setValue(sanitizeInteger(e.target.value))}
            placeholder="Ex. 8500"
            autoFocus
            style={{ width: '100%' }}
          />
          <div className="acts" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-o"
              onClick={() => setOpen(false)}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-p">
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
