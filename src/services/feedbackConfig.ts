/**
 * ─── Feedback Google Form Configuration ─────────────────────────────────────
 *
 * HOW TO GET THESE VALUES:
 *
 *  1. Open your Google Form in the browser.
 *  2. Click ⋮ (top-right) → "Get pre-filled link".
 *  3. Fill in every field with dummy values and click "Get link".
 *  4. Copy the URL — it looks like:
 *       https://docs.google.com/forms/d/e/<FORM_ID>/formResponse?
 *         entry.123456789=5&entry.987654321=feature&entry.111222333=hello
 *  5. Replace the values below with your real FORM_ID and entry IDs.
 *
 * PRIVACY:
 *  - No email is required.
 *  - No Google account is required.
 *  - No PII (name, device ID, IP binding) is intentionally transmitted.
 *  - The form must NOT be set to "Collect email addresses".
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const FEEDBACK_CONFIG = {
  /**
   * The long alphanumeric token from your Google Form's share URL.
   * Example: "1FAIpQLSe_ABCDEF1234567890xyz..."
   */
  FORM_ID: '1FAIpQLScsgoRZHatgF-cVG9bAES3ALjV3Go7wyZpukUw2FCAvJb_loA',

  /**
   * Google Forms submission endpoint (do not change this pattern).
   * The full URL is assembled at runtime: BASE_URL + FORM_ID + '/formResponse'
   */
  BASE_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScsgoRZHatgF-cVG9bAES3ALjV3Go7wyZpukUw2FCAvJb_loA/formResponse',

  /**
   * Google Forms submission endpoint (do not change this pattern).
   * The full URL is assembled at runtime: BASE_URL + FORM_ID + '/formResponse'
   */
  // Shortened_URL: 'https://forms.gle/oNsfidzk5WQghFKf7',

  /**
   * Field entry IDs — copy the "entry.XXXXXXXXX" values from your pre-filled URL.
   * Each key maps to one question in your Google Form.
   */
  FIELD_RATING: 'entry.1499805366',     // Numeric 1-5 (short answer or multiple choice)
  FIELD_CATEGORY: 'entry.1453472379',
  FIELD_MESSAGE: 'entry.22035266',    // Long answer text

  /**
   * Max number of times to retry a failed submission before giving up.
   */
  MAX_SYNC_ATTEMPTS: 3,

  /**
   * Delay between sync retries (milliseconds, exponential back-off multiplier).
   * Attempt 1: 0ms, Attempt 2: RETRY_DELAY_MS * 2, Attempt 3: RETRY_DELAY_MS * 4
   */
  RETRY_DELAY_MS: 2_000,
} as const;
