// Formatter for last watered in popups and details panel

export function formatLastWatered(lastWateredIso) {
  if (!lastWateredIso) return "Probably";

  const last = new Date(lastWateredIso);
  const now = new Date();

  const diffMs = now - last;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}