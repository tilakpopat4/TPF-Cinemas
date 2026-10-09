import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Play,
  Bookmark,
  Check,
  Tv,
} from 'lucide-react';
import { Series, Season, Episode } from '../../types';
import { formatRuntime } from '../../lib/utils';

interface SeriesDetailModalProps {
  series: Series | null;
  onClose: () => void;
  onPlayEpisode: (series: Series, season: Season, episode: Episode) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (seriesId: string) => void;
  getEpisodeProgress?: (episodeId: string) => number;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  series,
  onClose,
  onPlayEpisode,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl bg-[#0f1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-white my-auto max-h-[92vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-colors backdrop-blur-md border border-white/10"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner Section */}
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/60 to-black/40" />

          {/* Banner Meta Info */}
          <div className="absolute bottom-4 left-6 right-6 sm:bottom-6 sm:left-8 sm:right-8 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500 text-black shadow-md shadow-amber-500/20">
                <Tv className="w-3 h-3" />
                <span>Original Series</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-black/60 backdrop-blur-md text-white/80 border border-white/10">
                {series.age_rating || 'UA13+'}
              </span>
              <span className="text-xs font-mono text-zinc-300">
                {series.release_year}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-xs font-mono text-zinc-300 uppercase">
                {series.language}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-xs font-mono text-amber-400">
                {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
              </span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-4xl text-white font-normal tracking-tight">
              {series.title}
            </h1>

            {/* Action Buttons: Play First Episode / Watchlist */}
            <div className="flex items-center gap-3 pt-2">
              {currentEpisodes.length > 0 && currentSeason && (
                <button
                  onClick={() => onPlayEpisode(series, currentSeason, currentEpisodes[0])}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Start S{currentSeason.season_number} E1</span>
                </button>
              )}

              <button
                onClick={() => onToggleWatchlist(series.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border backdrop-blur-md ${
                  isInWatchlist
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-white/10 hover:bg-white/15 text-white/90 border-white/10'
                }`}
              >
                {isInWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{isInWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 divide-y divide-white/[0.06]">
          {/* Synopsis & Creator Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h2 className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">
                Series Synopsis
              </h2>
              <p className="font-sans text-sm text-zinc-200 leading-relaxed">
                {series.synopsis}
              </p>
              {series.creator_note && (
                <div className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-200/90 italic font-editorial">
                  "{series.creator_note}" — Showrunner Note
                </div>
              )}
            </div>

            {/* Creator / Details Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Created By
                </span>
                <span className="font-sans font-medium text-white text-sm">
                  {series.profiles?.display_name || 'Independent Creator'}
                </span>
                {series.profiles?.city && (
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {series.profiles.city}
                  </span>
                )}
              </div>

              {series.series_genres && series.series_genres.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    Genres
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {series.series_genres.map((g) => (
                      <span
                        key={g.genre_id}
                        className="px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-300 text-[10px]"
                      >
                        {g.genres?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {series.series_credits && series.series_credits.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    Key Credits
                  </span>
                  <div className="space-y-1 text-[11px]">
                    {series.series_credits.slice(0, 4).map((c) => (
                      <div key={c.id} className="flex justify-between text-zinc-300">
                        <span>{c.person_name}</span>
                        <span className="text-zinc-500 uppercase text-[9px]">
                          {c.credit_role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seasons & Episodes Explorer */}
          <div className="pt-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-display tracking-wider uppercase text-white flex items-center gap-2">
                  <span>Episodes</span>
                  <span className="text-xs font-mono text-amber-400/90">
                    ({currentEpisodes.length})
                  </span>
                </h3>
                {currentSeason?.synopsis && (
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    {currentSeason.synopsis}
                  </p>
                )}
              </div>

              {/* Season Selection Tabs / Dropdown */}
              {seasons.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      onClick={() => setSelectedSeasonId(season.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all ${
                        season.id === currentSeason?.id
                          ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300'
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
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">
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
                      className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-amber-500/30 transition-all cursor-pointer"
                    >
                      {/* Episode Thumbnail */}
                      <div className="relative aspect-video w-full sm:w-44 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/5">
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
                          <div className="w-9 h-9 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-4 h-4 fill-black ml-0.5" />
                          </div>
                        </div>

                        {/* Duration Badge */}
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/80 text-zinc-300 backdrop-blur-sm">
                          {formatRuntime(episode.runtime_minutes)}
                        </div>

                        {/* Watch Progress Bar */}
                        {progressPercent > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Episode Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            E{episode.episode_number}
                          </span>
                          <h4 className="font-editorial text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors truncate">
                            {episode.title}
                          </h4>
                          {episode.is_free_preview && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Free
                            </span>
                          )}
                        </div>

                        {episode.synopsis && (
                          <p className="text-xs text-zinc-400 font-sans line-clamp-2 leading-relaxed">
                            {episode.synopsis}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="hidden sm:block shrink-0 pr-2">
                        <span className="px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider bg-white/[0.06] group-hover:bg-amber-500 group-hover:text-black transition-colors font-medium">
                          Play
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
