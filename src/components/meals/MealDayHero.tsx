import type { Macros, Targets } from '@/types';

interface Props {
  totals: Macros;
  targets: Targets;
  budgetDelta?: number;
}

function fmt(n: number): string {
  return n.toLocaleString('fr-FR').replace(/\u202F/g, ' ');
}

export default function MealDayHero({
  totals,
  targets,
  budgetDelta = 0,
}: Props) {
  const kcal = Math.round(totals.kcal);
  const target = Math.max(0, targets.kcal - budgetDelta);
  const pct = target ? Math.min(999, Math.round((kcal / target) * 100)) : 0;
  const remaining = target - kcal;
  const over = remaining < 0;

  const macroKcal = {
    p: totals.p * 4,
    g: totals.g * 4,
    l: totals.l * 9,
  };
  const macroTotal = Math.max(1, macroKcal.p + macroKcal.g + macroKcal.l) || 1;
  const pctP = (macroKcal.p / macroTotal) * 100;
  const pctG = (macroKcal.g / macroTotal) * 100;
  const pctL = (macroKcal.l / macroTotal) * 100;

  return (
    <section className={`meal-hero${over ? ' over' : ''}`}>
      <div className="meal-hero-head">
        <div className="meal-hero-l">
          <p className="meal-hero-cap">Consommé</p>
          <h2 className="meal-hero-v mono">
            <span>{fmt(kcal)}</span>
            <span className="meal-hero-t">/ {fmt(target)}</span>
          </h2>
        </div>
        <div className="meal-hero-r">
          <span className={`meal-hero-pct${over ? ' over' : ''}`}>{pct}%</span>
          <span className={`meal-hero-rest mono${over ? ' over' : ''}`}>
            {over ? `${fmt(remaining)} kcal` : `reste ${fmt(remaining)}`}
          </span>
        </div>
      </div>

      {budgetDelta > 0 && (
        <p className="meal-hero-adj mono">
          budget lissé · base {fmt(targets.kcal)} − {fmt(budgetDelta)}
        </p>
      )}

      <div className="meal-macro-bar" aria-hidden="true">
        <span className="meal-macro-seg prot" style={{ width: `${pctP}%` }} />
        <span className="meal-macro-seg gluc" style={{ width: `${pctG}%` }} />
        <span className="meal-macro-seg lip" style={{ width: `${pctL}%` }} />
      </div>

      <ul className="meal-macro-legend mono">
        <li>
          <span className="meal-dot prot" />P {Math.round(totals.p)}g
        </li>
        <li>
          <span className="meal-dot gluc" />G {Math.round(totals.g)}g
        </li>
        <li>
          <span className="meal-dot lip" />L {Math.round(totals.l)}g
        </li>
        <li>
          <span className="meal-dot fib" />F {Math.round(totals.f ?? 0)}g
        </li>
      </ul>
    </section>
  );
}
