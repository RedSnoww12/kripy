import { create } from 'zustand';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

export interface AdvisorDismiss {
  palierKey: string;
  untilDay: number;
}

interface AdvisorDismissState {
  dismiss: AdvisorDismiss | null;
  setDismiss: (d: AdvisorDismiss) => void;
  clear: () => void;
  rehydrate: () => void;
}

function read(): AdvisorDismiss | null {
  return loadJSON<AdvisorDismiss | null>(STORAGE_KEYS.advisorDismiss, null);
}

export const useAdvisorDismissStore = create<AdvisorDismissState>((set) => ({
  dismiss: read(),
  setDismiss: (d) => {
    saveJSON(STORAGE_KEYS.advisorDismiss, d);
    set({ dismiss: d });
  },
  clear: () => {
    saveJSON<AdvisorDismiss | null>(STORAGE_KEYS.advisorDismiss, null);
    set({ dismiss: null });
  },
  rehydrate: () => set({ dismiss: read() }),
}));
