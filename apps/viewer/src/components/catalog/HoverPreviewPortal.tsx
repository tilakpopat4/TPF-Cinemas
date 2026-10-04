import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Check, ChevronDown, Volume2, VolumeX, X } from 'lucide-react';
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
  getProgress?: (filmId: string) => number;
  onDismissFromHistory?: (filmId: string) => void;
}

export const HoverPreviewPortal: React.FC<HoverPreviewPortalProps> = ({
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
  onMoreInfo,
  onSelectGenre,
  getProgress,
  onDismissFromHistory,
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
          className="rounded-xl overflow-hidden border border-white/[0.12] shadow-[0_24px_56px_rgba(0,0,0,0.95)] text-ivory"
          style={{ backgroundColor: '#0A0A0B' }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.16, ease: 'easeOut' } }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
        >
          {/* Anamorphic 2.39:1 Preview Media Container */}
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            <img
              src={activeFilm.backdrop_url || activeFilm.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop'}
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


            {/* Resume Progress Bar */}
            {getProgress && getProgress(activeFilm.id) > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/80 z-20">
                <div
                  className="h-full bg-signature shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  style={{
                    width: `${Math.min(100, Math.round((getProgress(activeFilm.id) / ((activeFilm.runtime_minutes || 1) * 60)) * 100))}%`,
                  }}
                />
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
                  className="h-9 px-4 rounded-lg bg-signature hover:bg-signature-hover text-black flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  title="Screen Film"
                >
                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  <span>Play</span>
                </button>

                {/* Queue Button */}
                <button
                  onClick={() => onToggleWatchlist(activeFilm.id)}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                    inWatchlist
                      ? 'bg-signature text-black shadow-sm'
                      : 'bg-white/[0.08] text-ivory hover:bg-white/[0.16]'
                  }`}
                  title={inWatchlist ? 'Remove from Queue' : 'Add to Queue'}
                >
                  {inWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </button>

                {/* Dismiss from Resume Queue */}
                {onDismissFromHistory && getProgress && getProgress(activeFilm.id) > 0 && (
                  <button
                    onClick={() => {
                      onDismissFromHistory(activeFilm.id);
                      closeImmediately();
                    }}
                    className="h-9 w-9 rounded-lg bg-white/[0.06] hover:bg-black text-muted hover:text-white flex items-center justify-center transition-colors"
                    title="Remove from Continue Watching"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Curatorial More Info */}
              <button
                onClick={() => {
                  closeImmediately();
                  onMoreInfo(activeFilm);
                }}
                className="h-8.5 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-muted hover:text-ivory flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider transition-colors"
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
