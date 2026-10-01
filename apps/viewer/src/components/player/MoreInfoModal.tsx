import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Play, Plus, Check, Clock, Calendar, Globe, Sparkles } from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime, getAgeRatingColor } from '../../lib/utils';
import { useReducedMotion, fadeOnly, springNatural, springSnappy } from '../../lib/motion';

interface MoreInfoModalProps {
  film: Film | null;
  onClose: () => void;
  onPlay: (film: Film) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (filmId: string) => void;
}

export const MoreInfoModal: React.FC<MoreInfoModalProps> = ({
  film,
  onClose,
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
}) => {
  const reduced = useReducedMotion();

  // Esc key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!film) return null;

  const ageStyle = getAgeRatingColor(film.age_rating);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      {...fadeOnly(reduced)}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-3xl my-auto bg-[#0d1017] border border-white/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { ...springNatural, delay: 0.05 } }}
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer"
          aria-label="Close details"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Backdrop Banner */}
        <div className="relative aspect-video w-full max-h-[320px] bg-black overflow-hidden">
          <img
            src={
              film.poster_url ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop'
            }
            alt={film.title}
            className="w-full h-full object-cover object-center filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1017] via-transparent to-transparent" />

          {/* Quick Play CTA on banner */}
          <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3">
            <motion.button
              onClick={() => {
                onClose();
                onPlay(film);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/30 cursor-pointer"
              whileHover={reduced ? {} : { scale: 1.04, transition: springSnappy }}
              whileTap={reduced ? {} : { scale: 0.96, transition: springSnappy }}
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Watch Now</span>
            </motion.button>

            <motion.button
              onClick={() => onToggleWatchlist(film.id)}
              className="p-2.5 rounded-xl bg-black/60 border border-white/20 hover:border-white/40 text-white backdrop-blur-md cursor-pointer transition-colors"
              whileHover={reduced ? {} : { scale: 1.04, transition: springSnappy }}
              whileTap={reduced ? {} : { scale: 0.96, transition: springSnappy }}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isInWatchlist ? (
                <Check className="h-4 w-4 text-amber-400" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Header Row */}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
              <span className={`px-2 py-0.5 rounded font-bold border ${ageStyle.bg} ${ageStyle.text} ${ageStyle.border}`}>
                {film.age_rating}
              </span>
              <span className="flex items-center gap-1 text-zinc-300">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                {formatRuntime(film.runtime_minutes)}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                {film.release_year}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300 capitalize flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-zinc-400" />
                {film.language}
              </span>
              <span className="px-2 py-0.5 rounded font-black tracking-widest text-[9px] bg-black/60 border border-white/20 text-white">
                4K UHD
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
              {film.title}
            </h2>

            {film.profiles?.display_name && (
              <p className="text-xs text-amber-400 mt-1 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3 fill-current" />
                <span>Director: <strong>{film.profiles.display_name}</strong></span>
              </p>
            )}
          </div>

          {/* Synopsis */}
          <div className="space-y-1.5">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Synopsis</h3>
            <p className="text-sm text-zinc-200 leading-relaxed font-normal">
              {film.synopsis || 'No synopsis provided for this title.'}
            </p>
          </div>

          {/* Genres */}
          {film.film_genres && film.film_genres.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {film.film_genres.map((fg) => (
                  <span
                    key={fg.genre_id}
                    className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-zinc-200"
                  >
                    {fg.genres?.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cast & Crew Credits if available */}
          {film.film_credits && film.film_credits.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Cast & Crew</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {film.film_credits.map((c) => (
                  <div key={c.id} className="text-xs">
                    <p className="font-semibold text-white">{c.person_name}</p>
                    <p className="text-zinc-400 text-[11px]">{c.credit_role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
