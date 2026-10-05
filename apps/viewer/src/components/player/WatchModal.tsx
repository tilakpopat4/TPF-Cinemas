import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  X,
  Check,
  Plus,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Film, Profile } from '../../types';
import { formatRuntime } from '../../lib/utils';
import { FilmComments } from '../comments/FilmComments';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { CinematicPlayerEngine } from './CinematicPlayerEngine';
import { CinematicTransportHUD } from './CinematicTransportHUD';

interface WatchModalProps {
  film: Film | null;
  mode?: 'movie' | 'trailer';
  onClose: () => void;
  user: any;
  profile: Profile | null;
  onOpenAuth: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (filmId: string) => void;
  initialProgressSeconds?: number;
  onRecordProgress?: (filmId: string, seconds: number, completed?: boolean) => void;
}

export const WatchModal: React.FC<WatchModalProps> = ({
  film,
  mode = 'movie',
  onClose,
  user,
  profile,
  onOpenAuth,
  isInWatchlist,
  onToggleWatchlist,
  initialProgressSeconds = 0,
  onRecordProgress,
}) => {
  if (!film) return null;

  // In trailer mode stream the creator's trailer link; otherwise the full feature
  const isTrailerStream = mode === 'trailer' && !!film.trailer_ref?.trim();
  const playFilm: Film = isTrailerStream
    ? { ...film, video_ref: film.trailer_ref!.trim(), video_provider: 'youtube' }
    : film;

  const controller = useVideoPlayer(isTrailerStream ? 0 : (film.runtime_minutes || 0) * 60);

  const [showControls, setShowControls] = useState(true);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastGesture, setLastGesture] = useState<{
    type: 'play' | 'pause' | 'skip-forward' | 'skip-backward';
    id: number;
  } | null>(null);

  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const triggerGesture = useCallback(
    (type: 'play' | 'pause' | 'skip-forward' | 'skip-backward') => {
      setLastGesture({ type, id: Date.now() });
    },
    []
  );

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (!showDetailsDrawer) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [showDetailsDrawer]);

  // Mandatory requirement: authentication required to watch cinema
  useEffect(() => {
    if (!user) {
      onOpenAuth();
      onClose();
    }
  }, [user, onOpenAuth, onClose]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [resetHideTimer]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Failed to exit fullscreen:', err);
      });
      setIsFullscreen(false);
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    triggerGesture(controller.isPlaying ? 'pause' : 'play');
    controller.togglePlay();
  }, [controller, triggerGesture]);

  const handleSkip = useCallback(
    (delta: number) => {
      triggerGesture(delta > 0 ? 'skip-forward' : 'skip-backward');
      controller.skip(delta);
    },
    [controller, triggerGesture]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      resetHideTimer();

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'KeyJ':
        case 'ArrowLeft':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'KeyL':
        case 'ArrowRight':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'KeyM':
          e.preventDefault();
          controller.toggleMute();
          break;
        case 'ArrowUp':
          e.preventDefault();
          controller.setVolume(controller.volume + 10);
          break;
        case 'ArrowDown':
          e.preventDefault();
          controller.setVolume(controller.volume - 10);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyI':
          e.preventDefault();
          setShowDetailsDrawer((prev) => !prev);
          break;
        case 'Escape':
          e.preventDefault();
          if (showDetailsDrawer) {
            setShowDetailsDrawer(false);
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onClose,
    showDetailsDrawer,
    resetHideTimer,
    handleTogglePlay,
    handleSkip,
    controller,
    toggleFullscreen,
  ]);

  const lastRecordedTimeRef = useRef(initialProgressSeconds || 0);
  const currentTimeRef = useRef(controller.currentTime);
  currentTimeRef.current = controller.currentTime;

  // Trailers never write watch-history progress
  const progressRecorder = isTrailerStream ? undefined : onRecordProgress;

  // Throttle progress updates to at most once every 15 seconds
  useEffect(() => {
    if (!progressRecorder || controller.currentTime < 5) return;
    const current = Math.round(controller.currentTime);
    if (Math.abs(current - lastRecordedTimeRef.current) >= 15) {
      lastRecordedTimeRef.current = current;
      progressRecorder(film.id, current);
    }
  }, [film.id, controller.currentTime, progressRecorder]);

  // Flush final progress when player is closed/unmounted
  useEffect(() => {
    return () => {
      if (progressRecorder && currentTimeRef.current > 5) {
        progressRecorder(film.id, Math.round(currentTimeRef.current));
      }
    };
  }, [film.id, progressRecorder]);

  return createPortal(
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
      className={`fixed inset-0 z-[100] w-screen h-screen bg-canvas overflow-hidden select-none flex flex-col justify-between ${
        !showControls && !showDetailsDrawer && controller.isPlaying ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* Edge-to-Edge Custom Cinema Video Engine */}
      <CinematicPlayerEngine
        film={playFilm}
        controller={controller}
        initialProgressSeconds={isTrailerStream ? 0 : initialProgressSeconds}
        onTogglePlay={handleTogglePlay}
        onDoubleTapFullscreen={toggleFullscreen}
      />

      {/* Floating Cinema Top Bar (Graphite/Canvas Layering) */}
      <motion.div
        className={`absolute top-0 left-0 right-0 z-40 px-4 sm:px-8 py-4 flex items-center justify-between bg-gradient-to-b from-canvas via-canvas/75 to-transparent transition-opacity duration-200 ${
          showControls || showDetailsDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Left: Back Arrow + Film Title + Badges */}
        <div className="flex items-center gap-3 sm:gap-4 truncate mr-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shrink-0 active:scale-95 border-none"
            title="Back to Catalogue (Esc)"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">Back</span>
          </button>

          <div className="h-4 w-px bg-white/15 hidden sm:block shrink-0" />

          <div className="truncate">
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider bg-white/10 text-white/80 shrink-0">
                {film.age_rating}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider shrink-0 ${
                mode === 'trailer'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-white/10 text-white font-medium'
              }`}>
                {mode === 'trailer' ? 'Official Trailer' : 'Full Feature'}
              </span>
              <h1 className="font-editorial text-base sm:text-xl font-normal text-ivory tracking-tight truncate leading-none">
                {film.title}
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-2 font-mono text-[10px] text-muted mt-0.5">
              <span>{film.release_year}</span>
              <span>•</span>
              <span>{formatRuntime(film.runtime_minutes)}</span>
              <span>•</span>
              <span className="uppercase">{film.language}</span>
              {film.film_genres && film.film_genres.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-ivory/80 font-editorial italic">
                    {film.film_genres.map((fg) => fg.genres?.name).filter(Boolean).slice(0, 2).join(', ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Watchlist Toggle */}
          <button
            onClick={() => onToggleWatchlist(film.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all backdrop-blur-md active:scale-95 border-none ${
              isInWatchlist
                ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isInWatchlist ? 'Remove from Queue' : 'Add to Queue'}
          >
            {isInWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{isInWatchlist ? 'Queue' : 'Add'}</span>
          </button>

          {/* Details Drawer Toggle */}
          <button
            onClick={() => setShowDetailsDrawer(!showDetailsDrawer)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all backdrop-blur-md active:scale-95 border-none ${
              showDetailsDrawer
                ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Curatorial Notes & Discussion (I)"
          >
            <Info className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          {/* Browser Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all backdrop-blur-md hidden sm:flex items-center justify-center active:scale-95 border-none"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Close Player */}
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-rose-500/30 text-white/80 hover:text-rose-300 transition-all backdrop-blur-md flex items-center justify-center active:scale-95 border-none"
            title="Close Player (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Floating Bottom Cinema Transport HUD */}
      <motion.div
        className={`transition-opacity duration-200 ${
          showControls || showDetailsDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <CinematicTransportHUD
          controller={controller}
          filmTitle={film.title}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          showDetailsDrawer={showDetailsDrawer}
          onToggleDetailsDrawer={() => setShowDetailsDrawer(!showDetailsDrawer)}
          lastGesture={lastGesture}
        />
      </motion.div>

      {/* Slide-out Sidebar Drawer for Editorial Notes & Discussion */}
      <AnimatePresence>
        {showDetailsDrawer && (
          <motion.div
            className="fixed top-0 bottom-0 right-0 z-50 w-full sm:w-[440px] bg-graphite border-l border-hairline p-6 flex flex-col justify-between shadow-2xl text-ivory overflow-hidden pointer-events-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-hairline shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-[10px] uppercase tracking-[0.2em] text-signature font-bold">
                  Curatorial Archive
                </span>
                <span className="text-hairline">|</span>
                <h3 className="font-editorial text-base text-ivory">
                  {film.title}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailsDrawer(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
                title="Close Notes Drawer (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              {/* Synopsis */}
              <div>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
                  Synopsis
                </h4>
                <p className="font-sans text-xs sm:text-sm text-ivory/80 leading-[1.6]">
                  {film.synopsis}
                </p>
              </div>

              {/* Metadata Badges */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Runtime</span>
                  <span className="text-ivory">{formatRuntime(film.runtime_minutes)}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Release Year</span>
                  <span className="text-ivory">{film.release_year}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Language</span>
                  <span className="text-ivory uppercase">{film.language}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Age Rating</span>
                  <span className="text-ivory font-mono font-semibold">{film.age_rating}</span>
                </div>
                {film.is_debut && (
                  <div className="pt-2 border-t border-white/[0.08] text-signature text-[10px] tracking-wider uppercase font-mono font-medium">
                    • Official First-Time Director Debut
                  </div>
                )}
              </div>

              {/* Filmmaker Bio */}
              <div>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
                  Filmmaker
                </h4>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  <p className="font-editorial text-base font-semibold text-ivory">
                    {film.profiles?.display_name || 'Independent Director'}
                  </p>
                  {film.profiles?.city && (
                    <p className="font-mono text-[10px] text-muted mt-0.5">{film.profiles.city}</p>
                  )}
                  {film.profiles?.bio && (
                    <p className="font-sans text-xs text-ivory/70 mt-2 leading-[1.5]">
                      {film.profiles.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Cast & Crew */}
              {film.film_credits && film.film_credits.length > 0 && (
                <div>
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
                    Credits
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {film.film_credits.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                        <p className="text-xs font-medium text-ivory truncate">{c.person_name}</p>
                        <p className="font-mono text-[9px] text-muted truncate uppercase tracking-wider">{c.credit_role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audience Discussion Section */}
              <div className="pt-2 border-t border-hairline">
                <FilmComments
                  filmId={film.id}
                  user={user}
                  profile={profile}
                  onOpenAuth={onOpenAuth}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};
