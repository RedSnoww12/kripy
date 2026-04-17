import { MEAL_LABELS } from '@/data/constants';
import type { MealSlot } from '@/types';

interface Props {
  value: MealSlot;
  onChange: (slot: MealSlot) => void;
}

export default function MealTabs({ value, onChange }: Props) {
  return (
    <div className="mt meal-tabs">
      {MEAL_LABELS.map((label, idx) => {
        const slot = idx as MealSlot;
        const active = slot === value;
        return (
          <button
            key={slot}
            type="button"
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
