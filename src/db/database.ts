/**
 * Database foundation for Prava (expo-sqlite SDK 57).
 *
 * Responsibilities:
 *  - Open / cache the SQLite connection (WAL mode, foreign keys ON)
 *  - Versioned sequential migrations via PRAGMA user_version
 *  - Every migration runs inside its own transaction so a partial
 *    failure leaves the DB at the previous version (safe to retry)
 *
 * CURRENT_VERSION must be bumped every time a new migration_vN()
 * function is added. Never edit an existing migration; always add
 * a new one.
 */

import * as SQLite from 'expo-sqlite';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// Preserved database filename for zero-data-loss continuity
const DB_NAME = 'arova.db';

/**
 * Increment this whenever you add a new migration_vN() function.
 * The migration runner will execute every version from
 * (currentVersion + 1) up to CURRENT_VERSION sequentially.
 */
const CURRENT_VERSION = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Singleton connection
// ─────────────────────────────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Returns the cached database instance, opening and migrating it on first
 * call. Safe to call from multiple services concurrently — the promise
 * returned by the first caller is reused.
 */
let _initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // Enable WAL for better concurrent read performance.
    // Enable foreign-key enforcement (SQLite disables it by default).
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    await runMigrations(db);
    _db = db;
    return db;
  })();

  return _initPromise;
}

/**
 * Close and reset the cached connection.
 * Intended for tests only — not for production use.
 */
export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
    _initPromise = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Version helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getUserVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  return row?.user_version ?? 0;
}

/**
 * PRAGMA user_version does not accept bound parameters in expo-sqlite.
 * The value is validated to be a safe integer before interpolation.
 */
