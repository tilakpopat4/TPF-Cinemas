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
      {/* Poster Container — 2:3 Portrait Aspect Ratio */}
      <div className="relative aspect-[2/3] w-full rounded-sm overflow-hidden bg-graphite transition-all duration-300 group-hover:-translate-y-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.6)] group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.85)] z-10 border border-hairline group-hover:border-hairline-accent">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/30 opacity-75 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase tracking-wider bg-signature text-black shadow-sm">
            <Tv className="w-2.5 h-2.5" />
            <span>Web Series</span>
          </span>

          <span className="px-2 py-0.5 rounded-sm text-[9px] font-mono uppercase tracking-wider bg-black/70 backdrop-blur-md text-ivory/90 border border-hairline">
            {series.age_rating || 'UA13+'}
          </span>
        </div>

        {/* Quick Watchlist Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(series.id);
          }}
          className={`absolute top-2.5 right-2.5 z-30 p-2 rounded-sm backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 ${
            isInWatchlist
              ? 'bg-signature text-black shadow-sm'
              : 'bg-black/70 text-ivory hover:bg-black hover:text-signature'
          }`}
          title={isInWatchlist ? 'In Queue' : 'Add to Queue'}
        >
          {isInWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>

        {/* Center Hover Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
          <div className="w-11 h-11 rounded-sm bg-signature text-black flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-black ml-0.5" />
          </div>
        </div>

        {/* Bottom Content Card Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 z-20 space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-signature/90 tracking-wide">
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

          <h3 className="font-display text-sm sm:text-base text-ivory font-bold uppercase tracking-wide leading-tight truncate group-hover:text-signature transition-colors">
            {series.title}
          </h3>

          {series.series_genres && series.series_genres.length > 0 && (
            <p className="font-mono text-[9px] text-muted truncate uppercase tracking-wider">
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
