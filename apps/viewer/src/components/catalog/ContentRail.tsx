import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Film } from '../../types';
import { FilmCard } from './FilmCard';
import { useReducedMotion, railContainer, railItem } from '../../lib/motion';

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
  subtitle,
  films,
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
  getProgress,
}) => {
  const reduced = useReducedMotion();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-60px 0px' });

  if (!films || films.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -480 : 480;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const containerProps = railContainer(reduced);
  const itemProps = railItem(reduced);

  return (
    <section ref={sectionRef} className="relative py-7 group/rail">
      {/* Rail Header — Editorial Display Title with Italic Subtitle & Hairline */}
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-baseline justify-between border-b border-hairline pb-2.5">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl sm:text-2xl font-normal font-display tracking-widest text-ivory uppercase">
              {title}
            </h2>
            <span className="font-mono text-[10px] text-muted tracking-widest">
              [{films.length}]
            </span>
          </div>

          {subtitle && (
            <p className="font-editorial italic text-xs sm:text-sm text-muted hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </motion.div>

      {/* Horizontal Scroll Area */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Arrow Button (Sharp Rectangular, Graphite Surface) */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-30 h-10 w-8 bg-graphite/90 hover:bg-graphite text-ivory rounded-sm opacity-0 group-hover/rail:opacity-100 transition-opacity flex items-center justify-center border border-hairline focus:outline-none"
          title="Scroll Left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Films Row — Staggered Children */}
        <motion.div
          ref={scrollContainerRef}
          className="flex items-start gap-4 overflow-x-auto pb-4 pt-1 hide-scrollbar scroll-smooth"
          {...containerProps}
          animate={inView ? 'visible' : 'hidden'}
        >
          {films.map((film) => (
            <motion.div key={film.id} {...itemProps} className="flex-none">
              <FilmCard
                film={film}
                onPlay={onPlay}
                isInWatchlist={isInWatchlist(film.id)}
                onToggleWatchlist={onToggleWatchlist}
                progressSeconds={getProgress ? getProgress(film.id) : 0}
                inRail
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Right Arrow Button (Sharp Rectangular, Graphite Surface) */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-30 h-10 w-8 bg-graphite/90 hover:bg-graphite text-ivory rounded-sm opacity-0 group-hover/rail:opacity-100 transition-opacity flex items-center justify-center border border-hairline focus:outline-none"
          title="Scroll Right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};