async function setUserVersion(
  db: SQLite.SQLiteDatabase,
  version: number
): Promise<void> {
  if (!Number.isInteger(version) || version < 0) {
    throw new Error(`Invalid schema version: ${version}`);
  }
  await db.execAsync(`PRAGMA user_version = ${version};`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration runner
// ─────────────────────────────────────────────────────────────────────────────

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const storedVersion = await getUserVersion(db);

  if (storedVersion === CURRENT_VERSION) return; // Nothing to do

  if (storedVersion > CURRENT_VERSION) {
    // The database was created by a newer app version.
    // We cannot safely downgrade — treat it as a fatal error.
    throw new Error(
      `Database schema version ${storedVersion} is newer than ` +
        `the app supports (${CURRENT_VERSION}). Please update the app.`
    );
  }

  // Run every pending migration in order, each in its own transaction.
  // If a migration throws, the transaction rolls back and user_version
  // stays at its previous value so the migration is retried next launch.
  const migrations: Array<(db: SQLite.SQLiteDatabase) => Promise<void>> = [
    migration_v1, // index 0 → brings DB from 0 → 1
    migration_v2, // index 1 → brings DB from 1 → 2
    migration_v3, // index 2 → brings DB from 2 → 3
    migration_v4, // index 3 → brings DB from 3 → 4
    migration_v5, // index 4 → brings DB from 4 → 5
    migration_v6, // index 5 → brings DB from 5 → 6
    migration_v7, // index 6 → brings DB from 6 → 7
    migration_v8, // index 7 → brings DB from 7 → 8
  ];

  for (let targetVersion = storedVersion + 1; targetVersion <= CURRENT_VERSION; targetVersion++) {
    const migrationFn = migrations[targetVersion - 1];
    if (!migrationFn) {
      throw new Error(`No migration function found for version ${targetVersion}`);
    }

    await db.withTransactionAsync(async () => {
      await migrationFn(db);
      // Must be set inside the transaction so it rolls back with the schema
      // changes if anything fails.
      await setUserVersion(db, targetVersion);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration v1 — Initial schema
// ─────────────────────────────────────────────────────────────────────────────

async function migration_v1(db: SQLite.SQLiteDatabase): Promise<void> {
  // Workouts — one per calendar date, muscle groups stored as JSON array
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id            TEXT PRIMARY KEY NOT NULL,
      date          TEXT NOT NULL UNIQUE
                      CHECK(date GLOB '????-??-??'),
      muscle_groups TEXT NOT NULL,
      notes         TEXT,
      created_at    TEXT NOT NULL
    );
  `);

  // Weight entries — one per calendar date
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS weight_entries (
      id         TEXT PRIMARY KEY NOT NULL,
      date       TEXT NOT NULL UNIQUE
                   CHECK(date GLOB '????-??-??'),
      weight_kg  REAL NOT NULL
                   CHECK(weight_kg > 0 AND weight_kg < 1000),
      created_at TEXT NOT NULL
    );
  `);

  // Progress photos — file_path points to documentDirectory copy
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS progress_photos (
      id         TEXT PRIMARY KEY NOT NULL,
      date       TEXT NOT NULL
                   CHECK(date GLOB '????-??-??'),
      file_path  TEXT NOT NULL UNIQUE,
      notes      TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Profile — single row enforced by CHECK(id = 1)
  // No email column (offline app, no accounts).
  // No current_weight_kg — derived from weight_entries at query time.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profile (
      id                   INTEGER PRIMARY KEY DEFAULT 1
                             CHECK(id = 1),
      name                 TEXT,
      gym_name             TEXT,
      workout_goal         TEXT,
      target_weight_kg     REAL
                             CHECK(target_weight_kg IS NULL OR target_weight_kg > 0),
      height_cm            REAL
                             CHECK(height_cm IS NULL OR
                                   (height_cm > 50 AND height_cm < 300)),
      photo_frequency_days INTEGER NOT NULL DEFAULT 30
                             CHECK(photo_frequency_days > 0),
      avatar_id            TEXT,
      member_since         TEXT
    );
  `);

  // App settings — single row enforced by CHECK(id = 1)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id                       INTEGER PRIMARY KEY DEFAULT 1
                                 CHECK(id = 1),
      theme                    TEXT NOT NULL DEFAULT 'system'
                                 CHECK(theme IN ('system', 'light', 'dark')),
      private_checkins_enabled INTEGER NOT NULL DEFAULT 0
                                 CHECK(private_checkins_enabled IN (0, 1))
    );
  `);

  // Seed the single-row tables so every SELECT returns a row immediately.
  await db.execAsync(`
    INSERT OR IGNORE INTO profile (id) VALUES (1);
    INSERT OR IGNORE INTO app_settings (id) VALUES (1);
  `);

  // Performance indexes on the most commonly filtered column
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_workouts_date     ON workouts(date);
    CREATE INDEX IF NOT EXISTS idx_weights_date      ON weight_entries(date);
    CREATE INDEX IF NOT EXISTS idx_photos_date       ON progress_photos(date);
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration v2 — Private section (questions + encrypted check-ins)
// ─────────────────────────────────────────────────────────────────────────────

async function migration_v2(db: SQLite.SQLiteDatabase): Promise<void> {
  // Questions the user defines for their private daily check-in
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS private_questions (
      id            TEXT    PRIMARY KEY NOT NULL,
      text          TEXT    NOT NULL,
      enabled       INTEGER NOT NULL DEFAULT 1
                      CHECK(enabled IN (0, 1)),
      display_order INTEGER NOT NULL
                      CHECK(display_order >= 0),
      created_at    TEXT    NOT NULL
    );
  `);

  // One check-in per calendar date.
  // answers_enc: AES-256-GCM ciphertext (base64)
  // iv:          GCM initialisation vector (base64, 96-bit)
  // auth_tag:    GCM authentication tag (base64) for integrity verification
  // NEVER store plaintext answers here.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS private_checkins (
      id           TEXT PRIMARY KEY NOT NULL,
      date         TEXT NOT NULL UNIQUE
                     CHECK(date GLOB '????-??-??'),
      answers_enc  TEXT NOT NULL,
      iv           TEXT NOT NULL,
      auth_tag     TEXT NOT NULL,
      completed_at TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_checkins_date ON private_checkins(date);
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration v3 — Notification settings columns
// ─────────────────────────────────────────────────────────────────────────────

async function migration_v3(db: SQLite.SQLiteDatabase): Promise<void> {
  // SQLite does not support adding multiple columns in one ALTER TABLE.
  // Each column must be a separate statement.
  const cols: Array<{ name: string; definition: string }> = [
    { name: 'workout_reminder_enabled', definition: 'INTEGER NOT NULL DEFAULT 0 CHECK(workout_reminder_enabled IN (0,1))' },
    { name: 'workout_reminder_time',    definition: "TEXT NOT NULL DEFAULT '19:00'" },
    { name: 'weight_reminder_enabled',  definition: 'INTEGER NOT NULL DEFAULT 0 CHECK(weight_reminder_enabled IN (0,1))' },
    { name: 'weight_reminder_time',     definition: "TEXT NOT NULL DEFAULT '21:00'" },
    { name: 'photo_reminder_enabled',   definition: 'INTEGER NOT NULL DEFAULT 0 CHECK(photo_reminder_enabled IN (0,1))' },
    { name: 'photo_reminder_time',      definition: "TEXT NOT NULL DEFAULT '08:00'" },
  ];

  for (const col of cols) {
    // Guard against re-running on a partially upgraded DB (idempotent).
    // expo-sqlite will throw if the column already exists; catch and ignore.
    try {
      await db.execAsync(
        `ALTER TABLE app_settings ADD COLUMN ${col.name} ${col.definition};`
      );
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      if (!msg.includes('duplicate column')) {
        throw e; // Re-throw unexpected errors
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration v4 — First-time onboarding flag
// ─────────────────────────────────────────────────────────────────────────────

async function migration_v4(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(
      `ALTER TABLE app_settings ADD COLUMN has_onboarded INTEGER NOT NULL DEFAULT 0 CHECK(has_onboarded IN (0, 1));`
    );
  } catch (e: any) {
    const msg: string = e?.message ?? '';
    if (!msg.includes('duplicate column')) {
      throw e;
    }
  }

  // If the user already set up a profile name previously, mark as onboarded
  // so existing users are not redirected back to onboarding.
  await db.execAsync(`
    UPDATE app_settings
    SET has_onboarded = 1
    WHERE EXISTS (
      SELECT 1 FROM profile WHERE id = 1 AND name IS NOT NULL AND TRIM(name) != ''
    );
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration v5 — Private progress photos toggle
// ─────────────────────────────────────────────────────────────────────────────

async function migration_v5(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(
      `ALTER TABLE app_settings ADD COLUMN private_photos_enabled INTEGER NOT NULL DEFAULT 0 CHECK(private_photos_enabled IN (0, 1));`
    );
  } catch (e: any) {
    const msg: string = e?.message ?? '';
    if (!msg.includes('duplicate column')) {
      throw e;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration v6 — Configurable weekly rest days for streak continuity
// ─────────────────────────────────────────────────────────────────────────────

async function migration_v6(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(
      `ALTER TABLE profile ADD COLUMN rest_days_per_week INTEGER NOT NULL DEFAULT 1 CHECK(rest_days_per_week >= 0 AND rest_days_per_week <= 6);`
    );
  } catch (e: any) {
    const msg: string = e?.message ?? '';
    if (!msg.includes('duplicate column')) {
      throw e;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration v7 — Monthly and custom rest days configuration
// ─────────────────────────────────────────────────────────────────────────────

async function migration_v7(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(
      `ALTER TABLE profile ADD COLUMN rest_days_mode TEXT NOT NULL DEFAULT 'weekly';`
    );
  } catch (e: any) {
    const msg: string = e?.message ?? '';
    if (!msg.includes('duplicate column')) {
      throw e;
    }
  }

  try {
    await db.execAsync(
      `ALTER TABLE profile ADD COLUMN rest_days_value INTEGER NOT NULL DEFAULT 1;`
    );
  } catch (e: any) {
    const msg: string = e?.message ?? '';
    if (!msg.includes('duplicate column')) {
      throw e;
    }
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Migration v8 — Offline-first feedback queue
// ─────────────────────────────────────────────────────────────────────────────

async function migration_v8(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS feedback_queue (
      id                   TEXT PRIMARY KEY NOT NULL,
      rating               INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      category             TEXT NOT NULL DEFAULT 'general',
      message              TEXT NOT NULL,
      created_at           TEXT NOT NULL,
      sync_status          TEXT NOT NULL DEFAULT 'pending'
                             CHECK(sync_status IN ('pending','synced','failed')),
      sync_attempts        INTEGER NOT NULL DEFAULT 0,
      last_sync_attempt_at TEXT
    );
  `);
}
