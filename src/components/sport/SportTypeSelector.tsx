import type { SportCategory } from '@/types';

type OtherCategory = Exclude<SportCategory, 'muscu'>;

interface Props {
  value: OtherCategory;
  onChange: (next: OtherCategory) => void;
}

interface CategoryMeta {
  key: OtherCategory;
  label: string;
  icon: string;
  color: string;
}

const CATEGORIES: readonly CategoryMeta[] = [
  {
    key: 'cardio',
    label: 'Cardio',
    icon: 'directions_run',
    color: 'var(--cyan)',
  },
  { key: 'sport', label: 'Sport', icon: 'sports_soccer', color: 'var(--org)' },
  { key: 'combat', label: 'Combat', icon: 'sports_mma', color: 'var(--pnk)' },
];

export default function SportTypeSelector({ value, onChange }: Props) {
  return (
    <div className="kl-sport-cats kl-sport-cats-3">
      {CATEGORIES.map((c) => {
        const on = c.key === value;
        return (
          <button
            key={c.key}
            type="button"
            className={`kl-sport-cat ${on ? 'on' : ''}`}
            style={
              {
                '--cat-color': c.color,
              } as React.CSSProperties
            }
            onClick={() => onChange(c.key)}
            aria-pressed={on}
          >
            <span className="material-symbols-outlined kl-sport-cat-ico">
              {c.icon}
            </span>
            <span className="kl-sport-cat-label">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
