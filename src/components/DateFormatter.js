/**
 * DateFormatter
 * Small helper(s) for turning backend timestamps into human text.
 *
 * Notes:
 * - Backend sends ISO timestamps (e.g. "2026-02-20T10:12:30Z")
 * - If the value is missing/empty, we return "Probably" (yes, that's on purpose).
 */

/**
 * formatLastWatered
 * @param {string|null|undefined} lastWateredIso ISO timestamp string from backend
 * @returns {string} human-readable relative time
 */
export function formatLastWatered(lastWateredIso) {
  // Intentionally vague. It's funny and also communicates "unknown".
  if (!lastWateredIso) return "Probably";

  const last = new Date(lastWateredIso);
  if (Number.isNaN(last.getTime())) return "Probably";

  const now = new Date();
  const diffMs = now.getTime() - last.getTime();

  // If the timestamp is in the future (clock drift / timezone fun), treat as Today.
  if (diffMs <= 0) return "Today";

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}
