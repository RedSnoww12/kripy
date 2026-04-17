import type { Macros, Targets } from '@/types';

interface Props {
  totals: Macros;
  targets: Targets;
}

function fmt(n: number): string {
  return n.toLocaleString('fr-FR').replace(/\u202F/g, ' ');
}

export default function MealDayHero({ totals, targets }: Props) {
  const remaining = Math.max(0, Math.round(targets.kcal - totals.kcal));
  const over = totals.kcal > targets.kcal;
  const overBy = Math.round(totals.kcal - targets.kcal);
  const pct = targets.kcal
    ? Math.min(100, Math.round((totals.kcal / targets.kcal) * 100))
    : 0;

  const heroNumber = over ? `+${fmt(overBy)}` : fmt(remaining);

  return (
    <section className="meal-bento">
      <div className="meal-bento-hero">
        <div className="meal-bento-hero-l">
          <p className="meal-bento-cap">
            {over ? 'Dépassement' : 'Calories restantes'}
          </p>
          <h2 className="meal-bento-v">
            <span>{heroNumber}</span>
            <span className="meal-bento-u">kcal</span>
          </h2>
        </div>
        <div className="meal-bento-hero-r">
          <p className="meal-bento-cap meal-bento-cap-acc">
            Objectif : {fmt(targets.kcal)}
          </p>
          <div className="meal-bento-bar">
            <div className="meal-bento-bar-f" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="meal-bento-m">
        <span className="meal-bento-l">Prot</span>
        <span className="meal-bento-m-v" style={{ color: 'var(--acc)' }}>
          {Math.round(totals.p)}
          <span className="meal-bento-m-u">g</span>
        </span>
      </div>
      <div className="meal-bento-m">
        <span className="meal-bento-l">Gluc</span>
        <span className="meal-bento-m-v" style={{ color: '#4DD0E1' }}>
          {Math.round(totals.g)}
          <span className="meal-bento-m-u">g</span>
        </span>
      </div>
      <div className="meal-bento-m">
        <span className="meal-bento-l">Lip</span>
        <span className="meal-bento-m-v" style={{ color: '#FF6B9D' }}>
          {Math.round(totals.l)}
          <span className="meal-bento-m-u">g</span>
        </span>
      </div>
      <div className="meal-bento-m">
        <span className="meal-bento-l">Fib</span>
        <span className="meal-bento-m-v" style={{ color: '#FFB347' }}>
          {Math.round(totals.f ?? 0)}
          <span className="meal-bento-m-u">g</span>
        </span>
      </div>
    </section>
  );
}
