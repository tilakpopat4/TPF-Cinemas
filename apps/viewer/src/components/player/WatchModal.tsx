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
  Tv,
  Play,
  Sparkles,
} from 'lucide-react';
import { Film, Profile, Series, Season, Episode } from '../../types';
import { formatRuntime } from '../../lib/utils';
import { FilmComments } from '../comments/FilmComments';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { CinematicPlayerEngine } from './CinematicPlayerEngine';
import { CinematicTransportHUD } from './CinematicTransportHUD';

export interface EpisodicContext {
  series: Series;
  season: Season;
  episode: Episode;
  allEpisodes: Episode[];
}

interface WatchModalProps {
  film?: Film | null;
  mode?: 'movie' | 'trailer' | 'episode';
  episodicContext?: EpisodicContext | null;
  onSelectEpisode?: (episode: Episode) => void;
  onClose: () => void;
  user: any;
  profile: Profile | null;
  onOpenAuth: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (id: string) => void;
  initialProgressSeconds?: number;
  onRecordProgress?: (id: string, seconds: number, completed?: boolean) => void;
}

export const WatchModal: React.FC<WatchModalProps> = ({
  film,
  mode = 'movie',
  episodicContext,
  onSelectEpisode,
  onClose,
  user,
  profile,
  onOpenAuth,
  isInWatchlist,
  onToggleWatchlist,
  initialProgressSeconds = 0,
  onRecordProgress,
}) => {
  if (!film && !episodicContext) return null;

  const isEpisodic = mode === 'episode' || !!episodicContext;
  const currentEpisode = episodicContext?.episode;
  const currentSeries = episodicContext?.series;
  const currentSeason = episodicContext?.season;

  // In trailer mode stream the creator's trailer link; in episode mode stream episode; otherwise film feature
  const isTrailerStream = !isEpisodic && mode === 'trailer' && !!film?.trailer_ref?.trim();

  const playFilm: Film = isEpisodic && currentEpisode && currentSeries
    ? {
        id: currentEpisode.id,
        filmmaker_id: currentSeries.creator_id,
        title: currentEpisode.title,
        slug: currentEpisode.slug,
        synopsis: currentEpisode.synopsis || currentSeries.synopsis,
        runtime_minutes: currentEpisode.runtime_minutes,
        release_year: currentSeries.release_year,
        language: currentSeries.language,
        age_rating: currentSeries.age_rating,
        video_provider: currentEpisode.video_provider,
        video_ref: currentEpisode.video_ref,
        poster_url: currentEpisode.thumbnail_url || currentSeries.poster_url,
        backdrop_url: currentSeries.backdrop_url,
        is_featured: false,
        is_debut: false,
        status: 'published',
        published_at: currentEpisode.created_at,
        view_count: currentEpisode.view_count,
        created_at: currentEpisode.created_at,
        profiles: currentSeries.profiles,
      }
    : isTrailerStream
    ? { ...film!, video_ref: film!.trailer_ref!.trim(), video_provider: 'youtube' }
    : film!;

  const controller = useVideoPlayer(
    isTrailerStream ? 0 : (playFilm.runtime_minutes || 0) * 60
  );

  const [showControls, setShowControls] = useState(true);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastGesture, setLastGesture] = useState<{
    type: 'play' | 'pause' | 'skip-forward' | 'skip-backward';
    id: number;
  } | null>(null);

  // Next Episode Auto-Advance State
  const currentIndex = episodicContext?.allEpisodes
    ? episodicContext.allEpisodes.findIndex((ep) => ep.id === currentEpisode?.id)
    : -1;
  const nextEpisode =
    episodicContext &&
    currentIndex >= 0 &&
    currentIndex < episodicContext.allEpisodes.length - 1
      ? episodicContext.allEpisodes[currentIndex + 1]
      : null;

  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [nextPromptDismissed, setNextPromptDismissed] = useState(false);

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
    if (!showDetailsDrawer && !showEpisodeDrawer) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [showDetailsDrawer, showEpisodeDrawer]);

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

  // Reset next episode prompt when episode changes
  useEffect(() => {
    setShowNextPrompt(false);
    setNextPromptDismissed(false);
    setCountdown(5);
  }, [currentEpisode?.id]);

  // Monitor progress for Next Episode prompt (>= 95% completion or < 15s remaining)
  useEffect(() => {
    if (!isEpisodic || !nextEpisode || nextPromptDismissed || showNextPrompt) return;

    const duration = controller.duration;
    const current = controller.currentTime;

    if (duration > 15) {
      const isNearEnd = current / duration >= 0.95 || duration - current <= 15;
      if (isNearEnd) {
        setShowNextPrompt(true);
        setCountdown(5);
      }
    }
  }, [
    isEpisodic,
    nextEpisode,
    nextPromptDismissed,
    showNextPrompt,
    controller.currentTime,
    controller.duration,
  ]);

  // Countdown timer for Next Episode
  useEffect(() => {
    if (!showNextPrompt || !nextEpisode) return;

    if (countdown <= 0) {
      if (onSelectEpisode) {
        onSelectEpisode(nextEpisode);
      }
      setShowNextPrompt(false);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showNextPrompt, countdown, nextEpisode, onSelectEpisode]);

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
          setShowEpisodeDrawer(false);
          break;
        case 'KeyE':
          if (isEpisodic) {
            e.preventDefault();
            setShowEpisodeDrawer((prev) => !prev);
            setShowDetailsDrawer(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (showDetailsDrawer || showEpisodeDrawer) {
            setShowDetailsDrawer(false);
            setShowEpisodeDrawer(false);
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
    showEpisodeDrawer,
    isEpisodic,
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
      const isCompleted =
        controller.duration > 0 &&
        controller.currentTime / controller.duration >= 0.95;
      progressRecorder(playFilm.id, current, isCompleted);
    }
  }, [playFilm.id, controller.currentTime, controller.duration, progressRecorder]);

  // Flush final progress when player is closed/unmounted
  useEffect(() => {
    return () => {
      if (progressRecorder && currentTimeRef.current > 5) {
        progressRecorder(playFilm.id, Math.round(currentTimeRef.current));
      }
    };
  }, [playFilm.id, progressRecorder]);

  return createPortal(
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
      className={`fixed inset-0 z-[100] w-screen h-screen bg-canvas overflow-hidden select-none flex flex-col justify-between ${
        !showControls && !showDetailsDrawer && !showEpisodeDrawer && controller.isPlaying
          ? 'cursor-none'
          : 'cursor-default'
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

      {/* Floating Cinema Top Bar */}
      <motion.div
        className={`absolute top-0 left-0 right-0 z-40 px-4 sm:px-8 py-4 flex items-center justify-between bg-gradient-to-b from-canvas via-canvas/75 to-transparent transition-opacity duration-200 ${
          showControls || showDetailsDrawer || showEpisodeDrawer
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Left: Back Arrow + Film / Series Title + Badges */}
        <div className="flex items-center gap-3 sm:gap-4 truncate mr-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shrink-0 active:scale-95 border-none"
            title="Back (Esc)"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider">
              Back
            </span>
          </button>

          <div className="h-4 w-px bg-white/15 hidden sm:block shrink-0" />

          <div className="truncate">
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider bg-white/10 text-white/80 shrink-0">
                {playFilm.age_rating}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider shrink-0 ${
                  isEpisodic
                    ? 'bg-amber-500 text-black font-bold'
                    : mode === 'trailer'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-white/10 text-white font-medium'
                }`}
              >
                {isEpisodic
                  ? `S${currentSeason?.season_number || 1} E${currentEpisode?.episode_number || 1}`
                  : mode === 'trailer'
                  ? 'Official Trailer'
                  : 'Full Feature'}
              </span>

              {isEpisodic && currentSeries && (
                <span className="font-editorial text-sm sm:text-base text-amber-400/90 truncate hidden md:inline">
                  {currentSeries.title} <span className="text-zinc-500 mx-1">/</span>
                </span>
              )}

              <h1 className="font-editorial text-base sm:text-xl font-normal text-ivory tracking-tight truncate leading-none">
                {playFilm.title}
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-2 font-mono text-[10px] text-muted mt-0.5">
              <span>{playFilm.release_year}</span>
              <span>•</span>
              <span>{formatRuntime(playFilm.runtime_minutes)}</span>
              <span>•</span>
              <span className="uppercase">{playFilm.language}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Episode Drawer Button for Series */}
          {isEpisodic && (
            <button
              onClick={() => {
                setShowEpisodeDrawer(!showEpisodeDrawer);
                setShowDetailsDrawer(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all backdrop-blur-md active:scale-95 border-none ${
                showEpisodeDrawer
                  ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Episodes (E)"
            >
              <Tv className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Episodes</span>
            </button>
          )}

          {/* Watchlist Toggle */}
          <button
            onClick={() => onToggleWatchlist(isEpisodic && currentSeries ? currentSeries.id : playFilm.id)}
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
            onClick={() => {
              setShowDetailsDrawer(!showDetailsDrawer);
              setShowEpisodeDrawer(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all backdrop-blur-md active:scale-95 border-none ${
              showDetailsDrawer
                ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Curatorial Notes (I)"
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

      {/* Next Episode Auto-Advance Floating Countdown Banner */}
      <AnimatePresence>
        {showNextPrompt && nextEpisode && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="absolute bottom-28 right-6 sm:right-10 z-50 max-w-sm w-full p-4 rounded-2xl bg-[#141418]/95 backdrop-blur-2xl border border-amber-500/40 shadow-2xl shadow-black/90 text-white space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Next Episode in {countdown}s</span>
              </span>
              <button
                onClick={() => {
                  setShowNextPrompt(false);
                  setNextPromptDismissed(true);
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative aspect-video w-24 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                <img
                  src={
                    nextEpisode.thumbnail_url ||
                    playFilm.poster_url ||
                    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop'
                  }
                  alt={nextEpisode.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Episode {nextEpisode.episode_number}
                </span>
                <h4 className="font-editorial text-sm text-white font-medium truncate">
                  {nextEpisode.title}
                </h4>
                <span className="text-[10px] font-mono text-amber-400/90 block">
                  {formatRuntime(nextEpisode.runtime_minutes)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  if (onSelectEpisode) onSelectEpisode(nextEpisode);
                  setShowNextPrompt(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-colors shadow-md shadow-amber-500/20 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Play Now</span>
              </button>

              <button
                onClick={() => {
                  setShowNextPrompt(false);
                  setNextPromptDismissed(true);
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
              >
                Stay Here
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Cinema Transport HUD */}
      <motion.div
        className={`transition-opacity duration-200 ${
          showControls || showDetailsDrawer || showEpisodeDrawer
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <CinematicTransportHUD
          controller={controller}
          filmTitle={
            isEpisodic && currentSeries
              ? `${currentSeries.title}: ${playFilm.title}`
              : playFilm.title
          }
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          showDetailsDrawer={showDetailsDrawer}
          onToggleDetailsDrawer={() => {
            setShowDetailsDrawer(!showDetailsDrawer);
            setShowEpisodeDrawer(false);
          }}
          lastGesture={lastGesture}
          isEpisodic={isEpisodic}
          showEpisodeDrawer={showEpisodeDrawer}
          onToggleEpisodeDrawer={() => {
            setShowEpisodeDrawer(!showEpisodeDrawer);
            setShowDetailsDrawer(false);
          }}
        />
      </motion.div>

      {/* Slide-out Sidebar Drawer for Episodic Selector */}
      <AnimatePresence>
        {showEpisodeDrawer && episodicContext && (
          <motion.div
            className="fixed top-0 bottom-0 right-0 z-50 w-full sm:w-[440px] bg-[#12141a]/95 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl text-ivory overflow-hidden pointer-events-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5" />
                  <span>Season {currentSeason?.season_number || 1}</span>
                </span>
                <span className="text-zinc-600">|</span>
                <h3 className="font-editorial text-base text-white truncate max-w-[200px]">
                  {currentSeries?.title}
                </h3>
              </div>
              <button
                onClick={() => setShowEpisodeDrawer(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
                title="Close Drawer (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Episodes List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {episodicContext.allEpisodes.map((ep) => {
                const isPlayingThis = ep.id === currentEpisode?.id;
                return (
                  <div
                    key={ep.id}
                    onClick={() => {
                      if (onSelectEpisode) onSelectEpisode(ep);
                    }}
                    className={`group flex items-center gap-3.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      isPlayingThis
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] text-white'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-28 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                      <img
                        src={
                          ep.thumbnail_url ||
                          playFilm.poster_url ||
                          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=300&auto=format&fit=crop'
                        }
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {isPlayingThis ? (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-black/70 px-2 py-0.5 rounded-full border border-amber-500/40">
                            Playing
                          </span>
                        ) : (
                          <Play className="w-4 h-4 fill-white/80" />
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          E{ep.episode_number}
                        </span>
                        <h4 className="font-editorial text-sm font-medium truncate group-hover:text-amber-300 transition-colors">
                          {ep.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                        {formatRuntime(ep.runtime_minutes)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {playFilm.title}
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
                  {playFilm.synopsis}
                </p>
              </div>

              {/* Metadata Badges */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Runtime</span>
                  <span className="text-ivory">{formatRuntime(playFilm.runtime_minutes)}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Release Year</span>
                  <span className="text-ivory">{playFilm.release_year}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Language</span>
                  <span className="text-ivory uppercase">{playFilm.language}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Age Rating</span>
                  <span className="text-ivory font-mono font-semibold">{playFilm.age_rating}</span>
                </div>
              </div>

              {/* Creator / Filmmaker Bio */}
              <div>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
                  {isEpisodic ? 'Showrunner / Creator' : 'Filmmaker'}
                </h4>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  <p className="font-editorial text-base font-semibold text-ivory">
                    {playFilm.profiles?.display_name || 'Independent Creator'}
                  </p>
                  {playFilm.profiles?.city && (
                    <p className="font-mono text-[10px] text-muted mt-0.5">
                      {playFilm.profiles.city}
                    </p>
                  )}
                  {playFilm.profiles?.bio && (
                    <p className="font-sans text-xs text-ivory/70 mt-2 leading-[1.5]">
                      {playFilm.profiles.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Audience Discussion Section (for films) */}
              {!isEpisodic && (
                <div className="pt-2 border-t border-hairline">
                  <FilmComments
                    filmId={playFilm.id}
                    user={user}
                    profile={profile}
                    onOpenAuth={onOpenAuth}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};
