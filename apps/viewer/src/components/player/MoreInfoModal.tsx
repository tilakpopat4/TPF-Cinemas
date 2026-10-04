import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  X,
  Play,
  Plus,
  Check,
  Clock,
  Film as FilmIcon,
  Volume2,
  VolumeX,
  Share2,
  Flag,
} from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime, extractYouTubeId } from '../../lib/utils';
import { useReducedMotion, fadeOnly } from '../../lib/motion';
import { ReportCopyrightModal } from '../legal/ReportCopyrightModal';

interface MoreInfoModalProps {
  film: Film | null;
  onClose: () => void;
  onPlay: (film: Film, mode?: 'movie' | 'trailer') => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (filmId: string) => void;
  allFilms?: Film[];
}

export const MoreInfoModal: React.FC<MoreInfoModalProps> = ({
  film,
  onClose,
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
  allFilms = [],
}) => {
  const reduced = useReducedMotion();
  const [isPlayingTeaser, setIsPlayingTeaser] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!film) return null;

  const youtubeId = extractYouTubeId(film.video_ref);

  // Recommendations: Films in the same genre or other catalog titles
  const relatedFilms = allFilms
    .filter((f) => f.id !== film.id)
    .slice(0, 6);

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const portal = createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex justify-center p-0 sm:p-4 md:p-6 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(8px)' }}
      {...fadeOnly(reduced)}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-5xl my-auto sm:my-8 rounded-none sm:rounded-md overflow-hidden shadow-2xl border border-hairline/80 flex flex-col min-h-screen sm:min-h-0 text-ivory selection:bg-signature selection:text-black"
        style={{ backgroundColor: '#141417' }}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
        exit={{ opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.16 } }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Circular Close Button — Netflix Style */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 h-9 w-9 rounded-full bg-black/80 hover:bg-black text-ivory border border-white/20 flex items-center justify-center transition-colors shadow-lg focus:outline-none"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cinematic Backdrop Hero Section (16:9 / 2.39:1 Anamorphic) */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-black overflow-hidden">
          {isPlayingTeaser && youtubeId ? (
            <div className="absolute inset-0 w-full h-full overflow-hidden scale-[1.38] pointer-events-none">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                title={`${film.title} Preview`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <img
              src={
                film.backdrop_url || film.poster_url ||
                'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop'
              }
              alt={film.title}
              className="w-full h-full object-cover object-center filter brightness-[0.88]"
            />
          )}

          {/* Authentic Film Grain Overlay */}
          <div className="absolute inset-0 film-grain pointer-events-none z-[1]" />

          {/* Deep Bottom & Side Vignette Gradients into Solid #141417 */}
          <div
            className="absolute inset-0 z-[2] pointer-events-none"
            style={{
              background: 'linear-gradient(to top, #141417 0%, rgba(20, 20, 23, 0.85) 20%, rgba(20, 20, 23, 0.2) 60%, transparent 100%)',
            }}
          />
          <div
            className="absolute inset-0 z-[2] pointer-events-none hidden sm:block"
            style={{
              background: 'linear-gradient(to right, rgba(20, 20, 23, 0.8) 0%, rgba(20, 20, 23, 0.3) 40%, transparent 70%)',
            }}
          />

          {/* Sound Toggle (if teaser is playing) */}
          {isPlayingTeaser && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-16 z-30 h-9 w-9 rounded-full bg-black/80 hover:bg-black text-ivory border border-white/20 flex items-center justify-center transition-colors shadow-lg"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-muted" /> : <Volume2 className="h-4 w-4 text-signature" />}
            </button>
          )}

          {/* Hero Floating Title & Action Controls */}
          <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-10 right-6 z-10 space-y-3 sm:space-y-4 max-w-2xl">
            {/* Tag / Laurel */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-sm bg-signature text-black font-mono text-[9px] uppercase font-bold tracking-widest">
                {film.is_debut ? 'Director Debut Spotlight' : 'Official Festival Selection'}
              </span>
              <span className="font-mono text-[10px] text-muted tracking-wider uppercase">
                {film.language} Cinema
              </span>
            </div>

            {/* Display Title */}
            <h1 className="font-editorial text-3xl sm:text-5xl md:text-6xl font-normal text-ivory leading-[1.05] tracking-tight">
              {film.title}
            </h1>

            {/* Netflix-Style Two Primary Exhibition Options: Watch Movie & Watch Trailer */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Option 1: Watch Movie */}
              <button
                onClick={() => {
                  onClose();
                  onPlay(film, 'movie');
                }}
                className="px-6 py-2.5 rounded-full bg-amber-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 border-none"
                title="Screen Full Feature Movie"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Watch Movie</span>
              </button>

              {/* Option 2: Watch Trailer */}
              <button
                onClick={() => {
                  if (youtubeId && !isPlayingTeaser) {
                    setIsPlayingTeaser(true);
                  } else {
                    onClose();
                    onPlay(film, 'trailer');
                  }
                }}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md font-medium text-xs uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 border-none"
                title="Watch Official Teaser"
              >
                <FilmIcon className="h-4 w-4 text-signature" />
                <span>{isPlayingTeaser ? 'Fullscreen Trailer' : 'Watch Trailer'}</span>
              </button>

              {/* Queue Button */}
              <button
                onClick={() => onToggleWatchlist(film.id)}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all active:scale-95 border-none"
                title={isInWatchlist ? 'Remove from Queue' : 'Add to Queue'}
              >
                {isInWatchlist ? (
                  <Check className="h-4 w-4 text-signature" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>

              {/* Share Button */}
              <button
                onClick={handleCopyShare}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all active:scale-95 border-none"
                title={copiedLink ? 'Link Copied!' : 'Share Cinema'}
              >
                {copiedLink ? <Check className="h-4 w-4 text-signature" /> : <Share2 className="h-4 w-4 text-zinc-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content Body — Netflix 2-Column Layout */}
        <div className="p-6 sm:p-10 space-y-10" style={{ backgroundColor: '#141417' }}>
          {/* Main 2-Column Info Block */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {/* Left Column (Approx 65% width): Narrative, Metrics, Curatorial Dossier */}
            <div className="md:col-span-8 space-y-6">
              {/* Metrics & Format Badges */}
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs text-muted">
                <span className="text-emerald-400 font-bold tracking-wider">
                  98% Match
                </span>
                <span>•</span>
                <span className="text-ivory">{film.release_year}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold border-none">
                  {film.age_rating}
                </span>
                <span>•</span>
                <span className="text-ivory flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted" />
                  {formatRuntime(film.runtime_minutes)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-signature/10 text-signature text-[10px] font-mono font-semibold border-none">
                  4K ULTRA HD
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[10px] border-none">
                  5.1 AUDIO
                </span>
              </div>

              {/* Full Synopsis */}
              <div className="space-y-3">
                <h3 className="font-editorial text-2xl font-normal text-ivory tracking-tight">
                  Curatorial Synopsis
                </h3>
                <p className="font-sans text-sm sm:text-base text-ivory/85 leading-[1.7]">
                  {film.synopsis || 'No curatorial overview provided for this title.'}
                </p>
              </div>

              {/* Director's Vision & Festival Note */}
              <div className="p-4.5 rounded-xl bg-white/[0.04] space-y-2">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-signature">
                  <FilmIcon className="h-3.5 w-3.5" />
                  <span>Curator&apos;s Dispatch</span>
                </div>
                <p className="font-editorial italic text-sm text-ivory/90 leading-relaxed">
                  &ldquo;A poignant exploration of time, memory, and physical space. Presented in its original 2.39:1 anamorphic theatrical aspect ratio with uncompressed master audio.&rdquo;
                </p>
              </div>
            </div>

            {/* Right Column (Approx 35% width): Personnel, Metadata, Tags */}
            <div className="md:col-span-4 space-y-5 text-xs font-sans text-muted">
              {/* Director Credit */}
              {film.profiles?.display_name && (
                <div>
                  <span className="text-muted block text-[11px] uppercase font-mono tracking-wider mb-1">
                    Director:
                  </span>
                  <span className="text-ivory font-medium hover:text-signature transition-colors cursor-pointer text-sm">
                    {film.profiles.display_name}
                  </span>
                </div>
              )}

              {/* Credits & Cast */}
              {film.film_credits && film.film_credits.length > 0 && (
                <div>
                  <span className="text-muted block text-[11px] uppercase font-mono tracking-wider mb-1">
                    Key Credits:
                  </span>
                  <div className="space-y-1">
                    {film.film_credits.slice(0, 4).map((c) => (
                      <div key={c.id} className="text-ivory/90 flex justify-between gap-2">
                        <span className="font-medium truncate">{c.person_name}</span>
                        <span className="text-[10px] text-muted font-mono uppercase shrink-0">
                          {c.credit_role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Genres */}
              {film.film_genres && film.film_genres.length > 0 && (
                <div>
                  <span className="text-muted block text-[11px] uppercase font-mono tracking-wider mb-1.5">
                    Genres:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {film.film_genres.map((fg) => (
                      <span
                        key={fg.genre_id}
                        className="px-2 py-0.5 rounded-sm bg-canvas border border-hairline text-ivory text-[10px] font-mono uppercase tracking-wider"
                      >
                        {fg.genres?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Exhibition Format */}
              <div className="pt-2 border-t border-hairline/60 space-y-1.5 text-[11px]">
                <div>
                  <span className="text-muted">Audio / Subtitles: </span>
                  <span className="text-ivory font-medium uppercase">{film.language} (Original Audio), English Subtitles</span>
                </div>
                <div>
                  <span className="text-muted">Aspect Ratio: </span>
                  <span className="text-ivory font-mono font-medium">2.39:1 CinemaScope</span>
                </div>
                <div>
                  <span className="text-muted">Distribution: </span>
                  <span className="text-signature font-mono uppercase">TPF Cinemas Exclusive Premiere</span>
                </div>
              </div>
            </div>
          </div>

          {/* "More Like This" Section — Netflix Hallmark */}
          {relatedFilms.length > 0 && (
            <div className="pt-8 border-t border-hairline space-y-5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-editorial text-2xl font-normal text-ivory tracking-tight">
                  More Like This
                </h3>
                <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
                  [{relatedFilms.length} Recommended Titles]
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4 sm:gap-5">
                {relatedFilms.map((rf) => (
                  <div
                    key={rf.id}
                    onClick={() => {
                      onClose();
                      onPlay(rf, 'movie');
                    }}
                    className="group relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#12141a] transition-all duration-300 hover:-translate-y-1 shadow-[0_6px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.85)] cursor-pointer"
                    title={rf.title}
                  >
                    <img
                      src={rf.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop'}
                      alt={rf.title}
                      loading="lazy"
                      className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300 group-hover:scale-105"
                    />



                    {/* Hover Quick Actions Overlay */}
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-black/70 text-ivory rounded-md">
                          {rf.age_rating}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                          {rf.release_year}
                        </span>
                      </div>

                      <div className="self-center">
                        <div className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.7)] hover:bg-white/95 transition-all duration-200 group-hover:scale-110 active:scale-95">
                          <Play className="h-5 w-5 fill-black text-black ml-0.5" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[10px] text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted" />
                          {formatRuntime(rf.runtime_minutes)}
                        </span>
                        <span className="text-signature uppercase tracking-wider font-semibold">
                          Screen →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About This Production — Netflix Dossier Footer */}
          <div className="pt-8 border-t border-hairline space-y-3 text-xs text-muted">
            <h4 className="font-editorial text-xl font-normal text-ivory">
              About <span className="font-medium text-ivory">{film.title}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-[11px]">
              <div>
                <span className="text-muted">Director: </span>
                <span className="text-ivory">{film.profiles?.display_name || 'Independent Director'}</span>
              </div>
              <div>
                <span className="text-muted">Original Release: </span>
                <span className="text-ivory">{film.release_year}</span>
              </div>
              <div>
                <span className="text-muted">Runtime: </span>
                <span className="text-ivory">{formatRuntime(film.runtime_minutes)}</span>
              </div>
              <div>
                <span className="text-muted">Age Classification: </span>
                <span className="text-ivory">{film.age_rating} • Suitable for theatrical exhibition</span>
              </div>
            </div>

            {/* Copyright Report Button */}
            <div className="pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-rose-400 transition-colors group"
              >
                <Flag className="h-3 w-3 group-hover:text-rose-400" />
                <span>Report Copyright Infringement</span>
              </button>
              <p className="text-[9px] text-zinc-600 mt-1">
                Indian Copyright Act 1957 · IT Act 2000 §79
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );

  return (
    <>
      {portal}
      {showReport && (
        <ReportCopyrightModal film={film} onClose={() => setShowReport(false)} />
      )}
    </>
  );
};
