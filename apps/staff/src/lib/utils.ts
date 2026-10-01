/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(urlOrId: string | null): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Handle youtube.com/watch?v=ID or embed/ID
  const fullMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (fullMatch) return fullMatch[1];

  return null;
}

/**
 * Format minutes into readable "1h 45m" or "45m"
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes) return '–';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format date string into human-readable format
 */
export function formatDate(isoString: string | null): string {
  if (!isoString) return '–';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}
