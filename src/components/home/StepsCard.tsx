import { useTweenInt } from '@/hooks/useTween';

interface Props {
  steps: number;
  goal: number;
}

export default function StepsCard({ steps, goal }: Props) {
  const valueRef = useTweenInt<HTMLDivElement>(steps, 450);
  const pct = goal ? Math.min(100, Math.round((steps / goal) * 100)) : 0;
  const goalLabel = goal.toLocaleString('fr-FR').replace(/\u202F/g, ' ');

  return (
    <div className="bento bento-steps">
      <div className="bn-h">
        <span className="material-symbols-outlined bn-ico">
          directions_walk
        </span>
        <span className="bn-l">Activité</span>
      </div>
      <div ref={valueRef} className="bn-v">
        {steps.toLocaleString('fr-FR').replace(/\u202F/g, ' ')}
      </div>
      <div className="bn-sub">
        Objectif : <span>{goalLabel}</span>
      </div>
      <div className="bn-bw">
        <div className="bn-bf" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
