import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Plus, Check, Clock } from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime, getAgeRatingColor, formatProgress } from '../../lib/utils';
import { useReducedMotion, springSnappy, springNatural, railItem } from '../../lib/motion';
import { useHoverPreview } from '../../context/HoverPreviewContext';

interface FilmCardProps {
  film: Film;
  onPlay: (film: Film) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (filmId: string) => void;
  progressSeconds?: number;
  /** When inside a stagger rail, omit individual entrance — rail drives it */
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
  const ageRatingStyle = getAgeRatingColor(film.age_rating);
  const totalSeconds = (film.runtime_minutes || 1) * 60;
  const progressPercent = Math.min(100, Math.round((progressSeconds / totalSeconds) * 100));

  const handleMouseEnter = () => {
    // Only trigger hover popout on desktop fine-pointer devices (not touch screens)
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

  // When in a stagger rail: use named variants driven by parent container.
  // When standalone (search grid): use own entrance animation.
  const itemVariants = inRail ? railItem(reduced) : undefined;
  const standaloneProps = !inRail
    ? {
        initial: reduced ? { opacity: 0 } : { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0, transition: springNatural },
      }
    : {};

  const liftProps = reduced
    ? {}
    : {
        whileHover: { y: -6, transition: springNatural },
        whileFocus: { y: -6, transition: springNatural },
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
      {/* Poster Container */}
      <div
        onClick={() => onPlay(film)}
        className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-lg poster-glow"
      >
        <motion.img
          src={film.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop'}
          alt={film.title}
          loading="lazy"
          className="w-full h-full object-cover"
          whileHover={reduced ? {} : { scale: 1.05, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }}
        />

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5">
          {/* Top Row: Watchlist button */}
          <div className="flex items-center justify-between">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${ageRatingStyle.bg} ${ageRatingStyle.text} ${ageRatingStyle.border}`}>
              {film.age_rating}
            </span>

            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(film.id);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
                isInWatchlist
                  ? 'bg-amber-500 text-black'
                  : 'bg-black/60 text-white hover:bg-black/80'
              }`}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              whileTap={reduced ? {} : { scale: 0.88, transition: springSnappy }}
            >
              {isInWatchlist ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Plus className="h-3.5 w-3.5 stroke-[2.5]" />}
            </motion.button>
          </div>

          {/* Center: Play Icon */}
          <div className="self-center">
            <motion.div
              className="h-11 w-11 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/40"
              whileHover={reduced ? {} : { scale: 1.12, transition: springSnappy }}
              whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
              onClick={() => onPlay(film)}
            >
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </motion.div>
          </div>

          {/* Bottom Hover Info */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-300">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-zinc-400" />
                {formatRuntime(film.runtime_minutes)}
              </span>
              <span>{film.release_year}</span>
            </div>

            {film.film_genres && film.film_genres.length > 0 && (
              <p className="text-[10px] text-amber-400/90 font-medium truncate">
                {film.film_genres.map((fg) => fg.genres?.name).filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
        </div>

        {/* Continue Watching Progress Bar */}
        {progressSeconds > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 z-20">
            <motion.div
              className="h-full bg-amber-500 origin-left"
              animate={{ scaleX: progressPercent / 100 }}
              transition={reduced ? { duration: 0.01 } : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            />
          </div>
        )}

        {/* Debut Ribbon */}
        {film.is_debut && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-amber-500 text-black rounded-md shadow-md">
              Debut
            </span>
          </div>
        )}
      </div>

      {/* Card Details below poster */}
      <div className="mt-2.5 px-0.5">
        <h3
          onClick={() => onPlay(film)}
          className="text-sm font-semibold text-white truncate group-hover:text-amber-400 group-focus:text-amber-400 transition-colors"
          title={film.title}
        >
          {film.title}
        </h3>
        <p className="text-xs text-zinc-400 truncate mt-0.5">
          {film.profiles?.display_name || 'Independent Filmmaker'}
        </p>

        {progressSeconds > 0 && (
          <p className="text-[11px] text-amber-500/80 font-medium mt-0.5">
            Resume at {formatProgress(progressSeconds)}
          </p>
        )}
      </div>
    </motion.div>
  );
};
