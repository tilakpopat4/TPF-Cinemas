import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Film } from '../../types';
import { FilmCard } from './FilmCard';

interface ContentRailProps {
  title: string;
  subtitle?: string;
  films: Film[];
  onPlay: (film: Film) => void;
  isInWatchlist: (filmId: string) => boolean;
  onToggleWatchlist: (filmId: string) => void;
  getProgress?: (filmId: string) => number;
}

export const ContentRail: React.FC<ContentRailProps> = ({
  title,
  subtitle: _subtitle,
  films,
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
  getProgress,
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
  }, [checkScrollBounds, films]);

  if (!films || films.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const step = scrollContainerRef.current.clientWidth * 0.8;
      const scrollAmount = direction === 'left' ? -step : step;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-6 group/rail">
      {/* Rail Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3">
        <div className="flex items-baseline gap-3 pb-1">
          <h2 className="text-xl sm:text-2xl font-normal font-display tracking-widest text-ivory uppercase">
            {title}
          </h2>
          <span className="font-mono text-[10px] text-muted tracking-widest">
            [{films.length}]
          </span>
        </div>
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

        {/* Films Row — Always visible and smoothly scrollable with touch support */}
        <motion.div
          ref={scrollContainerRef as any}
          className="flex items-start gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 hide-scrollbar scroll-smooth touch-pan-x"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "0px 100px" }}
          variants={{
            visible: {
              transition: { staggerChildren: 0.05 }
            },
            hidden: {}
          }}
        >
          {films.map((film) => (
            <motion.div 
              key={film.id} 
              className="flex-none"
              variants={{
                hidden: { opacity: 0, scale: 0.95, y: 10 },
                visible: { 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: { type: 'spring', stiffness: 400, damping: 30 } 
                }
              }}
            >
              <FilmCard
                film={film}
                onPlay={onPlay}
                isInWatchlist={isInWatchlist(film.id)}
                onToggleWatchlist={onToggleWatchlist}
                progressSeconds={getProgress ? getProgress(film.id) : 0}
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
