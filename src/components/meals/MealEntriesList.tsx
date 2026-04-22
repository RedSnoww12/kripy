import { MEAL_LABELS } from '@/data/constants';
import type { MealEntry, MealSlot } from '@/types';

interface Props {
  entries: MealEntry[];
  currentSlot: MealSlot;
  onSelectSlot: (slot: MealSlot) => void;
  onEdit: (entry: MealEntry) => void;
  onDelete: (entry: MealEntry) => void;
}

function pluralize(label: string, count: number): string {
  if (count <= 1) return label;
  if (label.endsWith('s') || label.endsWith('x')) return label;
  return `${label}s`;
}

function entryMeta(entry: MealEntry): string {
  const parts: string[] = [];
  if (entry.unit) {
    parts.push(
      `${entry.unit.count} ${pluralize(entry.unit.label, entry.unit.count)}`,
    );
  } else if (entry.qty) {
    parts.push(`${entry.qty}g`);
  }
  if (entry.p) parts.push(`P${Math.round(entry.p)}`);
  if (entry.g) parts.push(`G${Math.round(entry.g)}`);
  if (entry.l) parts.push(`L${Math.round(entry.l)}`);
  return parts.join(' · ');
}

export default function MealEntriesList({
  entries,
  currentSlot,
  onSelectSlot,
  onEdit,
  onDelete,
}: Props) {
  const currentEntries = entries.filter((e) => e.meal === currentSlot);
  const sum = currentEntries.reduce(
    (a, e) => ({
      kcal: a.kcal + e.kcal,
      p: a.p + (e.p ?? 0),
      g: a.g + (e.g ?? 0),
      l: a.l + (e.l ?? 0),
    }),
    { kcal: 0, p: 0, g: 0, l: 0 },
  );

  return (
    <>
      <header className="meal-sh">
        <span className="meal-sh-l">
          <span className="meal-sh-dash" />
          Repas
        </span>
        <span className="meal-sh-r">{MEAL_LABELS[currentSlot]}</span>
      </header>

      <section className="meal-card">
        <header className="meal-card-head">
          <span className="meal-card-count">
            {currentEntries.length}{' '}
            {currentEntries.length > 1 ? 'items' : 'item'}
          </span>
          <span className="meal-card-sum mono">
            {Math.round(sum.kcal)} kcal · P{Math.round(sum.p)} G
            {Math.round(sum.g)} L{Math.round(sum.l)}
          </span>
        </header>

        {currentEntries.length === 0 ? (
          <p className="meal-card-empty mono">// aucun item sur ce repas</p>
        ) : (
          <ul className="meal-card-list">
            {currentEntries.map((entry) => (
              <li key={entry.id} className="meal-row">
                <button
                  type="button"
                  className="meal-row-main"
                  onClick={() => onEdit(entry)}
                >
                  <span className="meal-row-dot" aria-hidden="true" />
                  <span className="meal-row-body">
                    <span className="meal-row-n">{entry.food}</span>
                    <span className="meal-row-meta mono">
                      {entryMeta(entry) || '—'}
                    </span>
                  </span>
                  <span className="meal-row-k mono">
                    {Math.round(entry.kcal)}
                  </span>
                </button>
                <button
                  type="button"
                  className="meal-row-del"
                  aria-label="Supprimer"
                  onClick={() => onDelete(entry)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {renderOtherMealsRecap(entries, currentSlot, onSelectSlot)}
    </>
  );
}

function renderOtherMealsRecap(
  entries: MealEntry[],
  currentSlot: MealSlot,
  onSelectSlot: (slot: MealSlot) => void,
) {
  const others = MEAL_LABELS.map((name, idx) => {
    if (idx === currentSlot) return null;
    const slot = idx as MealSlot;
    const slice = entries.filter((e) => e.meal === slot);
    return {
      slot,
      name,
      count: slice.length,
      kcal: slice.reduce((s, e) => s + e.kcal, 0),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <section className="meal-other">
      {others.map((item) => (
        <button
          key={item.slot}
          type="button"
          className="meal-other-row"
          onClick={() => onSelectSlot(item.slot)}
        >
          <span className="meal-other-n">{item.name}</span>
          <span className="meal-other-c mono">{item.count} items</span>
          <span className="meal-other-k mono">
            {Math.round(item.kcal)} kcal
          </span>
        </button>
      ))}
    </section>
  );
}
