import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Check, ThumbsUp, ChevronDown, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Film } from '../../types';
import { useHoverPreview } from '../../context/HoverPreviewContext';
import { formatRuntime, getAgeRatingColor, extractYouTubeId } from '../../lib/utils';
import { useReducedMotion, springSnappy } from '../../lib/motion';

interface HoverPreviewPortalProps {
  onPlay: (film: Film) => void;
  isInWatchlist: (filmId: string) => boolean;
  onToggleWatchlist: (filmId: string) => void;
  onMoreInfo: (film: Film) => void;
  onSelectGenre?: (genre: string) => void;
}

export const HoverPreviewPortal: React.FC<HoverPreviewPortalProps> = ({
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
  onMoreInfo,
  onSelectGenre,
}) => {
  const reduced = useReducedMotion();
  const { activeFilm, sourceRect, isOpen, portalEnter, portalLeave, closeImmediately } = useHoverPreview();

  const [isMuted, setIsMuted] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [delayedVideoMount, setDelayedVideoMount] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When activeFilm changes, reset video state and delay mounting the video 250ms for smooth popout
  useEffect(() => {
    setIsVideoReady(false);
    setHasVideoError(false);
    setDelayedVideoMount(false);

    if (activeFilm && isOpen) {
      if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
      videoTimerRef.current = setTimeout(() => {
        setDelayedVideoMount(true);
      }, 250);
    }

    return () => {
      if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
    };
  }, [activeFilm, isOpen]);

  // Handle mute/unmute via postMessage to YouTube iframe
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!iframeRef.current?.contentWindow) return;
    const nextMuted = !isMuted;
    const command = nextMuted ? 'mute' : 'unMute';
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: command, args: [] }),
      '*'
    );
    setIsMuted(nextMuted);
  };

  if (!isOpen || !activeFilm || !sourceRect) {
    return null;
  }

  const ageRatingStyle = getAgeRatingColor(activeFilm.age_rating);
  const youtubeId = extractYouTubeId(activeFilm.video_ref);

  // Position calculations with screen edge clamping (HOVER-04)
  const targetWidth = Math.min(360, Math.max(310, sourceRect.width * 1.35));
  const centerX = sourceRect.left + sourceRect.width / 2;
  const clampedX = Math.max(16, Math.min(window.innerWidth - targetWidth - 16, centerX - targetWidth / 2));
  const clampedY = Math.max(76, sourceRect.top - 20);

  const inWatchlist = isInWatchlist(activeFilm.id);

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed z-50 pointer-events-auto select-none"
        style={{
          left: `${clampedX}px`,
          top: `${clampedY}px`,
          width: `${targetWidth}px`,
        }}
        onMouseEnter={portalEnter}
        onMouseLeave={portalLeave}
      >
        <motion.div
          className="rounded-2xl overflow-hidden bg-[#101218] border border-white/15 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-white"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 8 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        >
          {/* 16:9 Media Preview Container */}
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
            {/* Fallback / Background Poster with Ken Burns Zoom */}
            <motion.img
              src={activeFilm.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop'}
              alt={activeFilm.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isVideoReady ? 'opacity-0' : 'opacity-100'
              }`}
              animate={reduced ? {} : { scale: [1, 1.05] }}
              transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
            />

            {/* Embedded Muted YouTube Video Teaser Loop */}
            {youtubeId && delayedVideoMount && !hasVideoError && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden scale-125">
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                  title={`${activeFilm.title} Teaser`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  onLoad={() => setIsVideoReady(true)}
                  onError={() => setHasVideoError(true)}
                  className="w-full h-full border-0 pointer-events-none"
                />
              </div>
            )}

            {/* Subtle Vignette Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101218] via-transparent to-black/30 pointer-events-none" />

            {/* Audio Toggle Button */}
            {youtubeId && isVideoReady && (
              <motion.button
                onClick={toggleMute}
                className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
                whileTap={reduced ? {} : { scale: 0.88, transition: springSnappy }}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5 text-zinc-300" /> : <Volume2 className="h-3.5 w-3.5 text-amber-400" />}
              </motion.button>
            )}

            {/* Debut / Exclusive Tag */}
            {activeFilm.is_debut && (
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-extrabold uppercase tracking-wider shadow-lg">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Indie Debut</span>
              </div>
            )}
          </div>

          {/* Details & Actions Body */}
          <div className="p-4 space-y-3">
            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Play Button */}
                <motion.button
                  onClick={() => {
                    closeImmediately();
                    onPlay(activeFilm);
                  }}
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-amber-500 text-black shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-colors"
                  title="Watch Now"
                  whileHover={reduced ? {} : { scale: 1.1, transition: springSnappy }}
                  whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
                >
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </motion.button>

                {/* Add to Watchlist Button */}
                <motion.button
                  onClick={() => onToggleWatchlist(activeFilm.id)}
                  className={`flex items-center justify-center h-9 w-9 rounded-full border backdrop-blur-md transition-colors ${
                    inWatchlist
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                  title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  whileHover={reduced ? {} : { scale: 1.1, transition: springSnappy }}
                  whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
                >
                  {inWatchlist ? <Check className="h-4 w-4 stroke-[2.5]" /> : <Plus className="h-4 w-4 stroke-[2.5]" />}
                </motion.button>

                {/* Like / Reaction Button */}
                <motion.button
                  onClick={() => setLiked(!liked)}
                  className={`flex items-center justify-center h-9 w-9 rounded-full border backdrop-blur-md transition-colors ${
                    liked
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                  title={liked ? 'Liked' : 'Like'}
                  whileHover={reduced ? {} : { scale: 1.1, transition: springSnappy }}
                  whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
                >
                  <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                </motion.button>
              </div>

              {/* More Info Trigger */}
              <motion.button
                onClick={() => {
                  closeImmediately();
                  onMoreInfo(activeFilm);
                }}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                title="Episode & Film Info"
                whileHover={reduced ? {} : { scale: 1.1, transition: springSnappy }}
                whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Title & Metadata Line */}
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight truncate">
                {activeFilm.title}
              </h3>

              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${ageRatingStyle.bg} ${ageRatingStyle.text} ${ageRatingStyle.border}`}>
                  {activeFilm.age_rating}
                </span>

                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-zinc-300 border border-white/10">
                  4K ULTRA HD
                </span>

                <span>{formatRuntime(activeFilm.runtime_minutes)}</span>
                <span>•</span>
                <span>{activeFilm.release_year}</span>
              </div>
            </div>

            {/* Synopsis Preview */}
            {activeFilm.synopsis && (
              <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                {activeFilm.synopsis}
              </p>
            )}

            {/* Genre Pills */}
            {activeFilm.film_genres && activeFilm.film_genres.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {activeFilm.film_genres.slice(0, 3).map((fg) => {
                  const genreName = fg.genres?.name;
                  if (!genreName) return null;
                  return (
                    <button
                      key={genreName}
                      onClick={() => {
                        closeImmediately();
                        if (onSelectGenre) onSelectGenre(genreName);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-amber-400 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-full border border-white/5 transition-colors"
                    >
                      {genreName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
