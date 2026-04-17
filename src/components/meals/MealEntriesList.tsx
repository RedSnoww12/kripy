import { MEAL_LABELS } from '@/data/constants';
import type { MealEntry, MealSlot } from '@/types';

interface Props {
  entries: MealEntry[];
  currentSlot: MealSlot;
  onSelectSlot: (slot: MealSlot) => void;
  onEdit: (entry: MealEntry) => void;
  onDelete: (entry: MealEntry) => void;
}

function entryDetails(entry: MealEntry): string {
  const parts: string[] = [];
  if (entry.qty) parts.push(`${entry.qty}g`);
  parts.push(`${Math.round(entry.kcal)} kcal`);
  if (entry.p) parts.push(`${Math.round(entry.p)}g P`);
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
  const currentKcal = currentEntries.reduce((s, e) => s + e.kcal, 0);
  const currentLabel = MEAL_LABELS[currentSlot];

  return (
    <div className="meal-list">
      <div className="meal-section-head">
        <h3 className="meal-section-t">{currentLabel}</h3>
        <span className="meal-section-k">{Math.round(currentKcal)} kcal</span>
      </div>

      {currentEntries.length > 0 ? (
        <div className="meal-entries">
          {currentEntries.map((entry) => (
            <div key={entry.id} className="meal-entry">
              <div
                className="meal-entry-l"
                onClick={() => onEdit(entry)}
                style={{ cursor: 'pointer' }}
              >
                <div className="meal-entry-ico">
                  <span className="material-symbols-outlined">restaurant</span>
                </div>
                <div className="meal-entry-m">
                  <h4 className="meal-entry-n">{entry.food}</h4>
                  <p className="meal-entry-d">{entryDetails(entry)}</p>
                </div>
              </div>
              <button
                type="button"
                className="meal-entry-del"
                aria-label="Supprimer"
                onClick={() => onDelete(entry)}
              >
                <span className="material-symbols-outlined">
                  delete_outline
                </span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="meal-empty">
          <div className="meal-empty-ico">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <p className="meal-empty-t">{currentLabel} vide</p>
          <p className="meal-empty-s">
            Utilise la recherche ou (+) pour ajouter
          </p>
        </div>
      )}

      {renderOtherMealsRecap(entries, currentSlot, onSelectSlot)}
    </div>
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
    <>
      <div className="meal-recap-head">Autres repas du jour</div>
      <div className="meal-recap-list">
        {others.map((item) => (
          <button
            key={item.slot}
            type="button"
            className="meal-recap"
            onClick={() => onSelectSlot(item.slot)}
          >
            <span className="meal-recap-n">{item.name}</span>
            <span className="meal-recap-c">{item.count} items</span>
            <span className="meal-recap-k">{Math.round(item.kcal)} kcal</span>
          </button>
        ))}
      </div>
    </>
  );
}
