/**
 * Converts a string to a URL-friendly slug matching schema regex `^[a-z0-9]+(-[a-z0-9]+)*$`
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Handle youtube.com/shorts/ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Handle youtube.com/watch?v=ID or embed/ID or v/ID
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
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export interface FilmArtworks {
  portrait: string;
  landscape: string;
}

export function getFilmArtworks(
  filmOrUrl?: { poster_url?: string | null; backdrop_url?: string | null } | string | null
): FilmArtworks {
  const fallbackPortrait = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
  const fallbackLandscape = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop';

  if (!filmOrUrl) {
    return { portrait: fallbackPortrait, landscape: fallbackLandscape };
  }

  let rawPoster: string | null = null;
  let rawBackdrop: string | null = null;

  if (typeof filmOrUrl === 'string') {
    rawPoster = filmOrUrl;
  } else {
    rawPoster = filmOrUrl.poster_url || null;
    rawBackdrop = filmOrUrl.backdrop_url || null;
  }

  let portrait = rawPoster || '';
  let landscape = rawBackdrop || '';

  if (rawPoster && rawPoster.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawPoster);
      if (parsed.portrait) portrait = parsed.portrait;
      if (parsed.landscape) landscape = parsed.landscape;
    } catch {
      // not JSON, keep as is
    }
  }

  if (!portrait && landscape) portrait = landscape;
  if (!landscape && portrait) landscape = portrait;

  return {
    portrait: portrait || fallbackPortrait,
    landscape: landscape || fallbackLandscape,
  };
}
