import { create } from 'zustand';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import { DEFAULT_PROFILE, DEFAULT_TARGETS } from '@/data/constants';
import type {
  ActivityLevel,
  Phase,
  Targets,
  Theme,
  UserProfile,
} from '@/types';

interface SettingsState {
  height: number;
  startWeight: number;
  phase: Phase;
  stepsGoal: number;
  activity: ActivityLevel;
  theme: Theme;
  targets: Targets;
  setup: boolean;
  tdeeConfirmed: boolean;

  setHeight: (v: number) => void;
  setStartWeight: (v: number) => void;
  setPhase: (p: Phase) => void;
  setStepsGoal: (v: number) => void;
  setActivity: (a: ActivityLevel) => void;
  setTheme: (t: Theme) => void;
  setTargets: (t: Targets) => void;
  confirmTdee: () => void;
  completeOnboarding: (profile: UserProfile, targets: Targets) => void;
  rehydrate: () => void;
}

function readAll() {
  return {
    height: loadJSON(STORAGE_KEYS.height, DEFAULT_PROFILE.height),
    startWeight: loadJSON(
      STORAGE_KEYS.startWeight,
      DEFAULT_PROFILE.startWeight,
    ),
    phase: loadJSON<Phase>(STORAGE_KEYS.phase, DEFAULT_PROFILE.phase),
    stepsGoal: loadJSON(STORAGE_KEYS.stepsGoal, DEFAULT_PROFILE.stepsGoal),
    activity: loadJSON<ActivityLevel>(
      STORAGE_KEYS.activity,
      DEFAULT_PROFILE.activity,
    ),
    theme: loadJSON<Theme>(STORAGE_KEYS.theme, DEFAULT_PROFILE.theme),
    targets: loadJSON<Targets>(STORAGE_KEYS.targets, DEFAULT_TARGETS),
    setup: loadJSON<boolean>(STORAGE_KEYS.setup, false),
    tdeeConfirmed: loadJSON<boolean>(STORAGE_KEYS.tdeeConfirmed, false),
  };
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...readAll(),

  setHeight: (v) => {
    saveJSON(STORAGE_KEYS.height, v);
    set({ height: v });
  },
  setStartWeight: (v) => {
    saveJSON(STORAGE_KEYS.startWeight, v);
    set({ startWeight: v });
  },
  setPhase: (p) => {
    saveJSON(STORAGE_KEYS.phase, p);
    set({ phase: p });
  },
  setStepsGoal: (v) => {
    saveJSON(STORAGE_KEYS.stepsGoal, v);
    set({ stepsGoal: v });
  },
  setActivity: (a) => {
    saveJSON(STORAGE_KEYS.activity, a);
    set({ activity: a });
  },
  setTheme: (t) => {
    saveJSON(STORAGE_KEYS.theme, t);
    set({ theme: t });
  },
  setTargets: (t) => {
    saveJSON(STORAGE_KEYS.targets, t);
    set({ targets: t });
  },
  confirmTdee: () => {
    saveJSON(STORAGE_KEYS.tdeeConfirmed, true);
    set({ tdeeConfirmed: true });
  },
  completeOnboarding: (profile, targets) => {
    saveJSON(STORAGE_KEYS.height, profile.height);
    saveJSON(STORAGE_KEYS.startWeight, profile.startWeight);
    saveJSON(STORAGE_KEYS.phase, profile.phase);
    saveJSON(STORAGE_KEYS.stepsGoal, profile.stepsGoal);
    saveJSON(STORAGE_KEYS.activity, profile.activity);
    saveJSON(STORAGE_KEYS.targets, targets);
    saveJSON(STORAGE_KEYS.setup, true);
    set({ ...profile, targets, setup: true });
  },
  rehydrate: () => set(readAll()),
}));
