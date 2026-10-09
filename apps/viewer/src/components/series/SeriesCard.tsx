import React from 'react';
import { Tv, Bookmark, Check, Play } from 'lucide-react';
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
      onClick={() => onSelect(series)}
      className={`group relative cursor-pointer select-none outline-none transition-all duration-300 ${
        inRail ? 'flex-none w-48 sm:w-56 md:w-60' : 'w-full'
      }`}
      tabIndex={0}
      title={series.title}
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#12141a] transition-all duration-300 group-hover:-translate-y-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.6)] group-hover:shadow-[0_16px_36px_rgba(245,158,11,0.15)] z-10 border border-white/[0.04] group-hover:border-amber-500/30">
        <img
          src={
            series.poster_url ||
            'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=600&auto=format&fit=crop'
          }
          alt={series.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 opacity-70 group-hover:opacity-85 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500 text-black shadow-md shadow-amber-500/20">
            <Tv className="w-2.5 h-2.5" />
            <span>Series</span>
          </span>

          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-black/60 backdrop-blur-md text-white/90 border border-white/10">
            {series.age_rating || 'UA13+'}
          </span>
        </div>

        {/* Quick Watchlist Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(series.id);
          }}
          className={`absolute top-2.5 right-2.5 z-30 p-2 rounded-full backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 ${
            isInWatchlist
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
              : 'bg-black/60 text-white/90 hover:bg-black/80 hover:text-amber-400'
          }`}
          title={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        >
          {isInWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>

        {/* Center Hover Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
          <div className="w-12 h-12 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-xl shadow-amber-500/30 scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>

        {/* Bottom Content Card Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 z-20 space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400/90 tracking-wide">
            <span>
              {totalSeasons} {totalSeasons === 1 ? 'Season' : 'Seasons'}
            </span>
            {totalEpisodes > 0 && (
              <>
                <span>•</span>
                <span>{totalEpisodes} Eps</span>
              </>
            )}
            <span>•</span>
            <span>{series.release_year}</span>
          </div>

          <h3 className="font-editorial text-sm sm:text-base text-white font-medium leading-tight truncate group-hover:text-amber-300 transition-colors">
            {series.title}
          </h3>

          {series.series_genres && series.series_genres.length > 0 && (
            <p className="font-mono text-[9px] text-zinc-400 truncate uppercase tracking-wider">
              {series.series_genres
                .map((g) => g.genres?.name)
                .filter(Boolean)
                .slice(0, 2)
                .join(' • ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
