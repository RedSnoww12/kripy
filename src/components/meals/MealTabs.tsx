import { MEAL_LABELS } from '@/data/constants';
import type { MealSlot } from '@/types';

interface Props {
  value: MealSlot;
  onChange: (slot: MealSlot) => void;
}

export default function MealTabs({ value, onChange }: Props) {
  return (
    <div className="meal-tabs" role="tablist">
      {MEAL_LABELS.map((label, idx) => {
        const slot = idx as MealSlot;
        const active = slot === value;
        return (
          <button
            key={slot}
            type="button"
            role="tab"
            aria-selected={active}
            className={`meal-tab${active ? ' active' : ''}`}
            onClick={() => onChange(slot)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
