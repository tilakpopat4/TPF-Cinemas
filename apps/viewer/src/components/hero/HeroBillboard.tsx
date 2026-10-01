import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Plus,
  Check,
  Volume2,
  VolumeX,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime, extractYouTubeId } from '../../lib/utils';

export interface HeroBillboardProps {
  film?: Film | null;
  films?: Film[];
  onPlay: (film: Film) => void;
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeFilms = films.length > 0 ? films : singleFilm ? [singleFilm] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Guarantee we always have a current film
  const currentFilm = activeFilms[currentIndex] || activeFilms[0] || null;

  useEffect(() => {
    setVideoLoaded(false);
    setVideoError(false);
  }, [currentIndex, currentFilm?.id]);

  // Rotate carousel every 10 seconds if not hovered
  useEffect(() => {
    if (activeFilms.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeFilms.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [activeFilms.length, isPaused]);

  if (!currentFilm) return null;

  const videoId = currentFilm.video_ref ? extractYouTubeId(currentFilm.video_ref) : '';
  const inList =
    typeof isInWatchlist === 'function'
      ? isInWatchlist(currentFilm.id)
      : !!isInWatchlist;

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextMuted ? 'mute' : 'unMute',
          args: [],
        }),
        '*'
      );
    }
  };

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
      {/* Background Media with Anamorphic 2.39:1 Cinema Ratio */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFilm.id}
          className="absolute inset-0 z-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
        >
          {/* Teaser Video (Muted Background Stream) */}
          {videoId && !videoError ? (
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`}
                title={`${currentFilm.title} Teaser`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                onLoad={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
                className={`w-full h-full object-cover border-none transition-opacity duration-700 ${
                  videoLoaded ? 'opacity-70' : 'opacity-0'
                }`}
                style={{
                  width: '100vw',
                  height: '56.25vw',
                  minHeight: '100%',
                  minWidth: '177.77vh',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          ) : null}

          {/* Fallback Still Poster */}
          <img
            src={
              currentFilm.poster_url ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop'
            }
            alt={currentFilm.title}
            className={`w-full h-full object-cover object-center filter brightness-[0.8] transition-opacity duration-500 ${
              videoLoaded ? 'opacity-30' : 'opacity-100'
            }`}
          />

          {/* Letterbox Mask & Layering (Graphite to Canvas — No AI Purple/Blue Gradients) */}
          <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/80 via-45% to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 via-30% to-transparent z-[1]" />

          {/* Film Grain Texture Overlay (Authentic 2.8% Noise) */}
          <div className="absolute inset-0 film-grain pointer-events-none z-[2]" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content Container — Asymmetric Editorial Layout, Guaranteed Fully Visible */}
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
            <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-ivory leading-[1.05] tracking-tight">
              {currentFilm.title}
            </h1>

            {/* Architectural Metadata Badges (Sharp 2px corners, no pills) */}
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

            {/* Synopsis with Generous 1.6 Line-Height */}
            <p className="font-sans text-xs sm:text-sm text-ivory/80 max-w-xl leading-[1.6] line-clamp-3">
              {currentFilm.synopsis}
            </p>

            {/* Three Distinct Button Weights: Solid Primary, Outline Secondary, Ghost Tertiary */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Solid Signature Primary */}
              <button
                onClick={() => onPlay(currentFilm)}
                className="btn-primary"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Screen Film</span>
              </button>

              {/* Outline Secondary */}
              <button
                onClick={() => onToggleWatchlist(currentFilm.id)}
                className="btn-secondary"
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

              {/* Sound Toggle Ghost */}
              {videoId ? (
                <button
                  onClick={toggleSound}
                  className="btn-ghost text-xs"
                  title={isMuted ? 'Unmute Teaser' : 'Mute Teaser'}
                >
                  {!isMuted ? (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-signature" />
                      <span className="font-mono text-[10px] tracking-wider uppercase text-signature">Audio On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-3.5 w-3.5" />
                      <span className="font-mono text-[10px] tracking-wider uppercase">Muted</span>
                    </>
                  )}
                </button>
              ) : null}

              {/* More Info */}
              {onMoreInfo ? (
                <button
                  onClick={() => onMoreInfo(currentFilm)}
                  className="btn-ghost text-xs"
                  title="Curatorial Notes & Credits"
                >
                  <Info className="h-3.5 w-3.5" />
                  <span className="font-mono text-[10px] tracking-wider uppercase">Editorial Notes</span>
                </button>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Multi-Title Carousel Controls: Hairline Progress Bars on Bottom-Right */}
      {activeFilms.length > 1 && (
        <>
          {/* Arrow navigation */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex gap-2">
            <button
              onClick={handlePrevSlide}
              aria-label="Previous Featured Film"
              className="p-2.5 rounded-sm bg-graphite/90 hover:bg-graphite text-muted hover:text-ivory border border-hairline transition-colors shadow-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex gap-2">
            <button
              onClick={handleNextSlide}
              aria-label="Next Featured Film"
              className="p-2.5 rounded-sm bg-graphite/90 hover:bg-graphite text-muted hover:text-ivory border border-hairline transition-colors shadow-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Hairline Step Indicators (Minimalist Editorial, No Rounded Pills) */}
          <div className="absolute right-6 sm:right-10 bottom-8 z-20 flex items-center gap-2 bg-graphite/95 border border-hairline px-3 py-2 rounded-sm shadow-xl">
            <span className="font-mono text-[10px] text-muted mr-1">
              0{currentIndex + 1} / 0{activeFilms.length}
            </span>
            {activeFilms.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-0.5 transition-all duration-200 ${
                  index === currentIndex
                    ? 'w-6 bg-signature'
                    : 'w-2.5 bg-ivory/20 hover:bg-ivory/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
