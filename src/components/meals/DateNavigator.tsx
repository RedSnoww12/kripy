import { addDaysISO, formatShortDate, todayISO } from '@/lib/date';

interface Props {
  date: string;
  onChange: (next: string) => void;
}

function labelFor(date: string): string {
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  if (date === today) return "Aujourd'hui";
  if (date === tomorrow) return 'Demain';

  if (date > today) return `${formatShortDate(date)} (prep)`;

  const diffDays = Math.round(
    (Date.parse(today) - Date.parse(date)) / 86_400_000,
  );
  if (diffDays === 1) return 'Hier';
  if (diffDays <= 3) return `il y a ${diffDays}j`;
  return formatShortDate(date);
}

export default function DateNavigator({ date, onChange }: Props) {
  const today = todayISO();
  const maxDate = addDaysISO(today, 7);

  const handlePrev = () => onChange(addDaysISO(date, -1));
  const handleNext = () => {
    const next = addDaysISO(date, 1);
    if (next > maxDate) return;
    onChange(next);
  };

  const longLabel = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const longFormatted = longLabel.charAt(0).toUpperCase() + longLabel.slice(1);
  const color =
    date > today ? 'var(--org)' : date < today ? 'var(--t3)' : 'var(--t1)';

  return (
    <nav className="meal-dn">
      <button
        type="button"
        className="meal-dn-btn"
        aria-label="Jour précédent"
        onClick={handlePrev}
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
      <div className="meal-dn-c">
        <span className="meal-dn-l">{labelFor(date)}</span>
        <span className="meal-dn-d" style={{ color }}>
          {longFormatted}
        </span>
      </div>
      <button
        type="button"
        className="meal-dn-btn"
        aria-label="Jour suivant"
        onClick={handleNext}
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </nav>
  );
}
