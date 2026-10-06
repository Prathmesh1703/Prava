/**
 * PIN security for Arova — Phase 2 Security Foundation.
 *
 * Security properties:
 *  - PIN is NEVER stored as plaintext anywhere.
 *  - Only a salted SHA-256 hash is persisted, and only in expo-secure-store.
 *  - PIN never appears in the SQLite database, AsyncStorage, or logs.
 *  - Failed attempts are tracked in SecureStore (persists across app restarts).
 *  - After MAX_ATTEMPTS failures the section is locked for LOCKOUT_DURATION_MS.
 *  - A short in-memory session (SESSION_TTL_MS) avoids repeated PIN prompts
 *    within the same app session. Session is cleared when the app backgrounds.
 *  - PIN never travels in any backup file.
 *
 * Future: biometric unlock can wrap `isSessionActive()` — no PIN changes needed.
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** SecureStore keys. Never log these values. */
const PIN_HASH_KEY   = 'arova_pin_hash';
const ATTEMPTS_KEY   = 'arova_pin_attempts';
const LOCKOUT_KEY    = 'arova_pin_lockout_until'; // epoch ms as string

const MAX_ATTEMPTS         = 5;
const LOCKOUT_DURATION_MS  = 5 * 60 * 1000;  // 5 minutes
const SESSION_TTL_MS       = 5 * 60 * 1000;  // 5 minutes idle timeout

/**
 * App-specific pepper mixed into the hash so the hash is not reusable
 * across other apps even if a device key is compromised.
 * This is NOT a secret — its purpose is domain separation.
 */
const HASH_PEPPER = 'arova.gymtracker.pin.v1';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory session state (lives only for the current JS runtime)
// ─────────────────────────────────────────────────────────────────────────────

let _sessionActive  = false;
let _sessionExpiry  = 0;

// ─────────────────────────────────────────────────────────────────────────────
// Return types
// ─────────────────────────────────────────────────────────────────────────────

export type VerifyResult =
  | { success: true }
  | { success: false; lockedOut: true;  remainingMs: number }
  | { success: false; lockedOut: false; attemptsLeft: number };

export type SetupResult =
  | { success: true }
  | { success: false; reason: string };

export type ChangePinResult =
  | { success: true }
  | { success: false; reason: string };

