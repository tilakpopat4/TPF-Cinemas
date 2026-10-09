import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ArrowLeft, Save, Send, Loader2, Tv, Film, Users, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Series, Genre, AgeRating, SeriesCredit } from '../../types';
import { EpisodeBuilder, DraftSeason } from './EpisodeBuilder';
import { supabase } from '../../lib/supabase';
import { slugify, extractYouTubeId } from '../../lib/utils';

interface NewSeriesModalProps {
  series: Series | null;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  availableGenres: Genre[];
}

const WIZARD_STEPS = [
  { id: 'info', title: 'Show Metadata', icon: Tv, desc: 'Title, synopsis & rating' },
  { id: 'episodes', title: 'Seasons & Episodes', icon: Film, desc: 'Organize episodic stream' },
  { id: 'credits', title: 'Cast & Credits', icon: Users, desc: 'Showrunner & creative team' },
  { id: 'rights', title: 'Rights Declaration', icon: ShieldCheck, desc: 'Streaming grant & clearance' },
];

export const NewSeriesModal: React.FC<NewSeriesModalProps> = ({
  series,
  onClose,
  onSaved,
  userId,
  availableGenres,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Core metadata
  const [title, setTitle] = useState(series?.title || '');
  const [slug, setSlug] = useState(series?.slug || '');
  const [synopsis, setSynopsis] = useState(series?.synopsis || '');
  const [creatorNote, setCreatorNote] = useState(series?.creator_note || '');
  const [language, setLanguage] = useState(series?.language || 'Hindi');
  const [ageRating, setAgeRating] = useState<AgeRating>((series?.age_rating as AgeRating) || 'UA13+');
  const [posterUrl, setPosterUrl] = useState(series?.poster_url || '');
  const [backdropUrl, setBackdropUrl] = useState(series?.backdrop_url || '');
  const [trailerRef, setTrailerRef] = useState(series?.trailer_ref || '');
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    series?.series_genres?.map((g) => g.genre_id) || []
  );

  // Step 2: Seasons & Episodes
  const [seasons, setSeasons] = useState<DraftSeason[]>(() => {
    if (series?.seasons && series.seasons.length > 0) {
      return series.seasons.map((s) => ({
        id: s.id,
        season_number: s.season_number,
        title: s.title,
        synopsis: s.synopsis || '',
        release_year: s.release_year || new Date().getFullYear(),
        episodes: (s.episodes || []).map((ep) => ({
          id: ep.id,
          episode_number: ep.episode_number,
          title: ep.title,
          synopsis: ep.synopsis || '',
          runtime_minutes: ep.runtime_minutes || 25,
          video_ref: ep.video_ref,
          thumbnail_url: ep.thumbnail_url || undefined,
        })),
      }));
    }
    return [
      {
        season_number: 1,
        title: 'Season 1',
        synopsis: '',
        release_year: new Date().getFullYear(),
        episodes: [
          {
            episode_number: 1,
            title: 'Episode 1',
            synopsis: '',
            runtime_minutes: 25,
            video_ref: '',
          },
        ],
      },
    ];
  });

  // Step 3: Credits
  const [credits, setCredits] = useState<SeriesCredit[]>(() => {
    if (series?.series_credits && series.series_credits.length > 0) {
      return series.series_credits;
    }
    return [
      { person_name: '', credit_role: 'Showrunner', sort_order: 1 },
      { person_name: '', credit_role: 'Director', sort_order: 2 },
      { person_name: '', credit_role: 'Lead Cast', sort_order: 3 },
    ];
  });

  // Step 4: Rights & Declarations
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [musicCleared, setMusicCleared] = useState(false);

  // Auto-slugify title
  useEffect(() => {
    if (!series && title) {
      setSlug(slugify(title));
    }
  }, [title, series]);

  function handleToggleGenre(genreId: number) {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter((id) => id !== genreId));
    } else {
      if (selectedGenres.length < 3) {
        setSelectedGenres([...selectedGenres, genreId]);
      }
    }
  }

  function handleAddCredit() {
    setCredits([...credits, { person_name: '', credit_role: 'Key Cast', sort_order: credits.length + 1 }]);
  }

  function handleRemoveCredit(idx: number) {
    setCredits(credits.filter((_, i) => i !== idx));
  }

  function handleUpdateCredit(idx: number, patch: Partial<SeriesCredit>) {
    const updated = [...credits];
    updated[idx] = { ...updated[idx], ...patch };
    setCredits(updated);
  }

  async function handleSave(submitForReview = false) {
    setError(null);

    if (!title.trim()) {
      setError('Show title is required');
      setCurrentStep(0);
      return;
    }

    if (!slug.trim()) {
      setError('Unique show slug is required');
      setCurrentStep(0);
      return;
    }

    // Validate seasons & episodes
    if (seasons.length === 0) {
      setError('Show must have at least one season');
      setCurrentStep(1);
      return;
    }

    let totalEpisodes = 0;
    for (const season of seasons) {
      if (season.episodes.length === 0) {
        setError(`Season "${season.title}" has no episodes`);
        setCurrentStep(1);
        return;
      }
      for (const ep of season.episodes) {
        if (!ep.title.trim()) {
          setError(`Every episode must have a title`);
          setCurrentStep(1);
          return;
        }
        if (submitForReview && (!ep.video_ref || ep.video_ref.trim().length < 6)) {
          setError(`Episode "${ep.title}" must have a valid YouTube video link before submitting`);
          setCurrentStep(1);
          return;
        }
        totalEpisodes++;
      }
    }

    if (submitForReview && (!rightsConfirmed || !musicCleared)) {
      setError('You must confirm the non-exclusive streaming rights and music clearances before submitting');
      setCurrentStep(3);
      return;
    }

    setSaving(true);
    try {
      let seriesId = series?.id;

      const cleanTrailer = trailerRef.trim() ? (extractYouTubeId(trailerRef) || trailerRef.trim()) : null;

      const seriesPayload = {
        filmmaker_id: userId,
        title: title.trim(),
        slug: slug.trim(),
        synopsis: synopsis.trim() || null,
        creator_note: creatorNote.trim() || null,
        language,
        age_rating: ageRating,
        poster_url: posterUrl.trim() || null,
        backdrop_url: backdropUrl.trim() || null,
        trailer_ref: cleanTrailer,
        total_seasons: seasons.length,
        status: series?.status || 'draft',
      };

      if (seriesId) {
        const { error: updateErr } = await supabase
          .from('series')
          .update(seriesPayload)
          .eq('id', seriesId);
        if (updateErr) throw updateErr;
      } else {
        const { data: newSeries, error: insertErr } = await supabase
          .from('series')
          .insert(seriesPayload)
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        seriesId = newSeries.id;
      }

      // Upsert Genres
      await supabase.from('series_genres').delete().eq('series_id', seriesId);
      if (selectedGenres.length > 0) {
        const genreRows = selectedGenres.map((gid) => ({
          series_id: seriesId,
          genre_id: gid,
        }));
        const { error: gErr } = await supabase.from('series_genres').insert(genreRows);
        if (gErr) throw gErr;
      }

      // Upsert Credits
      await supabase.from('series_credits').delete().eq('series_id', seriesId);
      const validCredits = credits.filter((c) => c.person_name.trim());
      if (validCredits.length > 0) {
        const creditRows = validCredits.map((c, i) => ({
          series_id: seriesId,
          person_name: c.person_name.trim(),
          credit_role: c.credit_role.trim(),
          sort_order: i + 1,
        }));
        const { error: cErr } = await supabase.from('series_credits').insert(creditRows);
        if (cErr) throw cErr;
      }

      // Upsert Seasons & Episodes
      // Note: Delete existing seasons to re-sync hierarchy cleanly for draft
      await supabase.from('seasons').delete().eq('series_id', seriesId);

      for (const season of seasons) {
        const { data: insertedSeason, error: sErr } = await supabase
          .from('seasons')
          .insert({
            series_id: seriesId,
            season_number: season.season_number,
            title: season.title.trim() || `Season ${season.season_number}`,
            synopsis: season.synopsis.trim() || null,
            release_year: season.release_year,
          })
          .select('id')
          .single();

        if (sErr) throw sErr;

        const epRows = season.episodes.map((ep) => ({
          season_id: insertedSeason.id,
          series_id: seriesId,
          episode_number: ep.episode_number,
          title: ep.title.trim(),
          synopsis: ep.synopsis.trim() || null,
          runtime_minutes: ep.runtime_minutes || 25,
          video_provider: 'youtube',
          video_ref: ep.video_ref.trim(),
          thumbnail_url: ep.thumbnail_url || (ep.video_ref ? `https://img.youtube.com/vi/${ep.video_ref}/hqdefault.jpg` : null),
        }));

        const { error: epErr } = await supabase.from('episodes').insert(epRows);
        if (epErr) throw epErr;
      }

      // If submitting, call submit_series RPC
      if (submitForReview) {
        const { error: rpcErr } = await supabase.rpc('submit_series', { p_series_id: seriesId });
        if (rpcErr) throw rpcErr;
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving series:', err);
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-[#0c0d12] shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white">
                {series ? 'Edit Web Series' : 'Create New Web Series'}
              </h2>
              <p className="text-xs text-white/50 font-mono">
                {WIZARD_STEPS[currentStep].title} — {WIZARD_STEPS[currentStep].desc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 border-b border-white/10 bg-black/40">
          {WIZARD_STEPS.map((st, idx) => {
            const Icon = st.icon;
            const isActive = currentStep === idx;
            const isCompleted = currentStep > idx;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`py-3 px-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  isActive
                    ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                    : isCompleted
                    ? 'border-emerald-500/50 text-white/80 hover:text-white'
                    : 'border-transparent text-white/40 hover:text-white/60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-white/40'}`} />
                )}
                <span className="hidden sm:inline">{st.title}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: Metadata */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Show Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Scavengers of Bombay"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-semibold focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Show Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. scavengers-of-bombay"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Primary Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
                  >
                    <option value="Hindi">Hindi</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Malayalam">Malayalam</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Marathi">Marathi</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Age Rating</label>
                  <select
                    value={ageRating}
                    onChange={(e) => setAgeRating(e.target.value as AgeRating)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
                  >
                    <option value="U">U (Universal)</option>
                    <option value="UA7+">UA7+</option>
                    <option value="UA13+">UA13+</option>
                    <option value="UA16+">UA16+</option>
                    <option value="A">A (18+ Adults Only)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Trailer Link (Optional)</label>
                  <input
                    type="text"
                    value={trailerRef}
                    onChange={(e) => setTrailerRef(e.target.value)}
                    placeholder="YouTube trailer URL or ID"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Genres */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                  Genres (Choose up to 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableGenres.map((g) => {
                    const isSelected = selectedGenres.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleToggleGenre(g.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black font-semibold'
                            : 'bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Artworks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Portrait Poster (2:3 URL)</label>
                  <input
                    type="text"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Backdrop Banner (16:9 URL)</label>
                  <input
                    type="text"
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Show Synopsis</label>
                <textarea
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Compelling overview of the series premise..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none resize-none"
                />
              </div>

              {/* Creator / Showrunner Note */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Creator Note (Optional)</label>
                <textarea
                  rows={2}
                  value={creatorNote}
                  onChange={(e) => setCreatorNote(e.target.value)}
                  placeholder="Creative statement, inspiration, or notes for the curation jury..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Seasons & Episodes */}
          {currentStep === 1 && (
            <EpisodeBuilder seasons={seasons} onChange={setSeasons} />
          )}

          {/* STEP 3: Cast & Credits */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">
                  Credit key team members and principal cast for the entire series.
                </span>
                <button
                  type="button"
                  onClick={handleAddCredit}
                  className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white font-medium transition-colors"
                >
                  + Add Credit
                </button>
              </div>

              <div className="space-y-2">
                {credits.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c.person_name}
                      onChange={(e) => handleUpdateCredit(idx, { person_name: e.target.value })}
                      placeholder="Name (e.g. Anurag Kashyap)"
                      className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
                    />
                    <input
                      type="text"
                      value={c.credit_role}
                      onChange={(e) => handleUpdateCredit(idx, { credit_role: e.target.value })}
                      placeholder="Role (e.g. Showrunner, Director)"
                      className="w-48 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCredit(idx)}
                      className="p-2 text-white/30 hover:text-red-400 rounded-lg hover:bg-white/5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Rights & Legal */}
          {currentStep === 3 && (
            <div className="space-y-4 max-w-xl mx-auto py-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                  Episodic Content Rights Undertaking
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  By submitting this series to TPF Cinemas, you declare and warrant that:
                </p>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rightsConfirmed}
                      onChange={(e) => setRightsConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 text-amber-500 focus:ring-0 bg-black/40"
                    />
                    <span className="text-xs text-white/80 group-hover:text-white leading-snug">
                      I hold all worldwide episodic streaming distribution rights, creative ownership, and permissions for all submitted seasons and episodes under TPF Cinemas' master licence.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={musicCleared}
                      onChange={(e) => setMusicCleared(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 text-amber-500 focus:ring-0 bg-black/40"
                    />
                    <span className="text-xs text-white/80 group-hover:text-white leading-snug">
                      All music, sound score, archival footage, and synchronization elements across all episodes are 100% original, copyright-cleared, or properly licensed for streaming.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Draft</span>
            </button>

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit Series</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
