/**
 * Feedback API — sends a single feedback entry to Google Forms.
 *
 * Google Forms accepts anonymous form responses via a plain HTTP POST to:
 *   BASE_URL (the full formResponse endpoint from feedbackConfig)
 *
 * The payload is application/x-www-form-urlencoded with entry.XXXXXXX fields.
 * No authentication, no API key, no user account required.
 *
 * Google Forms does NOT return a JSON body — it returns HTML (confirmation page)
 * with HTTP 200. Any 2xx response means success.
 * Network errors (offline, timeout) will throw so the caller can retry.
 */

import { Feedback, FeedbackCategory } from '../types';
import { FEEDBACK_CONFIG } from './feedbackConfig';

// BASE_URL is already the full formResponse endpoint — use it directly.
const SUBMISSION_URL = FEEDBACK_CONFIG.BASE_URL;

/**
 * Maps internal category IDs to the exact option labels in Google Forms.
 * IMPORTANT: these strings must match your form's multiple-choice options exactly
 * (including capitalisation). Update if you rename the options in your form.
 */
const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  feature:     'Feature Idea',
  improvement: 'Improvement',
  bug:         'Bug Report',
  general:     'General',
};

/**
 * Submit a single Feedback item to Google Forms.
 *
 * @throws Error if network is unavailable or the request fails (HTTP >= 400).
 */
export async function submitFeedbackToGoogleForm(feedback: Feedback): Promise<void> {
  const categoryLabel = CATEGORY_LABELS[feedback.category] ?? feedback.category;

  // Build x-www-form-urlencoded payload
  const params = new URLSearchParams({
    [FEEDBACK_CONFIG.FIELD_RATING]:   String(feedback.rating),
    [FEEDBACK_CONFIG.FIELD_CATEGORY]: categoryLabel,
    [FEEDBACK_CONFIG.FIELD_MESSAGE]:  feedback.message,
    // fvv=1 is required by some Google Form versions to register a submission
    fvv: '1',
  });

  const response = await fetch(SUBMISSION_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
    // Abort after 15 s so we don't hang forever on a flaky connection
    signal:  AbortSignal.timeout(15_000),
  });

  // Google Forms returns 200 with an HTML confirmation page on success.
  // Treat any non-2xx as a failure.
  if (!response.ok) {
    throw new Error(
      `Google Form submission failed: HTTP ${response.status} ${response.statusText}`,
    );
  }
}

/**
 * Lightweight connectivity probe using Google's dedicated connectivity check
 * endpoint (returns 204 when online). This is more reliable than probing the
 * form URL directly (which can redirect or reject HEAD requests).
 */
export async function isOnline(): Promise<boolean> {
  try {
    const probe = await fetch('https://connectivitycheck.gstatic.com/generate_204', {
      method: 'HEAD',
      signal: AbortSignal.timeout(4_000),
    });
    // 204 No Content = online. Also accept other 2xx/3xx as online.
    return probe.status < 500;
  } catch {
    return false;
  }
}
