/**
 * Workout service — Phase 3.
 *
 * Replaces the in-memory `workoutsStore` with persistent SQLite storage.
 * All public method signatures are preserved so AppContext and screens
 * require no changes in this phase.
 *
 * Key changes from the mock implementation:
 *  - Data persists across app restarts.
 *  - IDs are UUIDs (expo-crypto.randomUUID) not timestamp strings.
 *  - Calendar dates use the device's local timezone (not UTC).
 *  - saveWorkout() enforces the private check-in prerequisite at the
 *    service layer — cannot be bypassed by the UI.
 *  - saveWorkout() returns a typed Result so the caller knows whether
 *    the save was blocked by the guard.
 */

import { Workout, MuscleGroup } from '../types';
import { getDatabase } from '../db/database';
import { generateId } from '../db/uuid';
import { localDateString, utcTimestamp } from '../db/dateUtils';
import { requirePrivateCheckin } from './checkinGuard';

// ─────────────────────────────────────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────────────────────────────────────

export type SaveWorkoutResult =
  | { success: true;  workout: Workout }
  | { success: false; code: 'CHECKIN_REQUIRED'; reason: string }
  | { success: false; code: 'FUTURE_DATE_NOT_ALLOWED'; reason: string }
  | { success: false; code: 'DB_ERROR';         reason: string };

// ─────────────────────────────────────────────────────────────────────────────
// Row mapper
// ─────────────────────────────────────────────────────────────────────────────

interface WorkoutRow {
  id:            string;
  date:          string;
  muscle_groups: string;
  notes:         string | null;
  created_at:    string;
}

function rowToWorkout(row: WorkoutRow): Workout {
  return {
    id:           row.id,
    date:         row.date,
    muscleGroups: JSON.parse(row.muscle_groups) as MuscleGroup[],
    notes:        row.notes ?? undefined,
    createdAt:    row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export const workoutService = {

  /**
   * Returns all workouts sorted newest-first.
   */
  async getWorkouts(): Promise<Workout[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WorkoutRow>(
      'SELECT * FROM workouts ORDER BY date DESC'
    );
    return rows.map(rowToWorkout);
  },

  /**
   * Returns the workout for a specific local calendar date, or null.
   */
  async getWorkoutByDate(date: string): Promise<Workout | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<WorkoutRow>(
      'SELECT * FROM workouts WHERE date = ?',
      [date]
    );
    return row ? rowToWorkout(row) : null;
  },

  /**
   * Returns today's workout (device local date), or null if none logged.
   */
  async getTodayWorkout(): Promise<Workout | null> {
    return this.getWorkoutByDate(localDateString());
  },

  /**
   * Save (insert or update) a workout for the given date.
   *
   * Before saving, the private check-in guard is evaluated.
   * If the guard blocks the save, { success: false, code: 'CHECKIN_REQUIRED' }
   * is returned — the caller should prompt the user to complete their check-in.
   *
   * On update, only muscle_groups and notes are changed; id and created_at
   * remain from the original record.
   */
  async saveWorkout(data: {
    date: string;
    muscleGroups: MuscleGroup[];
    notes?: string;
  }): Promise<SaveWorkoutResult> {
    // ── Guard: workouts cannot be logged for future dates ────────────────────
    const today = localDateString();
    if (data.date > today) {
      return {
        success: false,
        code: 'FUTURE_DATE_NOT_ALLOWED',
        reason: 'Workouts cannot be logged for future dates.',
      };
    }

    // ── Service-layer guard: cannot be bypassed from any UI code path ────────
    const guard = await requirePrivateCheckin(data.date);
    if (!guard.allowed) {
      return { success: false, code: 'CHECKIN_REQUIRED', reason: guard.reason };
    }

    try {
      const db = await getDatabase();
      const muscleGroupsJson = JSON.stringify(data.muscleGroups);
      const notes = data.notes?.trim() || null;

      // Check for existing record on this date
      const existing = await db.getFirstAsync<WorkoutRow>(
        'SELECT * FROM workouts WHERE date = ?',
        [data.date]
      );

      if (existing) {
        // Update — preserve original id and created_at
        await db.runAsync(
          'UPDATE workouts SET muscle_groups = ?, notes = ? WHERE id = ?',
          [muscleGroupsJson, notes, existing.id]
        );
        return {
          success: true,
          workout: rowToWorkout({ ...existing, muscle_groups: muscleGroupsJson, notes }),
        };
      }

      // Insert new record
      const id        = generateId();
      const createdAt = utcTimestamp();

      await db.runAsync(
        'INSERT INTO workouts (id, date, muscle_groups, notes, created_at) VALUES (?, ?, ?, ?, ?)',
        [id, data.date, muscleGroupsJson, notes, createdAt]
      );

      return {
        success: true,
        workout: {
          id,
          date:         data.date,
          muscleGroups: data.muscleGroups,
          notes:        data.notes?.trim() || undefined,
          createdAt,
        },
      };
    } catch (e: any) {
      return { success: false, code: 'DB_ERROR', reason: 'Failed to save workout.' };
    }
  },

  /**
   * Delete a workout by its ID.
   * Returns true if a record was deleted, false if no matching record found.
   */
  async deleteWorkout(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
    return result.changes > 0;
  },

  /**
   * Delete the workout for a specific date (if one exists).
   */
  async deleteWorkoutByDate(date: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync('DELETE FROM workouts WHERE date = ?', [date]);
    return result.changes > 0;
  },

  /**
   * Returns the count of workout days that fall within a date range.
   * Used by streak calculations.
   *
   * @param fromDate  Start date inclusive (YYYY-MM-DD)
   * @param toDate    End date inclusive (YYYY-MM-DD)
   */
  async getWorkoutCountInRange(fromDate: string, toDate: string): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM workouts WHERE date >= ? AND date <= ?',
      [fromDate, toDate]
    );
    return row?.count ?? 0;
  },

  /**
   * Returns all workout dates as an array of YYYY-MM-DD strings,
   * sorted newest-first. Used for streak and calendar rendering.
   */
  async getWorkoutDates(): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ date: string }>(
      'SELECT date FROM workouts ORDER BY date DESC'
    );
    return rows.map(r => r.date);
  },

  /**
   * Permanently removes all workout records.
   * Used by the "delete all data" flow in backup settings.
   */
  async clearAllWorkouts(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM workouts');
  },
};
