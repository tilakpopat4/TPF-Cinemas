import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  X,
  Check,
  Plus,
  Info,
  Maximize2,
  Minimize2,
  Film as FilmIcon,
  Sparkles,
} from 'lucide-react';
import { Film, Profile } from '../../types';
import { formatRuntime, extractYouTubeId, getAgeRatingColor } from '../../lib/utils';
import { FilmComments } from '../comments/FilmComments';
import { useReducedMotion, springSnappy } from '../../lib/motion';

interface WatchModalProps {
  film: Film | null;
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

  const reduced = useReducedMotion();
  const videoId = extractYouTubeId(film.video_ref);
  const ageStyle = getAgeRatingColor(film.age_rating);

  const [showControls, setShowControls] = useState(true);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls after 3.5 seconds of inactivity unless the drawer is open
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

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [resetHideTimer]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
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
  };

  // Keyboard navigation: Escape to close (or close drawer first), F for fullscreen, I for info
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDetailsDrawer) {
          setShowDetailsDrawer(false);
        } else {
          onClose();
        }
      } else if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'i' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setShowDetailsDrawer((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showDetailsDrawer]);

  // Record initial view session
  useEffect(() => {
    if (onRecordProgress) {
      onRecordProgress(film.id, Math.max(initialProgressSeconds, 15));
    }
  }, [film.id, initialProgressSeconds, onRecordProgress]);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
      className="fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden select-none flex flex-col justify-between"
    >
      {/* Edge-to-Edge Video Playback Canvas */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
        {videoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1&start=${initialProgressSeconds || 0}`}
            title={film.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-950">
            <FilmIcon className="h-16 w-16 mb-4 text-zinc-600 animate-pulse" />
            <p className="text-base font-medium text-zinc-300">Video stream currently unavailable</p>
            <p className="text-xs text-zinc-500 mt-1">Please check back shortly.</p>
          </div>
        )}
      </div>

      {/* Netflix-Style Floating Cinema Top Bar */}
      <motion.div
        className={`absolute top-0 left-0 right-0 z-40 px-4 sm:px-8 py-5 flex items-center justify-between bg-gradient-to-b from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls || showDetailsDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Left: Back Arrow + Film Title + Badges */}
        <div className="flex items-center gap-3 sm:gap-4 truncate mr-4">
          <motion.button
            onClick={onClose}
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all shrink-0"
            title="Back to Browse"
            whileHover={reduced ? {} : { scale: 1.05 }}
            whileTap={reduced ? {} : { scale: 0.92, transition: springSnappy }}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline text-xs font-semibold tracking-wide">Back</span>
          </motion.button>

          <div className="h-6 w-px bg-white/15 hidden sm:block shrink-0" />

          <div className="truncate">
            <div className="flex items-center gap-2 truncate">
              <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold border shrink-0 ${ageStyle.bg} ${ageStyle.text} ${ageStyle.border}`}>
                {film.age_rating}
              </span>
              <h1 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate font-display">
                {film.title}
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span>{film.release_year}</span>
              <span>•</span>
              <span>{formatRuntime(film.runtime_minutes)}</span>
              <span>•</span>
              <span>{film.language}</span>
              {film.film_genres && film.film_genres.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-zinc-300">
                    {film.film_genres.map((fg) => fg.genres?.name).filter(Boolean).slice(0, 2).join(', ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Watchlist Toggle */}
          <motion.button
            onClick={() => onToggleWatchlist(film.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
              isInWatchlist
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-black/60 hover:bg-black/80 border-white/15 text-white'
            }`}
            title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            whileHover={reduced ? {} : { scale: 1.05 }}
            whileTap={reduced ? {} : { scale: 0.92, transition: springSnappy }}
          >
            {isInWatchlist ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Plus className="h-3.5 w-3.5 stroke-[2.5]" />}
            <span className="hidden md:inline">{isInWatchlist ? 'My List' : 'Add to List'}</span>
          </motion.button>

          {/* Film Details & Discussion Drawer Toggle */}
          <motion.button
            onClick={() => setShowDetailsDrawer(!showDetailsDrawer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
              showDetailsDrawer
                ? 'bg-amber-500 text-black border-amber-500'
                : 'bg-black/60 hover:bg-black/80 border-white/15 text-white'
            }`}
            title="Film Info & Discussion (I)"
            whileHover={reduced ? {} : { scale: 1.05 }}
            whileTap={reduced ? {} : { scale: 0.92, transition: springSnappy }}
          >
            <Info className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Info & Chat</span>
          </motion.button>

          {/* Browser Fullscreen Toggle */}
          <motion.button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-colors hidden sm:flex items-center justify-center"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            whileHover={reduced ? {} : { scale: 1.08 }}
            whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </motion.button>

          {/* Close Player */}
          <motion.button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 hover:bg-red-500/80 text-white backdrop-blur-md border border-white/15 transition-colors"
            title="Close Player (Esc)"
            whileHover={reduced ? {} : { scale: 1.08 }}
            whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Slide-out Sidebar Drawer for Info, Cast, and Discussion */}
      <AnimatePresence>
        {showDetailsDrawer && (
          <motion.div
            className="fixed top-0 bottom-0 right-0 z-50 w-full sm:w-[460px] bg-[#0c0e14]/95 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl text-white overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-500" />
                <h3 className="font-bold text-sm sm:text-base font-display">
                  About {film.title}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailsDrawer(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Close Info Drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 custom-scrollbar">
              {/* Synopsis */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Synopsis
                </h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {film.synopsis}
                </p>
              </div>

              {/* Metadata Badges */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Runtime</span>
                  <span className="font-medium text-white">{formatRuntime(film.runtime_minutes)}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Release Year</span>
                  <span className="font-medium text-white">{film.release_year}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Language</span>
                  <span className="font-medium text-white">{film.language}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Age Rating</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${ageStyle.bg} ${ageStyle.text} ${ageStyle.border}`}>
                    {film.age_rating}
                  </span>
                </div>
                {film.is_debut && (
                  <div className="flex items-center gap-1.5 pt-1 text-amber-400 font-semibold text-[11px]">
                    <Sparkles className="h-3 w-3" />
                    <span>Official Indie Director Debut</span>
                  </div>
                )}
              </div>

              {/* Filmmaker Bio */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Filmmaker
                </h4>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center font-bold text-black text-sm shrink-0">
                    {film.profiles?.display_name?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white">
                      {film.profiles?.display_name || 'Independent Director'}
                    </p>
                    {film.profiles?.city && (
                      <p className="text-[11px] text-zinc-400">{film.profiles.city}</p>
                    )}
                  </div>
                </div>
                {film.profiles?.bio && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {film.profiles.bio}
                  </p>
                )}
              </div>

              {/* Cast & Crew */}
              {film.film_credits && film.film_credits.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Cast & Crew
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {film.film_credits.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-xs font-semibold text-white truncate">{c.person_name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{c.credit_role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audience Discussion Section */}
              <div className="pt-2 border-t border-white/10">
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
    </div>
  );
};
