import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Film, Bookmark, History } from 'lucide-react';
import { useViewerAuth } from './hooks/useViewerAuth';
import { useCatalogue } from './hooks/useCatalogue';
import { useWatchlist } from './hooks/useWatchlist';
import { useWatchHistory } from './hooks/useWatchHistory';
import { useUIManager, getFilmsForSection } from './hooks/useUIManager';
import { ViewerHeader } from './components/navigation/ViewerHeader';
import { ViewerFooter } from './components/navigation/ViewerFooter';
import { HeroBillboard } from './components/hero/HeroBillboard';
import { ContentRail } from './components/catalog/ContentRail';
import { NewFilmmakersSpotlight } from './components/catalog/NewFilmmakersSpotlight';
import { ContinueWatchingRail } from './components/catalog/ContinueWatchingRail';
import { Top10Rail } from './components/catalog/Top10Rail';
import { FilmCard } from './components/catalog/FilmCard';
import { WatchModal } from './components/player/WatchModal';
import { MoreInfoModal } from './components/player/MoreInfoModal';
import { ViewerAuthModal } from './components/auth/ViewerAuthModal';
import { LanguageProvider } from './context/LanguageContext';
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
  const { history, recordProgress, getProgress, dismissFromHistory, getInProgressFilms } = useWatchHistory(user?.id);

  // Dynamic UI Manager (Fully customizable sections, tab titles, reordering, creation)
  const {
    sections,
    tabTitles,
    heroConfig,
  } = useUIManager();

  const [currentTab, setCurrentTab] = useState<'home' | 'browse' | 'watchlist' | 'history'>('home');

  const [activeWatchFilm, setActiveWatchFilm] = useState<FilmType | null>(null);
  const [activeWatchMode, setActiveWatchMode] = useState<'movie' | 'trailer'>('movie');
  const [moreInfoFilm, setMoreInfoFilm] = useState<FilmType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingWatchFilm, setPendingWatchFilm] = useState<{ film: FilmType; mode: 'movie' | 'trailer' } | null>(null);

  // Mandatory requirement: Authentication required to watch cinema content
  const handlePlay = (film: FilmType, mode: 'movie' | 'trailer' = 'movie') => {
    if (!user) {
      setPendingWatchFilm({ film, mode });
      setShowAuthModal(true);
      return;
    }
    setActiveWatchFilm(film);
    setActiveWatchMode(mode);
  };

  // Automatically start playback once the user completes sign-in / sign-up
  useEffect(() => {
    if (user && pendingWatchFilm) {
      setActiveWatchFilm(pendingWatchFilm.film);
      setActiveWatchMode(pendingWatchFilm.mode);
      setPendingWatchFilm(null);
    }
  }, [user, pendingWatchFilm]);

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
  const inProgressFilms = getInProgressFilms(films);
  const top10Films = [...films]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 10);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-canvas text-ivory flex flex-col font-sans selection:bg-signature selection:text-black">
        {/* Navigation Header (Hidden in Theater Mode) */}
        {!activeWatchFilm && (
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
            tabTitles={tabTitles}
            onOpenAuth={() => setShowAuthModal(true)}
            onSignOut={signOut}
          />
        )}

        {/* Main Content View */}
        <main className="flex-1 pb-16">
          {/* Search Results Overlay View if Search is active */}
          {searchQuery.trim() ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 space-y-6">
              <div className="flex items-baseline justify-between pb-2">
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
                      onPlay={(f) => handlePlay(f)}
                      isInWatchlist={isInWatchlist(film.id)}
                      onToggleWatchlist={toggleWatchlist}
                      progressSeconds={getProgress(film.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : currentTab === 'home' ? (
            /* Home Tab: Hero Billboard & Dynamic Curated Content Rails from UI Manager */
            <div className="space-y-6">
              {/* Hero Billboard */}
              {heroConfig.enabled && (
                <HeroBillboard
                  films={featuredCarouselFilms}
                  film={featuredFilm}
                  onPlay={(f, mode) => handlePlay(f, mode)}
                  isInWatchlist={(id) => isInWatchlist(id)}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectGenre={(slug) => {
                    setSelectedGenre(slug);
                    setCurrentTab('browse');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onMoreInfo={(f) => setMoreInfoFilm(f)}
                />
              )}

              {/* Dynamic Rails Container — Controlled live from UI Manager */}
              <div className="relative -mt-6 sm:-mt-10 z-20 space-y-2">
                {sections
                  .filter((sec) => sec.enabled)
                  .map((sec) => {
                    const secFilms = getFilmsForSection(sec, films, inProgressFilms, top10Films);

                    // Section Type: Continue Watching
                    if (sec.type === 'continue_watching') {
                      if (!user || inProgressFilms.length === 0) return null;
                      return (
                        <ContinueWatchingRail
                          key={sec.id}
                          films={inProgressFilms}
                          onPlay={(f) => handlePlay(f, 'movie')}
                          isInWatchlist={isInWatchlist}
                          onToggleWatchlist={toggleWatchlist}
                          getProgress={getProgress}
                          onDismiss={dismissFromHistory}
                        />
                      );
                    }

                    // Section Type: Top 10 in India
                    if (sec.type === 'top10') {
                      if (top10Films.length === 0) return null;
                      return (
                        <Top10Rail
                          key={sec.id}
                          films={top10Films.slice(0, sec.limit || 10)}
                          onPlay={(f) => handlePlay(f, 'movie')}
                          isInWatchlist={isInWatchlist}
                          onToggleWatchlist={toggleWatchlist}
                          getProgress={getProgress}
                        />
                      );
                    }

                    // Section Type: Grid Showcase
                    if (sec.type === 'grid') {
                      if (secFilms.length === 0) return null;
                      return (
                        <section key={sec.id} className="relative py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                          <div className="flex items-baseline gap-3 pb-1">
                            <h2 className="text-xl sm:text-2xl font-normal font-display tracking-widest text-ivory uppercase">
                              {sec.title}
                            </h2>
                            <span className="font-mono text-[10px] text-muted tracking-widest">
                              [{secFilms.length}]
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                            {secFilms.map((film) => (
                              <FilmCard
                                key={film.id}
                                film={film}
                                onPlay={(f) => handlePlay(f)}
                                isInWatchlist={isInWatchlist(film.id)}
                                onToggleWatchlist={toggleWatchlist}
                                progressSeconds={getProgress(film.id)}
                              />
                            ))}
                          </div>
                        </section>
                      );
                    }

                    // Section Type: New Filmmakers Spotlight (Panoramic 16:9 Showcase)
                    if (sec.type === 'spotlight' || sec.filterType === 'debut') {
                      if (secFilms.length === 0) return null;
                      return (
                        <NewFilmmakersSpotlight
                          key={sec.id}
                          title={sec.title}
                          subtitle={sec.subtitle}
                          films={secFilms}
                          onPlay={(f, mode) => handlePlay(f, mode)}
                          isInWatchlist={(filmId) => isInWatchlist(filmId)}
                          onToggleWatchlist={toggleWatchlist}
                        />
                      );
                    }

                    // Section Type: Horizontal Content Rail (Default)
                    if (secFilms.length === 0) return null;

                    return (
                      <ContentRail
                        key={sec.id}
                        title={sec.title}
                        subtitle={sec.subtitle}
                        films={secFilms}
                        onPlay={(f) => handlePlay(f)}
                        isInWatchlist={isInWatchlist}
                        onToggleWatchlist={toggleWatchlist}
                        getProgress={getProgress}
                      />
                    );
                  })}
              </div>
            </div>
          ) : currentTab === 'browse' ? (
            /* Browse Tab: Full Catalogue Grid + Genre Tags */
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6">
              <div className="pb-2">
                <h1 className="text-3xl sm:text-4xl font-normal font-display tracking-widest text-ivory uppercase">
                  Catalogue Explorer
                </h1>
                <p className="font-editorial italic text-sm text-muted mt-1">
                  Browse the complete archive of independent cinema, indexed by curatorial category.
                </p>

                {/* Genre Filter Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-4">
                  <button
                    onClick={() => setSelectedGenre(null)}
                    className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors ${
                      selectedGenre === null
                        ? 'bg-signature text-black font-bold'
                        : 'bg-white/[0.08] text-muted hover:text-ivory hover:bg-white/[0.14]'
                    }`}
                  >
                    All Disciplines
                  </button>
                  {genres.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGenre(g.slug === selectedGenre ? null : g.slug)}
                      className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors ${
                        selectedGenre === g.slug
                          ? 'bg-signature text-black font-bold'
                          : 'bg-white/[0.08] text-muted hover:text-ivory hover:bg-white/[0.14]'
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
                    onPlay={(f) => handlePlay(f)}
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
              <div className="pb-2">
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
                      onPlay={(f) => handlePlay(f)}
                      isInWatchlist={true}
                      onToggleWatchlist={toggleWatchlist}
                      progressSeconds={getProgress(film.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : currentTab === 'history' ? (
            /* Watch History Tab */
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6">
              <div className="pb-2">
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
                      onPlay={(f) => handlePlay(f)}
                      isInWatchlist={isInWatchlist(film.id)}
                      onToggleWatchlist={toggleWatchlist}
                      progressSeconds={getProgress(film.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </main>

        {/* Video Streaming Player Modal */}
        <AnimatePresence>
          {activeWatchFilm && (
            <WatchModal
              film={activeWatchFilm}
              mode={activeWatchMode}
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

          {/* Netflix-Style Cinema More Info Details Modal */}
          {moreInfoFilm && (
            <MoreInfoModal
              film={moreInfoFilm}
              allFilms={films}
              onClose={() => setMoreInfoFilm(null)}
              onPlay={(f, mode) => {
                setMoreInfoFilm(null);
                handlePlay(f, mode);
              }}
              isInWatchlist={moreInfoFilm ? isInWatchlist(moreInfoFilm.id) : false}
              onToggleWatchlist={toggleWatchlist}
            />
          )}
        </AnimatePresence>

        {/* Auth Modal */}
        <ViewerAuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setPendingWatchFilm(null);
          }}
          contextPrompt={
            pendingWatchFilm
              ? `Sign in or sign up to stream "${pendingWatchFilm.film.title}"`
              : undefined
          }
        />

        {/* Netflix-Inspired Curatorial Footer */}
        <ViewerFooter
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      </div>
    </LanguageProvider>
  );
}
