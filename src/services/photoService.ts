/**
 * Photo service — Phase 5.
 *
 * Replaces the in-memory `photosStore` with persistent SQLite + FileSystem storage.
 *
 * Architecture:
 *  - Image files live in `documentDirectory/arova_photos/` (persistent across restarts).
 *  - The `progress_photos` table stores only the file path and metadata — never raw URIs
 *    from the image picker (those are temporary and will break after app restart).
 *  - On add: the picker URI is copied into documentDirectory before the DB insert.
 *  - On delete: the physical file is removed after the DB row is deleted.
 *  - cleanupOrphanedFiles() detects and removes files with no corresponding DB record.
 *
 * The `ProgressPhoto.uri` field exposed to the UI is the persistent `file_path`
 * from the DB — always valid after restart.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { ProgressPhoto } from '../types';
import { getDatabase } from '../db/database';
import { generateId } from '../db/uuid';
import { localDateString, utcTimestamp } from '../db/dateUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Photo storage directory
// ─────────────────────────────────────────────────────────────────────────────

const PHOTOS_DIR = `${FileSystem.documentDirectory}arova_photos/`;

async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

/**
 * Copies a temporary picker/camera URI to a permanent app path.
 * Returns the persistent path that should be stored in the DB.
 */
async function copyToStorage(sourceUri: string, id: string): Promise<string> {
  await ensurePhotosDir();
  // Preserve the file extension from the source URI
  const match = sourceUri.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
  const ext   = match?.[1]?.toLowerCase() ?? 'jpg';
  const dest  = `${PHOTOS_DIR}${id}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

// ─────────────────────────────────────────────────────────────────────────────
// Row mapper
// ─────────────────────────────────────────────────────────────────────────────

interface PhotoRow {
  id:         string;
  date:       string;
  file_path:  string;
  notes:      string | null;
  created_at: string;
}

/**
 * Maps a DB row to ProgressPhoto.
 * `uri` is set to `file_path` — the persistent on-device path.
 */
function rowToPhoto(row: PhotoRow): ProgressPhoto {
  return {
    id:        row.id,
    date:      row.date,
    uri:       row.file_path,
    notes:     row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export const photoService = {

  /**
   * Returns all photos sorted newest-first.
   * Missing files are not automatically removed here — use cleanupOrphanedFiles()
   * for periodic cleanup. The `uri` field is a persistent on-device path.
   */
  async getPhotos(): Promise<ProgressPhoto[]> {
    const db   = await getDatabase();
    const rows = await db.getAllAsync<PhotoRow>(
      'SELECT * FROM progress_photos ORDER BY date DESC'
    );
    return rows.map(rowToPhoto);
  },

  /**
   * Returns photo-status for the reminder UI:
   *  - lastPhotoDaysAgo: days since the most recent photo, or null if none.
   *  - nextPhotoDueDays: how many days until the next photo is due (0 = due now).
   *  - lastPhotoDate: date string of the last photo.
   */
  async getPhotoStatus(frequencyDays: number = 30): Promise<{
    lastPhotoDaysAgo: number | null;
    nextPhotoDueDays: number;
    lastPhotoDate?:   string;
  }> {
    const db  = await getDatabase();
    const row = await db.getFirstAsync<PhotoRow>(
      'SELECT * FROM progress_photos ORDER BY date DESC LIMIT 1'
    );

    if (!row) {
      return { lastPhotoDaysAgo: null, nextPhotoDueDays: 0 };
    }

    const today    = new Date();
    const lastDate = new Date(row.date);
    const diffMs   = today.getTime() - lastDate.getTime();
    const daysAgo  = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const dueIn    = Math.max(0, frequencyDays - daysAgo);

    return {
      lastPhotoDaysAgo: daysAgo,
      nextPhotoDueDays: dueIn,
      lastPhotoDate:    row.date,
    };
  },

  /**
   * Add a new progress photo.
   *
   * The `data.uri` MUST be the picker/camera URI. This method:
   *  1. Generates a UUID for the record.
   *  2. Copies the file to permanent storage.
   *  3. Verifies the copy succeeded.
   *  4. Inserts the metadata row into SQLite.
   *
   * Throws if the file copy fails so the caller knows the operation did not complete.
   */
  async addPhoto(data: {
    uri:    string;
    date?:  string;
    notes?: string;
  }): Promise<ProgressPhoto> {
    const id        = generateId();
    const entryDate = data.date ?? localDateString();
    const createdAt = utcTimestamp();

    // Copy to permanent storage BEFORE inserting into DB
    const filePath = await copyToStorage(data.uri, id);

    // Verify the copy actually landed
    const info = await FileSystem.getInfoAsync(filePath);
    if (!info.exists) {
      throw new Error('Photo copy failed: file not found after copy.');
    }

    const db    = await getDatabase();
    const notes = data.notes?.trim() || null;

    await db.runAsync(
      'INSERT INTO progress_photos (id, date, file_path, notes, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, entryDate, filePath, notes, createdAt]
    );

    return { id, date: entryDate, uri: filePath, notes: notes ?? undefined, createdAt };
  },

  /**
   * Delete a photo by ID.
   *  1. Fetches the file_path from DB.
   *  2. Deletes the DB row.
   *  3. Deletes the physical file (idempotent — safe if already gone).
   *
   * Returns true if a record was found and deleted.
   */
  async deletePhoto(id: string): Promise<boolean> {
    const db  = await getDatabase();
    const row = await db.getFirstAsync<{ file_path: string }>(
      'SELECT file_path FROM progress_photos WHERE id = ?',
      [id]
    );
    if (!row) return false;

    await db.runAsync('DELETE FROM progress_photos WHERE id = ?', [id]);
    // Remove file after DB row is gone — idempotent if file is already missing
    await FileSystem.deleteAsync(row.file_path, { idempotent: true });
    return true;
  },

  /**
   * Checks whether the physical file for a given photo still exists.
   * Use before displaying a photo to gracefully handle missing files.
   */
  async verifyPhotoExists(filePath: string): Promise<boolean> {
    const info = await FileSystem.getInfoAsync(filePath);
    return info.exists;
  },

  /**
   * Scans the arova_photos directory for files that have no corresponding
   * DB record and deletes them.
   *
   * This handles edge cases like:
   *  - App crash after file copy but before DB insert
   *  - Manual file manipulation outside the app
   *
   * Returns the number of orphaned files removed.
   */
  async cleanupOrphanedFiles(): Promise<number> {
    try {
      await ensurePhotosDir();
      const db       = await getDatabase();
      const rows     = await db.getAllAsync<{ file_path: string }>(
        'SELECT file_path FROM progress_photos'
      );
      const knownPaths = new Set(rows.map(r => r.file_path));
      const dirEntries = await FileSystem.readDirectoryAsync(PHOTOS_DIR).catch(() => [] as string[]);

      let cleaned = 0;
      for (const filename of dirEntries) {
        const fullPath = `${PHOTOS_DIR}${filename}`;
        if (!knownPaths.has(fullPath)) {
          await FileSystem.deleteAsync(fullPath, { idempotent: true });
          cleaned++;
        }
      }
      return cleaned;
    } catch {
      return 0;
    }
  },

  /**
   * Permanently removes all photo DB records AND physical files.
   * Used by the "delete all data" backup flow.
   */
  async clearAllPhotos(): Promise<void> {
    const db   = await getDatabase();
    const rows = await db.getAllAsync<{ file_path: string }>(
      'SELECT file_path FROM progress_photos'
    );
    await db.runAsync('DELETE FROM progress_photos');
    // Delete all files after clearing DB rows
    for (const row of rows) {
      await FileSystem.deleteAsync(row.file_path, { idempotent: true });
    }
  },

  /**
   * Returns the absolute path of the photos storage directory.
   * Used by backupService when bundling photos for export.
   */
  getPhotosDir(): string {
    return PHOTOS_DIR;
  },
};
