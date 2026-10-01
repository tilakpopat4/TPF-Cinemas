import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Film, Bookmark, History, Heart } from 'lucide-react';
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
      <div className="min-h-screen bg-[#08090c] text-white flex flex-col">
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
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                Search Results for &ldquo;{searchQuery}&rdquo;
              </h2>
              <span className="text-xs text-zinc-400">
                {filteredFilms.length} {filteredFilms.length === 1 ? 'title' : 'titles'} found
              </span>
            </div>

            {filteredFilms.length === 0 ? (
              <div className="py-20 text-center text-zinc-500 space-y-2">
                <Film className="h-10 w-10 mx-auto opacity-40" />
                <p className="text-sm font-medium">No films matched your query.</p>
                <p className="text-xs text-zinc-600">Try searching by genre, language, or director name.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
            <div className="relative -mt-10 sm:-mt-16 z-20 space-y-2">
              {/* Continue Watching (if viewer has history) */}
              {user && historyFilms.length > 0 && (
                <ContentRail
                  title="Continue Watching"
                  subtitle="Pick up where you left off"
                  films={historyFilms}
                  onPlay={(f) => setActiveWatchFilm(f)}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={toggleWatchlist}
                  getProgress={getProgress}
                />
              )}

              {/* Trending / New Releases */}
              <ContentRail
                title="Trending & Premieres"
                subtitle="Curated official festival selections"
                films={films}
                onPlay={(f) => setActiveWatchFilm(f)}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={toggleWatchlist}
                getProgress={getProgress}
              />

              {/* Debut Spotlights */}
              {debutFilms.length > 0 && (
                <ContentRail
                  title="First-Time Directors Spotlight"
                  subtitle="Bold, uncompromised debut vision"
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
                  title="Intimate Drama & Human Stories"
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
                  title="Edge-of-the-Seat Thrillers"
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
                  title="Real Lives: Documentaries"
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
          /* Browse Tab: Full Catalogue Grid + Genre Pills */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl font-extrabold font-display text-white tracking-tight">
                Catalogue Explorer
              </h1>

              {/* Genre Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
                <button
                  onClick={() => setSelectedGenre(null)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedGenre === null
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  All Genres
                </button>
                {genres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenre(g.slug === selectedGenre ? null : g.slug)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectedGenre === g.slug
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800'
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6 animate-fade-in">
            <div className="border-b border-white/10 pb-4">
              <h1 className="text-3xl font-extrabold font-display text-white tracking-tight flex items-center gap-2.5">
                <Bookmark className="h-7 w-7 text-amber-500" />
                <span>My Watchlist</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Films you have saved for later streaming.
              </p>
            </div>

            {watchlistFilms.length === 0 ? (
              <div className="py-24 text-center text-zinc-500 space-y-3">
                <Bookmark className="h-12 w-12 mx-auto opacity-30 text-amber-500" />
                <h3 className="text-base font-bold text-white">Your watchlist is empty</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Explore our curated festival catalog and tap the bookmark icon to queue films.
                </p>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  Explore Catalogue
                </button>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6 animate-fade-in">
            <div className="border-b border-white/10 pb-4">
              <h1 className="text-3xl font-extrabold font-display text-white tracking-tight flex items-center gap-2.5">
                <History className="h-7 w-7 text-zinc-400" />
                <span>Watch History</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Films you recently streamed on TPF Cinemas.
              </p>
            </div>

            {historyFilms.length === 0 ? (
              <div className="py-24 text-center text-zinc-500 space-y-3">
                <History className="h-12 w-12 mx-auto opacity-30" />
                <h3 className="text-base font-bold text-white">No stream history yet</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Start watching any film and your progress will automatically sync here.
                </p>
                <button
                  onClick={() => setCurrentTab('home')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  Start Watching
                </button>
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

      {/* Platform Footer */}
      <footer className="border-t border-white/10 bg-[#06070a] py-12 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
                <Film className="h-4 w-4 text-black" />
              </div>
              <span className="font-display font-bold text-base text-white tracking-wider">
                TPF<span className="text-amber-500">CINEMAS</span>
              </span>
            </div>

            <div className="flex items-center gap-6 text-zinc-400">
              <button onClick={() => setCurrentTab('browse')} className="hover:text-white transition-colors">
                Catalogue
              </button>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-[11px]">
            <p>© 2026 TPF Cinemas. Celebrating independent cinema worldwide.</p>
            <p className="flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-current inline" /> for cinema lovers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  </HoverPreviewProvider>
  );
}
