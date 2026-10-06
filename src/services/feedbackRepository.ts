/**
 * Feedback Repository — SQLite CRUD for the feedback_queue table.
 *
 * All interactions with the database are isolated here.
 * The service layer calls these functions; no other module touches
 * the feedback_queue table directly.
 */

import { getDatabase } from '../db/database';
import { generateId } from '../db/uuid';
import { utcTimestamp } from '../db/dateUtils';
import { Feedback, FeedbackCategory, FeedbackSyncStatus } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Internal row shape
// ─────────────────────────────────────────────────────────────────────────────

interface FeedbackRow {
  id:                   string;
  rating:               number;
  category:             string;
  message:              string;
  created_at:           string;
  sync_status:          string;
  sync_attempts:        number;
  last_sync_attempt_at: string | null;
}

function rowToFeedback(row: FeedbackRow): Feedback {
  return {
    id:                 row.id,
    rating:             row.rating,
    category:           row.category as FeedbackCategory,
    message:            row.message,
    createdAt:          row.created_at,
    syncStatus:         row.sync_status as FeedbackSyncStatus,
    syncAttempts:       row.sync_attempts,
    lastSyncAttemptAt:  row.last_sync_attempt_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persist a new feedback entry with status 'pending'.
 * Returns the created Feedback object.
 */
export async function insertFeedback(
  rating:   number,
  category: FeedbackCategory,
  message:  string,
): Promise<Feedback> {
  const db = await getDatabase();
  const id  = generateId();
  const now = utcTimestamp();

  await db.runAsync(
    `INSERT INTO feedback_queue
       (id, rating, category, message, created_at, sync_status, sync_attempts, last_sync_attempt_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, NULL);`,
    [id, rating, category, message, now],
  );

  return {
    id,
    rating,
    category,
    message,
    createdAt:         now,
    syncStatus:        'pending',
    syncAttempts:      0,
    lastSyncAttemptAt: null,
  };
}

/**
 * Return all entries with sync_status = 'pending' or 'failed'
 * (and fewer than MAX_SYNC_ATTEMPTS attempts), ordered oldest-first.
 */
export async function getPendingFeedback(maxAttempts: number): Promise<Feedback[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<FeedbackRow>(
    `SELECT * FROM feedback_queue
     WHERE sync_status IN ('pending','failed')
       AND sync_attempts < ?
     ORDER BY created_at ASC;`,
    [maxAttempts],
  );
  return rows.map(rowToFeedback);
}

/**
 * Mark a feedback entry as successfully synced.
 */
export async function markSynced(id: string): Promise<void> {
  const db  = await getDatabase();
  const now = utcTimestamp();
  await db.runAsync(
    `UPDATE feedback_queue
     SET sync_status = 'synced',
         last_sync_attempt_at = ?
     WHERE id = ?;`,
    [now, id],
  );
}

/**
 * Increment the retry counter and set status to 'failed'.
 * If syncAttempts >= maxAttempts the entry will be excluded from
 * future getPendingFeedback() calls automatically.
 */
export async function markFailed(id: string): Promise<void> {
  const db  = await getDatabase();
  const now = utcTimestamp();
  await db.runAsync(
    `UPDATE feedback_queue
     SET sync_status          = 'failed',
         sync_attempts        = sync_attempts + 1,
         last_sync_attempt_at = ?
     WHERE id = ?;`,
    [now, id],
  );
}

/**
 * Delete all entries that have been synced (optional housekeeping).
 */
export async function purgeSyncedFeedback(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM feedback_queue WHERE sync_status = 'synced';`,
  );
}
