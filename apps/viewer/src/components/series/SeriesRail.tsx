import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Tv } from 'lucide-react';
import { Series } from '../../types';
import { SeriesCard } from './SeriesCard';

interface SeriesRailProps {
  title?: string;
  subtitle?: string;
  seriesList: Series[];
  onSelectSeries: (series: Series) => void;
  isInWatchlist: (seriesId: string) => boolean;
  onToggleWatchlist: (seriesId: string) => void;
}

export const SeriesRail: React.FC<SeriesRailProps> = ({
  title = 'Original Web Series',
  subtitle = 'Episodic cinematic storytelling, curated seasons, and exclusive indie narratives.',
  seriesList,
  onSelectSeries,
  isInWatchlist,
  onToggleWatchlist,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollBounds = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScrollBounds();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollBounds, { passive: true });
    window.addEventListener('resize', checkScrollBounds);

    return () => {
      el.removeEventListener('scroll', checkScrollBounds);
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, [checkScrollBounds, seriesList]);

  if (!seriesList || seriesList.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const step = scrollContainerRef.current.clientWidth * 0.8;
      const scrollAmount = direction === 'left' ? -step : step;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 group/rail">
      {/* Rail Header */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <h2 className="text-xl sm:text-2xl font-normal font-display tracking-widest text-ivory uppercase flex items-center gap-2">
              <Tv className="w-5 h-5 text-amber-500" />
              <span>{title}</span>
            </h2>
          </div>
          {subtitle && (
            <p className="font-editorial italic text-xs sm:text-sm text-muted mt-1 ml-4.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Scroll Nav Indicators */}
        <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover/rail:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-20 disabled:cursor-not-allowed text-ivory transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-20 disabled:cursor-not-allowed text-ivory transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        {/* Left Shadow Mask Fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-canvas to-transparent z-20 pointer-events-none" />
        )}

        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-2 scroll-smooth"
        >
          {seriesList.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              onSelect={onSelectSeries}
              isInWatchlist={isInWatchlist(series.id)}
              onToggleWatchlist={onToggleWatchlist}
              inRail
            />
          ))}
        </div>

        {/* Right Shadow Mask Fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-canvas to-transparent z-20 pointer-events-none" />
        )}
      </div>
    </section>
  );
};
