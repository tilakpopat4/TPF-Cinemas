import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Play, Clock, Calendar, Globe, Check, Plus, Film as FilmIcon } from 'lucide-react';
import { Film, Profile } from '../../types';
import { formatRuntime, extractYouTubeId, getAgeRatingColor, formatProgress } from '../../lib/utils';
import { FilmComments } from '../comments/FilmComments';
import { useReducedMotion, fadeOnly, springNatural, springSnappy } from '../../lib/motion';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = extractYouTubeId(film.video_ref);
  const ageStyle = getAgeRatingColor(film.age_rating);

  // Esc key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Record initial view session
  useEffect(() => {
    if (onRecordProgress && isPlaying) {
      onRecordProgress(film.id, Math.max(initialProgressSeconds, 15));
    }
  }, [isPlaying, film.id, initialProgressSeconds, onRecordProgress]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto"
      {...fadeOnly(reduced)}
    >
      <motion.div
        className="relative w-full max-w-5xl my-auto bg-[#0d1017] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { ...springNatural, delay: 0.05 } }}
        exit={reduced ? { opacity: 0, transition: { duration: 0.01 } } : { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as [number, number, number, number] } }}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#10141c] border-b border-white/10">
          <div className="flex items-center gap-3 truncate pr-4">
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${ageStyle.bg} ${ageStyle.text} ${ageStyle.border}`}>
              {film.age_rating}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white truncate font-display">
              {film.title}
            </h2>
          </div>

          <motion.button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Close Player"
            whileTap={reduced ? {} : { scale: 0.88, transition: springSnappy }}
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Scrollable Player & Details Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {/* Video Player Box */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10">
            {isPlaying || !film.poster_url ? (
              videoId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&start=${initialProgressSeconds || 0}`}
                  title={film.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                  <FilmIcon className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">Video stream not available</p>
                </div>
              )
            ) : (
              /* Poster click-to-play banner */
              <div
                onClick={() => setIsPlaying(true)}
                className="relative w-full h-full cursor-pointer group"
              >
                <img
                  src={film.poster_url}
                  alt={film.title}
                  className="w-full h-full object-cover filter brightness-75 group-hover:brightness-90 transition-[filter] duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                  <motion.div
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-2xl shadow-amber-500/50"
                    whileHover={reduced ? {} : { scale: 1.1, transition: springSnappy }}
                    whileTap={reduced ? {} : { scale: 0.95, transition: springSnappy }}
                  >
                    <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-current ml-1" />
                  </motion.div>
                  {initialProgressSeconds > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/80 text-amber-400 border border-amber-500/30">
                      Resume from {formatProgress(initialProgressSeconds)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions & Meta Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                {formatRuntime(film.runtime_minutes)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                {film.release_year}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-zinc-400" />
                {film.language}
              </span>

              {film.film_genres && film.film_genres.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    {film.film_genres.map((fg) => (
                      <span
                        key={fg.genre_id}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px]"
                      >
                        {fg.genres?.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Watchlist Action */}
            <motion.button
              onClick={() => onToggleWatchlist(film.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                isInWatchlist
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 border-white/10 text-white'
              }`}
              whileTap={reduced ? {} : { scale: 0.93, transition: springSnappy }}
            >
              {isInWatchlist ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Synopsis & Filmmaker Profile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Synopsis
                </h4>
                <p className="text-sm text-zinc-200 leading-relaxed">
                  {film.synopsis}
                </p>
              </div>

              {/* Cast & Crew Credits */}
              {film.film_credits && film.film_credits.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Cast & Crew
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {film.film_credits.map((c) => (
                      <div key={c.id} className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
                        <p className="text-white font-medium truncate">{c.person_name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{c.credit_role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filmmaker Column */}
            <div className="space-y-4 bg-zinc-900/40 p-4 rounded-xl border border-white/5 h-fit">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                About the Filmmaker
              </h4>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center font-bold text-black text-sm shrink-0">
                  {film.profiles?.display_name?.charAt(0)?.toUpperCase() || 'F'}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {film.profiles?.display_name || 'Independent Director'}
                  </p>
                  {film.profiles?.city && (
                    <p className="text-xs text-zinc-400">{film.profiles.city}</p>
                  )}
                </div>
              </div>

              {film.profiles?.bio && (
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {film.profiles.bio}
                </p>
              )}

              {film.is_debut && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400">
                  ⭐️ Official Director Debut Feature
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <FilmComments
            filmId={film.id}
            user={user}
            profile={profile}
            onOpenAuth={onOpenAuth}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
