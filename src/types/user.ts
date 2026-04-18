export type Phase = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type Theme = 'dark' | 'light';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export interface UserProfile {
  height: number;
  startWeight: number;
  phase: Phase;
  stepsGoal: number;
  activity: ActivityLevel;
  theme: Theme;
  name?: string;
  age?: number;
  goalWeight?: number;
  sportSessions?: number;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
