import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
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
  subtitle,
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
    <section className="relative py-6 group/rail">
      {/* Rail Header — Exactly matching ContentRail layout & typography */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3">
        <div className="flex items-baseline gap-3 pb-1">
          <h2 className="text-xl sm:text-2xl font-normal font-display tracking-widest text-ivory uppercase flex items-center gap-2">
            <Tv className="w-5 h-5 text-signature" />
            <span>{title}</span>
          </h2>
          <span className="font-mono text-[10px] text-muted tracking-widest">
            [{seriesList.length}]
          </span>
        </div>
        {subtitle && (
          <p className="font-editorial italic text-xs sm:text-sm text-muted">
            {subtitle}
          </p>
        )}
      </div>

      {/* Horizontal Scroll Area */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Arrow Button — Boundary Aware */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-30 h-12 w-9 bg-black/80 hover:bg-black text-ivory rounded-r-md opacity-0 group-hover/rail:opacity-100 transition-opacity flex items-center justify-center focus:outline-none shadow-2xl backdrop-blur-md"
            title="Scroll Left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Series Row — Always visible and smoothly scrollable with touch support & exact motion stagger */}
        <motion.div
          ref={scrollContainerRef as any}
          className="flex items-start gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 hide-scrollbar scroll-smooth touch-pan-x"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '0px 100px' }}
          variants={{
            visible: {
              transition: { staggerChildren: 0.05 },
            },
            hidden: {},
          }}
        >
          {seriesList.map((series) => (
            <motion.div
              key={series.id}
              className="flex-none"
              variants={{
                hidden: { opacity: 0, scale: 0.95, y: 10 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: { type: 'spring', stiffness: 400, damping: 30 },
                },
              }}
            >
              <SeriesCard
                series={series}
                onSelect={onSelectSeries}
                isInWatchlist={isInWatchlist(series.id)}
                onToggleWatchlist={onToggleWatchlist}
                inRail={true}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Right Arrow Button — Boundary Aware */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-30 h-12 w-9 bg-black/80 hover:bg-black text-ivory rounded-l-md opacity-0 group-hover/rail:opacity-100 transition-opacity flex items-center justify-center focus:outline-none shadow-2xl backdrop-blur-md"
            title="Scroll Right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
};
