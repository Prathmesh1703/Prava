export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Biceps'
  | 'Triceps'
  | 'Shoulders'
  | 'Legs'
  | 'Forearms'
  | 'Abs';

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Biceps',
  'Triceps',
  'Shoulders',
  'Legs',
  'Forearms',
  'Abs',
];

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  muscleGroups: MuscleGroup[];
  notes?: string;
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  createdAt: string;
}

export interface ProgressPhoto {
  id: string;
  date: string; // YYYY-MM-DD
  uri: string;
  notes?: string;
  createdAt: string;
}

export interface PrivateQuestion {
  id: string;
  text: string;
  enabled: boolean;
  order: number;
  createdAt: string;
}

export interface PrivateCheckinEntry {
  id: string;
  date: string; // YYYY-MM-DD
  answers: Record<string, boolean>; // questionId -> boolean
  completedAt: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export type RestDaysMode = 'weekly' | 'monthly';

export interface UserProfile {
  name: string;
  email: string;
  gymName: string;
  workoutGoal: string;
  targetWeightKg?: number;
  memberSince?: string;
  heightCm: number;
  currentWeightKg: number;
  photoFrequencyDays: number; // Dynamic custom days
  restDaysPerWeek: number; // Configurable weekly rest days (0-6)
  restDaysMode?: RestDaysMode; // 'weekly' (default) | 'monthly'
  restDaysValue?: number; // Configurable rest days amount (e.g. 1/wk or 4/mo)
  avatarId?: string;
}

export interface NotificationSettings {
  workoutReminder: boolean;
  workoutReminderTime: string; // e.g. "07:00 PM"
  weightReminder: boolean;
  weightReminderTime: string; // e.g. "09:00 PM"
  progressPhotoReminder: boolean;
  progressPhotoTime: string; // e.g. "08:00 AM"
}

export interface AppSettings {
  theme: ThemePreference;
  privateCheckinsEnabled: boolean;
  pin: string; // 4-digit PIN for mock auth
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

/** Sync status values stored in feedback_queue */
export type FeedbackSyncStatus = 'pending' | 'synced' | 'failed';

export type FeedbackCategory = 'feature' | 'improvement' | 'bug' | 'general';

/**
 * A feedback entry — created offline, uploaded to Google Form when online.
 * No PII is collected; all fields are anonymous.
 */
export interface Feedback {
  id: string;
  rating: number;           // 1-5
  category: FeedbackCategory;
  message: string;
  createdAt: string;        // ISO-8601 UTC timestamp
  syncStatus: FeedbackSyncStatus;
  syncAttempts: number;
  lastSyncAttemptAt: string | null;
}
