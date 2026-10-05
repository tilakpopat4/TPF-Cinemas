import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  Check,
  Info,
  Play,
} from 'lucide-react';
import { Film, AgeRating } from '../../types';
import { supabase } from '../../lib/supabase';
import { extractYouTubeId } from '../../lib/utils';

interface ProposeUpdateModalProps {
  film: Film;
  onClose: () => void;
  onSuccess: () => void;
}

/** Fields the creator is allowed to propose changes for */
type EditableFields = {
  title: string;
  synopsis: string;
  director_note: string;
  runtime_minutes: string; // string for input, cast on submit
  language: string;
  release_year: string;  // string for input
  age_rating: AgeRating | '';
  poster_url: string;
  video_ref: string;
  trailer_ref: string;
};

const AGE_RATINGS: AgeRating[] = ['U', 'UA7+', 'UA13+', 'UA16+', 'A'];

const FIELD_LABELS: Record<keyof EditableFields, string> = {
  title: 'Film Title',
  synopsis: 'Synopsis',
  director_note: "Director's Note",
  runtime_minutes: 'Runtime (minutes)',
  language: 'Primary Language',
  release_year: 'Release Year',
  age_rating: 'Age Rating (OTT)',
  poster_url: 'Portrait Poster URL',
  video_ref: 'Video Reference',
  trailer_ref: 'Trailer Link',
};

