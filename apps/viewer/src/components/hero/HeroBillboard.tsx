import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import {
  Play,
  Plus,
  Check,
  Sparkles,
  Clock,
  Volume2,
  VolumeX,
  Info,
  ChevronLeft,
  ChevronRight,
  Tv,
} from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime, getAgeRatingColor, extractYouTubeId } from '../../lib/utils';
import {
  useReducedMotion,
  heroBillboardBadge,
  heroBillboardText,
  fadeSlideUp,
  springSnappy,
  springNatural,
} from '../../lib/motion';

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
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Normalize list of featured films
  const activeFilms = films.length > 0 ? films : singleFilm ? [singleFilm] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Audio and teaser playback state
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const currentFilm = activeFilms[currentIndex] || null;

  // Reset video loading state on slide change
  useEffect(() => {
    setVideoLoaded(false);
    setVideoError(false);
  }, [currentIndex, currentFilm?.id]);

  // Carousel auto-advance timer (9s interval, paused on hover)
  useEffect(() => {
    if (activeFilms.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeFilms.length);
    }, 9000);

    return () => clearInterval(timer);
  }, [activeFilms.length, isPaused]);

  // Scroll-driven parallax
  const { scrollY } = useScroll();
  const posterY = useTransform(scrollY, [0, 600], [0, reduced ? 0 : 80]);
  const textOpacity = useTransform(scrollY, [0, 350], [1, reduced ? 1 : 0.1]);

  if (!currentFilm) return null;

  const videoId = currentFilm.video_ref ? extractYouTubeId(currentFilm.video_ref) : '';
  const ageRatingStyle = getAgeRatingColor(currentFilm.age_rating);
  const badge = heroBillboardBadge(reduced);
  const text = heroBillboardText(reduced);
  const ctas = fadeSlideUp(reduced, true);

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
      className="relative w-full h-[82vh] min-h-[580px] max-h-[880px] overflow-hidden bg-[#08090c] select-none"
    >
      {/* Background Media Layer with AnimatePresence for smooth slide transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFilm.id}
          className="absolute inset-0 z-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, ease: 'easeInOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
        >
          {/* 1. YouTube Teaser Iframe (when videoId exists and not errored) */}
          {videoId && !videoError ? (
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden scale-110">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`}
                title={`${currentFilm.title} Teaser`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                onLoad={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
                className={`w-full h-full object-cover border-none transition-opacity duration-1000 ${
                  videoLoaded ? 'opacity-80' : 'opacity-0'
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

          {/* 2. Poster Backdrop (Always loaded as foundation + Ken Burns fallback) */}
          <motion.img
            src={
              currentFilm.poster_url ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop'
            }
            alt={currentFilm.title}
            className={`w-full h-[115%] object-cover object-center filter brightness-90 transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-30' : 'opacity-100'
            }`}
            style={{ y: posterY }}
            animate={
              reduced
                ? {}
                : {
                    scale: [1, 1.06],
                    transition: {
                      duration: 18,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    },
                  }
            }
          />

          {/* 3. Dual Cinematic Vignette & Deep Gradient Masks */}
          {/* Left-to-right fade for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090c] via-[#08090c]/85 via-45% to-transparent z-[1]" />
          {/* Bottom-to-top gradient merging into #08090c content rails */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-[#08090c]/65 via-35% to-transparent z-[2]" />
          {/* Ambient top amber atmospheric glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent z-[2]" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content Container */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 md:pb-20"
        style={{ opacity: textOpacity }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFilm.id}
            className="max-w-2xl lg:max-w-3xl space-y-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0, transition: { ...springNatural, delay: 0.1 } }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
          >
            {/* Top Spotlight Tag */}
            <motion.div
              className="flex flex-wrap items-center gap-2.5"
              initial={badge.initial}
              animate={badge.animate}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/35 backdrop-blur-md shadow-sm">
                <Sparkles className="h-3.5 w-3.5 fill-current" />
                <span>{currentFilm.is_debut ? 'Director Debut Spotlight' : 'TPF Exclusive Premiere'}</span>
              </span>

              {currentFilm.profiles?.display_name && (
                <span className="text-xs text-zinc-300 font-medium">
                  Directed by <strong className="text-white">{currentFilm.profiles.display_name}</strong>
                </span>
              )}
            </motion.div>

            {/* Cinematic Title */}
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display tracking-tight text-white leading-[1.05] drop-shadow-2xl"
              initial={text.initial}
              animate={text.animate}
            >
              {currentFilm.title}
            </motion.h1>

            {/* Glassmorphic Metadata Badges */}
            <motion.div
              className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-300"
              initial={text.initial}
              animate={{
                ...text.animate,
                transition: { ...(text.animate as any).transition, delay: 0.12 },
              }}
            >
              {/* 4K Ultra HD Badge */}
              <span className="px-2 py-0.5 rounded font-black tracking-widest text-[10px] bg-black/50 border border-white/25 text-white backdrop-blur-md">
                4K ULTRA HD
              </span>

              {/* Age Rating Pill */}
              <span
                className={`px-2 py-0.5 rounded font-bold border backdrop-blur-md text-[11px] ${ageRatingStyle.bg} ${ageRatingStyle.text} ${ageRatingStyle.border}`}
              >
                {currentFilm.age_rating}
              </span>

              {/* Duration */}
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-zinc-200">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                {formatRuntime(currentFilm.runtime_minutes)}
              </span>

              {/* Release Year */}
              <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-zinc-200 font-medium">
                {currentFilm.release_year}
              </span>

              {/* Audio badge */}
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[11px] text-zinc-300">
                <Tv className="h-3 w-3 text-zinc-400" />
                5.1 AUDIO
              </span>

              {/* Interactive Genre Pills */}
              {currentFilm.film_genres && currentFilm.film_genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 ml-1">
                  {currentFilm.film_genres.slice(0, 3).map((fg) => (
                    <button
                      key={fg.genre_id}
                      type="button"
                      onClick={() => onSelectGenre?.(fg.genres?.slug || '')}
                      className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-amber-500/20 border border-white/15 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300 text-[11px] transition-colors cursor-pointer backdrop-blur-md"
                      title={`Filter by ${fg.genres?.name}`}
                    >
                      {fg.genres?.name}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Synopsis */}
            <motion.p
              className="text-sm sm:text-base text-zinc-300/95 line-clamp-3 leading-relaxed drop-shadow max-w-2xl font-normal"
              initial={text.initial}
              animate={{
                ...text.animate,
                transition: { ...(text.animate as any).transition, delay: 0.18 },
              }}
            >
              {currentFilm.synopsis}
            </motion.p>

            {/* Action CTAs & Sound Control Cluster */}
            <motion.div
              className="flex flex-wrap items-center gap-3 pt-3"
              initial={ctas.initial}
              animate={{
                ...ctas.animate,
                transition: { ...(ctas.animate as any).transition, delay: 0.25 },
              }}
            >
              {/* Primary Play Button */}
              <motion.button
                onClick={() => onPlay(currentFilm)}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-xl shadow-amber-500/25 transition-shadow cursor-pointer"
                whileHover={reduced ? {} : { scale: 1.04, transition: springSnappy }}
                whileTap={reduced ? {} : { scale: 0.96, transition: springSnappy }}
              >
                <Play className="h-5 w-5 fill-current" />
                <span>Watch Now</span>
              </motion.button>

              {/* Watchlist Toggle Button */}
              <motion.button
                onClick={() => onToggleWatchlist(currentFilm.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border backdrop-blur-md transition-colors cursor-pointer ${
                  inList
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-zinc-900/70 border-white/20 text-white hover:bg-zinc-800/80 hover:border-white/40'
                }`}
                whileHover={reduced ? {} : { scale: 1.03, transition: springSnappy }}
                whileTap={reduced ? {} : { scale: 0.96, transition: springSnappy }}
              >
                {inList ? (
                  <>
                    <Check className="h-4 w-4 text-amber-400" />
                    <span>In Watchlist</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add to List</span>
                  </>
                )}
              </motion.button>

              {/* Sound Toggle Button (D-02 Decision: placed directly in CTA group) */}
              {videoId ? (
                <motion.button
                  onClick={toggleSound}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm border backdrop-blur-md transition-colors cursor-pointer ${
                    !isMuted
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-zinc-900/60 border-white/15 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                  whileHover={reduced ? {} : { scale: 1.03, transition: springSnappy }}
                  whileTap={reduced ? {} : { scale: 0.96, transition: springSnappy }}
                  title={isMuted ? 'Unmute Teaser Sound' : 'Mute Teaser Sound'}
                >
                  {!isMuted ? (
                    <>
                      <Volume2 className="h-4 w-4 text-amber-400 animate-pulse" />
                      <span className="hidden sm:inline text-xs font-semibold">Sound On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">Muted</span>
                    </>
                  )}
                </motion.button>
              ) : null}

              {/* More Info Button */}
              {onMoreInfo ? (
                <motion.button
                  onClick={() => onMoreInfo(currentFilm)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm border bg-zinc-900/50 border-white/15 text-zinc-300 hover:bg-zinc-800/80 hover:text-white hover:border-white/30 backdrop-blur-md transition-colors cursor-pointer"
                  whileHover={reduced ? {} : { scale: 1.03, transition: springSnappy }}
                  whileTap={reduced ? {} : { scale: 0.96, transition: springSnappy }}
                  title="Film Details & Credits"
                >
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">More Info</span>
                </motion.button>
              ) : null}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Multi-Title Carousel Navigation Controls & Indicators (When multiple films exist) */}
      {activeFilms.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={handlePrevSlide}
            aria-label="Previous Featured Film"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white/70 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleNextSlide}
            aria-label="Next Featured Film"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white/70 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Carousel Slide Indicators on Bottom Right */}
          <div className="absolute right-6 sm:right-10 bottom-8 z-20 flex items-center gap-2 bg-black/50 border border-white/15 px-3 py-1.5 rounded-full backdrop-blur-md">
            {activeFilms.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-6 bg-amber-400'
                    : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
