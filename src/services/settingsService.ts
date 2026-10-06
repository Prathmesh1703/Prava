/**
 * Settings service — Phase 7.
 *
 * Replaces the in-memory `profileStore` / `settingsStore` with persistent SQLite.
 *
 * Design decisions:
 *  - profile and app_settings are both single-row tables (id always = 1).
 *    Seeded by migration_v1 with INSERT OR IGNORE so the row always exists.
 *  - No `email` or `current_weight_kg` fields — offline app with no accounts,
 *    and current weight is derived from weight_entries.
 *  - Notification settings live in app_settings (added by migration_v3).
 *  - updateProfile() uses a dynamic UPDATE to only touch provided fields.
 *  - The AppSettings.pin field is removed from the type — PIN lives in SecureStore only.
 */

import { UserProfile, AppSettings, ThemePreference, NotificationSettings } from '../types';
import { getDatabase } from '../db/database';

// ─────────────────────────────────────────────────────────────────────────────
// Row mappers
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileRow {
  id:                   number;
  name:                 string | null;
  gym_name:             string | null;
  workout_goal:         string | null;
  target_weight_kg:     number | null;
  height_cm:            number | null;
  photo_frequency_days: number;
  avatar_id:            string | null;
  member_since:         string | null;
  rest_days_per_week?:  number | null;
  rest_days_mode?:      string | null;
  rest_days_value?:     number | null;
}

function rowToProfile(row: ProfileRow): UserProfile {
  const mode = (row.rest_days_mode as 'weekly' | 'monthly') || 'weekly';
  const val = row.rest_days_value ?? (row.rest_days_per_week ?? 1);
  return {
    name:               row.name ?? '',
    email:              '',          // Kept for type compat — always empty (offline app)
    gymName:            row.gym_name ?? '',
    workoutGoal:        row.workout_goal ?? '',
    targetWeightKg:     row.target_weight_kg ?? undefined,
    heightCm:           row.height_cm ?? 0,
    currentWeightKg:    0,           // Derived from weight_entries at context level
    photoFrequencyDays: row.photo_frequency_days,
    restDaysPerWeek:    row.rest_days_per_week ?? 1,
    restDaysMode:       mode,
    restDaysValue:      val,
    avatarId:           row.avatar_id ?? undefined,
    memberSince:        row.member_since ?? undefined,
  };
}

interface SettingsRow {
  id:                       number;
  theme:                    string;
  private_checkins_enabled: number;
  private_photos_enabled:   number;
  has_onboarded:            number;
  workout_reminder_enabled: number;
  workout_reminder_time:    string;
  weight_reminder_enabled:  number;
  weight_reminder_time:     string;
  photo_reminder_enabled:   number;
  photo_reminder_time:      string;
}

function rowToSettings(row: SettingsRow): AppSettings {
  return {
    theme:                  row.theme as ThemePreference,
    privateCheckinsEnabled: row.private_checkins_enabled === 1,
    pin:                    '', // PIN not stored here — kept for type compat only
  };
}

