import { create } from 'zustand';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import { todayISO } from '@/lib/date';
import {
  computePalier,
  extendPalierBackward,
} from '@/features/analysis/palier';
import type { Palier, Phase, WeightEntry } from '@/types';

interface PalierState {
  palier: Palier | null;
  recompute: (
    currentKcal: number,
    currentPhase: Phase,
    weights: WeightEntry[],
  ) => Palier;
  extend: (date: string, tgKcal: number, phase: Phase) => void;
  rehydrate: () => void;
}

function readPalier(): Palier | null {
  return loadJSON<Palier | null>(STORAGE_KEYS.palier, null);
}

export const usePalierStore = create<PalierState>((set, get) => ({
  palier: readPalier(),

  recompute: (currentKcal, currentPhase, weights) => {
    const next = computePalier(
      get().palier,
      currentKcal,
      currentPhase,
      weights,
      todayISO(),
    );
    const prev = get().palier;
    const changed =
      !prev ||
      prev.kcal !== next.kcal ||
      prev.phase !== next.phase ||
      prev.startDate !== next.startDate;
    if (changed) {
      saveJSON(STORAGE_KEYS.palier, next);
      set({ palier: next });
    }
    return next;
  },

  extend: (date, tgKcal, phase) => {
    const current = get().palier;
    if (!current) return;
    const next = extendPalierBackward(current, date, tgKcal, phase);
    if (next.startDate !== current.startDate) {
      saveJSON(STORAGE_KEYS.palier, next);
      set({ palier: next });
    }
  },

  rehydrate: () => set({ palier: readPalier() }),
}));
