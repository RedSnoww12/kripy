import { addDaysISO, todayISO } from '@/lib/date';

interface Props {
  date: string;
  onChange: (next: string) => void;
}

const WEEKDAY_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const MONTH_SHORT = [
  'JAN',
  'FÉV',
  'MAR',
  'AVR',
  'MAI',
  'JUN',
  'JUI',
  'AOÛ',
  'SEP',
  'OCT',
  'NOV',
  'DÉC',
];

function relativeLabel(date: string): string {
  const today = todayISO();
  if (date === today) return 'AUJOURD’HUI';
  if (date === addDaysISO(today, 1)) return 'DEMAIN';
  if (date === addDaysISO(today, -1)) return 'HIER';
  if (date > today) return 'À VENIR';
  const diff = Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000);
  if (diff <= 6) return `IL Y A ${diff}J`;
  return '';
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DateNavigator({ date, onChange }: Props) {
  const today = todayISO();
  const maxDate = addDaysISO(today, 7);
  const d = new Date(date);
  const weekday = WEEKDAY_SHORT[d.getDay()];
  const rel = relativeLabel(date);
  const hint = rel ? `${rel} · ${weekday}` : weekday;

  const handlePrev = () => onChange(addDaysISO(date, -1));
  const handleNext = () => {
    const next = addDaysISO(date, 1);
    if (next > maxDate) return;
    onChange(next);
  };

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
        <span className="meal-dn-l">{hint}</span>
        <span className="meal-dn-d">{shortDate(date)}</span>
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
