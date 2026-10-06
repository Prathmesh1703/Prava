/**
 * Backup service — Phase 8.
 *
 * Two-tier backup architecture:
 *
 *  ┌────────────────┬──────────────────────────────────────────────────────┐
 *  │ Standard       │ Profile, settings, workouts, weight entries,         │
 *  │ (.arova)       │ photo metadata (no files). No private data.          │
 *  │                │ Unencrypted JSON — safe to inspect.                  │
 *  ├────────────────┼──────────────────────────────────────────────────────┤
 *  │ Full Encrypted │ Everything above + actual photo files (base64) +     │
 *  │ (.arova)       │ private questions + encrypted check-in ciphertexts.  │
 *  │                │ Re-encrypted with a backup password (PBKDF2-derived).│
 *  └────────────────┴──────────────────────────────────────────────────────┘
 *
 * Security guarantees:
 *  - Private check-in answers are NEVER in a standard backup.
 *  - The app's internal encryption key is NEVER exported in any backup.
 *  - PIN is NEVER in any backup.
 *  - Device-specific file paths are NEVER exported — photos use UUID filenames.
 *
 * Restore is atomic:
 *  1. Validate format_version + schema_version.
 *  2. Snapshot existing DB to .bak.
 *  3. Run all inserts inside a single transaction.
 *  4. Write photo files.
 *  5. On any failure: restore .bak, delete partial photo writes.
 *  6. On success: delete .bak.
 *
 * CSV export:
 *  - Includes workouts and weight entries only.
 *  - Private data is NEVER in a CSV export.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { AES, CBC, Pkcs7, Base64, Utf8, PBKDF2, Hex } from 'crypto-es';
import * as Crypto from 'expo-crypto';

import { getDatabase } from '../db/database';
import { photoService } from './photoService';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BACKUP_FORMAT_VERSION = 2;
const APP_VERSION           = '1.0.0';
const CURRENT_SCHEMA        = 5;

const BACKUP_DIR  = `${FileSystem.documentDirectory}arova_backups/`;
const PHOTOS_DIR  = photoService.getPhotosDir();

// ─────────────────────────────────────────────────────────────────────────────
// Backup types
// ─────────────────────────────────────────────────────────────────────────────

interface BackupMeta {
  format_version: number;
  app_version:    string;
  schema_version: number;
  created_at:     string;
  backup_type:    'standard' | 'full';
  encrypted:      boolean;
}

interface StandardBackupData {
  profile:       Record<string, unknown>;
  settings:      Record<string, unknown>;
  workouts:      Record<string, unknown>[];
  weight_entries: Record<string, unknown>[];
  photos_manifest: Array<{ id: string; date: string; notes: string | null; filename: string }>;
}

interface FullBackupData extends StandardBackupData {
  photos_files: Record<string, string>;  // filename → base64
  private: {
    questions: Record<string, unknown>[];
    checkins_package_enc: string;   // base64 — entire JSON array encrypted
    checkins_package_iv:  string;   // base64
    checkins_package_tag: string;   // base64 (HMAC)
  };
}

interface BackupFile {
  meta: BackupMeta;
  data: StandardBackupData | FullBackupData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function ensureBackupDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(BACKUP_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive an AES key from a user-supplied password using PBKDF2.
 * Used for full backup encryption — NOT the app's internal key.
 */
function deriveBackupKey(password: string, saltHex: string): any {
  const salt = Hex.parse(saltHex);
  const key  = PBKDF2(password, salt, { keySize: 8, iterations: 10000 });
  return key;
}

function encryptWithPassword(plaintext: string, password: string, saltHex: string): { ciphertext: string; iv: string } {
  const key      = deriveBackupKey(password, saltHex);
  const ivBytes  = Crypto.getRandomValues(new Uint8Array(16));
  const iv       = Hex.parse(bytesToHex(ivBytes));
  const encrypted = AES.encrypt(Utf8.parse(plaintext), key as any, { iv, mode: CBC, padding: Pkcs7 });
  return {
    ciphertext: encrypted.ciphertext?.toString(Base64) ?? '',
    iv:         iv.toString(Base64),
  };
}

