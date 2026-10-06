/**
 * Feedback Sync Service — offline-first queue processor.
 *
 * Responsibilities:
 *  1. saveFeedback() — persist locally, then attempt to sync immediately.
 *  2. syncPending()  — drain the queue; called on app foreground / network restore.
 *  3. A mutex (isSyncing flag) prevents concurrent sync runs.
 *
 * Flow:
 *   User submits → insertFeedback() (SQLite) → optimistic UI "received"
 *   → syncPending() → submitFeedbackToGoogleForm() → markSynced()
 *     on failure    → markFailed() (retry up to MAX_SYNC_ATTEMPTS)
 */

import { FeedbackCategory } from '../types';
import { FEEDBACK_CONFIG } from './feedbackConfig';
import {
  insertFeedback,
  getPendingFeedback,
  markSynced,
  markFailed,
  purgeSyncedFeedback,
} from './feedbackRepository';
import { submitFeedbackToGoogleForm, isOnline } from './feedbackApi';

// ─────────────────────────────────────────────────────────────────────────────
// Sync lock — prevents concurrent flush runs
// ─────────────────────────────────────────────────────────────────────────────

let _isSyncing = false;

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save a feedback entry locally and attempt to sync it immediately.
 *
 * The UI should treat this as "success" once it returns — even if the
 * network sync fails, the item is queued and will be retried later.
 */
export async function saveFeedback(
  rating:   number,
  category: FeedbackCategory,
  message:  string,
): Promise<void> {
  // 1. Always persist locally first (zero data loss)
  await insertFeedback(rating, category, message);

  // 2. Best-effort immediate sync (don't await to block UI)
  syncPending().catch(() => {/* swallow — will retry later */});
}

/**
 * Drain the pending feedback queue.
 *
 * Safe to call multiple times concurrently — a mutex ensures only one
 * flush runs at a time. Extra calls return immediately.
 *
 * Suitable call sites:
 *  - AppContext on app foreground (AppState 'active')
 *  - After NetInfo reports the connection is restored
 *  - After saveFeedback()
 */
export async function syncPending(): Promise<void> {
  if (_isSyncing) return;

  const online = await isOnline();
  if (!online) return;

  _isSyncing = true;

  try {
    const items = await getPendingFeedback(FEEDBACK_CONFIG.MAX_SYNC_ATTEMPTS);

    for (const item of items) {
      try {
        await submitFeedbackToGoogleForm(item);
        await markSynced(item.id);
      } catch {
        await markFailed(item.id);
      }
    }

    // Housekeeping: purge rows that have been synced to keep the table small
    await purgeSyncedFeedback();
  } finally {
    _isSyncing = false;
  }
}
