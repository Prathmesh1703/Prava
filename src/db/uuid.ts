/**
 * UUID generation using expo-crypto (SDK 57).
 * Cryptographically secure, works on iOS, Android, and Web
 * without any native polyfills.
 */
import * as Crypto from 'expo-crypto';

/**
 * Generate a UUID v4 string.
 * Use this for all new database record IDs instead of Date.now().
 */
export function generateId(): string {
  return Crypto.randomUUID();
}
