import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useReducedMotion, fadeOnly, scaleModal } from '../../lib/motion';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
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

const STEPS = [
  { id: 'info', title: 'Details' },
  { id: 'episodes', title: 'Episodes' },
  { id: 'credits', title: 'Cast & Crew' },
  { id: 'rights', title: 'Rights' },
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

  // Artwork file upload states
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterProgress, setPosterProgress] = useState(0);
  const [posterUploadError, setPosterUploadError] = useState<string | null>(null);
  const [showPosterUrlInput, setShowPosterUrlInput] = useState(false);

  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const [backdropProgress, setBackdropProgress] = useState(0);
  const [backdropUploadError, setBackdropUploadError] = useState<string | null>(null);
  const [showBackdropUrlInput, setShowBackdropUrlInput] = useState(false);

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

  async function handlePosterFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setPosterUploadError(null);
    setPosterProgress(0);

    if (file.size > 5 * 1024 * 1024) {
      setPosterUploadError('Poster must be smaller than 5 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPosterUploadError('Please choose a JPG, PNG, or WebP image.');
      return;
    }

    try {
      setUploadingPoster(true);
      setPosterProgress(30);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/series_poster_${Date.now()}_${sanitizedName}`;

      setPosterProgress(60);
      const { error: uploadErr } = await supabase.storage
        .from('posters')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      setPosterProgress(90);
      const { data: publicUrlData } = supabase.storage
        .from('posters')
        .getPublicUrl(filePath);

      setPosterProgress(100);
      setPosterUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error('Poster upload failed:', err);
      setPosterUploadError(err?.message || 'Failed to upload series poster.');
    } finally {
      setUploadingPoster(false);
    }
  }

  async function handleBackdropFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setBackdropUploadError(null);
    setBackdropProgress(0);

    if (file.size > 5 * 1024 * 1024) {
      setBackdropUploadError('Backdrop banner must be smaller than 5 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setBackdropUploadError('Please choose a JPG, PNG, or WebP image.');
      return;
    }

    try {
      setUploadingBackdrop(true);
      setBackdropProgress(30);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/series_backdrop_${Date.now()}_${sanitizedName}`;

      setBackdropProgress(60);
      const { error: uploadErr } = await supabase.storage
        .from('posters')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      setBackdropProgress(90);
      const { data: publicUrlData } = supabase.storage
        .from('posters')
        .getPublicUrl(filePath);

      setBackdropProgress(100);
      setBackdropUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error('Backdrop upload failed:', err);
      setBackdropUploadError(err?.message || 'Failed to upload backdrop banner.');
    } finally {
      setUploadingBackdrop(false);
    }
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
      setError('Title is required');
      setCurrentStep(0);
      return;
    }

    if (!slug.trim()) {
      setError('URL slug is required');
      setCurrentStep(0);
      return;
    }

    if (seasons.length === 0) {
      setError('Series must have at least one season');
      setCurrentStep(1);
      return;
    }

    for (const season of seasons) {
      if (season.episodes.length === 0) {
        setError(`"${season.title}" has no episodes`);
        setCurrentStep(1);
        return;
      }
      for (const ep of season.episodes) {
        if (!ep.title.trim()) {
          setError('Every episode requires a title');
          setCurrentStep(1);
          return;
        }
        if (submitForReview && (!ep.video_ref || ep.video_ref.trim().length < 6)) {
          setError(`Episode "${ep.title}" requires a valid YouTube video link before submitting`);
          setCurrentStep(1);
          return;
        }
      }
    }

    if (submitForReview && !series && (!rightsConfirmed || !musicCleared)) {
      setError('Please confirm rights clearances before submitting');
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

      // Smart sync seasons and episodes to preserve IDs and watch history
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

      // If submitting new series for review
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

  const cleanTrailerId = trailerRef.trim()
    ? extractYouTubeId(trailerRef) || (trailerRef.trim().length === 11 ? trailerRef.trim() : '')
    : '';

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
      {...fadeOnly(reduced)}
    >
      <motion.div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-xl border border-white/10 bg-[#0d1017] shadow-2xl flex flex-col overflow-hidden text-ivory"
        {...scaleModal(reduced)}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-white">
              {series
                ? series.status === 'published'
                  ? `Edit Series: ${series.title}`
                  : `Edit ${series.title}`
                : 'Create Web Series'}
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              {series?.status === 'published' ? 'Live on platform' : 'Serialized video streaming'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Tabs (Clean & Minimal) */}
        <div className="flex border-b border-white/10 px-6 bg-white/[0.02]">
          {STEPS.map((st, idx) => {
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
                className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-signature text-signature'
                    : isCompleted
                    ? 'border-transparent text-white/80 hover:text-white'
                    : 'border-transparent text-white/30 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isActive
                      ? 'bg-signature text-black font-bold'
                      : isCompleted
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/40'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </span>
                <span>{st.title}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-md text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Step Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: Metadata */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Show Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Scavengers of Bombay"
                    className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs focus:border-signature outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. scavengers-of-bombay"
                    className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs font-mono focus:border-signature outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs focus:border-signature outline-none"
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

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Age Rating
                  </label>
                  <select
                    value={ageRating}
                    onChange={(e) => setAgeRating(e.target.value as AgeRating)}
                    className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs focus:border-signature outline-none"
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
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Genres (Choose up to 3)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableGenres.map((g) => {
                    const isSelected = selectedGenres.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleToggleGenre(g.id)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                          isSelected
                            ? 'bg-signature text-black font-semibold'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border border-white/5'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Posters & Artworks with Direct File Upload */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-white">
                    Series Artworks
                  </label>
                  <p className="text-[11px] text-white/50">
                    Upload theatrical poster (2:3) and widescreen backdrop banner (16:9) directly from your device.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Portrait Poster (2:3) */}
                  <div className="p-4 rounded-xl bg-white/[0.03] space-y-3 border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-signature" />
                        <span>Portrait Poster (2:3)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPosterUrlInput(!showPosterUrlInput)}
                        className="text-[10px] text-signature hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>{showPosterUrlInput ? 'Hide Link' : 'Paste Link'}</span>
                      </button>
                    </div>

                    {/* Upload / Preview Box */}
                    <div className="relative aspect-[2/3] w-full max-w-[180px] mx-auto rounded-lg overflow-hidden bg-black/60 flex flex-col items-center justify-center border-0 shadow-lg">
                      {posterUrl ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={posterUrl}
                            alt="Poster Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                            <label
                              htmlFor="series-poster-upload"
                              className="px-3 py-1.5 rounded-lg bg-signature text-black font-semibold text-[11px] cursor-pointer flex items-center gap-1.5 hover:bg-signature-hover shadow-sm active:scale-95 transition-all"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Replace</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setPosterUrl('')}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[11px] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="series-poster-upload"
                          className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-white/[0.04] transition-colors"
                        >
                          {uploadingPoster ? (
                            <>
                              <Loader2 className="w-6 h-6 text-signature animate-spin mb-2" />
                              <span className="text-[11px] text-white font-medium">Uploading poster...</span>
                              <span className="text-[9px] text-white/40 mt-1">{posterProgress}%</span>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-signature mb-2 shadow-sm">
                                <Upload className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold text-white">Upload Poster</span>
                              <span className="text-[10px] text-white/40 mt-0.5">2:3 Portrait Aspect</span>
                              <span className="text-[9px] text-white/30 mt-0.5">JPG, PNG, WebP up to 5MB</span>
                            </>
                          )}
                        </label>
                      )}
                      <input
                        type="file"
                        id="series-poster-upload"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePosterFileSelect}
                        disabled={uploadingPoster}
                        className="hidden"
                      />
                    </div>

                    {posterUploadError && (
                      <p className="text-[11px] text-rose-400 text-center font-sans">
                        {posterUploadError}
                      </p>
                    )}

                    {showPosterUrlInput && (
                      <input
                        type="text"
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value)}
                        placeholder="https://... (or direct image URL)"
                        className="w-full px-3 py-1.5 rounded-md bg-white/[0.04] text-white text-xs focus:ring-1 focus:ring-signature outline-none border-0"
                      />
                    )}
                  </div>

                  {/* 2. Landscape Backdrop (16:9) */}
                  <div className="p-4 rounded-xl bg-white/[0.03] space-y-3 border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-signature" />
                        <span>Backdrop Banner (16:9)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowBackdropUrlInput(!showBackdropUrlInput)}
                        className="text-[10px] text-signature hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>{showBackdropUrlInput ? 'Hide Link' : 'Paste Link'}</span>
                      </button>
                    </div>

                    {/* Upload / Preview Box */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/60 flex flex-col items-center justify-center border-0 shadow-lg">
                      {backdropUrl ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={backdropUrl}
                            alt="Backdrop Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            <label
                              htmlFor="series-backdrop-upload"
                              className="px-3 py-1.5 rounded-lg bg-signature text-black font-semibold text-[11px] cursor-pointer flex items-center gap-1.5 hover:bg-signature-hover shadow-sm active:scale-95 transition-all"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Replace</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setBackdropUrl('')}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[11px] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="series-backdrop-upload"
                          className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-white/[0.04] transition-colors"
                        >
                          {uploadingBackdrop ? (
                            <>
                              <Loader2 className="w-6 h-6 text-signature animate-spin mb-2" />
                              <span className="text-[11px] text-white font-medium">Uploading banner...</span>
                              <span className="text-[9px] text-white/40 mt-1">{backdropProgress}%</span>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-signature mb-2 shadow-sm">
                                <Upload className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold text-white">Upload Backdrop Banner</span>
                              <span className="text-[10px] text-white/40 mt-0.5">16:9 Widescreen Aspect</span>
                              <span className="text-[9px] text-white/30 mt-0.5">JPG, PNG, WebP up to 5MB</span>
                            </>
                          )}
                        </label>
                      )}
                      <input
                        type="file"
                        id="series-backdrop-upload"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleBackdropFileSelect}
                        disabled={uploadingBackdrop}
                        className="hidden"
                      />
                    </div>

                    {backdropUploadError && (
                      <p className="text-[11px] text-rose-400 text-center font-sans">
                        {backdropUploadError}
                      </p>
                    )}

                    {showBackdropUrlInput && (
                      <input
                        type="text"
                        value={backdropUrl}
                        onChange={(e) => setBackdropUrl(e.target.value)}
                        placeholder="https://... (or direct image URL)"
                        className="w-full px-3 py-1.5 rounded-md bg-white/[0.04] text-white text-xs focus:ring-1 focus:ring-signature outline-none border-0"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Series Trailer Link */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-white/70">
                    Series Trailer URL (Optional)
                  </label>
                  {cleanTrailerId && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <Check className="w-3 h-3" /> Trailer linked
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={trailerRef}
                  onChange={(e) => setTrailerRef(e.target.value)}
                  placeholder="Paste YouTube video link or ID"
                  className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs font-mono focus:border-signature outline-none"
                />
              </div>

              {/* Synopsis */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Show Synopsis *
                </label>
                <textarea
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Compelling overview of the story premise..."
                  className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs focus:border-signature outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Creator Note */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Creator Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={creatorNote}
                  onChange={(e) => setCreatorNote(e.target.value)}
                  placeholder="Creative intent or jury statement..."
                  className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs focus:border-signature outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Seasons & Episodes */}
          {currentStep === 1 && (
            <EpisodeBuilder seasons={seasons} onChange={setSeasons} />
          )}

          {/* STEP 3: Cast & Crew */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium text-white">Cast & Creative Team</h3>
                  <p className="text-[11px] text-white/50">Credit key creators and principal cast.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCredit}
                  className="text-xs font-medium text-signature hover:text-signature-hover flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Person</span>
                </button>
              </div>

              <div className="space-y-2">
                {credits.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c.person_name}
                      onChange={(e) => handleUpdateCredit(idx, { person_name: e.target.value })}
                      placeholder="Name"
                      className="flex-1 px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs focus:border-signature outline-none"
                    />
                    <input
                      type="text"
                      value={c.credit_role}
                      onChange={(e) => handleUpdateCredit(idx, { credit_role: e.target.value })}
                      placeholder="Role (e.g. Director, Lead Cast)"
                      className="w-44 px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs focus:border-signature outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCredit(idx)}
                      className="p-2 text-white/30 hover:text-rose-400 rounded transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Rights & Legal */}
          {currentStep === 3 && (
            <div className="space-y-4 max-w-lg mx-auto py-6">
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rightsConfirmed}
                    onChange={(e) => setRightsConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 text-signature focus:ring-0 bg-transparent"
                  />
                  <span className="text-xs text-white/80 group-hover:text-white leading-relaxed">
                    I own and grant non-exclusive streaming rights for this series on TPF Cinemas.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={musicCleared}
                    onChange={(e) => setMusicCleared(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 text-signature focus:ring-0 bg-transparent"
                  />
                  <span className="text-xs text-white/80 group-hover:text-white leading-relaxed">
                    All music, sound effects, and archival elements are fully copyright-cleared or licensed.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Clean 2-tier actions) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3.5 py-2 rounded-md text-xs font-medium text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-md text-xs font-medium bg-white/[0.05] hover:bg-white/[0.08] text-white/80 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{series?.status === 'published' ? 'Save Changes' : 'Save Draft'}</span>
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-2 rounded-md bg-signature hover:bg-signature-hover text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(series?.status === 'published' ? false : true)}
                className="px-4 py-2 rounded-md bg-signature hover:bg-signature-hover text-black text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
