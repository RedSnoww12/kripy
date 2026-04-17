interface RangeOption<T extends number> {
  label: string;
  value: T;
}

interface Props<T extends number> {
  options: readonly RangeOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function RangeSelector<T extends number>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div className="stat-range">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`stat-rng-btn${opt.value === value ? ' sel' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
