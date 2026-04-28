import { useEffect, useMemo, useRef, useState } from 'react';
import DateNavigator from '@/components/meals/DateNavigator';
import MealDayHero from '@/components/meals/MealDayHero';
import MealTabs from '@/components/meals/MealTabs';
import FoodSearchBar from '@/components/meals/FoodSearchBar';
import QuickPicks from '@/components/meals/QuickPicks';
import QuantityModal from '@/components/meals/QuantityModal';
import ManualEntryModal from '@/components/meals/ManualEntryModal';
import MealEntriesList from '@/components/meals/MealEntriesList';
import ScannerModal from '@/features/scanner/ScannerModal';
import AIAnalysisModal from '@/features/ai/AIAnalysisModal';
import type { AiMealResult } from '@/features/ai/groqClient';
import { dayTotals } from '@/features/nutrition/totals';
import {
  applyQtyChange,
  computeMealEntry,
  getAllFoods,
  type Basis,
} from '@/features/nutrition/foodSearch';
import { toast } from '@/components/ui/toastStore';
import { currentMealSlot, todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { FoodTuple, MealEntry, MealEntryUnit, MealSlot } from '@/types';

type EditingState =
  | { mode: 'create'; food: string; tuple: FoodTuple }
  | { mode: 'update'; entry: MealEntry; tuple: FoodTuple };

export default function MealsPage() {
  const [date, setDate] = useState(todayISO());
  const [slot, setSlot] = useState<MealSlot>(() => currentMealSlot());
  const userPickedSlotRef = useRef(false);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const targets = useSettingsStore((s) => s.targets);
  const log = useNutritionStore((s) => s.log);
  const recipes = useNutritionStore((s) => s.recipes);
  const recipePortions = useNutritionStore((s) => s.recipePortions);
  const recipeUnits = useNutritionStore((s) => s.recipeUnits);
  const barcodes = useNutritionStore((s) => s.barcodes);
  const addMealEntry = useNutritionStore((s) => s.addMealEntry);
  const removeMealEntry = useNutritionStore((s) => s.removeMealEntry);
  const updateMealEntry = useNutritionStore((s) => s.updateMealEntry);
  const pushRecent = useNutritionStore((s) => s.pushRecent);

  const totals = useMemo(() => dayTotals(log, date), [log, date]);
  const entries = log[date] ?? [];

  useEffect(() => {
    if (date === todayISO()) {
      userPickedSlotRef.current = false;
      setSlot(currentMealSlot());
    }
  }, [date]);

  useEffect(() => {
    const sync = () => {
      if (userPickedSlotRef.current) return;
      if (date !== todayISO()) return;
      const auto = currentMealSlot();
      setSlot((prev) => (prev === auto ? prev : auto));
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVis);
    const interval = window.setInterval(sync, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(interval);
    };
  }, [date]);

  const handleSelectSlot = (next: MealSlot) => {
    userPickedSlotRef.current = true;
    setSlot(next);
  };

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

  const handleConfirmQty = (
    qty: number,
    unit?: MealEntryUnit,
    nextSlot?: MealSlot,
  ) => {
    if (!editing) return;
    const foodName =
      editing.mode === 'create' ? editing.food : editing.entry.food;
    const baseUnit = recipeUnits[foodName];
    const basis: Basis = baseUnit
      ? { kind: 'perUnit', label: baseUnit.label }
      : { kind: 'per100g' };
    if (editing.mode === 'create') {
      const entry = computeMealEntry(
        editing.food,
        editing.tuple,
        qty,
        nextSlot ?? slot,
        unit,
        basis,
      );
      addMealEntry(date, entry);
      pushRecent(editing.food);
      toast(`${editing.food} ajouté`, 'success');
    } else {
      const updated = applyQtyChange(
        editing.entry,
        editing.tuple,
        qty,
        unit ?? null,
        basis,
      );
      if (nextSlot !== undefined) updated.meal = nextSlot;
      updateMealEntry(date, editing.entry.id, updated);
      toast(`${editing.entry.food} mis à jour`, 'success');
    }
    setEditing(null);
  };

  const handleDelete = (entry: MealEntry) => {
    removeMealEntry(date, entry.id);
    toast('Aliment retiré', 'info');
  };

  const handleAiConfirm = (result: AiMealResult) => {
    const entry: MealEntry = {
      id: Date.now(),
      food: result.nom || 'Repas IA',
      qty: 0,
      kcal: Math.round(result.kcal),
      p: Math.round(result.prot),
      g: Math.round(result.gluc),
      l: Math.round(result.lip),
      f: Math.round(result.fib),
      meal: slot,
    };
    addMealEntry(date, entry);
    toast(`${entry.food} ajouté`, 'success');
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
    <div className="tp active meal-tp">
      <DateNavigator date={date} onChange={setDate} />
      <MealDayHero totals={totals} targets={targets} />

      <section className="meal-search-row">
        <FoodSearchBar onSelect={handleSelectFood} />
        <button
          type="button"
          className="meal-icon-btn"
          aria-label="Scanner code-barres"
          onClick={() => setScannerOpen(true)}
        >
          <span className="material-symbols-outlined">barcode_scanner</span>
        </button>
      </section>

      <section className="meal-actions">
        <button
          type="button"
          className="meal-action meal-action-ai"
          onClick={() => setAiOpen(true)}
        >
          <span className="material-symbols-outlined">auto_awesome</span>
          Analyse IA
        </button>
        <button
          type="button"
          className="meal-action meal-action-manual"
          onClick={() => setManualOpen(true)}
        >
          <span className="material-symbols-outlined">edit</span>
          Manuel
        </button>
      </section>

      <QuickPicks onSelect={handleSelectFood} />

      <MealTabs value={slot} onChange={handleSelectSlot} />

      <MealEntriesList
        entries={entries}
        currentSlot={slot}
        onSelectSlot={handleSelectSlot}
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
        initialUnit={
          editing?.mode === 'update' ? editing.entry.unit : undefined
        }
        initialSlot={
          editing?.mode === 'update' ? editing.entry.meal : undefined
        }
        extraUnits={(() => {
          const name =
            editing?.mode === 'create'
              ? editing.food
              : editing?.mode === 'update'
                ? editing.entry.food
                : null;
          return name ? recipePortions[name] : undefined;
        })()}
        baseUnit={(() => {
          const name =
            editing?.mode === 'create'
              ? editing.food
              : editing?.mode === 'update'
                ? editing.entry.food
                : null;
          return name ? recipeUnits[name] : undefined;
        })()}
        onClose={() => setEditing(null)}
        onConfirm={handleConfirmQty}
      />

      <ManualEntryModal
        open={manualOpen}
        slot={slot}
        onClose={() => setManualOpen(false)}
        onConfirm={handleManualAdd}
      />

      <ScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProductResolved={(name, tuple) => {
          setEditing({ mode: 'create', food: name, tuple });
        }}
      />

      <AIAnalysisModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onConfirm={handleAiConfirm}
      />
    </div>
  );
}
