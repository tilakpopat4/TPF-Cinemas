import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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
const ASPECT_PRESETS = ['16:9', '2.39:1', '1.85:1', '4:3', '1:1', '9:16'];
const ASPECT_PATTERN = /^\d+(\.\d+)?\s*[:/]\s*\d+(\.\d+)?$/;

export const StepDetails: React.FC<StepDetailsProps> = ({ formData, onChange }) => {
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);
  const [langInput, setLangInput] = useState('');

  const currentAspect = formData.aspect_ratio || '16:9';
  const isCustomAspect = !ASPECT_PRESETS.includes(currentAspect);
  const [customAspectMode, setCustomAspectMode] = useState(isCustomAspect);
  const showCustomAspect = customAspectMode || isCustomAspect;
  const aspectInvalid = showCustomAspect && !ASPECT_PATTERN.test(currentAspect.trim());

  const isCustomPrimary = !!formData.language && !LANGUAGES.includes(formData.language);
  const [customPrimaryMode, setCustomPrimaryMode] = useState(isCustomPrimary);
  const showCustomPrimary = customPrimaryMode || isCustomPrimary;

  const extraLanguages = formData.extra_languages || [];

  function addExtraLanguage(raw: string) {
    const name = raw.trim().replace(/\s+/g, ' ');
    if (!name) return;
    const exists = [formData.language, ...extraLanguages].some(
      (l) => l?.toLowerCase() === name.toLowerCase()
    );
    if (!exists && extraLanguages.length < 12) {
      onChange({ extra_languages: [...extraLanguages, name] });
    }
    setLangInput('');
  }

  function removeExtraLanguage(name: string) {
    onChange({ extra_languages: extraLanguages.filter((l) => l !== name) });
  }

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
                className="text-signature font-semibold hover:text-white underline font-mono text-[11px]"
              >
                Auto-fix collision
              </button>
            )}
          </div>
          {slugTaken && (
            <p className="text-[11px] text-muted flex items-center gap-1 mt-1 font-mono">
              <AlertCircle className="h-3.5 w-3.5 text-signature shrink-0" />
              <span>A film with this slug already exists. A unique suffix will be added automatically upon saving.</span>
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
        <div className={`text-right text-[11px] font-mono ${
          (formData.synopsis || '').length > 1400
            ? 'text-signature font-semibold'
            : 'text-muted'
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
        <div className={`text-right text-[11px] font-mono ${
          (formData.director_note || '').length > 1400
            ? 'text-signature font-semibold'
            : 'text-muted'
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
            value={showCustomPrimary ? 'Other' : (formData.language || 'Hindi')}
            onChange={(e) => {
              if (e.target.value === 'Other') {
                setCustomPrimaryMode(true);
                onChange({ language: '' });
              } else {
                setCustomPrimaryMode(false);
                onChange({ language: e.target.value });
              }
            }}
            className="form-select"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'Other' ? 'Other (type your own)' : lang}
              </option>
            ))}
          </select>
          {showCustomPrimary && (
            <input
              type="text"
              maxLength={40}
              value={formData.language || ''}
              onChange={(e) => onChange({ language: e.target.value })}
              placeholder="e.g. Bhojpuri, Konkani, Assamese"
              className="form-input mt-2"
            />
          )}
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

      {/* Aspect Ratio & Additional Languages (creator-controlled) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Content Aspect Ratio *</label>
          <select
            value={showCustomAspect ? 'custom' : currentAspect}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setCustomAspectMode(true);
              } else {
                setCustomAspectMode(false);
                onChange({ aspect_ratio: e.target.value });
              }
            }}
            className="form-select"
          >
            {ASPECT_PRESETS.map((r) => (
              <option key={r} value={r}>
                {r}{r === '16:9' ? ' (Widescreen, default)' : r === '2.39:1' ? ' (Anamorphic / Cinemascope)' : r === '9:16' ? ' (Vertical)' : ''}
              </option>
            ))}
            <option value="custom">Custom ratio…</option>
          </select>
          {showCustomAspect && (
            <input
              type="text"
              value={isCustomAspect ? currentAspect : ''}
              onChange={(e) => onChange({ aspect_ratio: e.target.value })}
              placeholder="e.g. 21:9 or 1.66:1"
              className={`form-input mt-2 font-mono text-sm ${aspectInvalid ? 'border-amber-500/70' : ''}`}
            />
          )}
          {aspectInvalid ? (
            <p className="text-[11px] text-amber-400 mt-1">Enter the ratio as W:H, for example 21:9 or 1.66:1.</p>
          ) : (
            <p className="text-[11px] text-zinc-400 mt-1">
              The player is sized to this ratio so your film is never cropped or stretched.
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Additional Languages (dubs / subtitles)</label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={40}
              value={langInput}
              onChange={(e) => setLangInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addExtraLanguage(langInput);
                }
              }}
              placeholder="Type a language and press Enter"
              className="form-input"
            />
            <button
              type="button"
              onClick={() => addExtraLanguage(langInput)}
              className="px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0"
            >
              Add
            </button>
          </div>
          {extraLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {extraLanguages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] text-white"
                >
                  {lang}
                  <button
                    type="button"
                    onClick={() => removeExtraLanguage(lang)}
                    className="text-zinc-400 hover:text-rose-300 leading-none"
                    aria-label={`Remove ${lang}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
