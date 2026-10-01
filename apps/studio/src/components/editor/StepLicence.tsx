import React from 'react';
import { ShieldCheck, FileText, CheckSquare, Info } from 'lucide-react';
import { LicenceAgreement } from '../../types';

interface StepLicenceProps {
  licence: Partial<LicenceAgreement>;
  onChange: (updates: Partial<LicenceAgreement>) => void;
  filmTitle: string;
}

export const StepLicence: React.FC<StepLicenceProps> = ({
  licence,
  onChange,
  filmTitle,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Licence Banner */}
      <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display">
              TPF Non-Exclusive Filmmaker Licence (v1.0)
            </h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              You keep 100% of your copyright. This non-exclusive licence gives TPF Cinemas the right to stream
              your film on our platform while leaving all film festival entries, sales, and television rights completely open to you.
            </p>
          </div>
        </div>
      </div>

      {/* Licence Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Licence Territory</label>
          <input
            type="text"
            disabled
            value="Worldwide (Non-exclusive)"
            className="form-input bg-slate-900/50 text-slate-400 cursor-not-allowed"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Term Duration (Months) *</label>
          <select
            value={licence.term_months || 24}
            onChange={(e) => onChange({ term_months: parseInt(e.target.value, 10) })}
            className="form-select"
          >
            <option value={12}>12 Months (1 Year)</option>
            <option value={24}>24 Months (2 Years - Standard)</option>
            <option value={36}>36 Months (3 Years)</option>
            <option value={60}>60 Months (5 Years)</option>
          </select>
          <span className="text-[11px] text-slate-500">
            You may request takedown or archival at any time.
          </span>
        </div>
      </div>

      {/* Music Clearance Declaration (Crucial legal requirement from schema line 114) */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="music_cleared"
            required
            checked={licence.music_cleared || false}
            onChange={(e) => onChange({ music_cleared: e.target.checked })}
            className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500 mt-0.5 shrink-0"
          />
          <div>
            <label htmlFor="music_cleared" className="text-xs font-bold text-white cursor-pointer">
              Music Clearance Declaration (Mandatory) *
            </label>
            <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
              I certify and warrant that all background music, songs, score compositions, and sound recordings incorporated into{' '}
              <strong>"{filmTitle || 'this film'}"</strong> are either original, public domain, or fully cleared and licensed for non-exclusive streaming.
            </p>
          </div>
        </div>
      </div>

      {/* Terms Agreement Checkbox */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-3">
          <CheckSquare className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            By saving and submitting this film, I digitally execute the TPF Cinemas Filmmaker Licence Agreement (Version 1.0) and authorize TPF Cinemas to display, stream, and promote this film in accordance with the platform terms.
          </p>
        </div>
      </div>
    </div>
  );
};