export const ProposeUpdateModal: React.FC<ProposeUpdateModalProps> = ({
  film,
  onClose,
  onSuccess,
}) => {
  // Initialise form state from live film values
  const initial: EditableFields = {
    title: film.title ?? '',
    synopsis: film.synopsis ?? '',
    director_note: film.director_note ?? '',
    runtime_minutes: film.runtime_minutes != null ? String(film.runtime_minutes) : '',
    language: film.language ?? '',
    release_year: film.release_year != null ? String(film.release_year) : '',
    age_rating: film.age_rating ?? '',
    poster_url: film.poster_url ?? '',
    video_ref: film.video_ref ?? '',
    trailer_ref: film.trailer_ref ?? '',
  };

  const [fields, setFields] = useState<EditableFields>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Track which fields were actually changed
  const dirtyFields = (Object.keys(fields) as (keyof EditableFields)[]).filter(
    (key) => fields[key] !== initial[key]
  );
  const hasChanges = dirtyFields.length > 0;

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function updateField<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasChanges) {
      setError('No changes detected. Please modify at least one field before submitting.');
      return;
    }

    // Build the diff object — only include changed fields
    const proposed: Record<string, unknown> = {};
    for (const key of dirtyFields) {
      const val = fields[key];
      if (key === 'runtime_minutes') {
        proposed[key] = val === '' ? null : parseInt(val as string, 10);
      } else if (key === 'release_year') {
        proposed[key] = val === '' ? null : parseInt(val as string, 10);
      } else if (key === 'age_rating') {
        proposed[key] = val === '' ? null : val;
      } else if (key === 'video_ref' || key === 'trailer_ref') {
        // Extract YouTube ID if a full URL is pasted
        const raw = (val as string).trim();
        proposed[key] = raw ? (extractYouTubeId(raw) ?? raw) : null;
      } else {
        proposed[key] = val === '' ? null : val;
      }
    }

    setError(null);
    setSubmitting(true);
    try {
      const { error: rpcErr } = await supabase.rpc('propose_film_update', {
        p_film_id: film.id,
        p_changes: proposed,
      });
      if (rpcErr) throw rpcErr;
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isChanged = (key: keyof EditableFields) => fields[key] !== initial[key];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1017] shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#10141c]/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white tracking-tight">
                Propose Changes
              </h2>
              <p className="text-[11px] text-zinc-400">
                {film.title} — edits will be reviewed before going live
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
          <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Your live film remains unchanged until our curation team reviews and approves these edits.
            Only the fields you modify will be sent for review.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white">Edit Submitted!</h3>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Your proposed changes are now pending curator review. The live film stays unchanged until approved.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title */}
              <div className="form-group">
                <label className={`form-label text-[11px] flex items-center justify-between`}>
                  <span>{FIELD_LABELS.title}</span>
                  {isChanged('title') && <span className="text-amber-400 text-[10px] font-bold">Modified</span>}
                </label>
                <input
                  type="text"
                  value={fields.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  maxLength={120}
                  className={`form-input text-sm ${isChanged('title') ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                />
              </div>

              {/* Synopsis */}
              <div className="form-group">
                <label className="form-label text-[11px] flex items-center justify-between">
                  <span>{FIELD_LABELS.synopsis}</span>
                  {isChanged('synopsis') && <span className="text-amber-400 text-[10px] font-bold">Modified</span>}
                </label>
                <textarea
                  rows={4}
                  value={fields.synopsis}
                  onChange={(e) => updateField('synopsis', e.target.value)}
                  maxLength={2000}
                  className={`form-textarea text-sm ${isChanged('synopsis') ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                />
              </div>

              {/* Director's Note */}
              <div className="form-group">
                <label className="form-label text-[11px] flex items-center justify-between">
                  <span>{FIELD_LABELS.director_note}</span>
                  {isChanged('director_note') && <span className="text-amber-400 text-[10px] font-bold">Modified</span>}
                </label>
                <textarea
                  rows={3}
                  value={fields.director_note}
                  onChange={(e) => updateField('director_note', e.target.value)}
                  maxLength={1000}
                  className={`form-textarea text-sm ${isChanged('director_note') ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                />
              </div>

              {/* Runtime / Release Year / Language / Age Rating — 2-col grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-[11px] flex items-center justify-between">
                    <span>{FIELD_LABELS.runtime_minutes}</span>
                    {isChanged('runtime_minutes') && <span className="text-amber-400 text-[10px] font-bold">↑</span>}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={fields.runtime_minutes}
                    onChange={(e) => updateField('runtime_minutes', e.target.value)}
                    className={`form-input text-sm ${isChanged('runtime_minutes') ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-[11px] flex items-center justify-between">
                    <span>{FIELD_LABELS.release_year}</span>
                    {isChanged('release_year') && <span className="text-amber-400 text-[10px] font-bold">↑</span>}
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={fields.release_year}
                    onChange={(e) => updateField('release_year', e.target.value)}
                    className={`form-input text-sm ${isChanged('release_year') ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-[11px] flex items-center justify-between">
                    <span>{FIELD_LABELS.language}</span>
                    {isChanged('language') && <span className="text-amber-400 text-[10px] font-bold">↑</span>}
                  </label>
                  <input
                    type="text"
                    value={fields.language}
                    onChange={(e) => updateField('language', e.target.value)}
                    maxLength={60}
                    className={`form-input text-sm ${isChanged('language') ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-[11px] flex items-center justify-between">
                    <span>{FIELD_LABELS.age_rating}</span>
                    {isChanged('age_rating') && <span className="text-amber-400 text-[10px] font-bold">↑</span>}
                  </label>
                  <select
                    value={fields.age_rating}
                    onChange={(e) => updateField('age_rating', e.target.value as AgeRating | '')}
                    className={`form-select text-sm ${isChanged('age_rating') ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                  >
                    <option value="">— Select —</option>
                    {AGE_RATINGS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Poster URL */}
              <div className="form-group">
                <label className="form-label text-[11px] flex items-center justify-between">
                  <span>{FIELD_LABELS.poster_url} (2:3 portrait)</span>
                  {isChanged('poster_url') && <span className="text-amber-400 text-[10px] font-bold">Modified</span>}
                </label>
                <input
                  type="url"
                  value={fields.poster_url}
                  onChange={(e) => updateField('poster_url', e.target.value)}
                  placeholder="https://..."
                  className={`form-input text-sm ${isChanged('poster_url') ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                />
                {/* Side-by-side preview */}
                {isChanged('poster_url') && (film.poster_url || fields.poster_url) && (
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 font-mono uppercase">Current Live</p>
                      <div className="aspect-[2/3] max-w-[80px] rounded-lg overflow-hidden border border-white/10 bg-black/40">
                        {film.poster_url
                          ? <img src={film.poster_url} alt="current" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-zinc-700 text-[9px]">None</div>
                        }
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-amber-400/70 font-mono uppercase">Proposed</p>
                      <div className="aspect-[2/3] max-w-[80px] rounded-lg overflow-hidden border border-amber-500/20 bg-black/40">
                        {fields.poster_url
                          ? <img src={fields.poster_url} alt="proposed" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-zinc-700 text-[9px]">None</div>
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Ref */}
              <div className="form-group">
                <label className="form-label text-[11px] flex items-center justify-between">
                  <span>{FIELD_LABELS.video_ref}</span>
                  {isChanged('video_ref') && <span className="text-amber-400 text-[10px] font-bold">Modified</span>}
                </label>
                <input
                  type="text"
                  value={fields.video_ref}
                  onChange={(e) => updateField('video_ref', e.target.value)}
                  placeholder="YouTube ID or URL"
                  className={`form-input text-sm ${isChanged('video_ref') ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                />
              </div>

              {/* Trailer Ref */}
              <div className="form-group">
                <label className="form-label text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Play className="h-3 w-3 text-zinc-500" />
                    <span>{FIELD_LABELS.trailer_ref}</span>
                    <span className="text-zinc-600 font-normal">(optional)</span>
                  </div>
                  {isChanged('trailer_ref') && <span className="text-amber-400 text-[10px] font-bold">Modified</span>}
                </label>
                <input
                  type="text"
                  value={fields.trailer_ref}
                  onChange={(e) => updateField('trailer_ref', e.target.value)}
                  placeholder="YouTube trailer URL or ID (optional)"
                  className={`form-input text-sm ${isChanged('trailer_ref') ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                />
                <p className="mt-1 text-[10px] text-zinc-600">
                  Paste a full YouTube URL or just the video ID. Used for hover previews on the viewer site.
                </p>
              </div>


              {/* Changed fields summary */}
              {hasChanges && (
                <div className="p-3 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl">
                  <p className="text-[11px] text-amber-400 font-semibold mb-1">
                    {dirtyFields.length} field{dirtyFields.length > 1 ? 's' : ''} modified:
                  </p>
                  <p className="text-[11px] text-amber-200/70">
                    {dirtyFields.map((k) => FIELD_LABELS[k]).join(', ')}
                  </p>
                </div>
              )}
            </>
          )}
        </form>

        {/* Footer */}
        {!success && (
          <div className="border-t border-white/[0.08] px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="propose-update-form"
              onClick={handleSubmit}
              disabled={submitting || !hasChanges}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>Submit for Review</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
