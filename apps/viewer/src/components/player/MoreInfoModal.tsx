import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Play, Plus, Check, Clock, Calendar, Globe } from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime } from '../../lib/utils';
import { useReducedMotion, fadeOnly } from '../../lib/motion';

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!film) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-canvas/85 overflow-y-auto"
      {...fadeOnly(reduced)}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-2xl my-auto bg-graphite border border-hairline rounded-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
        exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-sm bg-black/80 hover:bg-black text-muted hover:text-ivory border border-hairline transition-colors"
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Backdrop Banner: 2.39:1 Cinema Ratio */}
        <div className="relative aspect-video w-full max-h-[280px] bg-black overflow-hidden">
          <img
            src={
              film.poster_url ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop'
            }
            alt={film.title}
            className="w-full h-full object-cover object-center filter brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/40 to-transparent" />
          <div className="absolute inset-0 film-grain pointer-events-none" />

          {/* Quick Play CTA on banner */}
          <div className="absolute bottom-5 left-5 z-10 flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onPlay(film);
              }}
              className="btn-primary"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Screen Film</span>
            </button>

            <button
              onClick={() => onToggleWatchlist(film.id)}
              className="btn-secondary"
              title={isInWatchlist ? 'Remove from Queue' : 'Add to Queue'}
            >
              {isInWatchlist ? (
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
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Header Row */}
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted mb-2">
              <span className="px-1.5 py-0.5 rounded-sm bg-canvas border border-hairline text-ivory">
                {film.age_rating}
              </span>
              <span className="flex items-center gap-1 text-ivory">
                <Clock className="h-3 w-3 text-muted" />
                {formatRuntime(film.runtime_minutes)}
              </span>
              <span className="text-hairline">•</span>
              <span className="text-ivory flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted" />
                {film.release_year}
              </span>
              <span className="text-hairline">•</span>
              <span className="text-ivory uppercase flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted" />
                {film.language}
              </span>
              <span className="px-1.5 py-0.5 rounded-sm font-bold bg-canvas border border-hairline text-signature">
                4K UHD
              </span>
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-ivory leading-tight">
              {film.title}
            </h2>

            {film.profiles?.display_name && (
              <p className="font-editorial italic text-sm text-ivory/80 mt-1">
                Directed by <strong className="not-italic text-ivory font-medium">{film.profiles.display_name}</strong>
              </p>
            )}
          </div>

          {/* Synopsis */}
          <div className="space-y-1">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">Curatorial Overview</h3>
            <p className="font-sans text-xs sm:text-sm text-ivory/80 leading-[1.6]">
              {film.synopsis || 'No curatorial overview provided for this title.'}
            </p>
          </div>

          {/* Genres */}
          {film.film_genres && film.film_genres.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">Genres</h3>
              <div className="flex flex-wrap gap-1.5">
                {film.film_genres.map((fg) => (
                  <span
                    key={fg.genre_id}
                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-canvas border border-hairline text-muted"
                  >
                    {fg.genres?.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Credits */}
          {film.film_credits && film.film_credits.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-hairline">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">Credits</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {film.film_credits.map((c) => (
                  <div key={c.id} className="p-2 rounded-sm bg-canvas border border-hairline">
                    <p className="text-xs font-medium text-ivory truncate">{c.person_name}</p>
                    <p className="font-mono text-[9px] text-muted truncate uppercase">{c.credit_role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
