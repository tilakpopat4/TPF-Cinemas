import React, { useRef } from 'react';
import { Play, Plus, Check, Clock, X } from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime } from '../../lib/utils';
import { useHoverPreview } from '../../context/HoverPreviewContext';

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
  const cardRef = useRef<HTMLDivElement>(null);
  const { activeFilm, isOpen, triggerEnter, triggerLeave } = useHoverPreview();
  const isHoveredInPortal = isOpen && activeFilm?.id === film.id;
  const totalSeconds = (film.runtime_minutes || 1) * 60;
  const progressPercent = Math.min(100, Math.round((progressSeconds / totalSeconds) * 100));
  const remainingMinutes = Math.max(1, Math.ceil((totalSeconds - progressSeconds) / 60));

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        triggerEnter(film, rect);
      }
    }
  };

  const handleMouseLeave = () => {
    triggerLeave();
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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

      {/* Poster Container: Sharp 2px corners, graphite backing, hairline border */}
      <div
        onClick={() => onPlay(film)}
        className={`relative aspect-[2/3] w-full rounded-sm overflow-hidden bg-graphite border border-hairline group-hover:border-signature/50 transition-colors shadow-lg z-10 ${
          isHoveredInPortal ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:-translate-y-1'
        }`}
      >
        <img
          src={film.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop'}
          alt={film.title}
          loading="lazy"
          className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300"
        />

        {/* Minimalist Top Stamp / Debut Ribbon */}
        {film.is_debut && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest bg-signature text-black rounded-none">
              Debut
            </span>
          </div>
        )}

        {/* Hover Quick Actions Overlay */}
        <div className="absolute inset-0 bg-canvas/80 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
          {/* Top Row: Rating Badge & Action Buttons */}
          <div className="flex items-center justify-between">
            <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-graphite border border-hairline text-ivory">
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
                  className="p-1.5 rounded-sm bg-graphite/90 hover:bg-black text-muted hover:text-white border border-hairline transition-colors"
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
                className={`p-1.5 rounded-sm border transition-colors ${
                  isInWatchlist
                    ? 'bg-signature text-black border-signature'
                    : 'bg-graphite text-ivory border-hairline hover:border-ivory'
                }`}
                title={isInWatchlist ? 'Remove from Queue' : 'Add to Queue'}
              >
                {isInWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Center: Play Trigger */}
          <div className="self-center">
            <div
              className="h-10 w-10 bg-signature text-black flex items-center justify-center rounded-sm transition-transform group-hover:scale-105"
              onClick={() => onPlay(film)}
            >
              <Play className="h-4 w-4 fill-current ml-0.5" />
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
              className="h-full bg-signature shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Typography below poster */}
      <div className={`mt-2.5 px-0.5 z-10 relative ${isHoveredInPortal ? 'opacity-0' : 'opacity-100'}`}>
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
