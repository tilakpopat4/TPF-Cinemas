import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Film,
  Tv,
  Bookmark,
  Check,
} from 'lucide-react';
import { Series, Season, Episode } from '../../types';
import { formatRuntime } from '../../lib/utils';
import { useReducedMotion } from '../../lib/motion';

interface SeriesDetailModalProps {
  series: Series | null;
  onClose: () => void;
  onPlayEpisode: (series: Series, season: Season, episode: Episode) => void;
  onPlayTrailer?: (series: Series) => void;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (seriesId: string) => void;
  getEpisodeProgress?: (episodeId: string) => number;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  series,
  onClose,
  onPlayEpisode,
  onPlayTrailer,
  isInWatchlist = false,
  onToggleWatchlist = () => {},
  getEpisodeProgress,
}) => {
  const reduced = useReducedMotion();
  const seasons = (series?.seasons || []).sort((a, b) => a.season_number - b.season_number);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    seasons[0]?.id || ''
  );

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll when modal is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!series) return null;

  const currentSeason =
    seasons.find((s) => s.id === selectedSeasonId) || seasons[0] || null;
  const currentEpisodes = currentSeason?.episodes || [];

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 select-none"
    >
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#0c0d12] rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-ivory my-auto max-h-[92vh] flex flex-col border-0"
      >
        {/* Close Button with Micro-Interaction */}
        <motion.button
          onClick={onClose}
          whileHover={reduced ? {} : { scale: 1.08, rotate: 90 }}
          whileTap={reduced ? {} : { scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/70 hover:bg-black text-ivory/80 hover:text-white transition-colors backdrop-blur-md cursor-pointer border-0"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </motion.button>

        {/* Hero Banner Section — 21:9 Widescreen Framing */}
        <div className="relative aspect-[16/8] sm:aspect-[21/9] w-full overflow-hidden shrink-0">
          <img
            src={
              series.backdrop_url ||
              series.poster_url ||
              'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1200&auto=format&fit=crop'
            }
            alt={series.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-[#0c0d12]/60 to-black/40" />

          {/* Banner Meta Info */}
          <div className="absolute bottom-4 left-6 right-6 sm:bottom-6 sm:left-8 sm:right-8 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-signature text-black shadow-sm">
                <Tv className="w-3 h-3" />
                <span>Original Web Series</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-black/75 backdrop-blur-md text-ivory/90">
                {series.age_rating || 'UA13+'}
              </span>
              <span className="text-xs font-mono text-muted">
                {series.release_year}
              </span>
              <span className="text-muted/40">•</span>
              <span className="text-xs font-mono text-muted uppercase">
                {series.language}
              </span>
              <span className="text-muted/40">•</span>
              <span className="text-xs font-mono text-signature">
                {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl text-ivory font-bold uppercase tracking-wide">
              {series.title}
            </h1>

            {/* Action Buttons: Choose Episode / Play / Watchlist with Micro-Interactions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {currentEpisodes.length > 0 && currentSeason && (
                <>
                  <motion.button
                    whileHover={reduced ? {} : { scale: 1.03 }}
                    whileTap={reduced ? {} : { scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => {
                      const el = document.getElementById('episodes-list');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-signature hover:bg-signature-hover text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer border-0"
                  >
                    <Tv className="w-4 h-4 text-black" />
                    <span>Choose Episode ({currentEpisodes.length})</span>
                  </motion.button>

                  <motion.button
                    whileHover={reduced ? {} : { scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    whileTap={reduced ? {} : { scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => onPlayEpisode(series, currentSeason, currentEpisodes[0])}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 text-ivory font-medium text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-0"
                    title={`Start ${currentEpisodes[0].title}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play E1</span>
                  </motion.button>
                </>
              )}

              {series.trailer_ref?.trim() && onPlayTrailer && (
                <motion.button
                  whileHover={reduced ? {} : { scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  whileTap={reduced ? {} : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => onPlayTrailer(series)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 text-ivory font-medium text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-0"
                  title="Watch Official Series Trailer"
                >
                  <Film className="w-3.5 h-3.5 text-signature" />
                  <span>Watch Trailer</span>
                </motion.button>
              )}

              <motion.button
                whileHover={reduced ? {} : { scale: 1.03 }}
                whileTap={reduced ? {} : { scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => onToggleWatchlist(series.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all backdrop-blur-md cursor-pointer border-0 ${
                  isInWatchlist
                    ? 'bg-signature/20 text-signature shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-ivory'
                }`}
              >
                <motion.span
                  key={isInWatchlist ? 'queued' : 'unqueued'}
                  initial={reduced ? {} : { scale: 0.7, rotate: -20 }}
                  animate={reduced ? {} : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="inline-flex items-center"
                >
                  {isInWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </motion.span>
                <span>{isInWatchlist ? 'In Queue' : 'Add to Queue'}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body (Seamless Without Outline Borders) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* 1. Seasons & Episodes Explorer */}
          <div id="episodes-list" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-display tracking-wide uppercase text-ivory flex items-center gap-2">
                  <Tv className="w-4 h-4 text-signature" />
                  <span>Select Episode</span>
                  <span className="text-xs font-mono text-signature/90">
                    [{currentEpisodes.length} {currentEpisodes.length === 1 ? 'Episode' : 'Episodes'}]
                  </span>
                </h3>
                <p className="text-xs text-muted font-sans mt-0.5">
                  {currentSeason?.synopsis || 'Choose an episode below to begin deliberate streaming.'}
                </p>
              </div>

              {/* Season Selection Tabs with Micro-Interactions */}
              {seasons.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {seasons.map((season) => (
                    <motion.button
                      key={season.id}
                      whileHover={reduced ? {} : { scale: 1.04 }}
                      whileTap={reduced ? {} : { scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => setSelectedSeasonId(season.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border-0 ${
                        season.id === currentSeason?.id
                          ? 'bg-signature text-black font-bold shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-muted hover:text-ivory'
                      }`}
                    >
                      Season {season.season_number}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Episodes List Grid with Staggered Cascading Reveal */}
            {currentEpisodes.length === 0 ? (
              <div className="py-12 text-center text-muted font-mono text-xs">
                No episodes published for this season yet.
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSeason?.id}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: reduced ? 0 : 0.04,
                        delayChildren: reduced ? 0 : 0.02,
                      },
                    },
                  }}
                  className="space-y-3"
                >
                  {currentEpisodes.map((episode) => {
                  const progress = getEpisodeProgress ? getEpisodeProgress(episode.id) : 0;
                  const totalSecs = (episode.runtime_minutes || 1) * 60;
                  const progressPercent = Math.min(
                    100,
                    Math.round((progress / totalSecs) * 100)
                  );

                  return (
                    <motion.div
                      key={episode.id}
                      variants={{
                        hidden: { opacity: 0, y: reduced ? 0 : 12 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.22, ease: [0.25, 1, 0.5, 1] },
                        },
                      }}
                      whileHover={reduced ? {} : { scale: 1.008 }}
                      whileTap={reduced ? {} : { scale: 0.99 }}
                      onClick={() =>
                        currentSeason && onPlayEpisode(series, currentSeason, episode)
                      }
                      className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer border-0"
                    >
                      {/* Episode Thumbnail */}
                      <div className="relative aspect-video w-full sm:w-44 rounded-lg overflow-hidden bg-black/60 shrink-0">
                        <img
                          src={
                            episode.thumbnail_url ||
                            series.poster_url ||
                            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop'
                          }
                          alt={episode.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                          <div className="w-8 h-8 rounded-full bg-signature text-black flex items-center justify-center shadow-md scale-95 group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(245,158,11,0.5)] transition-all duration-200">
                            <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                          </div>
                        </div>

                        {/* Duration Badge */}
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/80 text-ivory/80 backdrop-blur-sm">
                          {formatRuntime(episode.runtime_minutes)}
                        </div>

                        {/* Watch Progress Bar */}
                        {progressPercent > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div
                              className="h-full bg-signature"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Episode Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-signature px-2 py-0.5 rounded bg-signature/15">
                            E{episode.episode_number}
                          </span>
                          <h4 className="font-display uppercase text-sm sm:text-base text-ivory group-hover:text-signature transition-colors truncate">
                            {episode.title}
                          </h4>
                        </div>

                        {episode.synopsis && (
                          <p className="font-editorial italic text-xs text-muted/90 line-clamp-2 leading-relaxed">
                            {episode.synopsis}
                          </p>
                        )}
                      </div>

                      {/* Action Button with Play Micro-Nudge */}
                      <div className="hidden sm:block shrink-0 pr-2">
                        <span className="px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider bg-white/10 group-hover:bg-signature group-hover:text-black transition-all duration-200 font-medium flex items-center gap-1.5 shadow-sm">
                          <Play className="w-3 h-3 fill-current group-hover:translate-x-0.5 transition-transform" />
                          <span>Stream</span>
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
          </div>

          {/* 2. Synopsis & Creator Info */}
          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted">
                Series Synopsis
              </h2>
              <p className="font-editorial italic text-sm text-ivory leading-relaxed">
                {series.synopsis}
              </p>
              {series.creator_note && (
                <div className="p-4 rounded-xl bg-white/[0.03] text-xs text-ivory/90 italic font-editorial leading-relaxed border-0">
                  "{series.creator_note}" — Showrunner Note
                </div>
              )}
            </div>

            {/* Creator / Details Card (Borderless Seamless Surface) */}
            <div className="p-5 rounded-xl bg-white/[0.04] space-y-4 font-mono text-xs border-0">
              <div>
                <span className="text-[10px] text-muted uppercase tracking-wider block">
                  Created By
                </span>
                <span className="font-sans font-medium text-ivory text-sm">
                  {series.profiles?.display_name || 'Independent Creator'}
                </span>
                {series.profiles?.city && (
                  <span className="text-[10px] text-muted block mt-0.5">
                    {series.profiles.city}
                  </span>
                )}
              </div>

              {series.series_genres && series.series_genres.length > 0 && (
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block mb-1.5">
                    Genres
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {series.series_genres.map((g) => (
                      <span
                        key={g.genre_id}
                        className="px-2.5 py-1 rounded-md bg-white/[0.06] text-ivory text-[10px]"
                      >
                        {g.genres?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {series.series_credits && series.series_credits.length > 0 && (
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block mb-1.5">
                    Key Credits
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    {series.series_credits.slice(0, 4).map((c) => (
                      <div key={c.id} className="flex justify-between text-ivory/80">
                        <span>{c.person_name}</span>
                        <span className="text-muted uppercase text-[9px]">
                          {c.credit_role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
