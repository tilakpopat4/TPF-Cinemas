import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Plus,
  Check,
  Info,
  ChevronLeft,
  ChevronRight,
  Film as FilmIcon,
  X,
} from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime } from '../../lib/utils';

export interface HeroBillboardProps {
  film?: Film | null;
  films?: Film[];
  onPlay: (film: Film, mode?: 'movie' | 'trailer') => void;
  isInWatchlist: boolean | ((filmId: string) => boolean);
  onToggleWatchlist: (filmId: string) => void;
  onSelectGenre?: (genreSlug: string) => void;
  onMoreInfo?: (film: Film) => void;
  customTagline?: string;
}

/**
 * Helper to truncate billboard synopsis to concise 2-3 lines max (~190 chars)
 */
function truncateBillboardSynopsis(text: string, maxLength = 190): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 100 ? sliced.slice(0, lastSpace) : sliced).trim() + '…';
}

export const HeroBillboard: React.FC<HeroBillboardProps> = ({
  film: singleFilm,
  films = [],
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
  onSelectGenre,
  onMoreInfo,
  customTagline,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const activeFilms = films.length > 0 ? films : singleFilm ? [singleFilm] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);

  // Guarantee we always have a current film
  const currentFilm = activeFilms[currentIndex] || activeFilms[0] || null;

  // Rotate carousel every 10 seconds if not hovered
  useEffect(() => {
    if (activeFilms.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeFilms.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [activeFilms.length, isPaused]);

  if (!currentFilm) return null;

  const inList =
    typeof isInWatchlist === 'function'
      ? isInWatchlist(currentFilm.id)
      : !!isInWatchlist;

  const handleNextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeFilms.length);
  };

  const handlePrevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + activeFilms.length) % activeFilms.length);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full aspect-video overflow-hidden bg-canvas select-none"
    >
      {/* Background Media — Still Poster Art ONLY, Zero Autoplay Video */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFilm.id}
          className="absolute inset-0 z-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } }}
        >
          {/* Exact 16:9 artwork: the container is aspect-video, so the image fills it edge to edge with no crop */}
          <img
            src={
              (currentFilm.backdrop_url || currentFilm.poster_url) ||
              'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop'
            }
            alt={currentFilm.title}
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 opacity-100"
          />

          {/* Subtle Vignettes ONLY: Soft bottom feathering into content rails, soft top feathering for navbar */}
          {/* Note: Heavy left gradient is completely removed so poster's embedded typography remains vibrant and readable */}
          <div className="absolute inset-x-0 bottom-0 h-36 sm:h-52 bg-gradient-to-t from-canvas via-canvas/60 via-40% to-transparent pointer-events-none z-[1]" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-canvas/80 via-canvas/20 to-transparent pointer-events-none z-[1]" />

          {/* Film Grain Texture Overlay */}
          <div className="absolute inset-0 film-grain pointer-events-none z-[2] opacity-35" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content Container — Asymmetric Editorial Layout */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-3 sm:pb-8 md:pb-12 pt-14 sm:pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFilm.id}
            className="max-w-2xl lg:max-w-3xl space-y-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1], staggerChildren: 0.1 } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] } }}
          >
            {/* Curatorial Header Stamp with frosted pill */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-black/40 backdrop-blur-md shadow-md">
                <span className="font-mono text-[10px] tracking-[0.2em] text-ivory/90 uppercase font-semibold">
                  {customTagline || (currentFilm.is_debut ? 'Director Debut Spotlight' : 'Official Festival Selection')}
                </span>
              </div>

              {currentFilm.profiles?.display_name && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md shadow-md text-[11px] text-ivory/90 font-editorial italic">
                  <span>Directed by</span>
                  <strong className="text-white font-medium not-italic">{currentFilm.profiles.display_name}</strong>
                </div>
              )}
            </div>

            {/* Architectural Metadata Badges */}
            <div className="hidden sm:flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-muted tracking-wider">
              {currentFilm.aspect_ratio && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.08] backdrop-blur-sm text-ivory">
                  {currentFilm.aspect_ratio}
                </span>
              )}

              {currentFilm.age_rating && (
                <span className="px-2 py-0.5 rounded-md bg-signature/15 backdrop-blur-sm text-signature font-semibold">
                  {currentFilm.age_rating}
                </span>
              )}

              {currentFilm.runtime_minutes && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.08] backdrop-blur-sm text-ivory/80">
                  {formatRuntime(currentFilm.runtime_minutes)}
                </span>
              )}

              {currentFilm.release_year && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.08] backdrop-blur-sm text-ivory/80">
                  {currentFilm.release_year}
                </span>
              )}

              {currentFilm.language && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.08] backdrop-blur-sm text-ivory/80 uppercase">
                  {[currentFilm.language, ...(currentFilm.extra_languages || [])]
                    .filter((l, i, arr) => l && arr.indexOf(l) === i)
                    .join(' · ')}
                </span>
              )}

              {/* Genre links */}
              {currentFilm.film_genres && currentFilm.film_genres.length > 0 && (
                <div className="flex items-center gap-1.5 ml-1">
                  {currentFilm.film_genres.slice(0, 2).map((fg) => (
                    <button
                      key={fg.genre_id}
                      type="button"
                      onClick={() => onSelectGenre?.(fg.genres?.slug || '')}
                      className="px-2.5 py-0.5 rounded-md bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-sm text-ivory/80 hover:text-white transition-colors"
                    >
                      {fg.genres?.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Synopsis: concise 2-3 lines max for cinematic billboard appearance */}
            {currentFilm.synopsis && currentFilm.synopsis.trim().length > 3 && (
              <p
                className="hidden md:block font-sans text-xs sm:text-sm text-ivory/85 max-w-xl leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {truncateBillboardSynopsis(currentFilm.synopsis, 190)}
              </p>
            )}

            {/* Action Buttons: Seamless Cinema UI with Soft Frosted Finishes */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Option 1: Watch Movie (Primary) */}
              <button
                onClick={() => onPlay(currentFilm, 'movie')}
                className="px-6 py-3 rounded-xl bg-signature hover:bg-signature-hover text-black font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                title="Watch Full Feature Movie"
              >
                <Play className="h-4 w-4 fill-current ml-0.5 shrink-0" />
                <span>Watch Movie</span>
              </button>

              {/* Option 2: Watch Trailer (Secondary) — only when the creator supplied a trailer link */}
              {currentFilm.trailer_ref?.trim() && (
                <button
                  onClick={() => onPlay(currentFilm, 'trailer')}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-ivory hover:text-white font-medium text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shadow-md"
                  title="Watch Official Trailer"
                >
                  <FilmIcon className="h-4 w-4 text-signature shrink-0" />
                  <span>Watch Trailer</span>
                </button>
              )}

              {/* Add to Queue / In Queue with Soft Frosted Styling */}
              <button
                onClick={() => onToggleWatchlist(currentFilm.id)}
                className={`px-5 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center gap-2 transition-all duration-200 backdrop-blur-md active:scale-95 whitespace-nowrap shadow-md ${
                  inList
                    ? 'bg-signature/20 text-signature hover:bg-signature/30'
                    : 'bg-white/10 hover:bg-white/15 text-ivory hover:text-white'
                }`}
                title={inList ? 'Remove from Queue' : 'Add to Queue'}
              >
                {inList ? (
                  <>
                    <Check className="h-4 w-4 text-signature shrink-0" />
                    <span>In Queue</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>Add to Queue</span>
                  </>
                )}
              </button>

              {/* Curatorial Notes */}
              {onMoreInfo && (
                <button
                  onClick={() => onMoreInfo(currentFilm)}
                  className="px-4 py-3 rounded-xl text-ivory/80 hover:text-ivory text-xs uppercase tracking-wider flex items-center gap-2 bg-white/10 hover:bg-white/15 transition-all duration-200 backdrop-blur-md active:scale-95 whitespace-nowrap shadow-md"
                  title="Curatorial Notes & Credits"
                >
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono text-[10px]">Notes</span>
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Carousel Navigation Arrows */}
      {activeFilms.length > 1 && (
        <>
          <button
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/60 hover:bg-black text-ivory flex items-center justify-center transition-colors focus:outline-none backdrop-blur-sm"
            title="Previous Featured Film"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/60 hover:bg-black text-ivory flex items-center justify-center transition-colors focus:outline-none backdrop-blur-sm"
            title="Next Featured Film"
            aria-label="Next Slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Slide Index Counter */}
      {activeFilms.length > 1 && (
        <div className="absolute bottom-6 right-6 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm font-mono text-[10px] text-muted tracking-widest uppercase">
          <span className="text-ivory font-bold">{String(currentIndex + 1).padStart(2, '0')}</span>
          <span className="mx-1 text-white/20">/</span>
          <span>{String(activeFilms.length).padStart(2, '0')}</span>
        </div>
      )}

      {/* Option Selection Dialog: Shown when user clicks title or general format selector */}
      {showFormatModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setShowFormatModal(false)}
          >
            <div
              className="relative w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#0A0A0B] p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.95)] text-ivory space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-signature font-semibold">
                    Select Screening Mode
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl font-medium tracking-tight text-ivory mt-0.5">
                    {currentFilm.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowFormatModal(false)}
                  className="text-muted hover:text-ivory h-8 w-8 rounded-lg border border-white/10 hover:bg-white/[0.06] flex items-center justify-center transition-colors shrink-0"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="font-sans text-xs sm:text-sm text-ivory/80 leading-relaxed font-normal">
                Choose your screening format below. Playback is optimized for lossless cinema fidelity:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Option: Trailer */}
                <button
                  onClick={() => {
                    setShowFormatModal(false);
                    onPlay(currentFilm, 'trailer');
                  }}
                  className="p-4 rounded-xl border border-white/[0.10] hover:border-signature/60 bg-white/[0.03] hover:bg-white/[0.08] flex flex-col items-center text-center gap-2.5 group transition-all duration-200"
                >
                  <div className="h-11 w-11 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-ivory group-hover:text-signature group-hover:border-signature/50 transition-colors">
                    <FilmIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs uppercase tracking-wider text-ivory block">
                      Watch Trailer
                    </span>
                    <span className="font-mono text-[10px] text-muted block mt-0.5">
                      Official Teaser
                    </span>
                  </div>
                </button>

                {/* Option: Movie */}
                <button
                  onClick={() => {
                    setShowFormatModal(false);
                    onPlay(currentFilm, 'movie');
                  }}
                  className="p-4 rounded-xl border border-signature bg-signature hover:bg-signature-hover text-black flex flex-col items-center text-center gap-2.5 transition-all duration-200 shadow-[0_4px_20px_rgba(229,169,59,0.3)] hover:scale-[1.02]"
                >
                  <div className="h-11 w-11 rounded-lg bg-black/20 flex items-center justify-center text-black">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider block">
                      Watch Movie
                    </span>
                    <span className="font-mono text-[10px] text-black/80 block mt-0.5">
                      {formatRuntime(currentFilm.runtime_minutes)}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
