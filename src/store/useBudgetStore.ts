import { create } from 'zustand';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import { buildAdjustment, pruneAdjustments } from '@/features/nutrition/budget';
import { addDaysISO } from '@/lib/date';
import type { BudgetAdjustment } from '@/types';

interface BudgetData {
  adjustments: BudgetAdjustment[];
  dismissed: string[];
}

interface BudgetState extends BudgetData {
  smooth: (sourceDate: string, amount: number, days: number) => void;
  cancel: (id: number) => void;
  dismissProposal: (sourceDate: string) => void;
  prune: (today: string) => void;
  rehydrate: () => void;
}

const EMPTY: BudgetData = { adjustments: [], dismissed: [] };

function read(): BudgetData {
  const data = loadJSON<Partial<BudgetData>>(STORAGE_KEYS.budget, EMPTY);
  return {
    adjustments: Array.isArray(data.adjustments) ? data.adjustments : [],
    dismissed: Array.isArray(data.dismissed) ? data.dismissed : [],
  };
}

function write(data: BudgetData): void {
  saveJSON(STORAGE_KEYS.budget, data);
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  ...read(),

  smooth: (sourceDate, amount, days) => {
    const adjustment = buildAdjustment(sourceDate, amount, days);
    const adjustments = [
      ...get().adjustments.filter((a) => a.sourceDate !== sourceDate),
      adjustment,
    ];
    const dismissed = get().dismissed.filter((d) => d !== sourceDate);
    write({ adjustments, dismissed });
    set({ adjustments, dismissed });
  },

  cancel: (id) => {
    const adjustments = get().adjustments.filter((a) => a.id !== id);
    write({ adjustments, dismissed: get().dismissed });
    set({ adjustments });
  },

  dismissProposal: (sourceDate) => {
    if (get().dismissed.includes(sourceDate)) return;
    const dismissed = [...get().dismissed, sourceDate];
    write({ adjustments: get().adjustments, dismissed });
    set({ dismissed });
  },

  prune: (today) => {
    const { adjustments, dismissed } = get();
    const nextAdjustments = pruneAdjustments(adjustments, today);
    const horizon = addDaysISO(today, -60);
    const nextDismissed = dismissed.filter((d) => d >= horizon);
    if (
      nextAdjustments.length === adjustments.length &&
      nextDismissed.length === dismissed.length
    ) {
      return;
    }
    write({ adjustments: nextAdjustments, dismissed: nextDismissed });
    set({ adjustments: nextAdjustments, dismissed: nextDismissed });
  },

  rehydrate: () => set(read()),
}));
