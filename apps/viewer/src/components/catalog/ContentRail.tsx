import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Film } from '../../types';
import { FilmCard } from './FilmCard';
import { useReducedMotion, railContainer, railItem, springSnappy } from '../../lib/motion';

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
  // Observe section root so stagger fires when header+cards are ~80px into viewport
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px 0px' });

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
    <section ref={sectionRef} className="relative py-6 group/rail">
      {/* Rail Header — fades in with a simple slide-up when inView */}
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex items-baseline justify-between"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={reduced ? { duration: 0.01 } : { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      >
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-normal text-zinc-500 font-sans">
              ({films.length})
            </span>
          </h2>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </motion.div>

      {/* Horizontal Scroll Area */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Arrow */}
        <motion.button
          onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-30 h-12 w-10 bg-black/80 hover:bg-black/95 text-white rounded-r-xl opacity-0 group-hover/rail:opacity-100 transition-opacity flex items-center justify-center border-y border-r border-white/10 shadow-xl focus:outline-none"
          title="Scroll Left"
          whileTap={reduced ? {} : { scale: 0.9, x: -2, transition: springSnappy }}
        >
          <ChevronLeft className="h-6 w-6" />
        </motion.button>

        {/* Films Row — stagger container */}
        <motion.div
          ref={scrollContainerRef}
          className="flex items-start gap-4 overflow-x-auto pb-4 pt-1 hide-scrollbar scroll-smooth"
          {...containerProps}
          animate={inView ? 'visible' : 'hidden'}
        >
          {films.map((film) => (
            // Each FilmCard gets the rail item variants so the parent drives stagger
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

        {/* Right Arrow */}
        <motion.button
          onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-30 h-12 w-10 bg-black/80 hover:bg-black/95 text-white rounded-l-xl opacity-0 group-hover/rail:opacity-100 transition-opacity flex items-center justify-center border-y border-l border-white/10 shadow-xl focus:outline-none"
          title="Scroll Right"
          whileTap={reduced ? {} : { scale: 0.9, x: 2, transition: springSnappy }}
        >
          <ChevronRight className="h-6 w-6" />
        </motion.button>
      </div>
    </section>
  );
};
