export { useSessionStore } from './useSessionStore';
export { useSettingsStore } from './useSettingsStore';
export { useNutritionStore } from './useNutritionStore';
export { useTrackingStore } from './useTrackingStore';
export { usePalierStore } from './usePalierStore';
export { useBudgetStore } from './useBudgetStore';
export { useSportStore } from './useSportStore';

import { useBudgetStore } from './useBudgetStore';
import { useNutritionStore } from './useNutritionStore';
import { usePalierStore } from './usePalierStore';
import { useSettingsStore } from './useSettingsStore';
import { useSportStore } from './useSportStore';
import { useTrackingStore } from './useTrackingStore';

export function rehydrateAll(): void {
  useSettingsStore.getState().rehydrate();
  useNutritionStore.getState().rehydrate();
  useTrackingStore.getState().rehydrate();
  usePalierStore.getState().rehydrate();
  useBudgetStore.getState().rehydrate();
  useSportStore.getState().rehydrate();
}
