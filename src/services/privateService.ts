/**
 * Private service — Phase 6.
 *
 * Replaces in-memory stores with persistent SQLite.
 *
 * Security properties:
 *  - Private check-in answers are ENCRYPTED before any DB write using
 *    AES-256-CBC + HMAC-SHA256 from encryption.ts. They are never stored
 *    as plaintext in the database.
 *  - PIN management is fully delegated to pinStore.ts (SecureStore only).
 *  - verifyPin() / updatePin() are thin wrappers around pinStore for backward
 *    compatibility with AppContext.
 *  - setPrivateEnabled(false) does NOT delete existing private records —
 *    it only updates the app_settings flag. Data is preserved.
 *  - clearAllPrivateData() wipes questions + checkins AND removes the PIN hash
 *    from SecureStore.
 */

import { PrivateQuestion, PrivateCheckinEntry } from '../types';
import { getDatabase } from '../db/database';
import { generateId } from '../db/uuid';
import { localDateString, utcTimestamp } from '../db/dateUtils';
import { encryptJson, decryptJson, EncryptedPayload } from '../crypto/encryption';
import { pinStore } from '../crypto/pinStore';

// ─────────────────────────────────────────────────────────────────────────────
// Row mappers
// ─────────────────────────────────────────────────────────────────────────────

interface QuestionRow {
  id:            string;
  text:          string;
  enabled:       number; // SQLite boolean: 0 | 1
  display_order: number;
  created_at:    string;
}

function rowToQuestion(row: QuestionRow): PrivateQuestion {
  return {
    id:        row.id,
    text:      row.text,
    enabled:   row.enabled === 1,
    order:     row.display_order,
    createdAt: row.created_at,
  };
}

