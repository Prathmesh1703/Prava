/**
 * Private check-in guard — Phase 3.
 *
 * This guard lives in the SERVICE LAYER, not the UI.
 * workoutService.saveWorkout() calls it before persisting any workout.
 * This ensures the requirement cannot be bypassed by any UI bug or
 * alternate code path.
 *
 * The guard is only active when:
 *   1. privateCheckinsEnabled is true in app_settings, AND
 *   2. The user has not completed a private check-in for the target date.
 *
 * If private check-ins are disabled, the guard always passes.
 */

import { getDatabase } from '../db/database';

export type GuardResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Returns { allowed: true } if the workout can be saved for the given date,
 * or { allowed: false, reason } if the private check-in prerequisite is not met.
 *
 * @param date  Local calendar date in YYYY-MM-DD format.
 */
export async function requirePrivateCheckin(date: string): Promise<GuardResult> {
  const db = await getDatabase();

  // Check if private check-ins feature is enabled
  const settings = await db.getFirstAsync<{ private_checkins_enabled: number }>(
    'SELECT private_checkins_enabled FROM app_settings WHERE id = 1'
  );

  // If the feature is off, always allow
  if (!settings || settings.private_checkins_enabled === 0) {
    return { allowed: true };
  }

  // Check whether the check-in exists for this date
  const checkin = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM private_checkins WHERE date = ?',
    [date]
  );

  if (!checkin) {
    return {
      allowed: false,
      reason: 'Complete your private check-in before logging a workout.',
    };
  }

  return { allowed: true };
}
