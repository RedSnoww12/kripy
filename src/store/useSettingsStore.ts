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

interface OnboardingExtras {
  name?: string;
  age?: number;
  goalWeight?: number;
  sportSessions?: number;
}

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
  name: string;
  age: number;
  goalWeight: number;
  sportSessions: number;

  setHeight: (v: number) => void;
  setStartWeight: (v: number) => void;
  setPhase: (p: Phase) => void;
  setStepsGoal: (v: number) => void;
  setActivity: (a: ActivityLevel) => void;
  setTheme: (t: Theme) => void;
  setTargets: (t: Targets) => void;
  setName: (v: string) => void;
  setAge: (v: number) => void;
  setGoalWeight: (v: number) => void;
  setSportSessions: (v: number) => void;
  confirmTdee: () => void;
  completeOnboarding: (profile: UserProfile, targets: Targets) => void;
  setExtras: (extras: OnboardingExtras) => void;
  rehydrate: () => void;
}

const DEFAULT_NAME = '';
const DEFAULT_AGE = 30;
const DEFAULT_GOAL_WEIGHT = DEFAULT_PROFILE.startWeight;
const DEFAULT_SPORT_SESSIONS = 0;

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
    name: loadJSON<string>(STORAGE_KEYS.name, DEFAULT_NAME),
    age: loadJSON<number>(STORAGE_KEYS.age, DEFAULT_AGE),
    goalWeight: loadJSON<number>(STORAGE_KEYS.goalWeight, DEFAULT_GOAL_WEIGHT),
    sportSessions: loadJSON<number>(
      STORAGE_KEYS.sportSessions,
      DEFAULT_SPORT_SESSIONS,
    ),
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
  setName: (v) => {
    saveJSON(STORAGE_KEYS.name, v);
    set({ name: v });
  },
  setAge: (v) => {
    saveJSON(STORAGE_KEYS.age, v);
    set({ age: v });
  },
  setGoalWeight: (v) => {
    saveJSON(STORAGE_KEYS.goalWeight, v);
    set({ goalWeight: v });
  },
  setSportSessions: (v) => {
    saveJSON(STORAGE_KEYS.sportSessions, v);
    set({ sportSessions: v });
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
    set({
      height: profile.height,
      startWeight: profile.startWeight,
      phase: profile.phase,
      stepsGoal: profile.stepsGoal,
      activity: profile.activity,
      theme: profile.theme,
      targets,
      setup: true,
    });
  },
  setExtras: (extras) => {
    const patch: Partial<SettingsState> = {};
    if (extras.name !== undefined) {
      saveJSON(STORAGE_KEYS.name, extras.name);
      patch.name = extras.name;
    }
    if (extras.age !== undefined) {
      saveJSON(STORAGE_KEYS.age, extras.age);
      patch.age = extras.age;
    }
    if (extras.goalWeight !== undefined) {
      saveJSON(STORAGE_KEYS.goalWeight, extras.goalWeight);
      patch.goalWeight = extras.goalWeight;
    }
    if (extras.sportSessions !== undefined) {
      saveJSON(STORAGE_KEYS.sportSessions, extras.sportSessions);
      patch.sportSessions = extras.sportSessions;
    }
    set(patch as SettingsState);
  },
  rehydrate: () => set(readAll()),
}));
