import React, { useState } from 'react';
import { Film as FilmIcon, Plus, Loader2, RefreshCw, Tv } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useFilms } from './hooks/useFilms';
import { useSeries } from './hooks/useSeries';
import { useGenres } from './hooks/useGenres';
import { Film, Series } from './types';
import { StudioHeader } from './components/layout/StudioHeader';
import { StudioFooter } from './components/layout/StudioFooter';
import { StatsOverview } from './components/dashboard/StatsOverview';
import { OnboardingBanner } from './components/dashboard/OnboardingBanner';
import { FilmsList } from './components/dashboard/FilmsList';
import { FeedbackModal } from './components/dashboard/FeedbackModal';
import { FilmEditorModal } from './components/editor/FilmEditorModal';
import { NewSeriesModal } from './components/series/NewSeriesModal';
import { SeriesCard } from './components/series/SeriesCard';
import { SeriesFeedbackModal } from './components/series/SeriesFeedbackModal';
import { LegalOnboardingModal } from './components/legal/LegalOnboardingModal';
import { useCreatorAgreement } from './hooks/useCreatorAgreement';
import { AuthModal } from './components/auth/AuthModal';
import { LanguageProvider } from './context/LanguageContext';

export const App: React.FC = () => {
  const { user, profile, isFilmmakerOrAdmin, loading: authLoading, becomeFilmmaker, signOut, refreshProfile } = useAuth();
  const { films, loading: filmsLoading, refreshFilms } = useFilms(user?.id);
  const { seriesList, loading: seriesLoading, refreshSeries, deleteSeries } = useSeries(user?.id);
  const { genres } = useGenres();
  const { hasSignedAgreement, refreshAgreement } = useCreatorAgreement(user?.id);

  // Content type toggle: Films vs Series
  const [contentType, setContentType] = useState<'films' | 'series'>('films');

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState<Film | null>(null);
  const [feedbackFilm, setFeedbackFilm] = useState<Film | null>(null);
  const [legalModalOpen, setLegalModalOpen] = useState(false);

  // Series modals state
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [feedbackSeries, setFeedbackSeries] = useState<Series | null>(null);

  // Filter tab state
  const [filterTab, setFilterTab] = useState<'all' | 'drafts' | 'review' | 'published'>('all');

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas text-ivory">
        <Loader2 className="h-10 w-10 text-signature animate-spin mb-3" />
        <p className="text-sm font-medium">Loading TPF Filmmaker Studio...</p>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return <AuthModal onSuccess={refreshProfile} />;
  }

  // Filtered films list
  const filteredFilms = films.filter((f) => {
    if (filterTab === 'drafts') return f.status === 'draft' || f.status === 'changes_requested';
    if (filterTab === 'review') return f.status === 'submitted' || f.status === 'approved';
    if (filterTab === 'published') return f.status === 'published' || f.status === 'update_pending';
    return true;
  });

  // Filtered series list
  const filteredSeries = seriesList.filter((s) => {
    if (filterTab === 'drafts') return s.status === 'draft' || s.status === 'changes_requested';
    if (filterTab === 'review') return s.status === 'submitted' || s.status === 'approved';
    if (filterTab === 'published') return s.status === 'published';
    return true;
  });

  const handleOpenNewFilm = () => {
    if (!hasSignedAgreement) {
      setLegalModalOpen(true);
      return;
    }
    setEditingFilm(null);
    setEditorOpen(true);
  };

  const handleOpenNewSeries = () => {
    if (!hasSignedAgreement) {
      setLegalModalOpen(true);
      return;
    }
    setEditingSeries(null);
    setSeriesModalOpen(true);
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-canvas text-ivory flex flex-col font-sans selection:bg-signature selection:text-black">
        {/* Unified Header */}
        <StudioHeader
          profile={profile}
          email={user.email}
          isFilmmaker={isFilmmakerOrAdmin}
          activeFilter={filterTab}
          onFilterChange={setFilterTab}
          onNewFilm={handleOpenNewFilm}
          hasSignedAgreement={hasSignedAgreement}
          onOpenAgreement={() => setLegalModalOpen(true)}
          onSignOut={signOut}
        />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Onboarding Banner for Viewers */}
        {!isFilmmakerOrAdmin && (
          <OnboardingBanner onRequestBecomeFilmmaker={() => setLegalModalOpen(true)} />
        )}

        {isFilmmakerOrAdmin && (
          <>
            {/* Top Stats Overview */}
            <StatsOverview films={films} />

            {/* Content Category Selector: Films vs Web Series */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setContentType('films')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    contentType === 'films'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <FilmIcon className="w-4 h-4" />
                  <span>Feature & Short Films ({films.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContentType('series')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    contentType === 'series'
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>Web Series ({seriesList.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {contentType === 'films' ? (
                  <button
                    onClick={handleOpenNewFilm}
                    className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Submit Film</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenNewSeries}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Web Series</span>
                  </button>
                )}
              </div>
            </div>

            {/* Controls Bar & Status Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    filterTab === 'all'
                      ? 'bg-white/[0.12] text-ivory shadow-sm'
                      : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                  }`}
                >
                  All ({contentType === 'films' ? films.length : seriesList.length})
                </button>
                <button
                  onClick={() => setFilterTab('drafts')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    filterTab === 'drafts'
                      ? 'bg-white/[0.12] text-ivory shadow-sm'
                      : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                  }`}
                >
                  Drafts & Revisions (
                  {contentType === 'films'
                    ? films.filter((f) => f.status === 'draft' || f.status === 'changes_requested').length
                    : seriesList.filter((s) => s.status === 'draft' || s.status === 'changes_requested').length}
                  )
                </button>
                <button
                  onClick={() => setFilterTab('review')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    filterTab === 'review'
                      ? 'bg-white/[0.12] text-ivory shadow-sm'
                      : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                  }`}
                >
                  In Review (
                  {contentType === 'films'
                    ? films.filter((f) => f.status === 'submitted' || f.status === 'approved').length
                    : seriesList.filter((s) => s.status === 'submitted' || s.status === 'approved').length}
                  )
                </button>
                <button
                  onClick={() => setFilterTab('published')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    filterTab === 'published'
                      ? 'bg-white/[0.12] text-ivory shadow-sm'
                      : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                  }`}
                >
                  Live (
                  {contentType === 'films'
                    ? films.filter((f) => f.status === 'published' || f.status === 'update_pending').length
                    : seriesList.filter((s) => s.status === 'published').length}
                  )
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={contentType === 'films' ? refreshFilms : refreshSeries}
                  title="Refresh catalog list"
                  className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${(contentType === 'films' ? filmsLoading : seriesLoading) ? 'animate-spin text-amber-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Films vs Series Content Display */}
            {contentType === 'films' ? (
              filmsLoading && films.length === 0 ? (
                <div className="py-20 text-center">
                  <Loader2 className="h-8 w-8 text-rose-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading film submissions...</p>
                </div>
              ) : (
                <FilmsList
                  films={filteredFilms}
                  onEdit={(film) => {
                    setEditingFilm(film);
                    setEditorOpen(true);
                  }}
                  onViewFeedback={(film) => setFeedbackFilm(film)}
                  onRefresh={refreshFilms}
                />
              )
            ) : (
              seriesLoading && seriesList.length === 0 ? (
                <div className="py-20 text-center">
                  <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading web series...</p>
                </div>
              ) : filteredSeries.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <Tv className="h-12 w-12 text-white/20 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No Web Series Found</h3>
                  <p className="text-xs text-white/50 mb-4 max-w-sm mx-auto">
                    Create and publish serialized stories with multi-season and episodic video support.
                  </p>
                  <button
                    onClick={handleOpenNewSeries}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Series</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSeries.map((s) => (
                    <SeriesCard
                      key={s.id}
                      series={s}
                      onEdit={(ser) => {
                        setEditingSeries(ser);
                        setSeriesModalOpen(true);
                      }}
                      onDelete={deleteSeries}
                      onViewFeedback={(ser) => setFeedbackSeries(ser)}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Film Editor Modal */}
      {editorOpen && (
        <FilmEditorModal
          film={editingFilm}
          onClose={() => setEditorOpen(false)}
          onSaved={refreshFilms}
          userId={user.id}
          availableGenres={genres}
        />
      )}

      {/* Series Editor Wizard Modal */}
      {seriesModalOpen && (
        <NewSeriesModal
          series={editingSeries}
          onClose={() => setSeriesModalOpen(false)}
          onSaved={refreshSeries}
          userId={user.id}
          availableGenres={genres}
        />
      )}

      {/* Series Curator Feedback Modal */}
      {feedbackSeries && (
        <SeriesFeedbackModal
          series={feedbackSeries}
          onClose={() => setFeedbackSeries(null)}
          onEdit={(ser) => {
            setFeedbackSeries(null);
            setEditingSeries(ser);
            setSeriesModalOpen(true);
          }}
        />
      )}

      {/* Curator Feedback Modal */}
      {feedbackFilm && (
        <FeedbackModal
          film={feedbackFilm}
          onClose={() => setFeedbackFilm(null)}
          onEdit={(film) => {
            setFeedbackFilm(null);
            setEditingFilm(film);
            setEditorOpen(true);
          }}
        />
      )}

      {/* Creator Legal Onboarding Modal */}
      {legalModalOpen && (
        <LegalOnboardingModal
          userId={user.id}
          userEmail={user.email || ''}
          defaultName={profile?.display_name || ''}
          onClose={() => setLegalModalOpen(false)}
          onSuccess={async () => {
            if (!isFilmmakerOrAdmin) {
              await becomeFilmmaker();
              await refreshProfile();
            }
            setLegalModalOpen(false);
            refreshAgreement();
            if (isFilmmakerOrAdmin) {
              setEditingFilm(null);
              setEditorOpen(true);
            }
          }}
          required={!hasSignedAgreement || !isFilmmakerOrAdmin}
        />
      )}

      {/* Unified Footer */}
      <StudioFooter onOpenSubmission={handleOpenNewFilm} />
    </div>
  </LanguageProvider>
);
};
export default App;
