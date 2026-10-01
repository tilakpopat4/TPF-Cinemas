import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Check, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { Film } from '../../types';
import { useHoverPreview } from '../../context/HoverPreviewContext';
import { formatRuntime, extractYouTubeId } from '../../lib/utils';
import { useReducedMotion } from '../../lib/motion';

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
  const [delayedVideoMount, setDelayedVideoMount] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsVideoReady(false);
    setHasVideoError(false);
    setDelayedVideoMount(false);

    if (activeFilm && isOpen) {
      if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
      videoTimerRef.current = setTimeout(() => {
        setDelayedVideoMount(true);
      }, 200);
    }

    return () => {
      if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
    };
  }, [activeFilm, isOpen]);

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

  const youtubeId = extractYouTubeId(activeFilm.video_ref);

  const targetWidth = Math.min(360, Math.max(310, sourceRect.width * 1.35));
  const centerX = sourceRect.left + sourceRect.width / 2;
  const clampedX = Math.max(16, Math.min(window.innerWidth - targetWidth - 16, centerX - targetWidth / 2));
  const clampedY = Math.max(76, sourceRect.top - 16);

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
          className="rounded-sm overflow-hidden border border-hairline shadow-2xl text-ivory"
          style={{ backgroundColor: '#1A1A1D' }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.16, ease: 'easeOut' } }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
        >
          {/* Anamorphic 2.39:1 Preview Media Container */}
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            <img
              src={activeFilm.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop'}
              alt={activeFilm.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isVideoReady ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* Embedded Teaser Loop — Scaled to 138% to cleanly crop YouTube title bars and watermark chrome */}
            {youtubeId && delayedVideoMount && !hasVideoError && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden scale-[1.38]">
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

            {/* Film Grain Texture Overlay */}
            <div className="absolute inset-0 film-grain pointer-events-none" />

            {/* Audio Toggle */}
            {youtubeId && isVideoReady && (
              <button
                onClick={toggleMute}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-sm bg-black/80 hover:bg-black text-ivory border border-hairline transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5 text-muted" /> : <Volume2 className="h-3.5 w-3.5 text-signature" />}
              </button>
            )}

            {/* Debut Tag */}
            {activeFilm.is_debut && (
              <div className="absolute top-2 left-2 z-20">
                <span className="px-1.5 py-0.5 bg-signature text-black font-mono text-[8px] uppercase tracking-widest font-bold">
                  Debut
                </span>
              </div>
            )}
          </div>

          {/* Details & Actions Body (No rounded pills) */}
          <div className="p-3.5 space-y-3">
            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Screen Play Button */}
                <button
                  onClick={() => {
                    closeImmediately();
                    onPlay(activeFilm);
                  }}
                  className="h-8 px-3 rounded-sm bg-signature text-black flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#f79612] transition-colors"
                  title="Screen Film"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Play</span>
                </button>

                {/* Queue Button */}
                <button
                  onClick={() => onToggleWatchlist(activeFilm.id)}
                  className={`h-8 w-8 rounded-sm border flex items-center justify-center transition-colors ${
                    inWatchlist
                      ? 'bg-signature text-black border-signature'
                      : 'bg-graphite border-hairline text-ivory hover:border-ivory'
                  }`}
                  title={inWatchlist ? 'Remove from Queue' : 'Add to Queue'}
                >
                  {inWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Curatorial More Info */}
              <button
                onClick={() => {
                  closeImmediately();
                  onMoreInfo(activeFilm);
                }}
                className="h-8 px-2.5 rounded-sm bg-graphite hover:bg-[#25252b] border border-hairline text-muted hover:text-ivory flex items-center gap-1 text-[11px] transition-colors"
                title="Curatorial Notes"
              >
                <span>Details</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Title & Metadata Line */}
            <div>
              <h3 className="font-editorial text-base font-semibold text-ivory tracking-tight truncate leading-tight">
                {activeFilm.title}
              </h3>

              <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[10px] text-muted">
                <span className="px-1.5 py-0.5 rounded-sm bg-canvas border border-hairline text-ivory">
                  {activeFilm.age_rating}
                </span>

                <span className="px-1.5 py-0.5 rounded-sm bg-canvas border border-hairline text-muted">
                  4K
                </span>

                <span>{formatRuntime(activeFilm.runtime_minutes)}</span>
                <span>•</span>
                <span>{activeFilm.release_year}</span>
              </div>
            </div>

            {/* Synopsis */}
            {activeFilm.synopsis && (
              <p className="font-sans text-xs text-ivory/70 line-clamp-2 leading-[1.5]">
                {activeFilm.synopsis}
              </p>
            )}

            {/* Genre Tags */}
            {activeFilm.film_genres && activeFilm.film_genres.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1 border-t border-hairline">
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
                      className="font-mono text-[9px] uppercase tracking-wider text-muted hover:text-ivory bg-canvas px-1.5 py-0.5 rounded-sm border border-hairline transition-colors"
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
