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
