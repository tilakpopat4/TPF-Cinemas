import React, { useState } from 'react';
import { Film as FilmIcon, Plus, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useFilms } from './hooks/useFilms';
import { useGenres } from './hooks/useGenres';
import { Film } from './types';
import { StudioHeader } from './components/layout/StudioHeader';
import { StudioFooter } from './components/layout/StudioFooter';
import { StatsOverview } from './components/dashboard/StatsOverview';
import { OnboardingBanner } from './components/dashboard/OnboardingBanner';
import { FilmsList } from './components/dashboard/FilmsList';
import { FeedbackModal } from './components/dashboard/FeedbackModal';
import { FilmEditorModal } from './components/editor/FilmEditorModal';
import { LegalOnboardingModal } from './components/legal/LegalOnboardingModal';
import { useCreatorAgreement } from './hooks/useCreatorAgreement';
import { AuthModal } from './components/auth/AuthModal';
import { LanguageProvider } from './context/LanguageContext';

export const App: React.FC = () => {
  const { user, profile, isFilmmakerOrAdmin, loading: authLoading, becomeFilmmaker, signOut, refreshProfile } = useAuth();
  const { films, loading: filmsLoading, refreshFilms } = useFilms(user?.id);
  const { genres } = useGenres();
  const { hasSignedAgreement, refreshAgreement } = useCreatorAgreement(user?.id);

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState<Film | null>(null);
  const [feedbackFilm, setFeedbackFilm] = useState<Film | null>(null);
  const [legalModalOpen, setLegalModalOpen] = useState(false);

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
    // update_pending = still live, just awaiting edit approval
    if (filterTab === 'published') return f.status === 'published' || f.status === 'update_pending';
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

            {/* Controls Bar & Filter Tabs */}
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
                  All ({films.length})
                </button>
                <button
                  onClick={() => setFilterTab('drafts')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    filterTab === 'drafts'
                      ? 'bg-white/[0.12] text-ivory shadow-sm'
                      : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                  }`}
                >
                  Drafts & Revisions ({films.filter((f) => f.status === 'draft' || f.status === 'changes_requested').length})
                </button>
                <button
                  onClick={() => setFilterTab('review')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    filterTab === 'review'
                      ? 'bg-white/[0.12] text-ivory shadow-sm'
                      : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                  }`}
                >
                  In Review ({films.filter((f) => f.status === 'submitted' || f.status === 'approved').length})
                </button>
                <button
                  onClick={() => setFilterTab('published')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    filterTab === 'published'
                      ? 'bg-white/[0.12] text-ivory shadow-sm'
                      : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                  }`}
                >
                  Live ({films.filter((f) => f.status === 'published' || f.status === 'update_pending').length})
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={refreshFilms}
                  title="Refresh films list"
                  className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${filmsLoading ? 'animate-spin text-rose-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    setEditingFilm(null);
                    setEditorOpen(true);
                  }}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>Submit Film</span>
                </button>
              </div>
            </div>

            {/* Films Content */}
            {filmsLoading && films.length === 0 ? (
              <div className="py-20 text-center">
                <Loader2 className="h-8 w-8 text-rose-500 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading submissions...</p>
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
            )}
          </>
        )}
      </main>

      {/* Editor Modal */}
      {editorOpen && (
        <FilmEditorModal
          film={editingFilm}
          onClose={() => setEditorOpen(false)}
          onSaved={refreshFilms}
          userId={user.id}
          availableGenres={genres}
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
