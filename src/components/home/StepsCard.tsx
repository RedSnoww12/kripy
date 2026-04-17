import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/toastStore';
import { useTweenInt } from '@/hooks/useTween';
import { todayISO } from '@/lib/date';
import { useTrackingStore } from '@/store/useTrackingStore';

interface Props {
  steps: number;
  goal: number;
}

const formatFr = (n: number) =>
  n.toLocaleString('fr-FR').replace(/\u202F/g, ' ');

export default function StepsCard({ steps, goal }: Props) {
  const valueRef = useTweenInt<HTMLDivElement>(steps, 450);
  const setStepsForDate = useTrackingStore((s) => s.setStepsForDate);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const pct = goal ? Math.min(100, Math.round((steps / goal) * 100)) : 0;

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
        className="bento bento-steps"
        role="button"
        tabIndex={0}
        aria-label="Modifier les pas du jour"
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      >
        <div className="bn-h">
          <span className="material-symbols-outlined bn-ico">
            directions_walk
          </span>
          <span className="bn-l">Activité</span>
        </div>
        <div ref={valueRef} className="bn-v">
          {formatFr(steps)}
        </div>
        <div className="bn-sub">
          Objectif : <span>{formatFr(goal)}</span>
        </div>
        <div className="bn-bw">
          <div className="bn-bf" style={{ width: `${pct}%` }} />
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
            onChange={(e) => setValue(e.target.value)}
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
