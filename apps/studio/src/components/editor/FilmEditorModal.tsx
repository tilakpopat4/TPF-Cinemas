import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion, easeMinimal, scaleModal, fadeOnly, springSnappy } from '../../lib/motion';
import { X, Check, ArrowRight, ArrowLeft, Save, Send, Loader2, Sparkles, Eye, Film as FilmIcon, Clock } from 'lucide-react';
import { Film, FilmCredit, LicenceAgreement, Genre } from '../../types';
import { StepDetails } from './StepDetails';
import { StepMedia } from './StepMedia';
import { StepCredits } from './StepCredits';
import { StepLicence } from './StepLicence';
import { supabase } from '../../lib/supabase';
import { formatDuration } from '../../lib/utils';

interface FilmEditorModalProps {
  film: Film | null;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  availableGenres: Genre[];
}

const STEPS = [
  { title: 'Film Metadata', subtitle: 'Title, synopsis & rating' },
  { title: 'Poster & Stream', subtitle: 'Artwork & YouTube ref' },
  { title: 'Cast & Credits', subtitle: 'Genres & creative team' },
  { title: 'Legal Licence', subtitle: 'Terms & music clearance' },
];

export const FilmEditorModal: React.FC<FilmEditorModalProps> = ({
  film,
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

  // Form states
  const [filmData, setFilmData] = useState<Partial<Film>>({
    title: '',
    slug: '',
    synopsis: '',
    director_note: '',
    runtime_minutes: 20,
    language: 'Hindi',
    release_year: 2026,
    age_rating: 'UA13+',
    poster_url: null,
    video_ref: '',
    video_provider: 'youtube',
    is_debut: false,
    ...film,
  });

  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [credits, setCredits] = useState<FilmCredit[]>([]);
  const [licence, setLicence] = useState<Partial<LicenceAgreement>>({
    licence_type: 'non_exclusive',
    territory: 'worldwide',
    term_months: 24,
    music_cleared: false,
    terms_version: 'v1.0',
  });

  // Populate if editing existing film
  useEffect(() => {
    if (film) {
      setFilmData({ ...film });
      if (film.film_genres) {
        setSelectedGenres(film.film_genres.map((fg) => fg.genre_id));
      }
      if (film.film_credits) {
        setCredits(film.film_credits);
      }
      if (film.licence_agreements) {
        setLicence(film.licence_agreements);
      }
    }
  }, [film]);

  function handleToggleGenre(genreId: number) {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter((id) => id !== genreId));
    } else {
      if (selectedGenres.length >= 3) {
        setSelectedGenres([...selectedGenres.slice(1), genreId]);
      } else {
        setSelectedGenres([...selectedGenres, genreId]);
      }
    }
  }

  // Validate current step before advancing
  function canProceed(): boolean {
    if (currentStep === 0) {
      return !!(filmData.title?.trim() && filmData.slug?.trim() && filmData.synopsis?.trim() && filmData.runtime_minutes);
    }
    if (currentStep === 1) {
      return true; // Optional in draft
    }
    if (currentStep === 2) {
      return selectedGenres.length > 0;
    }
    return true;
  }

  // Save film draft
  async function handleSave(andSubmit = false) {
    setError(null);
    setSaving(true);

    try {
      let savedFilmId = film?.id;

      if (!savedFilmId) {
        // Create new film
        // IMPORTANT: Never include status, is_featured, or published_at in insert payload
        const { data, error: insertError } = await supabase
          .from('films')
          .insert({
            filmmaker_id: userId,
            title: filmData.title!.trim(),
            slug: filmData.slug!.trim(),
            synopsis: filmData.synopsis!.trim(),
            director_note: filmData.director_note?.trim() || null,
            runtime_minutes: Number(filmData.runtime_minutes) || 1,
            language: filmData.language || 'Hindi',
            release_year: Number(filmData.release_year) || 2026,
            age_rating: filmData.age_rating || 'UA13+',
            video_provider: filmData.video_provider || 'youtube',
            video_ref: filmData.video_ref?.trim() || null,
            poster_url: filmData.poster_url || null,
            is_debut: !!filmData.is_debut,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        savedFilmId = data.id;
      } else {
        // Update existing film
        const { error: updateError } = await supabase
          .from('films')
          .update({
            title: filmData.title!.trim(),
            slug: filmData.slug!.trim(),
            synopsis: filmData.synopsis!.trim(),
            director_note: filmData.director_note?.trim() || null,
            runtime_minutes: Number(filmData.runtime_minutes) || 1,
            language: filmData.language,
            release_year: Number(filmData.release_year),
            age_rating: filmData.age_rating,
            video_provider: filmData.video_provider,
            video_ref: filmData.video_ref?.trim() || null,
            poster_url: filmData.poster_url || null,
            is_debut: !!filmData.is_debut,
          })
          .eq('id', savedFilmId);

        if (updateError) throw updateError;
      }

      // Sync genres
      await supabase.from('film_genres').delete().eq('film_id', savedFilmId);
      if (selectedGenres.length > 0) {
        const genreRows = selectedGenres.map((gid) => ({
          film_id: savedFilmId!,
          genre_id: gid,
        }));
        const { error: genreErr } = await supabase.from('film_genres').insert(genreRows);
        if (genreErr) throw genreErr;
      }

      // Sync credits
      await supabase.from('film_credits').delete().eq('film_id', savedFilmId);
      if (credits.length > 0) {
        const creditRows = credits.map((c, index) => ({
          film_id: savedFilmId!,
          person_name: c.person_name.trim(),
          credit_role: c.credit_role.trim(),
          sort_order: index + 1,
        }));
        const { error: creditErr } = await supabase.from('film_credits').insert(creditRows);
        if (creditErr) throw creditErr;
      }

      // Sync licence agreement
      if (licence.music_cleared !== undefined) {
        const { error: licErr } = await supabase.from('licence_agreements').upsert(
          {
            film_id: savedFilmId,
            filmmaker_id: userId,
            territory: licence.territory || 'worldwide',
            term_months: licence.term_months || 24,
            music_cleared: !!licence.music_cleared,
            terms_version: licence.terms_version || 'v1.0',
            agreement_path: licence.agreement_path || null,
          },
          { onConflict: 'film_id' }
        );
        if (licErr) throw licErr;
      }

      // If submitting to curators right away
      if (andSubmit) {
        if (!filmData.poster_url) {
          throw new Error('Please upload a film poster before submitting for curation.');
        }
        if (!filmData.video_ref) {
          throw new Error('Please link a valid YouTube video stream before submitting for curation.');
        }
        if (!licence.music_cleared) {
          throw new Error('The mandatory music clearance declaration must be accepted before submitting.');
        }
        const { error: submitErr } = await supabase.rpc('submit_film', {
          p_film_id: savedFilmId,
        });
        if (submitErr) throw submitErr;
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Selected genre names for live preview
  const selectedGenreObjects = availableGenres.filter((g) => selectedGenres.includes(g.id));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl"
      {...fadeOnly(reduced)}
    >
      <motion.div
        className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1017] shadow-2xl flex flex-col max-h-[94vh]"
        {...scaleModal(reduced)}
      >
        {/* Modal Topbar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#10141c]/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400">
              <FilmIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white tracking-tight">
                {film ? `Edit: ${film.title}` : 'New Film Submission Suite'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Step {currentStep + 1} of 4: {STEPS[currentStep].title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                showPreview
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{showPreview ? 'Hide Live Preview' : 'Show Live Preview'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Main Body: Steps Sidebar + Active Step Content + Live Preview */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Vertical Stepper Rail */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#0a0d14] p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible shrink-0">
            {STEPS.map((s, index) => {
              const isActive = currentStep === index;
              const isPast = currentStep > index;

              return (
                <motion.button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors w-full shrink-0 ${
                    isActive
                      ? 'bg-rose-500/15 border border-rose-500/30 text-white shadow-md'
                      : isPast
                      ? 'text-zinc-300 hover:bg-white/5'
                      : 'text-zinc-500 hover:bg-white/5'
                  }`}
                  whileTap={reduced ? {} : { scale: 0.97, transition: springSnappy }}
                >
                  <motion.div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shrink-0 ${
                      isActive
                        ? 'bg-rose-500 text-white'
                        : isPast
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-zinc-500'
                    }`}
                    animate={isActive && !reduced ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] }}
                  >
                    {isPast ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : index + 1}
                  </motion.div>
                  <div className="hidden md:block">
                    <p className="text-xs font-bold font-display leading-tight">{s.title}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{s.subtitle}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Center: Active Form Step — animated crossfade between steps */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep}
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] } }}
                exit={{ opacity: 0, x: -8, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] as [number,number,number,number] } }}
              >
                {currentStep === 0 && (
                  <StepDetails
                    formData={filmData}
                    onChange={(updated) => setFilmData((prev) => ({ ...prev, ...updated }))}
                  />
                )}

                {currentStep === 1 && (
                  <StepMedia
                    formData={filmData}
                    userId={userId}
                    onChange={(updated) => setFilmData((prev) => ({ ...prev, ...updated }))}
                  />
                )}

                {currentStep === 2 && (
                  <StepCredits
                    availableGenres={availableGenres}
                    selectedGenreIds={selectedGenres}
                    onToggleGenre={handleToggleGenre}
                    credits={credits}
                    onCreditsChange={setCredits}
                  />
                )}

                {currentStep === 3 && (
                  <StepLicence
                    licence={licence}
                    filmTitle={filmData.title || 'Untitled Film'}
                    onChange={(updated) => setLicence((prev) => ({ ...prev, ...updated }))}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Live Audience Preview Drawer */}
          {showPreview && (
            <div className="hidden lg:flex w-72 border-l border-white/[0.08] bg-[#0a0d14] p-5 flex-col justify-between shrink-0">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Audience Preview</span>
                </div>

                {/* Simulated Movie Tile */}
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#121620] shadow-xl">
                  <div className="relative aspect-[2/3] w-full bg-black/80 overflow-hidden">
                    {filmData.poster_url ? (
                      <img
                        src={filmData.poster_url}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-zinc-600 p-4 text-center">
                        <FilmIcon className="h-10 w-10 mb-2 opacity-30" />
                        <span className="text-[11px]">Poster preview will appear here</span>
                      </div>
                    )}

                    {filmData.is_debut && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-black shadow-md">
                        Debut
                      </span>
                    )}

                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-zinc-200 border border-white/10">
                      {filmData.age_rating || 'UA13+'}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-1">
                    <p className="font-bold text-white text-xs truncate">
                      {filmData.title || 'Untitled Film'}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDuration(filmData.runtime_minutes || 20)}
                      </span>
                      <span>•</span>
                      <span>{filmData.release_year || 2026}</span>
                      <span>•</span>
                      <span>{filmData.language || 'Hindi'}</span>
                    </div>

                    {selectedGenreObjects.length > 0 && (
                      <p className="text-[10px] text-amber-400/90 font-medium truncate pt-1">
                        {selectedGenreObjects.map((g) => g.name).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] text-[11px] text-zinc-500">
                Live card updates as you fill details across steps.
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-[#10141c]/90 px-6 py-4">
          <div>
            {currentStep > 0 && (
              <motion.button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                whileTap={reduced ? {} : { scale: 0.96, transition: springSnappy }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous Step</span>
              </motion.button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>Save Draft</span>
            </button>

            {currentStep < STEPS.length - 1 ? (
              <motion.button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white shadow-lg shadow-rose-600/25 transition-colors"
                whileTap={reduced ? {} : { scale: 0.96, transition: springSnappy }}
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || !licence.music_cleared}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-40 text-white shadow-xl shadow-rose-600/30 transition-colors"
                whileTap={reduced ? {} : { scale: 0.97, transition: springSnappy }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>Submit to Curators</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