// ─────────────────────────────────────────────────────────────────────────────
// Hash helper — SHA-256(pin + pepper)
// ─────────────────────────────────────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
  // expo-crypto.digestStringAsync returns a lowercase hex string
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + HASH_PEPPER
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lockout helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getLockoutUntil(): Promise<number> {
  const raw = await SecureStore.getItemAsync(LOCKOUT_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

async function getAttemptCount(): Promise<number> {
  const raw = await SecureStore.getItemAsync(ATTEMPTS_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

async function setAttemptCount(n: number): Promise<void> {
  await SecureStore.setItemAsync(ATTEMPTS_KEY, String(n));
}

async function setLockout(): Promise<void> {
  const until = Date.now() + LOCKOUT_DURATION_MS;
  await SecureStore.setItemAsync(LOCKOUT_KEY, String(until));
  await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
}

async function clearLockout(): Promise<void> {
  await SecureStore.deleteItemAsync(LOCKOUT_KEY);
  await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export const pinStore = {
  // ── Setup ──────────────────────────────────────────────────────────────────

  /**
   * Hash and persist a new 4-digit numeric PIN.
   * Clears any existing lockout / attempt counters.
   */
  async setup(pin: string): Promise<SetupResult> {
    if (!/^\d{4}$/.test(pin)) {
      return { success: false, reason: 'PIN must be exactly 4 digits.' };
    }
    const hash = await hashPin(pin);
    await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
    await clearLockout();
    _sessionActive = true;
    _sessionExpiry = Date.now() + SESSION_TTL_MS;
    return { success: true };
  },

  /** Returns true if a PIN hash is stored (i.e. PIN has been set up). */
  async isSetup(): Promise<boolean> {
    const h = await SecureStore.getItemAsync(PIN_HASH_KEY);
    return !!h;
  },

  // ── Lockout status ─────────────────────────────────────────────────────────

  async isLockedOut(): Promise<boolean> {
    const until = await getLockoutUntil();
    return Date.now() < until;
  },

  async getLockoutRemainingMs(): Promise<number> {
    const until = await getLockoutUntil();
    return Math.max(0, until - Date.now());
  },

  // ── Verification ───────────────────────────────────────────────────────────

  /**
   * Verify a PIN attempt.
   *  - Returns { success: true } and starts a session on match.
   *  - Increments the attempt counter and returns attempts remaining on failure.
   *  - Returns { lockedOut: true } if already locked out.
   *  - Triggers a 5-minute lockout after MAX_ATTEMPTS failures.
   */
  async verify(pin: string): Promise<VerifyResult> {
    // Check lockout first
    const lockoutUntil = await getLockoutUntil();
    if (Date.now() < lockoutUntil) {
      return {
        success: false,
        lockedOut: true,
        remainingMs: lockoutUntil - Date.now(),
      };
    }

    const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
    if (!storedHash) {
      // PIN not configured — treat as not set up
      return { success: false, lockedOut: false, attemptsLeft: 0 };
    }

    const inputHash = await hashPin(pin);

    // Constant-time compare to resist timing attacks
    if (timingSafeEqual(inputHash, storedHash)) {
      await clearLockout();
      _sessionActive = true;
      _sessionExpiry = Date.now() + SESSION_TTL_MS;
      return { success: true };
    }

    // Failed attempt
    const attempts = (await getAttemptCount()) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await setLockout();
      return {
        success: false,
        lockedOut: true,
        remainingMs: LOCKOUT_DURATION_MS,
      };
    }

    await setAttemptCount(attempts);
    return {
      success: false,
      lockedOut: false,
      attemptsLeft: MAX_ATTEMPTS - attempts,
    };
  },

  // ── PIN change ─────────────────────────────────────────────────────────────

  /**
   * Change the PIN. Requires the current PIN to be verified first.
   * The session stays active after a successful change.
   */
  async changePin(currentPin: string, newPin: string): Promise<ChangePinResult> {
    const result = await this.verify(currentPin);
    if (!result.success) {
      if (result.lockedOut) {
        return { success: false, reason: 'Too many failed attempts. Try again later.' };
      }
      return { success: false, reason: 'Current PIN is incorrect.' };
    }
    return this.setup(newPin);
  },

  /**
   * Remove the PIN entirely (used when disabling the private section).
   * Does NOT delete encrypted data — only the access credential.
   */
  async clearPin(): Promise<void> {
    await SecureStore.deleteItemAsync(PIN_HASH_KEY);
    await clearLockout();
    this.lockSession();
  },

  // ── Session ────────────────────────────────────────────────────────────────

  /**
   * Returns true if the user has recently verified their PIN and the session
   * has not yet timed out. Use this to skip re-prompting within the same session.
   */
  isSessionActive(): boolean {
    if (!_sessionActive) return false;
    if (Date.now() > _sessionExpiry) {
      _sessionActive = false;
      return false;
    }
    return true;
  },

  /**
   * Extend the session TTL on any user interaction within the private section.
   * Call this whenever the user performs an action that proves they are active.
   */
  refreshSession(): void {
    if (_sessionActive) {
      _sessionExpiry = Date.now() + SESSION_TTL_MS;
    }
  },

  /**
   * Immediately invalidate the current session.
   * Call when the app moves to the background.
   */
  lockSession(): void {
    _sessionActive = false;
    _sessionExpiry = 0;
  },

  /**
   * How many milliseconds remain in the current session.
   * Returns 0 if no session is active.
   */
  sessionRemainingMs(): number {
    if (!_sessionActive) return 0;
    return Math.max(0, _sessionExpiry - Date.now());
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Constant-time string comparison (prevents timing side-channel on hash compare)
// ─────────────────────────────────────────────────────────────────────────────

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
