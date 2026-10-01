import React, { useState } from 'react';
import { Plus, Trash2, Users, Check } from 'lucide-react';
import { FilmCredit, Genre } from '../../types';

interface StepCreditsProps {
  selectedGenreIds: number[];
  onToggleGenre: (genreId: number) => void;
  availableGenres: Genre[];
  credits: FilmCredit[];
  onCreditsChange: (credits: FilmCredit[]) => void;
}

const COMMON_ROLES = [
  'Director',
  'Writer / Screenplay',
  'Producer',
  'Lead Actor',
  'Supporting Actor',
  'Cinematographer (DOP)',
  'Editor',
  'Music Composer',
  'Sound Designer',
];

export const StepCredits: React.FC<StepCreditsProps> = ({
  selectedGenreIds,
  onToggleGenre,
  availableGenres,
  credits,
  onCreditsChange,
}) => {
  const [newPerson, setNewPerson] = useState('');
  const [newRole, setNewRole] = useState(COMMON_ROLES[0]);

  function handleAddCredit() {
    if (!newPerson.trim()) return;
    onCreditsChange([
      ...credits,
      {
        person_name: newPerson.trim(),
        credit_role: newRole,
        sort_order: credits.length,
      },
    ]);
    setNewPerson('');
  }

  function handleRemoveCredit(index: number) {
    onCreditsChange(credits.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Genre selection chips */}
      <div>
        <label className="form-label mb-2 block">Select Genres (Pick 1 to 3) *</label>
        <div className="flex flex-wrap gap-2">
          {availableGenres.map((genre) => {
            const isSelected = selectedGenreIds.includes(genre.id);
            return (
              <button
                type="button"
                key={genre.id}
                onClick={() => onToggleGenre(genre.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
                <span>{genre.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cast & Crew Roster */}
      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-2">
          <label className="form-label flex items-center gap-2 mb-0">
            <Users className="h-4 w-4 text-rose-500" />
            <span>Cast & Crew Credits</span>
          </label>
          <span className="text-xs text-slate-500">{credits.length} credits added</span>
        </div>

        {/* Add Credit Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mt-2">
          <div className="sm:col-span-6">
            <input
              type="text"
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCredit())}
              placeholder="Person Name (e.g. Anand Kumar)"
              className="form-input text-sm"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="form-select text-sm"
            >
              {COMMON_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddCredit}
              className="btn btn-secondary w-full text-xs flex items-center justify-center gap-1 h-[42px]"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Credits list */}
        {credits.length > 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 divide-y divide-white/5 bg-slate-900/50 overflow-hidden max-h-56 overflow-y-auto">
            {credits.map((credit, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 text-xs text-slate-200 hover:bg-white/5 transition-colors"
              >
                <div>
                  <span className="font-bold text-white">{credit.person_name}</span>
                  <span className="text-slate-400 ml-2">as</span>
                  <span className="text-rose-400 font-medium ml-1.5">{credit.credit_role}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCredit(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                  title="Remove Credit"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500 italic">
            Add your key cast, cinematographer, editor, and composer to display on your film page.
          </p>
        )}
      </div>
    </div>
  );
};
