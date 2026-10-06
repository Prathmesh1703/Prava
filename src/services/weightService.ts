/**
 * Weight service — Phase 4.
 *
 * Replaces the in-memory `weightsStore` with persistent SQLite storage.
 *
 * Key design decisions:
 *  - weight_entries is the SOLE source of truth for current weight.
 *  - getCurrentWeight() derives the latest value by querying the two most
 *    recent entries — the profile table has NO current_weight_kg column.
 *  - Calendar dates use the device's local timezone (not UTC).
 *  - IDs are UUIDs, not timestamp strings.
 *  - One entry per calendar date (UNIQUE constraint on date column).
 *    Saving for an existing date updates the weight_kg value in place.
 */

import { WeightEntry } from '../types';
import { getDatabase } from '../db/database';
import { generateId } from '../db/uuid';
import { localDateString, utcTimestamp } from '../db/dateUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Row mapper
// ─────────────────────────────────────────────────────────────────────────────

interface WeightRow {
  id:         string;
  date:       string;
  weight_kg:  number;
  created_at: string;
}

function rowToEntry(row: WeightRow): WeightEntry {
  return {
    id:        row.id,
    date:      row.date,
    weightKg:  row.weight_kg,
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export const weightService = {

  /**
   * Returns all weight entries sorted oldest-first (for chart rendering).
   */
  async getWeights(): Promise<WeightEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WeightRow>(
      'SELECT * FROM weight_entries ORDER BY date ASC'
    );
    return rows.map(rowToEntry);
  },

  /**
   * Returns the most recent N entries sorted newest-first.
   * Used for chart rendering with a specific time window.
   */
  async getRecentWeights(limit: number = 30): Promise<WeightEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WeightRow>(
      'SELECT * FROM weight_entries ORDER BY date DESC LIMIT ?',
      [limit]
    );
    return rows.map(rowToEntry).reverse(); // reverse to oldest-first for charting
  },

  /**
   * Returns entries within a date range (inclusive), oldest-first.
   */
  async getWeightsInRange(fromDate: string, toDate: string): Promise<WeightEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WeightRow>(
      'SELECT * FROM weight_entries WHERE date >= ? AND date <= ? ORDER BY date ASC',
      [fromDate, toDate]
    );
    return rows.map(rowToEntry);
  },

  /**
   * Derives the current weight directly from weight_entries.
   * This is the ONLY source of truth — no profile.current_weight_kg.
   *
   * Returns null when no entries exist.
   */
  async getCurrentWeight(): Promise<{ current: number; delta: number; previousDate?: string }> {
    const db = await getDatabase();
    // Fetch the two most recent entries to compute delta
    const rows = await db.getAllAsync<WeightRow>(
      'SELECT * FROM weight_entries ORDER BY date DESC LIMIT 2'
    );
    if (rows.length === 0) return { current: 0, delta: 0 };

    const latest = rows[0];
    const prev   = rows[1] ?? null;
    const delta  = prev
      ? parseFloat((latest.weight_kg - prev.weight_kg).toFixed(1))
      : 0;

    return {
      current:      latest.weight_kg,
      delta,
      previousDate: prev?.date,
    };
  },

  /**
   * Add or update a weight entry for the given date.
   * If an entry already exists for that date, updates weight_kg only.
   * Weight is rounded to 1 decimal place.
   */
  async addWeightEntry(weightKg: number, date?: string): Promise<WeightEntry> {
    const db        = await getDatabase();
    const entryDate = date ?? localDateString();
    const rounded   = parseFloat(weightKg.toFixed(1));

    const existing = await db.getFirstAsync<WeightRow>(
      'SELECT * FROM weight_entries WHERE date = ?',
      [entryDate]
    );

    if (existing) {
      await db.runAsync(
        'UPDATE weight_entries SET weight_kg = ? WHERE id = ?',
        [rounded, existing.id]
      );
      return rowToEntry({ ...existing, weight_kg: rounded });
    }

    const id        = generateId();
    const createdAt = utcTimestamp();
    await db.runAsync(
      'INSERT INTO weight_entries (id, date, weight_kg, created_at) VALUES (?, ?, ?, ?)',
      [id, entryDate, rounded, createdAt]
    );
    return { id, date: entryDate, weightKg: rounded, createdAt };
  },

  /**
   * Delete a weight entry by its ID.
   * Returns true if a record was deleted.
   */
  async deleteWeightEntry(id: string): Promise<boolean> {
    const db     = await getDatabase();
    const result = await db.runAsync('DELETE FROM weight_entries WHERE id = ?', [id]);
    return result.changes > 0;
  },

  /**
   * Permanently removes all weight entries.
   * Used by the "delete all data" backup flow.
   */
  async clearAllWeights(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM weight_entries');
  },
};
