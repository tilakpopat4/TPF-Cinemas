import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion, fadeOnly, scaleModal } from '../../lib/motion';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Tv,
  Film,
  Users,
  ShieldCheck,
  CheckCircle2,
  Eye,
  AlertCircle,
  Plus,
} from 'lucide-react';
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
  { id: 'info', title: 'Series Metadata', icon: Tv, desc: 'Title, synopsis, rating & trailer' },
  { id: 'episodes', title: 'Seasons & Episodes', icon: Film, desc: 'Organize episodic stream architecture' },
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
  const reduced = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

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

  // Step 4: Rights & Declarations (pre-cleared if editing an existing series)
  const [rightsConfirmed, setRightsConfirmed] = useState(Boolean(series));
  const [musicCleared, setMusicCleared] = useState(Boolean(series));

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

  function isStepComplete(stepIndex: number): boolean {
    if (stepIndex === 0) {
      return Boolean(title.trim() && slug.trim() && synopsis.trim() && language);
    }
    if (stepIndex === 1) {
      return (
        seasons.length > 0 &&
        seasons.every((s) => s.episodes.length > 0 && s.episodes.every((ep) => ep.title.trim()))
      );
    }
    if (stepIndex === 2) {
      return credits.some((c) => c.person_name.trim());
    }
    if (stepIndex === 3) {
      return Boolean(series) || (rightsConfirmed && musicCleared);
    }
    return false;
  }

  function canAccessStep(stepIndex: number): boolean {
    if (stepIndex === 0) return true;
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepComplete(i)) return false;
    }
    return true;
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
          setError('Every episode must have a title');
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

    if (submitForReview && !series && (!rightsConfirmed || !musicCleared)) {
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
        ...(series?.published_at ? { published_at: series.published_at } : {}),
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

      // Smart sync seasons and episodes to preserve existing IDs and viewer watch histories
      const currentSeasonIds = seasons.map((s) => s.id).filter(Boolean) as string[];
      if (currentSeasonIds.length > 0) {
        await supabase
          .from('seasons')
          .delete()
          .eq('series_id', seriesId)
          .not('id', 'in', `(${currentSeasonIds.join(',')})`);
      } else if (!series) {
        await supabase.from('seasons').delete().eq('series_id', seriesId);
      }

      for (const season of seasons) {
        let seasonId = season.id;
        const seasonPayload = {
          series_id: seriesId,
          season_number: season.season_number,
          title: season.title.trim() || `Season ${season.season_number}`,
          synopsis: season.synopsis.trim() || null,
          release_year: season.release_year,
        };

        if (seasonId) {
          const { error: sUpdateErr } = await supabase
            .from('seasons')
            .update(seasonPayload)
            .eq('id', seasonId);
          if (sUpdateErr) throw sUpdateErr;
        } else {
          const { data: insertedSeason, error: sErr } = await supabase
            .from('seasons')
            .insert(seasonPayload)
            .select('id')
            .single();
          if (sErr) throw sErr;
          seasonId = insertedSeason.id;
        }

        // Delete removed episodes in this season
        const currentEpIds = season.episodes.map((ep) => ep.id).filter(Boolean) as string[];
        if (currentEpIds.length > 0) {
          await supabase
            .from('episodes')
            .delete()
            .eq('season_id', seasonId)
            .not('id', 'in', `(${currentEpIds.join(',')})`);
        }

        // Update existing episodes or insert new ones
        for (const ep of season.episodes) {
          const cleanEpVideo = extractYouTubeId(ep.video_ref) || ep.video_ref.trim();
          const epPayload = {
            season_id: seasonId,
            series_id: seriesId,
            episode_number: ep.episode_number,
            title: ep.title.trim(),
            synopsis: ep.synopsis.trim() || null,
            runtime_minutes: ep.runtime_minutes || 25,
            video_provider: 'youtube',
            video_ref: cleanEpVideo,
            thumbnail_url: ep.thumbnail_url || (cleanEpVideo ? `https://img.youtube.com/vi/${cleanEpVideo}/hqdefault.jpg` : null),
          };

          if (ep.id) {
            const { error: epUpdateErr } = await supabase
              .from('episodes')
              .update(epPayload)
              .eq('id', ep.id);
            if (epUpdateErr) throw epUpdateErr;
          } else {
            const { error: epInsertErr } = await supabase
              .from('episodes')
              .insert(epPayload);
            if (epInsertErr) throw epInsertErr;
          }
        }
      }

      // If submitting a new/draft series, call submit_series RPC
      if (submitForReview && series?.status !== 'published') {
        const { error: rpcErr } = await supabase.rpc('submit_series', { p_series_id: seriesId });
        if (rpcErr) throw rpcErr;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving series:', err);
      if (
        err?.message?.includes('schema cache') ||
        err?.message?.includes('series') ||
        err?.code === 'PGRST205' ||
        err?.code === 'PGRST202' ||
        err?.code === '42501'
      ) {
        setError('Database migration required: Please run migration 20261011000003_allow_published_series_updates.sql in your Supabase SQL Editor.');
      } else {
        setError(err?.message || 'Failed to save series. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  // Real-time extracted trailer ID
  const cleanTrailerId = trailerRef.trim()
    ? extractYouTubeId(trailerRef) || (trailerRef.trim().length === 11 ? trailerRef.trim() : '')
    : '';

  const totalEpisodeCount = seasons.reduce((sum, s) => sum + s.episodes.length, 0);
  const selectedGenreObjects = availableGenres.filter((g) => selectedGenres.includes(g.id));

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl"
      {...fadeOnly(reduced)}
    >
      <motion.div
        className="relative w-full max-w-6xl max-h-[94vh] rounded-sm border border-hairline bg-canvas shadow-2xl flex flex-col overflow-hidden text-ivory"
        {...scaleModal(reduced)}
      >
        {/* Modal Topbar */}
        <div className="flex items-center justify-between border-b border-hairline bg-graphite/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-signature/15 border border-hairline-signature text-signature">
              <Tv className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-ivory tracking-wide uppercase">
                {series
                  ? series.status === 'published'
                    ? `Edit Published Series: ${series.title}`
                    : `Edit: ${series.title}`
                  : 'New Web Series Distribution Suite'}
              </h2>
              <p className="text-[11px] text-muted font-mono uppercase tracking-wider">
                {series?.status === 'published'
                  ? `Live On Platform · Step ${currentStep + 1} of 4: ${WIZARD_STEPS[currentStep].title}`
                  : `Step ${currentStep + 1} of 4: ${WIZARD_STEPS[currentStep].title}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-graphite hover:bg-white/10 text-xs font-mono uppercase tracking-wider text-muted hover:text-ivory transition-colors border border-hairline"
            >
              <Eye className="h-3.5 w-3.5 text-signature" />
              <span>{showPreview ? 'Hide Preview' : 'Live Preview'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-sm text-muted hover:text-ivory hover:bg-white/10 transition-colors"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-500/30 rounded-sm text-xs text-rose-300 font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Body: Left Stepper Rail + Center Form Pane + Right Live Preview */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Vertical Stepper Rail */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-hairline bg-canvas p-4 flex md:flex-col gap-2 shrink-0">
            {WIZARD_STEPS.map((st, idx) => {
              const Icon = st.icon;
              const isActive = currentStep === idx;
              const isCompleted = isStepComplete(idx);
              const isAccessible = canAccessStep(idx);

              return (
                <button
                  key={st.id}
                  type="button"
                  disabled={!isAccessible}
                  onClick={() => {
                    if (isAccessible) setCurrentStep(idx);
                  }}
                  className={`flex items-start gap-3 p-3 rounded-sm text-left transition-all w-full shrink-0 border ${
                    isActive
                      ? 'bg-graphite border-l-2 border-l-signature border-hairline shadow-sm'
                      : isCompleted
                      ? 'bg-canvas hover:bg-graphite/40 border-hairline text-ivory/80'
                      : 'bg-canvas/50 border-hairline/40 text-muted/50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span
                        className={`flex items-center justify-center w-4 h-4 rounded-sm text-[10px] font-mono font-bold ${
                          isActive ? 'bg-signature text-black' : 'bg-white/10 text-muted'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <div
                      className={`text-xs font-display uppercase tracking-wider ${
                        isActive ? 'text-ivory font-bold' : 'text-ivory/80'
                      }`}
                    >
                      {st.title}
                    </div>
                    <div className="text-[10px] text-muted line-clamp-1 mt-0.5 font-sans">{st.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Middle Active Step Pane */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-graphite/30">
            {/* STEP 1: Metadata */}
            {currentStep === 0 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Show Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Scavengers of Bombay"
                      className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-sm font-semibold focus:border-signature outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Show Slug *</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. scavengers-of-bombay"
                      className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs font-mono focus:border-signature outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Primary Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs focus:border-signature outline-none"
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
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Age Rating</label>
                    <select
                      value={ageRating}
                      onChange={(e) => setAgeRating(e.target.value as AgeRating)}
                      className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs focus:border-signature outline-none"
                    >
                      <option value="U">U (Universal)</option>
                      <option value="UA7+">UA7+</option>
                      <option value="UA13+">UA13+</option>
                      <option value="UA16+">UA16+</option>
                      <option value="A">A (18+ Adults Only)</option>
                    </select>
                  </div>
                </div>

                {/* Genres */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted">
                    Curatorial Genres (Choose up to 3)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.map((g) => {
                      const isSelected = selectedGenres.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => handleToggleGenre(g.id)}
                          className={`px-3 py-1 rounded-sm text-xs font-mono uppercase tracking-wider transition-all border ${
                            isSelected
                              ? 'bg-signature text-black font-bold border-signature shadow-sm'
                              : 'bg-canvas hover:bg-graphite text-ivory/70 border-hairline'
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
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Portrait Poster (2:3 URL)</label>
                    <input
                      type="text"
                      value={posterUrl}
                      onChange={(e) => setPosterUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs focus:border-signature outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Backdrop Banner (16:9 URL)</label>
                    <input
                      type="text"
                      value={backdropUrl}
                      onChange={(e) => setBackdropUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs focus:border-signature outline-none"
                    />
                  </div>
                </div>

                {/* Official Series Trailer Card */}
                <div className="p-4 rounded-sm bg-graphite/60 border border-hairline space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-signature" />
                      <label className="text-xs font-display uppercase tracking-wider text-ivory">
                        Official Series Trailer (Optional)
                      </label>
                    </div>
                    {cleanTrailerId && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Trailer Verified</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={trailerRef}
                      onChange={(e) => setTrailerRef(e.target.value)}
                      placeholder="Paste YouTube trailer link or ID (e.g. https://youtu.be/... or EmFDd_MvVKo)"
                      className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs font-mono focus:border-signature outline-none"
                    />
                    <p className="text-[11px] text-muted">
                      When linked, viewers get an official <strong>Watch Trailer</strong> button on the billboard and series detail page.
                    </p>
                  </div>

                  {cleanTrailerId && (
                    <div className="relative aspect-video max-w-sm rounded-sm overflow-hidden border border-hairline bg-black shadow-lg mt-2">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${cleanTrailerId}?rel=0`}
                        title="Trailer preview"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>

                {/* Synopsis */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Show Synopsis *</label>
                  <textarea
                    rows={3}
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    placeholder="Compelling overview of the series premise..."
                    className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs font-editorial italic focus:border-signature outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Creator Note */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Creator Note (Optional)</label>
                  <textarea
                    rows={2}
                    value={creatorNote}
                    onChange={(e) => setCreatorNote(e.target.value)}
                    placeholder="Creative statement, inspiration, or notes for the curation jury..."
                    className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs font-editorial italic focus:border-signature outline-none resize-none"
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
                <div className="flex items-center justify-between border-b border-hairline pb-2">
                  <div>
                    <h3 className="font-display text-sm text-ivory uppercase tracking-wide">Creative Cast & Credits</h3>
                    <p className="text-[11px] text-muted">Credit key team members and principal cast for the entire series.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCredit}
                    className="px-3 py-1.5 rounded-sm border border-hairline bg-graphite hover:bg-white/5 text-xs font-mono uppercase tracking-wider text-ivory transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-signature" />
                    <span>Add Credit</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {credits.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={c.person_name}
                        onChange={(e) => handleUpdateCredit(idx, { person_name: e.target.value })}
                        placeholder="Person Name (e.g. Anurag Kashyap)"
                        className="flex-1 px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs focus:border-signature outline-none"
                      />
                      <input
                        type="text"
                        value={c.credit_role}
                        onChange={(e) => handleUpdateCredit(idx, { credit_role: e.target.value })}
                        placeholder="Role (e.g. Showrunner, Director)"
                        className="w-48 px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs focus:border-signature outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCredit(idx)}
                        className="p-2 text-muted hover:text-rose-400 rounded-sm hover:bg-white/5 transition-colors"
                        title="Remove Credit"
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
                <div className="p-6 rounded-sm bg-graphite border border-hairline space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-hairline">
                    <ShieldCheck className="w-5 h-5 text-signature" />
                    <h3 className="font-display text-base uppercase tracking-wider text-ivory">
                      Episodic Content Rights Declaration
                    </h3>
                  </div>

                  <p className="text-xs text-muted leading-relaxed font-sans">
                    By submitting this series to TPF Cinemas, you declare and warrant that:
                  </p>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rightsConfirmed}
                        onChange={(e) => setRightsConfirmed(e.target.checked)}
                        className="mt-0.5 rounded-sm border-hairline text-signature focus:ring-0 bg-canvas"
                      />
                      <span className="text-xs text-ivory/80 group-hover:text-ivory leading-snug">
                        I hold all worldwide episodic streaming distribution rights, creative ownership, and permissions for all submitted seasons and episodes under TPF Cinemas' master licence.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={musicCleared}
                        onChange={(e) => setMusicCleared(e.target.checked)}
                        className="mt-0.5 rounded-sm border-hairline text-signature focus:ring-0 bg-canvas"
                      />
                      <span className="text-xs text-ivory/80 group-hover:text-ivory leading-snug">
                        All music, sound score, archival footage, and synchronization elements across all episodes are 100% original, copyright-cleared, or properly licensed for streaming.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview Pane */}
          {showPreview && (
            <div className="hidden lg:flex w-72 p-6 border-l border-hairline bg-canvas flex-col gap-4 shrink-0 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted">Live Platform Card</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-signature/15 text-signature text-[9px] font-mono font-bold">
                  Preview
                </span>
              </div>

              {/* Mock Series Card */}
              <div className="rounded-sm bg-graphite border border-hairline overflow-hidden shadow-lg flex flex-col">
                <div className="relative aspect-[16/9] bg-canvas overflow-hidden border-b border-hairline">
                  {backdropUrl || posterUrl ? (
                    <img
                      src={backdropUrl || posterUrl}
                      alt={title || 'Preview'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted/40">
                      <Tv className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-mono">No artwork linked</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-black/40" />

                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-sm bg-graphite/80 border border-hairline text-ivory/80 text-[8px] font-mono uppercase tracking-wider">
                      {series?.status || 'Draft'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded-sm bg-black/75 text-ivory border border-hairline text-[8px] font-mono">
                      {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-black/75 text-ivory border border-hairline text-[8px] font-mono">
                      {totalEpisodeCount} Eps
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-signature font-bold uppercase">
                    <span>{language}</span>
                    <span className="text-muted">· {ageRating}</span>
                  </div>
                  <h4 className="font-display text-sm text-ivory uppercase tracking-wide line-clamp-1">
                    {title || 'Untitled Series'}
                  </h4>
                  <p className="font-editorial italic text-[11px] text-muted/80 line-clamp-2">
                    {synopsis || 'Enter a show synopsis to preview the curatorial summary.'}
                  </p>
                  {selectedGenreObjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedGenreObjects.map((g) => (
                        <span key={g.id} className="text-[8px] font-mono text-muted bg-white/5 px-1.5 py-0.2 rounded-sm border border-hairline">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-hairline bg-canvas">
          <div>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 rounded-sm border border-hairline bg-graphite hover:bg-white/5 text-xs font-mono uppercase tracking-wider text-ivory flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-sm border border-hairline bg-graphite hover:bg-white/5 text-xs font-mono uppercase tracking-wider text-ivory flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{series?.status === 'published' ? 'Save Changes' : 'Save Draft'}</span>
            </button>

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-sm bg-signature hover:bg-signature-hover text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(series?.status === 'published' ? false : true)}
                className="px-5 py-2.5 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : series?.status === 'published' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{series?.status === 'published' ? 'Update Live Series' : 'Submit Series'}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
