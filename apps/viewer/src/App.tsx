import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Film, Bookmark, History } from 'lucide-react';
import { useViewerAuth } from './hooks/useViewerAuth';
import { useCatalogue } from './hooks/useCatalogue';
import { useWatchlist } from './hooks/useWatchlist';
import { useWatchHistory } from './hooks/useWatchHistory';
import { ViewerHeader } from './components/navigation/ViewerHeader';
import { HeroBillboard } from './components/hero/HeroBillboard';
import { ContentRail } from './components/catalog/ContentRail';
import { FilmCard } from './components/catalog/FilmCard';
import { WatchModal } from './components/player/WatchModal';
import { MoreInfoModal } from './components/player/MoreInfoModal';
import { ViewerAuthModal } from './components/auth/ViewerAuthModal';
import { HoverPreviewProvider } from './context/HoverPreviewContext';
import { HoverPreviewPortal } from './components/catalog/HoverPreviewPortal';
import { Film as FilmType } from './types';

export default function App() {
  const { user, profile, role, signOut } = useViewerAuth();
  const {
    films,
    genres,
    selectedGenre,
    setSelectedGenre,
    searchQuery,
    setSearchQuery,
    filteredFilms,
    featuredFilm,
    debutFilms,
  } = useCatalogue();

  const { watchlistIds, toggleWatchlist, isInWatchlist } = useWatchlist(user?.id);
  const { history, recordProgress, getProgress } = useWatchHistory(user?.id);

  const [currentTab, setCurrentTab] = useState<'home' | 'browse' | 'watchlist' | 'history'>('home');
  const [activeWatchFilm, setActiveWatchFilm] = useState<FilmType | null>(null);
  const [moreInfoFilm, setMoreInfoFilm] = useState<FilmType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Curated list of featured films for the hero carousel rotation
  const featuredCarouselFilms = (() => {
    const list: FilmType[] = [];
    if (featuredFilm) list.push(featuredFilm);
    debutFilms.forEach((df) => {
      if (!list.some((item) => item.id === df.id)) list.push(df);
    });
    films
      .filter((f) => f.is_featured)
      .forEach((ff) => {
        if (!list.some((item) => item.id === ff.id)) list.push(ff);
      });
    return list.length > 0 ? list : films.slice(0, 5);
  })();

  // Filtered lists for specific rails
  const watchlistFilms = films.filter((f) => watchlistIds.has(f.id));
  const historyFilms = films.filter((f) => history.has(f.id));

  // Genre-specific film rails for home page
  const dramaFilms = films.filter((f) =>
    f.film_genres?.some((fg) => fg.genres?.slug === 'drama' || fg.genres?.name.toLowerCase() === 'drama')
  );
  const thrillerFilms = films.filter((f) =>
    f.film_genres?.some((fg) => fg.genres?.slug === 'thriller' || fg.genres?.name.toLowerCase() === 'thriller')
  );
  const docFilms = films.filter((f) =>
    f.film_genres?.some((fg) => fg.genres?.slug === 'documentary' || fg.genres?.name.toLowerCase() === 'documentary')
  );

  return (
    <HoverPreviewProvider>
      <div className="min-h-screen bg-canvas text-ivory flex flex-col font-sans selection:bg-signature selection:text-black">
        {/* Navigation Header */}
        <ViewerHeader
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim() && currentTab !== 'browse') {
              setCurrentTab('browse');
            }
          }}
          user={user}
          profile={profile}
          role={role}
          onOpenAuth={() => setShowAuthModal(true)}
          onSignOut={signOut}
        />

        {/* Main Content View */}
        <main className="flex-1 pb-16">
          {/* Search Results Overlay View if Search is active */}
          {searchQuery.trim() ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6">
              <div className="flex items-baseline justify-between border-b border-hairline pb-4">
                <h2 className="text-xl sm:text-2xl font-normal font-display tracking-widest text-ivory uppercase">
                  Search Results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
                  [{filteredFilms.length} {filteredFilms.length === 1 ? 'film' : 'films'}]
                </span>
              </div>

              {filteredFilms.length === 0 ? (
                <div className="py-24 text-center text-muted space-y-3">
                  <Film className="h-8 w-8 mx-auto opacity-40 text-muted" />
                  <p className="font-editorial text-lg text-ivory">No matching cinema records found.</p>
                  <p className="font-sans text-xs text-muted max-w-sm mx-auto">
                    Try searching by language, festival focus, or director name.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {filteredFilms.map((film) => (
                    <FilmCard
                      key={film.id}
                      film={film}
                      onPlay={(f) => setActiveWatchFilm(f)}
                      isInWatchlist={isInWatchlist(film.id)}
                      onToggleWatchlist={toggleWatchlist}
                      progressSeconds={getProgress(film.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : currentTab === 'home' ? (
            /* Home Tab: Hero Billboard & Curated Content Rails */
            <div className="space-y-6">
              {/* Hero Billboard */}
              <HeroBillboard
                films={featuredCarouselFilms}
                film={featuredFilm}
                onPlay={(f) => setActiveWatchFilm(f)}
                isInWatchlist={(id) => isInWatchlist(id)}
                onToggleWatchlist={toggleWatchlist}
                onSelectGenre={(slug) => {
                  setSelectedGenre(slug);
                  setCurrentTab('browse');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onMoreInfo={(f) => setMoreInfoFilm(f)}
              />

              {/* Rails Container */}
              <div className="relative -mt-6 sm:-mt-10 z-20 space-y-2">
                {/* Continue Watching (if viewer has history) */}
                {user && historyFilms.length > 0 && (
                  <ContentRail
                    title="Resuming Streams"
                    subtitle="Synchronized viewer positions"
                    films={historyFilms}
                    onPlay={(f) => setActiveWatchFilm(f)}
                    isInWatchlist={isInWatchlist}
                    onToggleWatchlist={toggleWatchlist}
                    getProgress={getProgress}
                  />
                )}

                {/* Trending / New Releases */}
                <ContentRail
                  title="Official Selections"
                  subtitle="Curated festival premieres and notable debuts"
                  films={films}
                  onPlay={(f) => setActiveWatchFilm(f)}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={toggleWatchlist}
                  getProgress={getProgress}
                />

                {/* Debut Spotlights */}
                {debutFilms.length > 0 && (
                  <ContentRail
                    title="First-Time Directors"
                    subtitle="Uncompromised vision from emerging auteurs"
                    films={debutFilms}
                    onPlay={(f) => setActiveWatchFilm(f)}
                    isInWatchlist={isInWatchlist}
                    onToggleWatchlist={toggleWatchlist}
                    getProgress={getProgress}
                  />
                )}

                {/* Drama Rail */}
                {dramaFilms.length > 0 && (
                  <ContentRail
                    title="Human Geographies & Drama"
                    subtitle="Intimate studies of relationships and quiet conflicts"
                    films={dramaFilms}
                    onPlay={(f) => setActiveWatchFilm(f)}
                    isInWatchlist={isInWatchlist}
                    onToggleWatchlist={toggleWatchlist}
                    getProgress={getProgress}
                  />
                )}

                {/* Thrillers */}
                {thrillerFilms.length > 0 && (
                  <ContentRail
                    title="Suspense & Noir"
                    subtitle="Tension, moral ambiguity, and atmospheric rhythm"
                    films={thrillerFilms}
                    onPlay={(f) => setActiveWatchFilm(f)}
                    isInWatchlist={isInWatchlist}
                    onToggleWatchlist={toggleWatchlist}
                    getProgress={getProgress}
                  />
                )}

                {/* Documentaries */}
                {docFilms.length > 0 && (
                  <ContentRail
                    title="Non-Fiction Archives"
                    subtitle="Endangered architectures, oral traditions, and real lives"
                    films={docFilms}
                    onPlay={(f) => setActiveWatchFilm(f)}
                    isInWatchlist={isInWatchlist}
                    onToggleWatchlist={toggleWatchlist}
                    getProgress={getProgress}
                  />
                )}
              </div>
            </div>
          ) : currentTab === 'browse' ? (
            /* Browse Tab: Full Catalogue Grid + Genre Tags */
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6">
              <div className="border-b border-hairline pb-4">
                <h1 className="text-3xl sm:text-4xl font-normal font-display tracking-widest text-ivory uppercase">
                  Catalogue Explorer
                </h1>
                <p className="font-editorial italic text-sm text-muted mt-1">
                  Browse the complete archive of independent cinema, indexed by curatorial category.
                </p>

                {/* Genre Filter Tags (Sharp 2px corners, no rounded pills) */}
                <div className="flex flex-wrap items-center gap-2 pt-4">
                  <button
                    onClick={() => setSelectedGenre(null)}
                    className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase tracking-wider transition-colors ${
                      selectedGenre === null
                        ? 'bg-signature text-black border border-signature font-bold'
                        : 'bg-graphite border border-hairline text-muted hover:text-ivory'
                    }`}
                  >
                    All Disciplines
                  </button>
                  {genres.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGenre(g.slug === selectedGenre ? null : g.slug)}
                      className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase tracking-wider transition-colors ${
                        selectedGenre === g.slug
                          ? 'bg-signature text-black border border-signature font-bold'
                          : 'bg-graphite border border-hairline text-muted hover:text-ivory'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Films Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 pt-2">
                {filteredFilms.map((film) => (
                  <FilmCard
                    key={film.id}
                    film={film}
                    onPlay={(f) => setActiveWatchFilm(f)}
                    isInWatchlist={isInWatchlist(film.id)}
                    onToggleWatchlist={toggleWatchlist}
                    progressSeconds={getProgress(film.id)}
                  />
                ))}
              </div>
            </div>
          ) : currentTab === 'watchlist' ? (
            /* Watchlist Tab */
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6">
              <div className="border-b border-hairline pb-4">
                <h1 className="text-3xl font-normal font-display tracking-widest text-ivory uppercase flex items-center gap-3">
                  <Bookmark className="h-6 w-6 text-signature" />
                  <span>Curated Queue</span>
                </h1>
                <p className="font-editorial italic text-sm text-muted mt-1">
                  Films you have reserved for deliberate personal screening.
                </p>
              </div>

              {watchlistFilms.length === 0 ? (
                <div className="py-24 text-center text-muted space-y-3">
                  <Bookmark className="h-10 w-10 mx-auto opacity-30 text-signature" />
                  <h3 className="font-editorial text-xl font-normal text-ivory">Your screening queue is clear</h3>
                  <p className="font-sans text-xs text-muted max-w-sm mx-auto">
                    Explore our festival catalogue and bookmark films to assemble your private program.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setCurrentTab('browse')}
                      className="btn-primary"
                    >
                      Explore Catalogue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {watchlistFilms.map((film) => (
                    <FilmCard
                      key={film.id}
                      film={film}
                      onPlay={(f) => setActiveWatchFilm(f)}
                      isInWatchlist={true}
                      onToggleWatchlist={toggleWatchlist}
                      progressSeconds={getProgress(film.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Watch History Tab */
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6">
              <div className="border-b border-hairline pb-4">
                <h1 className="text-3xl font-normal font-display tracking-widest text-ivory uppercase flex items-center gap-3">
                  <History className="h-6 w-6 text-muted" />
                  <span>Screening Log</span>
                </h1>
                <p className="font-editorial italic text-sm text-muted mt-1">
                  Archived screening records with synchronized playback timestamps.
                </p>
              </div>

              {historyFilms.length === 0 ? (
                <div className="py-24 text-center text-muted space-y-3">
                  <History className="h-10 w-10 mx-auto opacity-30 text-muted" />
                  <h3 className="font-editorial text-xl font-normal text-ivory">No screening activity recorded</h3>
                  <p className="font-sans text-xs text-muted max-w-sm mx-auto">
                    Begin screening any title and your exact progress will be logged here.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setCurrentTab('home')}
                      className="btn-primary"
                    >
                      Start Screening
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {historyFilms.map((film) => (
                    <FilmCard
                      key={film.id}
                      film={film}
                      onPlay={(f) => setActiveWatchFilm(f)}
                      isInWatchlist={isInWatchlist(film.id)}
                      onToggleWatchlist={toggleWatchlist}
                      progressSeconds={getProgress(film.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Video Streaming Player Modal */}
        <AnimatePresence>
          {activeWatchFilm && (
            <WatchModal
              film={activeWatchFilm}
              onClose={() => setActiveWatchFilm(null)}
              user={user}
              profile={profile}
              onOpenAuth={() => setShowAuthModal(true)}
              isInWatchlist={activeWatchFilm ? isInWatchlist(activeWatchFilm.id) : false}
              onToggleWatchlist={toggleWatchlist}
              initialProgressSeconds={activeWatchFilm ? getProgress(activeWatchFilm.id) : 0}
              onRecordProgress={recordProgress}
            />
          )}

          {/* More Info Details Modal */}
          {moreInfoFilm && (
            <MoreInfoModal
              film={moreInfoFilm}
              onClose={() => setMoreInfoFilm(null)}
              onPlay={(f) => setActiveWatchFilm(f)}
              isInWatchlist={moreInfoFilm ? isInWatchlist(moreInfoFilm.id) : false}
              onToggleWatchlist={toggleWatchlist}
            />
          )}
        </AnimatePresence>

        {/* Auth Modal */}
        <ViewerAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

        {/* Netflix-Style Hover Preview Portal */}
        <HoverPreviewPortal
          onPlay={(f) => setActiveWatchFilm(f)}
          isInWatchlist={isInWatchlist}
          onToggleWatchlist={toggleWatchlist}
          onMoreInfo={(f) => setMoreInfoFilm(f)}
          onSelectGenre={(g) => {
            setSelectedGenre(g);
            setCurrentTab('browse');
          }}
        />

        {/* Platform Editorial Masthead Footer (No Emoji in Chrome) */}
        <footer className="border-t border-hairline bg-canvas py-12 text-muted text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-graphite border border-hairline flex items-center justify-center rounded-sm">
                  <div className="w-2 h-2.5 border-y border-signature" />
                </div>
                <div>
                  <span className="font-display text-lg tracking-[0.08em] text-ivory">
                    TPF <span className="text-signature">CINEMAS</span>
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted block -mt-1">
                    Screening Beginners&apos; Dreams
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-wider text-muted">
                <button onClick={() => setCurrentTab('home')} className="hover:text-ivory transition-colors">
                  Curated
                </button>
                <button onClick={() => setCurrentTab('browse')} className="hover:text-ivory transition-colors">
                  Catalogue
                </button>
                <button onClick={() => setCurrentTab('watchlist')} className="hover:text-ivory transition-colors">
                  Queue
                </button>
              </div>
            </div>

            <div className="border-t border-hairline pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted text-[11px] font-mono">
              <p>© 2026 TPF Cinemas. Curated independent cinema platform.</p>
              <p className="tracking-wider uppercase text-[10px] text-muted">
                Screening Beginners&apos; Dreams worldwide.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </HoverPreviewProvider>
  );
}