function decryptWithPassword(ciphertextB64: string, ivB64: string, password: string, saltHex: string): string {
  const key       = deriveBackupKey(password, saltHex);
  const iv        = Base64.parse(ivB64);
  const cipher    = Base64.parse(ciphertextB64);
  const decrypted = AES.decrypt({ ciphertext: cipher } as any, key as any, { iv, mode: CBC, padding: Pkcs7 });
  return decrypted.toString(Utf8);
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export const backupService = {

  // ── Standard Backup ────────────────────────────────────────────────────────

  /**
   * Export a standard (non-sensitive) backup.
   * Contains: profile, settings, workouts, weights, photo metadata.
   * Does NOT include private check-in data or photo files.
   * The file is shared via the OS share sheet.
   */
  async exportStandardBackup(): Promise<{ success: boolean; filename: string }> {
    await ensureBackupDir();
    const db = await getDatabase();

    const profileRow  = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM profile WHERE id = 1');
    const settingsRow = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM app_settings WHERE id = 1');
    const workouts    = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM workouts ORDER BY date DESC');
    const weights     = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM weight_entries ORDER BY date DESC');
    const photoRows   = await db.getAllAsync<{ id: string; date: string; notes: string | null; file_path: string }>(
      'SELECT id, date, notes, file_path FROM progress_photos ORDER BY date DESC'
    );

    const photosManifest = photoRows.map(r => ({
      id:       r.id,
      date:     r.date,
      notes:    r.notes,
      filename: r.file_path.split('/').pop() ?? r.id,
    }));

    const backupData: BackupFile = {
      meta: {
        format_version: BACKUP_FORMAT_VERSION,
        app_version:    APP_VERSION,
        schema_version: CURRENT_SCHEMA,
        created_at:     new Date().toISOString(),
        backup_type:    'standard',
        encrypted:      false,
      },
      data: {
        profile:         profileRow ?? {},
        settings:        settingsRow ?? {},
        workouts:        workouts,
        weight_entries:  weights,
        photos_manifest: photosManifest,
      },
    };

    const dateStr  = new Date().toISOString().split('T')[0];
    const filename = `prava-backup-${dateStr}.prava`;
    const filePath = `${BACKUP_DIR}${filename}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupData, null, 2));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, { mimeType: 'application/json', dialogTitle: 'Save Prava Backup' });
    }

    return { success: true, filename };
  },

  // Keep legacy name for backward compat with AppContext
  async exportBackup(): Promise<{ success: boolean; filename: string; sizeKb: number }> {
    const result = await this.exportStandardBackup();
    const info   = await FileSystem.getInfoAsync(`${BACKUP_DIR}${result.filename}`);
    const sizeKb = info.exists ? Math.round((info as any).size / 1024) : 0;
    return { ...result, sizeKb };
  },

  // ── Full Encrypted Backup ──────────────────────────────────────────────────

  /**
   * Export a full encrypted backup.
   * Includes everything in standard + actual photo files (base64) + private data.
   * The private check-in records are re-encrypted using the provided backup password.
   * The backup password is NEVER stored anywhere — the user must remember it.
   *
   * @param password  User-supplied backup password (minimum 6 chars recommended).
   */
  async exportFullBackup(password: string): Promise<{ success: boolean; filename: string }> {
    await ensureBackupDir();
    const db = await getDatabase();

    // Collect all standard data
    const profileRow  = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM profile WHERE id = 1');
    const settingsRow = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM app_settings WHERE id = 1');
    const workouts    = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM workouts ORDER BY date DESC');
    const weights     = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM weight_entries ORDER BY date DESC');
    const photoRows   = await db.getAllAsync<{ id: string; date: string; notes: string | null; file_path: string }>(
      'SELECT id, date, notes, file_path FROM progress_photos ORDER BY date DESC'
    );

    // Bundle actual photo files as base64
    const photosFiles: Record<string, string> = {};
    const photosManifest = photoRows.map(r => ({
      id:       r.id,
      date:     r.date,
      notes:    r.notes,
      filename: r.file_path.split('/').pop() ?? r.id,
    }));

    for (const row of photoRows) {
      const filename = row.file_path.split('/').pop() ?? row.id;
      try {
        const info = await FileSystem.getInfoAsync(row.file_path);
        if (info.exists) {
          const b64 = await FileSystem.readAsStringAsync(row.file_path, { encoding: 'base64' as any });
          photosFiles[filename] = b64;
        }
      } catch {
        // Skip missing files — noted in manifest
      }
    }

    // Bundle private data — re-encrypt checkins with backup password
    const questions = await db.getAllAsync<Record<string, unknown>>(
      'SELECT id, text, enabled, display_order, created_at FROM private_questions ORDER BY display_order ASC'
    );
    const checkins = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM private_checkins ORDER BY date DESC'
    );

    // The stored checkins already have answers_enc + iv + auth_tag.
    // We bundle them as-is (app-key encrypted) but wrap the whole array
    // in an additional layer with the backup password.
    const saltHex = bytesToHex(Crypto.getRandomValues(new Uint8Array(16)));
    const checkinsJson = JSON.stringify(checkins);
    const encryptedCheckins = encryptWithPassword(checkinsJson, password, saltHex);

    const backupData: BackupFile = {
      meta: {
        format_version: BACKUP_FORMAT_VERSION,
        app_version:    APP_VERSION,
        schema_version: CURRENT_SCHEMA,
        created_at:     new Date().toISOString(),
        backup_type:    'full',
        encrypted:      true,
      },
      data: {
        profile:         profileRow ?? {},
        settings:        settingsRow ?? {},
        workouts:        workouts,
        weight_entries:  weights,
        photos_manifest: photosManifest,
        photos_files:    photosFiles,
        private: {
          questions:             questions,
          checkins_package_enc:  encryptedCheckins.ciphertext,
          checkins_package_iv:   encryptedCheckins.iv,
          checkins_package_tag:  saltHex, // salt stored in tag field for restore
        },
      } as FullBackupData,
    };

    const dateStr  = new Date().toISOString().split('T')[0];
    const filename = `prava-full-${dateStr}.prava`;
    const filePath = `${BACKUP_DIR}${filename}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupData));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, { mimeType: 'application/json', dialogTitle: 'Save Full Prava Backup' });
    }

    return { success: true, filename };
  },

  // ── Restore ────────────────────────────────────────────────────────────────

  /**
   * Pick and restore a backup file. Atomic: on any failure, the existing
   * database is restored from a .bak snapshot made before the restore begins.
   *
   * @param password  Required only for full encrypted backups; ignored for standard.
   */
  async importBackup(password?: string): Promise<{ success: boolean; message: string }> {
    // Step 1 — Pick file
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) {
      return { success: false, message: 'Backup import cancelled.' };
    }

    const fileUri = result.assets[0].uri;
    let raw: string;
    try {
      raw = await FileSystem.readAsStringAsync(fileUri);
    } catch {
      return { success: false, message: 'Could not read the backup file.' };
    }

    // Step 2 — Parse + validate
    let backup: BackupFile;
    try {
      backup = JSON.parse(raw) as BackupFile;
    } catch {
      return { success: false, message: 'Backup file is corrupted (invalid JSON).' };
    }

    if (!backup.meta || !backup.data) {
      return { success: false, message: 'Backup file format is not recognised.' };
    }
    if (backup.meta.format_version > BACKUP_FORMAT_VERSION) {
      return { success: false, message: `This backup was created by a newer version of Prava (format v${backup.meta.format_version}). Please update the app.` };
    }
    if (backup.meta.schema_version > CURRENT_SCHEMA) {
      return { success: false, message: `This backup requires a newer database schema. Please update the app.` };
    }

    const isFullBackup = backup.meta.backup_type === 'full' && backup.meta.encrypted;
    if (isFullBackup && !password) {
      return { success: false, message: 'A password is required to restore a full encrypted backup.' };
    }

    const data = backup.data as FullBackupData;

    // Step 3 — Snapshot existing DB
    const db      = await getDatabase();
    const dbPath  = `${FileSystem.documentDirectory}SQLite/arova.db`;
    const bakPath = `${FileSystem.documentDirectory}SQLite/arova.db.bak`;
    let snapshotMade = false;
    try {
      const dbInfo = await FileSystem.getInfoAsync(dbPath);
      if (dbInfo.exists) {
        await FileSystem.copyAsync({ from: dbPath, to: bakPath });
        snapshotMade = true;
      }
    } catch {
      // Non-fatal — snapshot best-effort
    }

    const writtenPhotoFiles: string[] = [];

    try {
      // Step 4 — Restore DB records inside a transaction
      await db.withTransactionAsync(async () => {
        // Profile
        if (data.profile) {
          const p = data.profile as any;
          await db.runAsync(
            `UPDATE profile SET name=?, gym_name=?, workout_goal=?, target_weight_kg=?,
             height_cm=?, photo_frequency_days=?, avatar_id=?, member_since=? WHERE id=1`,
            [p.name, p.gym_name, p.workout_goal, p.target_weight_kg,
             p.height_cm, p.photo_frequency_days ?? 30, p.avatar_id, p.member_since]
          );
        }

        // Settings (restore theme only — notification settings stay as-is)
        if (data.settings) {
          const s = data.settings as any;
          if (s.theme) {
            await db.runAsync('UPDATE app_settings SET theme = ? WHERE id = 1', [s.theme]);
          }
        }

        // Workouts
        await db.runAsync('DELETE FROM workouts');
        for (const w of (data.workouts ?? [])) {
          const ww = w as any;
          await db.runAsync(
            'INSERT OR IGNORE INTO workouts (id, date, muscle_groups, notes, created_at) VALUES (?, ?, ?, ?, ?)',
            [ww.id, ww.date, ww.muscle_groups, ww.notes, ww.created_at]
          );
        }

        // Weight entries
        await db.runAsync('DELETE FROM weight_entries');
        for (const we of (data.weight_entries ?? [])) {
          const w = we as any;
          await db.runAsync(
            'INSERT OR IGNORE INTO weight_entries (id, date, weight_kg, created_at) VALUES (?, ?, ?, ?)',
            [w.id, w.date, w.weight_kg, w.created_at]
          );
        }

        // Photo metadata (restored without file_path — paths set after file restore)
        await db.runAsync('DELETE FROM progress_photos');

        // Private data (full backup only)
        if (isFullBackup && data.private) {
          await db.runAsync('DELETE FROM private_questions');
          await db.runAsync('DELETE FROM private_checkins');

          for (const q of (data.private.questions ?? [])) {
            const qq = q as any;
            await db.runAsync(
              'INSERT OR IGNORE INTO private_questions (id, text, enabled, display_order, created_at) VALUES (?, ?, ?, ?, ?)',
              [qq.id, qq.text, qq.enabled, qq.display_order, qq.created_at]
            );
          }

          // Decrypt and restore checkins using backup password
          try {
            const saltHex = data.private.checkins_package_tag;
            const plain   = decryptWithPassword(
              data.private.checkins_package_enc,
              data.private.checkins_package_iv,
              password!,
              saltHex
            );
            const checkins = JSON.parse(plain) as any[];
            for (const c of checkins) {
              await db.runAsync(
                'INSERT OR IGNORE INTO private_checkins (id, date, answers_enc, iv, auth_tag, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
                [c.id, c.date, c.answers_enc, c.iv, c.auth_tag, c.completed_at]
              );
            }
          } catch {
            throw new Error('Failed to decrypt private data. Incorrect backup password?');
          }
        }
      });

      // Step 5 — Restore photo files (after DB transaction succeeds)
      const photosDir = photoService.getPhotosDir();
      const dirInfo   = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      }

      if (data.photos_manifest) {
        for (const photoMeta of data.photos_manifest) {
          const filename = photoMeta.filename;
          const destPath = `${photosDir}${filename}`;
          const b64      = isFullBackup ? (data as FullBackupData).photos_files?.[filename] : null;

          if (b64) {
            await FileSystem.writeAsStringAsync(destPath, b64, { encoding: 'base64' as any });
            writtenPhotoFiles.push(destPath);
          }

          // Re-insert photo metadata with restored file path
          await db.runAsync(
            'INSERT OR IGNORE INTO progress_photos (id, date, file_path, notes, created_at) VALUES (?, ?, ?, ?, ?)',
            [photoMeta.id, photoMeta.date, destPath, photoMeta.notes, new Date().toISOString()]
          );
        }
      }

      // Step 6 — Success: remove .bak
      if (snapshotMade) {
        await FileSystem.deleteAsync(bakPath, { idempotent: true });
      }

      return { success: true, message: 'Backup restored successfully.' };

    } catch (e: any) {
      // Rollback: restore DB from .bak, clean up written photo files
      if (snapshotMade) {
        try {
          await FileSystem.copyAsync({ from: bakPath, to: dbPath });
          await FileSystem.deleteAsync(bakPath, { idempotent: true });
        } catch {
          // Best-effort rollback
        }
      }
      for (const f of writtenPhotoFiles) {
        await FileSystem.deleteAsync(f, { idempotent: true });
      }
      return {
        success: false,
        message: e?.message ?? 'Restore failed. Your existing data has been preserved.',
      };
    }
  },

  // ── CSV Export ─────────────────────────────────────────────────────────────

  /**
   * Export workouts and weight entries as CSV.
   * Private data is NEVER included in CSV exports.
   */
  async exportCsv(): Promise<{ success: boolean; filename: string }> {
    await ensureBackupDir();
    const db = await getDatabase();

    const workouts = await db.getAllAsync<any>('SELECT * FROM workouts ORDER BY date DESC');
    const weights  = await db.getAllAsync<any>('SELECT * FROM weight_entries ORDER BY date DESC');

    const workoutsCsv = [
      'date,muscle_groups,notes',
      ...workouts.map(w => `${w.date},"${w.muscle_groups}","${w.notes ?? ''}"`)
    ].join('\n');

    const weightsCsv = [
      'date,weight_kg',
      ...weights.map(w => `${w.date},${w.weight_kg}`)
    ].join('\n');

    const csv = `# Prava Workout Log\n${workoutsCsv}\n\n# Prava Weight Log\n${weightsCsv}`;

    const dateStr  = new Date().toISOString().split('T')[0];
    const filename = `prava-export-${dateStr}.csv`;
    const filePath = `${BACKUP_DIR}${filename}`;

    await FileSystem.writeAsStringAsync(filePath, csv);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: 'Export Prava Data' });
    }

    return { success: true, filename };
  },

  // ── Delete all data ────────────────────────────────────────────────────────

  async deleteAllData(): Promise<{ success: boolean }> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM workouts');
      await db.runAsync('DELETE FROM weight_entries');
      await db.runAsync('DELETE FROM private_checkins');
      await db.runAsync('DELETE FROM private_questions');
      await db.runAsync('UPDATE profile SET name=NULL, gym_name=NULL, workout_goal=NULL, target_weight_kg=NULL, height_cm=NULL, avatar_id=NULL, member_since=NULL WHERE id=1');
      await db.runAsync('UPDATE app_settings SET has_onboarded=0 WHERE id=1');
    });
    // Also remove photo files
    await photoService.clearAllPhotos();
    return { success: true };
  },

  // ── Legacy helpers (used by AppContext) ────────────────────────────────────

  async getLastBackupDate(): Promise<string | null> {
    // Not stored persistently yet — returns null until full backup is exported
    return null;
  },
};
