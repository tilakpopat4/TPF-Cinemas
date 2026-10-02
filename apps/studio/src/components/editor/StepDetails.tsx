import React, { useState, useEffect } from 'react';
import { Film, AgeRating } from '../../types';
import { slugify } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

interface StepDetailsProps {
  formData: Partial<Film>;
  onChange: (updates: Partial<Film>) => void;
}

const AGE_RATINGS: AgeRating[] = ['U', 'UA7+', 'UA13+', 'UA16+', 'A'];
const LANGUAGES = [
  'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'English', 'Other'
];

export const StepDetails: React.FC<StepDetailsProps> = ({ formData, onChange }) => {
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);

  useEffect(() => {
    const rawSlug = formData.slug?.trim();
    if (!rawSlug) {
      setSlugTaken(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSlugChecking(true);
        const query = supabase.from('films').select('id').eq('slug', rawSlug);
        if (formData.id) {
          query.neq('id', formData.id);
        }
        const { data } = await query.maybeSingle();
        setSlugTaken(!!data);
      } catch (err) {
        console.error('Slug check error:', err);
      } finally {
        setSlugChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.slug, formData.id]);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value;
    // Auto-generate slug if slug hasn't been custom modified
    const currentAutoSlug = slugify(formData.title || '');
    if (!formData.slug || formData.slug === currentAutoSlug) {
      onChange({ title, slug: slugify(title) });
    } else {
      onChange({ title });
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title & Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Film Title *</label>
          <input
            type="text"
            required
            maxLength={120}
            value={formData.title || ''}
            onChange={handleTitleChange}
            placeholder="e.g. Whispers of the Ghats"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">URL Slug *</label>
          <input
            type="text"
            required
            value={formData.slug || ''}
            onChange={(e) => onChange({ slug: slugify(e.target.value) })}
            placeholder="whispers-of-the-ghats"
            className={`form-input font-mono text-sm ${
              slugTaken ? 'border-amber-500/70 focus:border-amber-400' : ''
            }`}
          />
          <div className="flex items-center justify-between text-[11px] mt-1">
            <span className="text-slate-500">
              tpfcinemas.com/film/{formData.slug || 'slug'}
            </span>
            {slugTaken && (
              <button
                type="button"
                onClick={() => onChange({ slug: `${formData.slug}-${Math.floor(100 + Math.random() * 900)}` })}
                className="text-amber-400 font-bold hover:text-white underline"
              >
                Auto-fix collision
              </button>
            )}
          </div>
          {slugTaken && (
            <p className="text-[11px] text-amber-400 mt-1">
              ⚠️ A film with this slug already exists. If left as-is, a unique suffix will be added automatically upon saving.
            </p>
          )}
        </div>
      </div>

      {/* Synopsis */}
      <div className="form-group">
        <label className="form-label">Synopsis (Max 1500 chars) *</label>
        <textarea
          rows={4}
          maxLength={1500}
          value={formData.synopsis || ''}
          onChange={(e) => onChange({ synopsis: e.target.value })}
          placeholder="Brief storyline and hook for the audience..."
          className="form-textarea"
        />
        <div className={`text-right text-[11px] ${
          (formData.synopsis || '').length > 1400
            ? 'text-amber-400 font-semibold'
            : 'text-slate-500'
        }`}>
          {(formData.synopsis || '').length} / 1500
        </div>
      </div>

      {/* Director's Note */}
      <div className="form-group">
        <label className="form-label">Director's Statement / Note</label>
        <textarea
          rows={3}
          maxLength={1500}
          value={formData.director_note || ''}
          onChange={(e) => onChange({ director_note: e.target.value })}
          placeholder="What inspired you to make this film? Your vision and creative background..."
          className="form-textarea"
        />
        <div className={`text-right text-[11px] ${
          (formData.director_note || '').length > 1400
            ? 'text-amber-400 font-semibold'
            : 'text-slate-500'
        }`}>
          {(formData.director_note || '').length} / 1500
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="form-group">
          <label className="form-label">Runtime (Mins) *</label>
          <input
            type="number"
            min={1}
            max={240}
            required
            value={formData.runtime_minutes || ''}
            onChange={(e) => onChange({ runtime_minutes: parseInt(e.target.value, 10) || null })}
            placeholder="e.g. 24"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Language *</label>
          <select
            value={formData.language || 'Hindi'}
            onChange={(e) => onChange({ language: e.target.value })}
            className="form-select"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Release Year</label>
          <input
            type="number"
            min={1990}
            max={2100}
            value={formData.release_year || 2026}
            onChange={(e) => onChange({ release_year: parseInt(e.target.value, 10) || null })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Age Rating</label>
          <select
            value={formData.age_rating || 'UA13+'}
            onChange={(e) => onChange({ age_rating: e.target.value as AgeRating })}
            className="form-select"
          >
            {AGE_RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Debut Film Toggle */}
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <input
          type="checkbox"
          id="is_debut"
          checked={formData.is_debut || false}
          onChange={(e) => onChange({ is_debut: e.target.checked })}
          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500"
        />
        <label htmlFor="is_debut" className="text-sm font-medium text-slate-200 cursor-pointer">
          This is my debut director project
          <span className="block text-xs text-slate-400 font-normal">
            Highlighted in the "New Voices / Debut Filmmakers" curated collection.
          </span>
        </label>
      </div>
    </div>
  );
};
