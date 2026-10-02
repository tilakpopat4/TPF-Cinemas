import React from 'react';
import { Play, Plus, Check, Clock, X } from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime } from '../../lib/utils';

interface FilmCardProps {
  film: Film;
  onPlay: (film: Film) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (filmId: string) => void;
  progressSeconds?: number;
  inRail?: boolean;
  rankIndex?: number;
  onDismiss?: (filmId: string) => void;
  resumeMode?: boolean;
}

export const FilmCard: React.FC<FilmCardProps> = ({
  film,
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
  progressSeconds = 0,
  rankIndex,
  onDismiss,
}) => {
  const totalSeconds = (film.runtime_minutes || 1) * 60;
  const progressPercent = Math.min(100, Math.round((progressSeconds / totalSeconds) * 100));
  const remainingMinutes = Math.max(1, Math.ceil((totalSeconds - progressSeconds) / 60));

  return (
    <div
      className={`group relative flex-none w-48 sm:w-56 md:w-60 cursor-pointer select-none outline-none transition-all duration-200 ${
        rankIndex !== undefined ? 'ml-6 sm:ml-9 md:ml-11' : ''
      }`}
      tabIndex={0}
    >
      {/* Anchored Top 10 Giant Stylized Outline Numeral (Netflix Style) */}
      {rankIndex !== undefined && (
        <div className="absolute -left-6 sm:-left-9 md:-left-11 bottom-6 sm:bottom-8 z-0 pointer-events-none select-none">
          <span
            className="font-display font-black text-7xl sm:text-8xl md:text-9xl tracking-tighter leading-none select-none text-canvas/90 transition-all duration-300 group-hover:drop-shadow-[0_0_18px_rgba(245,158,11,0.5)]"
            style={{
              WebkitTextStroke: '2.5px rgba(255, 255, 255, 0.75)',
              textShadow: '0 4px 16px rgba(0,0,0,0.95)',
            }}
          >
            {rankIndex}
          </span>
        </div>
      )}

      {/* Poster Container: Refined rounded-xl, graphite backing, luxury border & shadow */}
      <div
        onClick={() => onPlay(film)}
        className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#12141a] border border-white/[0.08] group-hover:border-signature/50 transition-all duration-300 group-hover:-translate-y-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.6)] group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.85)] z-10"
      >
        <img
          src={film.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop'}
          alt={film.title}
          loading="lazy"
          className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300 group-hover:scale-105"
        />

        {/* Minimalist Top Stamp / Debut Ribbon */}
        {film.is_debut && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest bg-signature text-black rounded-md shadow-sm">
              Debut
            </span>
          </div>
        )}

        {/* Hover Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5">
          {/* Top Row: Rating Badge & Action Buttons */}
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-black/60 border border-white/10 text-ivory rounded-md">
              {film.age_rating}
            </span>

            <div className="flex items-center gap-1.5">
              {/* Dismiss button for Continue Watching */}
              {onDismiss && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(film.id);
                  }}
                  className="p-1.5 rounded-lg bg-black/60 hover:bg-black text-muted hover:text-white border border-white/10 transition-colors"
                  title="Remove from Continue Watching"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Watchlist Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatchlist(film.id);
                }}
                className={`p-1.5 rounded-lg border transition-all ${
                  isInWatchlist
                    ? 'bg-signature text-black border-signature shadow-[0_0_12px_rgba(229,169,59,0.35)]'
                    : 'bg-black/60 text-ivory border-white/15 hover:border-white/40'
                }`}
                title={isInWatchlist ? 'Remove from Queue' : 'Add to Queue'}
              >
                {isInWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Center: Play Trigger (Circular Luxury Gold Accent) */}
          <div className="self-center">
            <div
              className="h-12 w-12 bg-signature text-black flex items-center justify-center rounded-full shadow-[0_4px_20px_rgba(229,169,59,0.45)] transition-transform duration-200 group-hover:scale-110 active:scale-95 cursor-pointer"
              onClick={() => onPlay(film)}
            >
              <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
            </div>
          </div>

          {/* Bottom Info: Runtime & Release */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted" />
                {formatRuntime(film.runtime_minutes)}
              </span>
              <span>{film.release_year}</span>
            </div>

            {film.film_genres && film.film_genres.length > 0 && (
              <p className="text-[10px] text-ivory/80 font-editorial italic truncate">
                {film.film_genres.map((fg) => fg.genres?.name).filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
        </div>

        {/* Continue Watching Progress Bar (Glowing Amber Signature Accent) */}
        {progressSeconds > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/80 z-20">
            <div
              className="h-full bg-signature shadow-[0_0_8px_rgba(229,169,59,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Typography below poster */}
      <div className="mt-2.5 px-0.5 z-10 relative">
        <h3
          onClick={() => onPlay(film)}
          className="font-editorial text-base sm:text-lg font-semibold text-ivory truncate group-hover:text-signature transition-colors leading-tight"
          title={film.title}
        >
          {film.title}
        </h3>
        <p className="text-xs text-muted truncate mt-0.5 font-sans">
          {film.profiles?.display_name || 'Independent Filmmaker'}
        </p>

        {progressSeconds > 0 && (
          <p className="font-mono text-[10px] text-signature mt-0.5 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-signature animate-pulse inline-block" />
            Resume • {remainingMinutes}m left
          </p>
        )}
      </div>
    </div>
  );
};
