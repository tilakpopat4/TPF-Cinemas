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
  inRail = false,
  rankIndex,
  onDismiss,
}) => {
  const totalSeconds = (film.runtime_minutes || 1) * 60;
  const progressPercent = Math.min(100, Math.round((progressSeconds / totalSeconds) * 100));
  const remainingMinutes = Math.max(1, Math.ceil((totalSeconds - progressSeconds) / 60));

  return (
    <div
      className={`group relative cursor-pointer select-none outline-none transition-all duration-200 ${
        inRail ? 'flex-none w-48 sm:w-56 md:w-60' : 'w-full'
      } ${rankIndex !== undefined ? 'ml-6 sm:ml-9 md:ml-11' : ''}`}
      tabIndex={0}
      title={film.title}
    >
      {/* Anchored Top 10 Giant Stylized Numeral (Netflix Style) */}
      {rankIndex !== undefined && (
        <div className="absolute -left-6 sm:-left-9 md:-left-11 bottom-1 sm:bottom-2 z-0 pointer-events-none select-none">
          <span
            className="font-display font-black text-7xl sm:text-8xl md:text-9xl tracking-tighter leading-none select-none text-[#232733] group-hover:text-[#3a4155] transition-all duration-300"
            style={{
              textShadow: '0 4px 20px rgba(0,0,0,0.95)',
            }}
          >
            {rankIndex}
          </span>
        </div>
      )}

      {/* Poster Container: Seamless rounded artwork without borders, smooth depth shadow */}
      <div
        onClick={() => onPlay(film)}
        className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#12141a] transition-all duration-300 group-hover:-translate-y-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.6)] group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.85)] z-10"
      >
        <img
          src={film.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop'}
          alt={film.title}
          loading="lazy"
          className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300 group-hover:scale-105"
        />



        {/* Hover Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5">
          {/* Top Row: Rating Badge & Action Buttons */}
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-black/70 text-ivory rounded-md">
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
                  className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-muted hover:text-white transition-colors"
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
                className={`p-1.5 rounded-lg transition-all ${
                  isInWatchlist
                    ? 'bg-signature text-black shadow-sm'
                    : 'bg-black/70 text-ivory hover:bg-black'
                }`}
                title={isInWatchlist ? 'Remove from Queue' : 'Add to Queue'}
              >
                {isInWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Center: Play Trigger (Clean Minimalist Cinema Disc — No Glow) */}
          <div className="self-center">
            <div
              className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.7)] hover:bg-white/95 transition-all duration-200 group-hover:scale-110 active:scale-95 cursor-pointer"
              onClick={() => onPlay(film)}
            >
              <Play className="h-5 w-5 fill-black text-black ml-0.5" />
            </div>
          </div>

          {/* Bottom Info: Runtime & Release */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted" />
                {progressSeconds > 0 ? `${remainingMinutes}m left` : formatRuntime(film.runtime_minutes)}
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

        {/* Continue Watching Progress Bar (Clean Solid Accent) */}
        {progressSeconds > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/80 z-20">
            <div
              className="h-full bg-signature"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
