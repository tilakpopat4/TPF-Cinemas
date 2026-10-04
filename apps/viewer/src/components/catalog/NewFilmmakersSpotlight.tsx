import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Film as FilmIcon, Plus, Check, MapPin } from 'lucide-react';
import { Film } from '../../types';
import { formatRuntime } from '../../lib/utils';

interface NewFilmmakersSpotlightProps {
  title?: string;
  subtitle?: string;
  films: Film[];
  onPlay: (film: Film, mode?: 'movie' | 'trailer') => void;
  isInWatchlist: (filmId: string) => boolean;
  onToggleWatchlist: (filmId: string) => void;
}

export const NewFilmmakersSpotlight: React.FC<NewFilmmakersSpotlightProps> = ({
  title = 'New Filmmakers Spotlight',
  subtitle: _subtitle = 'Uncompromising vision from debut auteurs • Screening the beginner dreams',
  films,
  onPlay,
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
  }, [checkScrollBounds, films]);

  if (!films || films.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const step = scrollContainerRef.current.clientWidth * 0.75;
      const scrollAmount = direction === 'left' ? -step : step;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-8 my-4 bg-gradient-to-b from-white/[0.02] via-white/[0.01] to-transparent">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
        <div className="pb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-signature/15 text-signature text-[10px] font-mono uppercase tracking-widest font-semibold mb-2">
            <FilmIcon className="h-3 w-3" />
            <span>Emerging Voices</span>
          </div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl sm:text-3xl font-normal font-display tracking-widest text-ivory uppercase">
              {title}
            </h2>
            <span className="font-mono text-[10px] text-muted tracking-widest">
              [{films.length} Debuts]
            </span>
          </div>
        </div>
      </div>

      {/* Panoramic Auteur Showcase Carousel */}
      <div className="relative group/spotlight">
        {/* Left Scroll Navigation Trigger */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 h-11 w-11 rounded-full bg-black/80 hover:bg-black text-ivory flex items-center justify-center transition-all duration-200 shadow-2xl backdrop-blur-md opacity-0 group-hover/spotlight:opacity-100 focus:opacity-100 focus:outline-none"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right Scroll Navigation Trigger */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 h-11 w-11 rounded-full bg-black/80 hover:bg-black text-ivory flex items-center justify-center transition-all duration-200 shadow-2xl backdrop-blur-md opacity-0 group-hover/spotlight:opacity-100 focus:opacity-100 focus:outline-none"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Scrollable Landscape Cards Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden no-scrollbar px-4 sm:px-6 lg:px-8 py-2 scroll-smooth"
        >
          {films.map((film) => {
            const inList = isInWatchlist(film.id);
            const directorName = film.profiles?.display_name || 'Emerging Director';
            const directorCity = film.profiles?.city;

            return (
              <div
                key={film.id}
                className="group relative flex-none w-72 sm:w-88 md:w-96 rounded-2xl bg-[#101217] overflow-hidden flex flex-col justify-between shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.85)] transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => onPlay(film, 'movie')}
              >
                {/* Top Landscape 16:9 Visual Frame */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
                  <img
                    src={film.backdrop_url || film.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop'}
                    alt={film.title}
                    loading="lazy"
                    className="w-full h-full object-cover filter brightness-[0.88] group-hover:brightness-100 transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101217] via-transparent to-black/40" />

                  {/* Clean Cinema Play Disc Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.7)] hover:bg-white/95 transition-transform duration-200 group-hover:scale-110 active:scale-95">
                      <Play className="h-5 w-5 fill-black text-black ml-0.5" />
                    </div>
                  </div>

                  {/* Top Film Duration & Rating */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-white/90">
                    <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md">
                      {film.age_rating}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md">
                      {formatRuntime(film.runtime_minutes)}
                    </span>
                  </div>
                </div>

                {/* Bottom Curated Dossier Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                  {/* Director Credit & Tagline */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-signature text-black font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                          {directorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-ivory tracking-wide truncate">
                          {directorName}
                        </span>
                      </div>

                      {directorCity && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-muted/80 shrink-0">
                          <MapPin className="h-3 w-3 text-signature/80" />
                          <span>{directorCity}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-ivory/70 line-clamp-2 leading-relaxed font-sans">
                      {film.synopsis}
                    </p>
                  </div>

                  {/* Meta Specs & Direct Interactive Actions */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono text-muted truncate">
                      <span>{film.language}</span>
                      <span className="mx-1">•</span>
                      <span>{film.release_year}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Watch Trailer */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlay(film, 'trailer');
                        }}
                        className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-ivory text-[10px] uppercase font-mono tracking-wider transition-colors flex items-center gap-1.5"
                        title="Watch Trailer"
                      >
                        <FilmIcon className="h-3 w-3 text-signature" />
                        <span className="hidden sm:inline">Trailer</span>
                      </button>

                      {/* Queue Bookmark */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(film.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          inList
                            ? 'bg-signature text-black'
                            : 'bg-white/[0.08] text-ivory hover:bg-white/[0.16]'
                        }`}
                        title={inList ? 'Remove from Queue' : 'Add to Queue'}
                      >
                        {inList ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