interface CheckinRow {
  id:           string;
  date:         string;
  answers_enc:  string;
  iv:           string;
  auth_tag:     string;
  completed_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export const privateService = {

  // ── Feature flag ───────────────────────────────────────────────────────────

  async isPrivateEnabled(): Promise<boolean> {
    const db  = await getDatabase();
    const row = await db.getFirstAsync<{ private_checkins_enabled: number }>(
      'SELECT private_checkins_enabled FROM app_settings WHERE id = 1'
    );
    return (row?.private_checkins_enabled ?? 0) === 1;
  },

  /**
   * Enable or disable the private section.
   * Disabling does NOT delete existing private records.
   * Enabling requires PIN to have been set up via setupPin() first.
   */
  async setPrivateEnabled(enabled: boolean): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE app_settings SET private_checkins_enabled = ? WHERE id = 1',
      [enabled ? 1 : 0]
    );
  },

  // ── PIN (delegated to pinStore) ────────────────────────────────────────────

  /**
   * Verify a PIN attempt. Returns true/false for backward compatibility.
   * For full result (attempts left, lockout info) use pinStore.verify() directly.
   */
  async verifyPin(pin: string): Promise<boolean> {
    const result = await pinStore.verify(pin);
    return result.success;
  },

  /**
   * Set up or overwrite the PIN hash in SecureStore.
   * Does not require the old PIN — use only during initial setup.
   * For changing PIN (requires old PIN), use pinStore.changePin() directly.
   */
  async updatePin(newPin: string): Promise<boolean> {
    const result = await pinStore.setup(newPin);
    return result.success;
  },

  async isPinSetup(): Promise<boolean> {
    return pinStore.isSetup();
  },

  async changePin(currentPin: string, newPin: string): Promise<{ success: boolean; reason?: string }> {
    return pinStore.changePin(currentPin, newPin);
  },

  // ── Questions ──────────────────────────────────────────────────────────────

  async getQuestions(): Promise<PrivateQuestion[]> {
    const db   = await getDatabase();
    const rows = await db.getAllAsync<QuestionRow>(
      'SELECT * FROM private_questions ORDER BY display_order ASC'
    );
    return rows.map(rowToQuestion);
  },

  async getActiveQuestions(): Promise<PrivateQuestion[]> {
    const db   = await getDatabase();
    const rows = await db.getAllAsync<QuestionRow>(
      'SELECT * FROM private_questions WHERE enabled = 1 ORDER BY display_order ASC'
    );
    return rows.map(rowToQuestion);
  },

  async addQuestion(text: string): Promise<PrivateQuestion> {
    const db = await getDatabase();
    // Place new question at the end of the list
    const countRow = await db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM private_questions'
    );
    const order = (countRow?.cnt ?? 0) + 1;

    const id        = generateId();
    const createdAt = utcTimestamp();

    await db.runAsync(
      'INSERT INTO private_questions (id, text, enabled, display_order, created_at) VALUES (?, ?, 1, ?, ?)',
      [id, text.trim(), order, createdAt]
    );
    return { id, text: text.trim(), enabled: true, order, createdAt };
  },

  async updateQuestion(id: string, text: string): Promise<PrivateQuestion | null> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE private_questions SET text = ? WHERE id = ?',
      [text.trim(), id]
    );
    const row = await db.getFirstAsync<QuestionRow>(
      'SELECT * FROM private_questions WHERE id = ?',
      [id]
    );
    return row ? rowToQuestion(row) : null;
  },

  async toggleQuestion(id: string, enabled: boolean): Promise<boolean> {
    const db     = await getDatabase();
    const result = await db.runAsync(
      'UPDATE private_questions SET enabled = ? WHERE id = ?',
      [enabled ? 1 : 0, id]
    );
    return result.changes > 0;
  },

  async deleteQuestion(id: string): Promise<boolean> {
    const db     = await getDatabase();
    const result = await db.runAsync(
      'DELETE FROM private_questions WHERE id = ?',
      [id]
    );
    return result.changes > 0;
  },

  // ── Check-ins ──────────────────────────────────────────────────────────────

  /**
   * Returns true if a check-in record exists for the given date.
   * Does NOT decrypt — used purely for the guard and UI indicator.
   */
  async isTodayCompleted(date?: string): Promise<boolean> {
    const db         = await getDatabase();
    const targetDate = date ?? localDateString();
    const row        = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM private_checkins WHERE date = ?',
      [targetDate]
    );
    return !!row;
  },

  /**
   * Returns the decrypted check-in for the given date, or null.
   * Decrypts on read — answers are never stored or cached in plaintext.
   */
  async getTodayCheckin(date?: string): Promise<PrivateCheckinEntry | null> {
    const db         = await getDatabase();
    const targetDate = date ?? localDateString();
    const row        = await db.getFirstAsync<CheckinRow>(
      'SELECT * FROM private_checkins WHERE date = ?',
      [targetDate]
    );
    if (!row) return null;

    const payload: EncryptedPayload = {
      ciphertext: row.answers_enc,
      iv:         row.iv,
      mac:        row.auth_tag,
    };

    try {
      const answers = await decryptJson<Record<string, boolean>>(payload);
      return { id: row.id, date: row.date, answers, completedAt: row.completed_at };
    } catch {
      // Decryption failure — return null rather than crashing
      return null;
    }
  },

  /**
   * Save (insert or replace) an encrypted check-in for the given date.
   * Answers are encrypted BEFORE any DB call. The plaintext answers object
   * never touches the database.
   */
  async saveCheckin(
    answers: Record<string, boolean>,
    date?: string
  ): Promise<PrivateCheckinEntry> {
    const db          = await getDatabase();
    const targetDate  = date ?? localDateString();
    const completedAt = utcTimestamp();

    // Encrypt BEFORE touching the database
    const encrypted = await encryptJson(answers);

    await db.withTransactionAsync(async () => {
      // Remove any existing entry for this date (upsert via delete + insert)
      await db.runAsync('DELETE FROM private_checkins WHERE date = ?', [targetDate]);
      await db.runAsync(
        'INSERT INTO private_checkins (id, date, answers_enc, iv, auth_tag, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), targetDate, encrypted.ciphertext, encrypted.iv, encrypted.mac, completedAt]
      );
    });

    // Return the entry with the decrypted answers for immediate UI use
    // (we pass back the original answers — no need to re-decrypt)
    const savedRow = await db.getFirstAsync<CheckinRow>(
      'SELECT * FROM private_checkins WHERE date = ?',
      [targetDate]
    );
    return { id: savedRow!.id, date: targetDate, answers, completedAt };
  },

  /**
   * Returns the count of completed check-ins in a date range.
   * Used for streak calculations. Does NOT decrypt.
   */
  async getCheckinCountInRange(fromDate: string, toDate: string): Promise<number> {
    const db  = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM private_checkins WHERE date >= ? AND date <= ?',
      [fromDate, toDate]
    );
    return row?.count ?? 0;
  },

  /**
   * Returns all check-in history, decrypted.
   * Used for history view and export. Each entry is decrypted individually.
   * Entries that fail decryption are silently skipped.
   */
  async getCheckinHistory(): Promise<PrivateCheckinEntry[]> {
    const db   = await getDatabase();
    const rows = await db.getAllAsync<CheckinRow>(
      'SELECT * FROM private_checkins ORDER BY date DESC'
    );

    const results: PrivateCheckinEntry[] = [];
    for (const row of rows) {
      try {
        const payload: EncryptedPayload = {
          ciphertext: row.answers_enc,
          iv:         row.iv,
          mac:        row.auth_tag,
        };
        const answers = await decryptJson<Record<string, boolean>>(payload);
        results.push({ id: row.id, date: row.date, answers, completedAt: row.completed_at });
      } catch {
        // Skip undecryptable records
      }
    }
    return results;
  },

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Wipes all private questions + check-ins from the DB and clears the PIN
   * from SecureStore. Called when the user explicitly deletes all private data.
   *
   * Does NOT touch app_settings.private_checkins_enabled — the feature flag
   * is managed separately by setPrivateEnabled().
   */
  async clearAllPrivateData(): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM private_checkins');
      await db.runAsync('DELETE FROM private_questions');
    });
    // Clear PIN from SecureStore
    await pinStore.clearPin();
  },
};
