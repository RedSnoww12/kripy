import { SPORT_CATEGORY_LABELS } from '@/data/constants';
import type { SportCategory } from '@/types';

interface Props {
  value: SportCategory;
  onChange: (next: SportCategory) => void;
}

const CATEGORIES: SportCategory[] = ['muscu', 'cardio', 'sport', 'combat'];

export default function SportTypeSelector({ value, onChange }: Props) {
  return (
    <>
      <div className="stitle">Type d'activité</div>
      <div className="sport-type-row">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`sport-type-btn${c === value ? ' sel' : ''}`}
            onClick={() => onChange(c)}
          >
            {SPORT_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
    </>
  );
}
