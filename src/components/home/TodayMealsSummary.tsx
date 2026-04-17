import { MEAL_LABELS } from '@/data/constants';
import { groupByMeal } from '@/features/nutrition/totals';
import type { MealEntry } from '@/types';

interface Props {
  entries: MealEntry[];
}

export default function TodayMealsSummary({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <section className="hm-card">
        <div className="hm-head">
          <span className="material-symbols-outlined hm-ico">restaurant</span>
          <h3>Repas du jour</h3>
        </div>
        <div className="empty" data-ico="🍽">
          Aucun repas aujourd'hui
        </div>
      </section>
    );
  }

  const grouped = groupByMeal(entries);
  const total = entries.reduce((s, i) => s + i.kcal, 0);

  return (
    <section className="hm-card">
      <div className="hm-head">
        <span className="material-symbols-outlined hm-ico">restaurant</span>
        <h3>Repas du jour</h3>
        <span className="hm-tot">{Math.round(total)} kcal</span>
      </div>
      {Object.entries(grouped).map(([slot, items]) => {
        const slotIdx = Number(slot);
        const label = MEAL_LABELS[slotIdx] ?? `Repas ${slotIdx}`;
        const mealKcal = items.reduce((s, i) => s + i.kcal, 0);
        return (
          <div key={slot} className="hm-item">
            <span className="hn">
              {label} <span className="hn-c">({items.length})</span>
            </span>
            <span className="hk">{Math.round(mealKcal)}</span>
          </div>
        );
      })}
    </section>
  );
}
