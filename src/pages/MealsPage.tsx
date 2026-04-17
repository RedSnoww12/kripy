import { useMemo, useState } from 'react';
import DateNavigator from '@/components/meals/DateNavigator';
import MealDayHero from '@/components/meals/MealDayHero';
import MealTabs from '@/components/meals/MealTabs';
import FoodSearchBar from '@/components/meals/FoodSearchBar';
import QuickPicks from '@/components/meals/QuickPicks';
import QuantityModal from '@/components/meals/QuantityModal';
import ManualEntryModal from '@/components/meals/ManualEntryModal';
import MealEntriesList from '@/components/meals/MealEntriesList';
import { dayTotals } from '@/features/nutrition/totals';
import {
  applyQtyChange,
  computeMealEntry,
  getAllFoods,
} from '@/features/nutrition/foodSearch';
import { toast } from '@/components/ui/toastStore';
import { todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { FoodTuple, MealEntry, MealSlot } from '@/types';

type EditingState =
  | { mode: 'create'; food: string; tuple: FoodTuple }
  | { mode: 'update'; entry: MealEntry; tuple: FoodTuple };

export default function MealsPage() {
  const [date, setDate] = useState(todayISO());
  const [slot, setSlot] = useState<MealSlot>(0);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const targets = useSettingsStore((s) => s.targets);
  const log = useNutritionStore((s) => s.log);
  const recipes = useNutritionStore((s) => s.recipes);
  const barcodes = useNutritionStore((s) => s.barcodes);
  const addMealEntry = useNutritionStore((s) => s.addMealEntry);
  const removeMealEntry = useNutritionStore((s) => s.removeMealEntry);
  const updateMealEntry = useNutritionStore((s) => s.updateMealEntry);
  const pushRecent = useNutritionStore((s) => s.pushRecent);

  const totals = useMemo(() => dayTotals(log, date), [log, date]);
  const entries = log[date] ?? [];

  const handleSelectFood = (food: string, tuple: FoodTuple) => {
    setEditing({ mode: 'create', food, tuple });
  };

  const handleEditEntry = (entry: MealEntry) => {
    const tuple = getAllFoods(recipes, barcodes)[entry.food];
    if (!tuple) {
      toast(`Aliment ${entry.food} introuvable dans la base`, 'warn');
      return;
    }
    setEditing({ mode: 'update', entry, tuple });
  };

  const handleConfirmQty = (qty: number) => {
    if (!editing) return;
    if (editing.mode === 'create') {
      const entry = computeMealEntry(editing.food, editing.tuple, qty, slot);
      addMealEntry(date, entry);
      pushRecent(editing.food);
      toast(`${editing.food} ajouté`, 'success');
    } else {
      const updated = applyQtyChange(editing.entry, editing.tuple, qty);
      updateMealEntry(date, editing.entry.id, updated);
      toast(`${editing.entry.food} mis à jour`, 'success');
    }
    setEditing(null);
  };

  const handleDelete = (entry: MealEntry) => {
    removeMealEntry(date, entry.id);
    toast('Aliment retiré', 'info');
  };

  const handleManualAdd = (data: {
    name: string;
    kcal: number;
    p: number;
    g: number;
    l: number;
    f: number;
  }) => {
    const entry: MealEntry = {
      id: Date.now(),
      food: data.name,
      qty: 0,
      kcal: data.kcal,
      p: data.p,
      g: data.g,
      l: data.l,
      f: data.f,
      meal: slot,
    };
    addMealEntry(date, entry);
    toast(`${data.name} ajouté`, 'success');
    setManualOpen(false);
  };

  return (
    <div className="tp active">
      <DateNavigator date={date} onChange={setDate} />
      <MealDayHero totals={totals} targets={targets} />

      <section className="meal-search-row">
        <FoodSearchBar onSelect={handleSelectFood} />
      </section>

      <section className="meal-chips">
        <button
          type="button"
          className="meal-chip"
          onClick={() => setManualOpen(true)}
        >
          <span className="material-symbols-outlined meal-chip-ico chip-add">
            add
          </span>
          <span>Manuel</span>
        </button>
      </section>

      <QuickPicks onSelect={handleSelectFood} />

      <MealTabs value={slot} onChange={setSlot} />

      <MealEntriesList
        entries={entries}
        currentSlot={slot}
        onSelectSlot={setSlot}
        onEdit={handleEditEntry}
        onDelete={handleDelete}
      />

      <QuantityModal
        open={editing !== null}
        food={
          editing?.mode === 'create'
            ? editing.food
            : editing?.mode === 'update'
              ? editing.entry.food
              : null
        }
        tuple={editing?.tuple ?? null}
        initialQty={editing?.mode === 'update' ? editing.entry.qty || 100 : 100}
        onClose={() => setEditing(null)}
        onConfirm={handleConfirmQty}
      />

      <ManualEntryModal
        open={manualOpen}
        slot={slot}
        onClose={() => setManualOpen(false)}
        onConfirm={handleManualAdd}
      />
    </div>
  );
}
