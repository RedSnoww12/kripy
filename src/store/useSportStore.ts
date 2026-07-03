import { create } from 'zustand';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import type { StrengthSession, TrainingProfile } from '@/types';

interface SportState {
  profile: TrainingProfile | null;
  sessions: StrengthSession[];

  setProfile: (profile: TrainingProfile) => void;
  clearProfile: () => void;
  addSession: (session: StrengthSession) => void;
  removeSession: (id: number) => void;
  setSessions: (sessions: StrengthSession[]) => void;
  rehydrate: () => void;
}

function readAll() {
  return {
    profile: loadJSON<TrainingProfile | null>(STORAGE_KEYS.sportProfile, null),
    sessions: loadJSON<StrengthSession[]>(STORAGE_KEYS.strengthLog, []),
  };
}

export const useSportStore = create<SportState>((set, get) => ({
  ...readAll(),

  setProfile: (profile) => {
    saveJSON(STORAGE_KEYS.sportProfile, profile);
    set({ profile });
  },
  clearProfile: () => {
    saveJSON(STORAGE_KEYS.sportProfile, null);
    set({ profile: null });
  },
  addSession: (session) => {
    const sessions = [...get().sessions, session];
    saveJSON(STORAGE_KEYS.strengthLog, sessions);
    set({ sessions });
  },
  removeSession: (id) => {
    const sessions = get().sessions.filter((s) => s.id !== id);
    saveJSON(STORAGE_KEYS.strengthLog, sessions);
    set({ sessions });
  },
  setSessions: (sessions) => {
    saveJSON(STORAGE_KEYS.strengthLog, sessions);
    set({ sessions });
  },
  rehydrate: () => set(readAll()),
}));
