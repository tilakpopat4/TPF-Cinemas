import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRuntime(minutes: number): string {
  if (!minutes) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (hrs > 0) {
    return `${hrs}h`;
  }
  return `${mins}m`;
}

export function formatProgress(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  return (match && match[2].length === 11) ? match[2] : trimmed;
}

/**
 * Parses a creator-declared aspect ratio ("16:9", "2.39:1", "4/3", "1.85") into a
 * numeric width/height value. Falls back to 16:9 for missing or invalid input.
 */
export function parseAspectRatio(value?: string | null): number {
  const fallback = 16 / 9;
  if (!value) return fallback;
  const parts = value.trim().split(/[:/xX]/).map((p) => parseFloat(p));
  let ratio = NaN;
  if (parts.length === 1) ratio = parts[0];
  else if (parts.length === 2 && parts[1] > 0) ratio = parts[0] / parts[1];
  if (!isFinite(ratio) || ratio < 0.2 || ratio > 5) return fallback;
  return ratio;
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

export function getAgeRatingColor(rating: string): { bg: string; text: string; border: string } {
  switch (rating) {
    case 'U':
      return { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'UA7+':
      return { bg: 'bg-cyan-950/60', text: 'text-cyan-400', border: 'border-cyan-500/30' };
    case 'UA13+':
      return { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'UA16+':
      return { bg: 'bg-orange-950/60', text: 'text-orange-400', border: 'border-orange-500/30' };
    case 'A':
      return { bg: 'bg-red-950/60', text: 'text-red-400', border: 'border-red-500/30' };
    default:
      return { bg: 'bg-zinc-900/60', text: 'text-zinc-400', border: 'border-zinc-700' };
  }
}
