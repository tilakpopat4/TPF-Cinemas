import React from 'react';
import { Tv, Plus, Check, Play } from 'lucide-react';
import { Series } from '../../types';

interface SeriesCardProps {
  series: Series;
  onSelect: (series: Series) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (seriesId: string) => void;
  inRail?: boolean;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({
  series,
  onSelect,
  isInWatchlist,
  onToggleWatchlist,
  inRail = false,
}) => {
  const totalSeasons = series.seasons?.length || 1;
  const totalEpisodes = (series.seasons || []).reduce(
    (acc, s) => acc + (s.episodes?.length || 0),
    0
  );

  return (
    <div
      className={`group relative cursor-pointer select-none outline-none transition-all duration-200 ${
        inRail ? 'flex-none w-48 sm:w-56 md:w-60' : 'w-full'
      }`}
      tabIndex={0}
      title={series.title}
    >
      {/* Poster Container: Seamless rounded artwork without borders, smooth depth shadow (Exact match to FilmCard) */}
      <div
        onClick={() => onSelect(series)}
        className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#12141a] transition-all duration-300 group-hover:-translate-y-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.6)] group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.85)] z-10"
      >
        <img
          src={
            series.poster_url ||
            'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=600&auto=format&fit=crop'
          }
          alt={series.title}
          loading="lazy"
          className="w-full h-full object-cover filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300 group-hover:scale-105"
        />

        {/* Hover Quick Actions Overlay (Exact match to FilmCard) */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5">
          {/* Top Row: Series Badge & Watchlist Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-signature text-black font-bold rounded-md">
                Series
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-black/70 text-ivory rounded-md">
                {series.age_rating || 'UA13+'}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(series.id);
              }}
              className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                isInWatchlist
                  ? 'bg-signature text-black shadow-sm'
                  : 'bg-black/70 text-ivory hover:bg-black'
              }`}
              title={isInWatchlist ? 'Remove from Queue' : 'Add to Queue'}
            >
              {isInWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Center: Play Trigger (Clean Minimalist Cinema Disc — Exactly like FilmCard) */}
          <div className="self-center">
            <div
              className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.7)] hover:bg-white/95 transition-all duration-200 group-hover:scale-110 active:scale-95 cursor-pointer"
              onClick={() => onSelect(series)}
            >
              <Play className="h-5 w-5 fill-black text-black ml-0.5" />
            </div>
          </div>

          {/* Bottom Info: Season/Episode Count, Release Year, and Genres */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <Tv className="h-3 w-3 text-muted" />
                {totalSeasons} {totalSeasons === 1 ? 'Season' : 'Seasons'}
                {totalEpisodes > 0 ? ` • ${totalEpisodes} Eps` : ''}
              </span>
              <span>{series.release_year}</span>
            </div>

            {series.series_genres && series.series_genres.length > 0 && (
              <p className="text-[10px] text-ivory/80 font-editorial italic truncate">
                {series.series_genres
                  .map((sg) => sg.genres?.name)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(' • ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
