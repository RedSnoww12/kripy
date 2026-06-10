import { create } from 'zustand';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

interface UiPrefs {
  analysisDetails: boolean;
}

interface UiPrefsState extends UiPrefs {
  setAnalysisDetails: (open: boolean) => void;
}

const DEFAULTS: UiPrefs = { analysisDetails: true };

function read(): UiPrefs {
  const data = loadJSON<Partial<UiPrefs>>(STORAGE_KEYS.uiPrefs, DEFAULTS);
  return { ...DEFAULTS, ...data };
}

export const useUiPrefsStore = create<UiPrefsState>((set) => ({
  ...read(),

  setAnalysisDetails: (open) => {
    saveJSON(STORAGE_KEYS.uiPrefs, { ...read(), analysisDetails: open });
    set({ analysisDetails: open });
  },
}));