function rowToNotifications(row: SettingsRow): NotificationSettings {
  return {
    workoutReminder:     row.workout_reminder_enabled === 1,
    workoutReminderTime: row.workout_reminder_time,
    weightReminder:      row.weight_reminder_enabled === 1,
    weightReminderTime:  row.weight_reminder_time,
    progressPhotoReminder: row.photo_reminder_enabled === 1,
    progressPhotoTime:   row.photo_reminder_time,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export const settingsService = {

  // ── Profile ────────────────────────────────────────────────────────────────

  async getProfile(): Promise<UserProfile> {
    const db  = await getDatabase();
    const row = await db.getFirstAsync<ProfileRow>(
      'SELECT * FROM profile WHERE id = 1'
    );
    // Row is always seeded by migration_v1 — should never be null
    return row ? rowToProfile(row) : rowToProfile({
      id: 1, name: null, gym_name: null, workout_goal: null,
      target_weight_kg: null, height_cm: null,
      photo_frequency_days: 30, avatar_id: null, member_since: null,
      rest_days_per_week: 1, rest_days_mode: 'weekly', rest_days_value: 1,
    });
  },

  /**
   * Update profile fields. Only provided keys are updated (partial update).
   * `email` and `currentWeightKg` are ignored — they are not stored.
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const db = await getDatabase();

    // Build dynamic SET clause from provided (non-undefined) fields
    const columnMap: Record<string, string> = {
      name:               'name',
      gymName:            'gym_name',
      workoutGoal:        'workout_goal',
      targetWeightKg:     'target_weight_kg',
      heightCm:           'height_cm',
      photoFrequencyDays: 'photo_frequency_days',
      restDaysPerWeek:    'rest_days_per_week',
      restDaysMode:       'rest_days_mode',
      restDaysValue:      'rest_days_value',
      avatarId:           'avatar_id',
      memberSince:        'member_since',
    };

    const setClauses: string[]  = [];
    const values:     unknown[] = [];

    for (const [tsKey, sqlCol] of Object.entries(columnMap)) {
      const val = (updates as Record<string, unknown>)[tsKey];
      if (val !== undefined) {
        setClauses.push(`${sqlCol} = ?`);
        values.push(val ?? null);
      }
    }

    if (setClauses.length > 0) {
      values.push(1); // WHERE id = 1
      await db.runAsync(
        `UPDATE profile SET ${setClauses.join(', ')} WHERE id = ?`,
        values as any[]
      );
    }

    return this.getProfile();
  },

  // ── App settings ───────────────────────────────────────────────────────────

  async getSettings(): Promise<AppSettings> {
    const db  = await getDatabase();
    const row = await db.getFirstAsync<SettingsRow>(
      'SELECT * FROM app_settings WHERE id = 1'
    );
    return row ? rowToSettings(row) : rowToSettings({
      id: 1, theme: 'system', private_checkins_enabled: 0, private_photos_enabled: 0, has_onboarded: 0,
      workout_reminder_enabled: 0, workout_reminder_time: '19:00',
      weight_reminder_enabled: 0,  weight_reminder_time: '21:00',
      photo_reminder_enabled: 0,   photo_reminder_time: '08:00',
    });
  },

  async updateTheme(theme: ThemePreference): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE app_settings SET theme = ? WHERE id = 1',
      [theme]
    );
  },

  async hasOnboarded(): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ has_onboarded: number }>(
      'SELECT has_onboarded FROM app_settings WHERE id = 1'
    );
    return (row?.has_onboarded ?? 0) === 1;
  },

  async setOnboarded(value: boolean = true): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE app_settings SET has_onboarded = ? WHERE id = 1',
      [value ? 1 : 0]
    );
  },

  async isPrivatePhotosEnabled(): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ private_photos_enabled: number }>(
      'SELECT private_photos_enabled FROM app_settings WHERE id = 1'
    );
    return (row?.private_photos_enabled ?? 0) === 1;
  },

  async setPrivatePhotosEnabled(enabled: boolean): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE app_settings SET private_photos_enabled = ? WHERE id = 1',
      [enabled ? 1 : 0]
    );
  },

  // ── Notifications ──────────────────────────────────────────────────────────

  async getNotifications(): Promise<NotificationSettings> {
    const db  = await getDatabase();
    const row = await db.getFirstAsync<SettingsRow>(
      'SELECT * FROM app_settings WHERE id = 1'
    );
    return row ? rowToNotifications(row) : rowToNotifications({
      id: 1, theme: 'system', private_checkins_enabled: 0, private_photos_enabled: 0, has_onboarded: 0,
      workout_reminder_enabled: 0, workout_reminder_time: '19:00',
      weight_reminder_enabled: 0,  weight_reminder_time: '21:00',
      photo_reminder_enabled: 0,   photo_reminder_time: '08:00',
    });
  },

  async updateNotifications(updates: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const db = await getDatabase();

    const columnMap: Record<string, string> = {
      workoutReminder:       'workout_reminder_enabled',
      workoutReminderTime:   'workout_reminder_time',
      weightReminder:        'weight_reminder_enabled',
      weightReminderTime:    'weight_reminder_time',
      progressPhotoReminder: 'photo_reminder_enabled',
      progressPhotoTime:     'photo_reminder_time',
    };

    const setClauses: string[]  = [];
    const values:     unknown[] = [];

    for (const [tsKey, sqlCol] of Object.entries(columnMap)) {
      const val = (updates as Record<string, unknown>)[tsKey];
      if (val !== undefined) {
        // Boolean flags must be stored as 0/1
        const stored = typeof val === 'boolean' ? (val ? 1 : 0) : val;
        setClauses.push(`${sqlCol} = ?`);
        values.push(stored);
      }
    }

    if (setClauses.length > 0) {
      values.push(1);
      await db.runAsync(
        `UPDATE app_settings SET ${setClauses.join(', ')} WHERE id = ?`,
        values as any[]
      );
    }

    return this.getNotifications();
  },
};
