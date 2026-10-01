import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Plus,
  Check,
  Info,
  ChevronLeft,
  ChevronRight,
  Film as FilmIcon,
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
}

export const HeroBillboard: React.FC<HeroBillboardProps> = ({
  film: singleFilm,
  films = [],
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
  onSelectGenre,
  onMoreInfo,
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
      className="relative w-full h-[82vh] min-h-[580px] max-h-[860px] overflow-hidden bg-canvas select-none border-b border-hairline"
    >
      {/* Background Media — Still Poster Art ONLY, Zero Autoplay Video */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFilm.id}
          className="absolute inset-0 z-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
        >
          {/* Still Backdrop Poster with Cinema Fidelity Lighting */}
          <img
            src={
              currentFilm.poster_url ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop'
            }
            alt={currentFilm.title}
            className="w-full h-full object-cover object-center filter brightness-[0.85] transition-opacity duration-500 opacity-100"
          />

          {/* Letterbox Mask & Layering (Canvas to Transparent Gradients) */}
          <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/80 via-45% to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 via-30% to-transparent z-[1]" />

          {/* Film Grain Texture Overlay */}
          <div className="absolute inset-0 film-grain pointer-events-none z-[2]" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content Container — Asymmetric Editorial Layout */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 md:pb-20 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFilm.id}
            className="max-w-2xl lg:max-w-3xl space-y-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
          >
            {/* Curatorial Header Stamp */}
            <div className="flex items-center gap-3">
              <div className="h-3.5 w-1 bg-signature" />
              <span className="font-mono text-[10px] tracking-[0.24em] text-muted uppercase">
                {currentFilm.is_debut ? 'Director Debut Spotlight' : 'Official Festival Selection'}
              </span>

              {currentFilm.profiles?.display_name && (
                <>
                  <span className="text-hairline">|</span>
                  <span className="font-editorial italic text-xs sm:text-sm text-ivory/80">
                    Directed by <strong className="text-ivory font-medium not-italic">{currentFilm.profiles.display_name}</strong>
                  </span>
                </>
              )}
            </div>

            {/* Editorial Serif Film Title */}
            <h1
              onClick={() => setShowFormatModal(true)}
              className="font-editorial text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-ivory leading-[1.05] tracking-tight cursor-pointer hover:text-signature transition-colors"
            >
              {currentFilm.title}
            </h1>

            {/* Architectural Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted tracking-wider">
              <span className="px-2 py-0.5 rounded-sm bg-graphite border border-hairline text-ivory">
                2.39:1 ANAMORPHIC
              </span>

              <span className="px-2 py-0.5 rounded-sm bg-graphite border border-hairline text-signature">
                {currentFilm.age_rating}
              </span>

              <span className="px-2 py-0.5 rounded-sm bg-graphite border border-hairline text-muted">
                {formatRuntime(currentFilm.runtime_minutes)}
              </span>

              <span className="px-2 py-0.5 rounded-sm bg-graphite border border-hairline text-muted">
                {currentFilm.release_year}
              </span>

              {currentFilm.language && (
                <span className="px-2 py-0.5 rounded-sm bg-graphite border border-hairline text-muted uppercase">
                  {currentFilm.language}
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
                      className="px-2 py-0.5 rounded-sm border border-hairline hover:border-signature text-muted hover:text-ivory transition-colors"
                    >
                      {fg.genres?.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Synopsis */}
            <p className="font-sans text-xs sm:text-sm text-ivory/80 max-w-xl leading-[1.6] line-clamp-3">
              {currentFilm.synopsis}
            </p>

            {/* Action Buttons: Explicit 2 Options (Movie & Trailer) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Option 1: Watch Movie (Primary) */}
              <button
                onClick={() => onPlay(currentFilm, 'movie')}
                className="px-5 py-2.5 rounded-sm bg-signature text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#f79612] transition-colors flex items-center gap-2 shadow-md"
                title="Watch Full Feature Movie"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Watch Movie</span>
              </button>

              {/* Option 2: Watch Trailer (Secondary) */}
              <button
                onClick={() => onPlay(currentFilm, 'trailer')}
                className="px-4.5 py-2.5 rounded-sm bg-graphite/70 hover:bg-graphite text-ivory border border-hairline hover:border-ivory font-medium text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
                title="Watch Official Trailer"
              >
                <FilmIcon className="h-4 w-4 text-signature" />
                <span>Watch Trailer</span>
              </button>

              {/* Add to Queue */}
              <button
                onClick={() => onToggleWatchlist(currentFilm.id)}
                className="px-4 py-2.5 rounded-sm border border-hairline hover:border-ivory text-ivory text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 bg-graphite/40 hover:bg-graphite/70 transition-colors"
              >
                {inList ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-signature" />
                    <span>In Queue</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Queue</span>
                  </>
                )}
              </button>

              {/* Curatorial Notes */}
              {onMoreInfo && (
                <button
                  onClick={() => onMoreInfo(currentFilm)}
                  className="px-3.5 py-2.5 rounded-sm text-muted hover:text-ivory text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-graphite/40 transition-colors"
                  title="Curatorial Notes & Credits"
                >
                  <Info className="h-3.5 w-3.5" />
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-sm bg-black/60 hover:bg-black text-ivory border border-hairline flex items-center justify-center transition-colors focus:outline-none"
            title="Previous Featured Film"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-sm bg-black/60 hover:bg-black text-ivory border border-hairline flex items-center justify-center transition-colors focus:outline-none"
            title="Next Featured Film"
            aria-label="Next Slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Slide Index Counter */}
      {activeFilms.length > 1 && (
        <div className="absolute bottom-6 right-6 z-20 px-3 py-1 rounded-sm bg-black/60 border border-hairline font-mono text-[10px] text-muted tracking-widest uppercase">
          <span className="text-ivory font-bold">{String(currentIndex + 1).padStart(2, '0')}</span>
          <span className="mx-1 text-hairline">/</span>
          <span>{String(activeFilms.length).padStart(2, '0')}</span>
        </div>
      )}

      {/* Option Selection Dialog: Shown when user clicks title or general format selector */}
      {showFormatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div
            className="rounded-sm border border-hairline p-6 max-w-md w-full shadow-2xl space-y-5 text-ivory"
            style={{ backgroundColor: '#141417' }}
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-signature block">
                  Select Playback Option
                </span>
                <h3 className="font-editorial text-2xl font-normal text-ivory mt-0.5">
                  {currentFilm.title}
                </h3>
              </div>
              <button
                onClick={() => setShowFormatModal(false)}
                className="text-muted hover:text-ivory text-sm px-2 py-1 rounded-sm border border-hairline hover:bg-canvas"
              >
                ✕
              </button>
            </div>

            <p className="font-sans text-xs text-muted leading-relaxed">
              Choose your screening format below. Video playback will not start until an option is selected:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option: Trailer */}
              <button
                onClick={() => {
                  setShowFormatModal(false);
                  onPlay(currentFilm, 'trailer');
                }}
                className="p-4 rounded-sm border border-hairline hover:border-signature bg-graphite/60 hover:bg-graphite flex flex-col items-center text-center gap-2.5 group transition-colors"
              >
                <div className="h-10 w-10 rounded-sm bg-black/60 border border-hairline flex items-center justify-center text-ivory group-hover:text-signature group-hover:border-signature transition-colors">
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
                className="p-4 rounded-sm border border-signature bg-signature text-black hover:bg-[#f79612] flex flex-col items-center text-center gap-2.5 transition-colors shadow-md"
              >
                <div className="h-10 w-10 rounded-sm bg-black/20 flex items-center justify-center text-black">
                  <Play className="h-5 w-5 fill-current" />
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
        </div>
      )}
    </div>
  );
};
