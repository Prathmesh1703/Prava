/**
 * Date utilities for Prava.
 *
 * IMPORTANT: Calendar dates (workout date, weight date, check-in date, etc.)
 * are stored as the user's LOCAL calendar date — NOT UTC.
 *
 * DO NOT use `new Date().toISOString().split('T')[0]` for calendar dates.
 * That returns a UTC date which will show the wrong day for users in
 * positive UTC offsets (e.g. UTC+5:30) after midnight.
 *
 * Use `localDateString()` for any date that represents "today" in the
 * user's local timezone.
 *
 * Full ISO-8601 UTC timestamps (created_at, completed_at) are still
 * obtained via `new Date().toISOString()` — that is correct and intentional.
 */

/**
 * Returns today's date in YYYY-MM-DD format using the device's local timezone.
 */
export function localDateString(d: Date = new Date()): string {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current UTC timestamp in ISO-8601 format.
 * Use for created_at / completed_at / updated_at audit fields only.
 */
export function utcTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validates that a string is in YYYY-MM-DD format.
 * Does not validate whether the date is calendar-valid (e.g. Feb 30).
 */
export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Compare two YYYY-MM-DD date strings lexicographically.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareDateStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
