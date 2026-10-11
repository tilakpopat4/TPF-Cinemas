import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Play,
  Bookmark,
  Check,
  Tv,
  Film,
} from 'lucide-react';
import { Series, Season, Episode } from '../../types';
import { formatRuntime } from '../../lib/utils';

interface SeriesDetailModalProps {
  series: Series | null;
  onClose: () => void;
  onPlayEpisode: (series: Series, season: Season, episode: Episode) => void;
  onPlayTrailer?: (series: Series) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (seriesId: string) => void;
  getEpisodeProgress?: (episodeId: string) => number;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  series,
  onClose,
  onPlayEpisode,
  onPlayTrailer,
  isInWatchlist,
  onToggleWatchlist,
  getEpisodeProgress,
}) => {
  const seasons = series?.seasons || [];
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  useEffect(() => {
    if (seasons.length > 0) {
      setSelectedSeasonId(seasons[0].id);
    }
  }, [series, seasons]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!series) return null;

  const currentSeason =
    seasons.find((s) => s.id === selectedSeasonId) || seasons[0] || null;
  const currentEpisodes = currentSeason?.episodes || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 select-none animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl bg-canvas border border-hairline rounded-sm overflow-hidden shadow-2xl text-ivory my-auto max-h-[92vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-40 p-2 rounded-sm bg-black/70 hover:bg-black text-ivory/80 hover:text-white transition-colors backdrop-blur-md border border-hairline"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Banner Section — 21:9 Widescreen Framing */}
        <div className="relative aspect-[16/8] sm:aspect-[21/9] w-full overflow-hidden shrink-0 border-b border-hairline">
          <img
            src={
              series.backdrop_url ||
              series.poster_url ||
              'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1200&auto=format&fit=crop'
            }
            alt={series.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 to-black/40" />

          {/* Banner Meta Info */}
          <div className="absolute bottom-4 left-6 right-6 sm:bottom-6 sm:left-8 sm:right-8 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase tracking-wider bg-signature text-black shadow-sm">
                <Tv className="w-3 h-3" />
                <span>Original Web Series</span>
              </span>
              <span className="px-2 py-0.5 rounded-sm text-[9px] font-mono uppercase bg-black/75 backdrop-blur-md text-ivory/90 border border-hairline">
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

            {/* Action Buttons: Choose Episode / Play / Watchlist */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {currentEpisodes.length > 0 && currentSeason && (
                <>
                  <button
                    onClick={() => {
                      const el = document.getElementById('episodes-list');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-signature hover:bg-signature-hover text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
                  >
                    <Tv className="w-4 h-4 text-black" />
                    <span>Choose Episode ({currentEpisodes.length})</span>
                  </button>

                  <button
                    onClick={() => onPlayEpisode(series, currentSeason, currentEpisodes[0])}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-graphite hover:bg-white/10 text-ivory font-medium text-xs font-mono uppercase tracking-wider transition-all border border-hairline active:scale-95"
                    title={`Start ${currentEpisodes[0].title}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play E1</span>
                  </button>
                </>
              )}

              {series.trailer_ref?.trim() && onPlayTrailer && (
                <button
                  onClick={() => onPlayTrailer(series)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-graphite hover:bg-white/10 text-ivory font-medium text-xs font-mono uppercase tracking-wider transition-all border border-hairline active:scale-95"
                  title="Watch Official Series Trailer"
                >
                  <Film className="w-3.5 h-3.5 text-signature" />
                  <span>Watch Trailer</span>
                </button>
              )}

              <button
                onClick={() => onToggleWatchlist(series.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-mono uppercase tracking-wider transition-all border backdrop-blur-md ${
                  isInWatchlist
                    ? 'bg-signature/15 text-signature border-hairline-signature shadow-sm'
                    : 'bg-graphite hover:bg-white/10 text-ivory border-hairline'
                }`}
              >
                {isInWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{isInWatchlist ? 'In Queue' : 'Add to Queue'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 divide-y divide-hairline">
          {/* 1. Seasons & Episodes Explorer (Primary Focus) */}
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

              {/* Season Selection Tabs */}
              {seasons.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      onClick={() => setSelectedSeasonId(season.id)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
                        season.id === currentSeason?.id
                          ? 'bg-signature text-black font-bold border-signature shadow-sm'
                          : 'bg-graphite hover:bg-white/10 text-muted hover:text-ivory border-hairline'
                      }`}
                    >
                      Season {season.season_number}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Episodes List Grid */}
            {currentEpisodes.length === 0 ? (
              <div className="py-12 text-center text-muted font-mono text-xs">
                No episodes published for this season yet.
              </div>
            ) : (
              <div className="space-y-3">
                {currentEpisodes.map((episode) => {
                  const progress = getEpisodeProgress ? getEpisodeProgress(episode.id) : 0;
                  const totalSecs = (episode.runtime_minutes || 1) * 60;
                  const progressPercent = Math.min(
                    100,
                    Math.round((progress / totalSecs) * 100)
                  );

                  return (
                    <div
                      key={episode.id}
                      onClick={() =>
                        currentSeason && onPlayEpisode(series, currentSeason, episode)
                      }
                      className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-sm bg-graphite/40 hover:bg-graphite border border-hairline hover:border-hairline-accent transition-all cursor-pointer"
                    >
                      {/* Episode Thumbnail */}
                      <div className="relative aspect-video w-full sm:w-44 rounded-sm overflow-hidden bg-black/60 shrink-0 border border-hairline">
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
                          <div className="w-8 h-8 rounded-sm bg-signature text-black flex items-center justify-center shadow-sm scale-95 group-hover:scale-105 transition-transform">
                            <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                          </div>
                        </div>

                        {/* Duration Badge */}
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-sm text-[9px] font-mono bg-black/80 text-ivory/80 backdrop-blur-sm border border-hairline">
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
                          <span className="font-mono text-xs font-bold text-signature px-1.5 py-0.5 rounded-sm bg-signature/10 border border-hairline-signature">
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

                      {/* Action Button */}
                      <div className="hidden sm:block shrink-0 pr-2">
                        <span className="px-3.5 py-1.5 rounded-sm text-xs font-mono uppercase tracking-wider bg-graphite group-hover:bg-signature group-hover:text-black transition-colors font-medium flex items-center gap-1.5 border border-hairline">
                          <Play className="w-3 h-3 fill-current" />
                          <span>Stream</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Synopsis & Creator Info */}
          <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted">
                Series Synopsis
              </h2>
              <p className="font-editorial italic text-sm text-ivory leading-relaxed">
                {series.synopsis}
              </p>
              {series.creator_note && (
                <div className="p-4 rounded-sm bg-graphite border border-hairline text-xs text-ivory/90 italic font-editorial leading-relaxed">
                  "{series.creator_note}" — Showrunner Note
                </div>
              )}
            </div>

            {/* Creator / Details Card */}
            <div className="p-4 rounded-sm bg-graphite border border-hairline space-y-3 font-mono text-xs">
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
                  <span className="text-[10px] text-muted uppercase tracking-wider block mb-1">
                    Genres
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {series.series_genres.map((g) => (
                      <span
                        key={g.genre_id}
                        className="px-2 py-0.5 rounded-sm bg-canvas text-ivory text-[10px] border border-hairline"
                      >
                        {g.genres?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {series.series_credits && series.series_credits.length > 0 && (
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block mb-1">
                    Key Credits
                  </span>
                  <div className="space-y-1 text-[11px]">
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
    </div>
  );
};
