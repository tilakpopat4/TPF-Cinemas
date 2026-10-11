import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Film, Bookmark, History, Tv } from 'lucide-react';
import { useViewerAuth } from './hooks/useViewerAuth';
import { useCatalogue } from './hooks/useCatalogue';
import { useSeriesCatalogue } from './hooks/useSeriesCatalogue';
import { useWatchlist } from './hooks/useWatchlist';
import { useWatchHistory } from './hooks/useWatchHistory';
import { useUIManager, getFilmsForSection } from './hooks/useUIManager';
import { ViewerHeader } from './components/navigation/ViewerHeader';
import { ViewerFooter } from './components/navigation/ViewerFooter';
import { HeroBillboard } from './components/hero/HeroBillboard';
import { ContentRail } from './components/catalog/ContentRail';
import { SeriesRail } from './components/series/SeriesRail';
import { SeriesDetailModal } from './components/series/SeriesDetailModal';
import { SeriesCard } from './components/series/SeriesCard';
import { NewFilmmakersSpotlight } from './components/catalog/NewFilmmakersSpotlight';
import { ContinueWatchingRail } from './components/catalog/ContinueWatchingRail';
import { Top10Rail } from './components/catalog/Top10Rail';
import { FilmCard } from './components/catalog/FilmCard';
import { WatchModal, EpisodicContext } from './components/player/WatchModal';
import { MoreInfoModal } from './components/player/MoreInfoModal';
import { ViewerAuthModal } from './components/auth/ViewerAuthModal';
import { LanguageProvider } from './context/LanguageContext';
import { Film as FilmType, Series, Season, Episode } from './types';

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

  const {
    seriesList,
    watchlistIds: seriesWatchlistIds,
    toggleSeriesWatchlist,
    isInWatchlist: isInSeriesWatchlist,
    recordEpisodeProgress,
    getEpisodeProgress,
  } = useSeriesCatalogue(user?.id);

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
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [activeEpisodicWatch, setActiveEpisodicWatch] = useState<EpisodicContext | null>(null);
  const [moreInfoFilm, setMoreInfoFilm] = useState<FilmType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingWatchFilm, setPendingWatchFilm] = useState<{ film: FilmType; mode: 'movie' | 'trailer' } | null>(null);
  const [pendingPlayEpisode, setPendingPlayEpisode] = useState<{
    series: Series;
    season: Season;
    episode: Episode;
  } | null>(null);

  // Mandatory requirement: Authentication required to watch cinema content
  const handlePlay = (film: FilmType, mode: 'movie' | 'trailer' = 'movie') => {
    // If the content is actually a web series, do not start video playback directly!
    // Open the SeriesDetailModal instead so the user can choose a season and episode.
    const matchingSeries = seriesList.find(
      (s) =>
        s.id === film.id ||
        s.slug === film.slug ||
        s.title.toLowerCase().trim() === film.title.toLowerCase().trim()
    );
    if (matchingSeries && mode !== 'trailer') {
      setSelectedSeries(matchingSeries);
      return;
    }

    if (!user) {
      setPendingWatchFilm({ film, mode });
      setShowAuthModal(true);
      return;
    }
    setActiveEpisodicWatch(null);
    setActiveWatchFilm(film);
    setActiveWatchMode(mode);
  };

  const handlePlayEpisode = (series: Series, season: Season, episode: Episode) => {
    if (!user) {
      setPendingPlayEpisode({ series, season, episode });
      setShowAuthModal(true);
      return;
    }
    setActiveWatchFilm(null);
    setSelectedSeries(null);
    setActiveEpisodicWatch({
      series,
      season,
      episode,
      allEpisodes: season.episodes || [],
    });
  };

  const handlePlaySeriesTrailer = (series: Series) => {
    if (!series.trailer_ref?.trim()) return;
    const trailerFilm: FilmType = {
      id: series.id,
      filmmaker_id: series.creator_id,
      title: `${series.title} (Official Trailer)`,
      slug: `${series.slug}-trailer`,
      synopsis: series.synopsis,
      runtime_minutes: 3,
      release_year: series.release_year,
      language: series.language,
      age_rating: series.age_rating,
      video_provider: 'youtube',
      video_ref: series.trailer_ref.trim(),
      trailer_ref: series.trailer_ref.trim(),
      poster_url: series.poster_url,
      backdrop_url: series.backdrop_url,
      is_featured: false,
      is_debut: false,
      status: 'published',
      published_at: series.published_at || series.created_at,
      view_count: 0,
      created_at: series.created_at,
      profiles: series.profiles,
    };
    setSelectedSeries(null);
    setActiveEpisodicWatch(null);
    setActiveWatchFilm(trailerFilm);
    setActiveWatchMode('trailer');
  };

  // Automatically start playback once the user completes sign-in / sign-up
  useEffect(() => {
    if (user && pendingWatchFilm) {
      setActiveWatchFilm(pendingWatchFilm.film);
      setActiveWatchMode(pendingWatchFilm.mode);
      setPendingWatchFilm(null);
    }
    if (user && pendingPlayEpisode) {
      handlePlayEpisode(
        pendingPlayEpisode.series,
        pendingPlayEpisode.season,
        pendingPlayEpisode.episode
      );
      setPendingPlayEpisode(null);
    }
  }, [user, pendingWatchFilm, pendingPlayEpisode]);

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

  const watchlistFilms = films.filter((f) => watchlistIds.has(f.id));
  const watchlistSeries = seriesList.filter((s) => seriesWatchlistIds.has(s.id));
  const historyFilms = films.filter((f) => history.has(f.id));
  const inProgressFilms = getInProgressFilms(films);
  const top10Films = [...films]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 10);

  const filteredSeries = selectedGenre
    ? seriesList.filter((s) => s.series_genres?.some((sg) => sg.genres?.slug === selectedGenre))
    : seriesList;

  const searchMatchingSeries = seriesList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return false;
    return (
      s.title.toLowerCase().includes(q) ||
      (s.synopsis && s.synopsis.toLowerCase().includes(q)) ||
      s.language.toLowerCase().includes(q) ||
      (s.profiles?.display_name && s.profiles.display_name.toLowerCase().includes(q)) ||
      s.series_genres?.some((sg) => sg.genres?.name.toLowerCase().includes(q))
    );
  });

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-canvas text-ivory flex flex-col font-sans selection:bg-signature selection:text-black">
        {/* Navigation Header (Hidden in Theater Mode) */}
        {!activeWatchFilm && !activeEpisodicWatch && (
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
                  [{filteredFilms.length + searchMatchingSeries.length} titles]
                </span>
              </div>

              {filteredFilms.length === 0 && searchMatchingSeries.length === 0 ? (
                <div className="py-24 text-center text-muted space-y-3">
                  <Film className="h-8 w-8 mx-auto opacity-40 text-muted" />
                  <p className="font-editorial text-lg text-ivory">No matching cinema records found.</p>
                  <p className="font-sans text-xs text-muted max-w-sm mx-auto">
                    Try searching by language, festival focus, or director name.
                  </p>
                </div>
              ) : (
                <div className="space-y-10">
                  {filteredFilms.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-mono text-xs uppercase tracking-wider text-muted flex items-center gap-2">
                        <Film className="w-3.5 h-3.5 text-signature" />
                        <span>Films ({filteredFilms.length})</span>
                      </h3>
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
                    </div>
                  )}

                  {searchMatchingSeries.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-mono text-xs uppercase tracking-wider text-muted flex items-center gap-2">
                        <Tv className="w-3.5 h-3.5 text-amber-500" />
                        <span>Original Web Series ({searchMatchingSeries.length})</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {searchMatchingSeries.map((s) => (
                          <SeriesCard
                            key={s.id}
                            series={s}
                            onSelect={setSelectedSeries}
                            isInWatchlist={isInSeriesWatchlist(s.id)}
                            onToggleWatchlist={toggleSeriesWatchlist}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : currentTab === 'home' ? (
            /* Home Tab: Hero Billboard & Dynamic Curated Content Rails from UI Manager */
            films.length === 0 && seriesList.length === 0 ? (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24 text-center space-y-5">
                <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-xl">
                  <Film className="h-10 w-10 text-signature opacity-80" />
                </div>
                <h2 className="text-2xl sm:text-4xl font-normal font-display tracking-widest text-ivory uppercase">
                  Festival Archive In Preparation
                </h2>
                <p className="font-editorial italic text-base sm:text-lg text-muted max-w-lg mx-auto leading-relaxed">
                  No films are currently published. Curated festival premieres and debut selections will appear here once approved by our curation team.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="https://tpfcinemas3.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-full bg-signature text-black font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-signature/20"
                  >
                    Submit Film in Studio
                  </a>
                </div>
              </div>
            ) : (
            <div className="space-y-6">
              {/* Hero Billboard */}
              {heroConfig.enabled && featuredFilm && (
                <HeroBillboard
                  films={featuredCarouselFilms}
                  film={featuredFilm}
                  seriesList={seriesList}
                  onSelectSeries={setSelectedSeries}
                  onPlaySeriesTrailer={handlePlaySeriesTrailer}
                  onPlay={(f, mode) => handlePlay(f, mode)}
                  isInWatchlist={(id) => isInWatchlist(id)}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectGenre={(slug) => {
                    setSelectedGenre(slug);
                    setCurrentTab('browse');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onMoreInfo={(f) => {
                    const matchingSeries = seriesList.find(
                      (s) =>
                        s.id === f.id ||
                        s.slug === f.slug ||
                        s.title.toLowerCase().trim() === f.title.toLowerCase().trim()
                    );
                    if (matchingSeries) {
                      setSelectedSeries(matchingSeries);
                    } else {
                      setMoreInfoFilm(f);
                    }
                  }}
                  customTagline={heroConfig.tagline}
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

                {/* Dedicated Original Web Series Rail */}
                {seriesList.length > 0 && (
                  <SeriesRail
                    seriesList={seriesList}
                    onSelectSeries={setSelectedSeries}
                    isInWatchlist={isInSeriesWatchlist}
                    onToggleWatchlist={toggleSeriesWatchlist}
                  />
                )}
              </div>
            </div>
            )
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

              {/* Films & Series Grid */}
              {filteredFilms.length === 0 && filteredSeries.length === 0 ? (
                <div className="py-24 text-center text-muted space-y-3">
                  <Film className="h-8 w-8 mx-auto opacity-30 text-signature" />
                  <h3 className="font-editorial text-xl font-normal text-ivory">No cinema found</h3>
                  <p className="font-sans text-xs text-muted max-w-sm mx-auto">
                    {selectedGenre
                      ? 'No films or series currently published under this category.'
                      : 'No titles are currently published in the catalogue. Check back soon for new festival releases!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-12 pt-2">
                  {filteredFilms.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-signature" />
                        <h2 className="text-sm font-mono uppercase tracking-wider text-muted">Feature Films & Shorts ({filteredFilms.length})</h2>
                      </div>
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
                    </div>
                  )}

                  {filteredSeries.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-amber-500" />
                        <h2 className="text-sm font-mono uppercase tracking-wider text-muted">Original Web Series ({filteredSeries.length})</h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {filteredSeries.map((s) => (
                          <SeriesCard
                            key={s.id}
                            series={s}
                            onSelect={setSelectedSeries}
                            isInWatchlist={isInSeriesWatchlist(s.id)}
                            onToggleWatchlist={toggleSeriesWatchlist}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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

              {watchlistFilms.length === 0 && watchlistSeries.length === 0 ? (
                <div className="py-24 text-center text-muted space-y-3">
                  <Bookmark className="h-10 w-10 mx-auto opacity-30 text-signature" />
                  <h3 className="font-editorial text-xl font-normal text-ivory">Your screening queue is clear</h3>
                  <p className="font-sans text-xs text-muted max-w-sm mx-auto">
                    Explore our festival catalogue and bookmark films or series to assemble your private program.
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
                <div className="space-y-8">
                  {watchlistSeries.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-mono uppercase tracking-widest text-amber-400 flex items-center gap-2">
                        <Tv className="w-4 h-4" />
                        <span>Saved Web Series ({watchlistSeries.length})</span>
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {watchlistSeries.map((series) => (
                          <div key={series.id}>
                            {/* Render card */}
                            <div
                              onClick={() => setSelectedSeries(series)}
                              className="group relative cursor-pointer select-none aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#12141a] transition-all duration-300 group-hover:-translate-y-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.6)] border border-white/[0.04] group-hover:border-amber-500/30"
                            >
                              <img
                                src={
                                  series.poster_url ||
                                  'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=600&auto=format&fit=crop'
                                }
                                alt={series.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 flex flex-col justify-end">
                                <span className="text-[10px] font-mono text-amber-400">
                                  {series.seasons?.length || 1} Seasons
                                </span>
                                <h3 className="font-editorial text-sm text-white font-medium truncate">
                                  {series.title}
                                </h3>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {watchlistFilms.length > 0 && (
                    <div className="space-y-3">
                      {watchlistSeries.length > 0 && (
                        <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                          <Film className="w-4 h-4" />
                          <span>Saved Films ({watchlistFilms.length})</span>
                        </h2>
                      )}
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
                    </div>
                  )}
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

          {/* Episodic Series Streaming Player Modal */}
          {activeEpisodicWatch && (
            <WatchModal
              mode="episode"
              episodicContext={activeEpisodicWatch}
              onSelectEpisode={(ep) =>
                setActiveEpisodicWatch((prev) =>
                  prev ? { ...prev, episode: ep } : null
                )
              }
              onClose={() => setActiveEpisodicWatch(null)}
              user={user}
              profile={profile}
              onOpenAuth={() => setShowAuthModal(true)}
              isInWatchlist={isInSeriesWatchlist(activeEpisodicWatch.series.id)}
              onToggleWatchlist={toggleSeriesWatchlist}
              initialProgressSeconds={getEpisodeProgress(activeEpisodicWatch.episode.id)}
              onRecordProgress={(id, seconds, completed) =>
                recordEpisodeProgress(id, seconds, completed)
              }
            />
          )}

          {/* Web Series Season & Episode Details Modal */}
          {selectedSeries && (
            <SeriesDetailModal
              series={selectedSeries}
              onClose={() => setSelectedSeries(null)}
              onPlayEpisode={handlePlayEpisode}
              onPlayTrailer={handlePlaySeriesTrailer}
              isInWatchlist={isInSeriesWatchlist(selectedSeries.id)}
              onToggleWatchlist={toggleSeriesWatchlist}
              getEpisodeProgress={getEpisodeProgress}
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
            setPendingPlayEpisode(null);
          }}
          contextPrompt={
            pendingPlayEpisode
              ? `Sign in or sign up to stream "${pendingPlayEpisode.series.title}: ${pendingPlayEpisode.episode.title}"`
              : pendingWatchFilm
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
