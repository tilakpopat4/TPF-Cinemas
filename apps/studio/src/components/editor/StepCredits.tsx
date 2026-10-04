import React, { useState } from 'react';
import { Plus, Trash2, Users, Check, ChevronUp, ChevronDown } from 'lucide-react';
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

  function handleMoveCredit(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= credits.length) return;
    const reordered = [...credits];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onCreditsChange(reordered.map((c, i) => ({ ...c, sort_order: i })));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Genre selection chips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0 block">Select Genres (Pick 1 to 3) *</label>
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
            selectedGenreIds.length > 0
              ? 'bg-signature/10 text-signature'
              : 'bg-white/[0.06] text-muted'
          }`}>
            {selectedGenreIds.length} / 3 selected
          </span>
        </div>
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
                    ? 'bg-signature text-black border-signature shadow-md shadow-signature/20'
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
            <Users className="h-4 w-4 text-signature" />
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
                  <span className="text-signature font-mono text-[11px] font-semibold ml-1.5">{credit.credit_role}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveCredit(idx, 'up')}
                    className="text-slate-500 hover:text-white disabled:opacity-20 p-1 rounded transition-colors"
                    title="Move Up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === credits.length - 1}
                    onClick={() => handleMoveCredit(idx, 'down')}
                    className="text-slate-500 hover:text-white disabled:opacity-20 p-1 rounded transition-colors"
                    title="Move Down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveCredit(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors ml-1"
                    title="Remove Credit"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
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
