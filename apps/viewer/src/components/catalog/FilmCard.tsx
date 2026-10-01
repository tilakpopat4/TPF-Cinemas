import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Plus, Check, Clock } from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime, formatProgress } from '../../lib/utils';
import { useReducedMotion, railItem } from '../../lib/motion';
import { useHoverPreview } from '../../context/HoverPreviewContext';

interface FilmCardProps {
  film: Film;
  onPlay: (film: Film) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (filmId: string) => void;
  progressSeconds?: number;
  inRail?: boolean;
}

export const FilmCard: React.FC<FilmCardProps> = ({
  film,
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
  progressSeconds = 0,
  inRail = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { triggerEnter, triggerLeave } = useHoverPreview();
  const reduced = useReducedMotion();
  const totalSeconds = (film.runtime_minutes || 1) * 60;
  const progressPercent = Math.min(100, Math.round((progressSeconds / totalSeconds) * 100));

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

  const itemVariants = inRail ? railItem(reduced) : undefined;
  const standaloneProps = !inRail
    ? {
        initial: reduced ? { opacity: 0 } : { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
      }
    : {};

  const liftProps = reduced
    ? {}
    : {
        whileHover: { y: -2, transition: { duration: 0.15 } },
        whileFocus: { y: -2, transition: { duration: 0.15 } },
      };

  return (
    <motion.div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex-none w-48 sm:w-56 md:w-60 cursor-pointer select-none outline-none"
      tabIndex={0}
      {...(itemVariants ?? {})}
      {...standaloneProps}
      {...liftProps}
    >
      {/* Poster Container: Sharp 2px corners, graphite backing, hairline border */}
      <div
        onClick={() => onPlay(film)}
        className="relative aspect-[2/3] w-full rounded-sm overflow-hidden bg-graphite border border-hairline group-hover:border-signature/50 transition-colors"
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

        {/* Hover Quick Actions Overlay (Minimalist, No AI Blur) */}
        <div className="absolute inset-0 bg-canvas/80 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
          {/* Top Row: Rating Badge & Queue Toggle */}
          <div className="flex items-center justify-between">
            <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-graphite border border-hairline text-ivory">
              {film.age_rating}
            </span>

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

        {/* Continue Watching Progress Bar (Hairline Signature Accent) */}
        {progressSeconds > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/80 z-20">
            <div
              className="h-full bg-signature"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Typography below poster */}
      <div className="mt-2.5 px-0.5">
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
          <p className="font-mono text-[10px] text-signature mt-0.5 uppercase tracking-wider">
            Resume • {formatProgress(progressSeconds)}
          </p>
        )}
      </div>
    </motion.div>
  );
};
