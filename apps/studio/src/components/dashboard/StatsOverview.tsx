import React from 'react';
import { Film, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Film as FilmType } from '../../types';

interface StatsOverviewProps {
  films: FilmType[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ films }) => {
  const total = films.length;
  const published = films.filter((f) => f.status === 'published').length;
  const inReview = films.filter((f) => f.status === 'submitted' || f.status === 'approved').length;
  const actionNeeded = films.filter((f) => f.status === 'changes_requested').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1015] p-5 shadow-lg transition-all hover:border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-mono">
            Total Submissions
          </span>
          <div className="p-2 rounded-xl bg-white/[0.05] text-zinc-300">
            <Film className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black text-ivory font-display tracking-tight">{total}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
          <span>In your creator studio</span>
        </div>
      </div>

      {/* Published Live */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1015] p-5 shadow-lg transition-all hover:border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 font-mono">
            Live on Platform
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black text-ivory font-display tracking-tight">{published}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Actively streaming to audiences</span>
        </div>
      </div>

      {/* In Review */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1015] p-5 shadow-lg transition-all hover:border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-signature font-mono">
            In Review Queue
          </span>
          <div className="p-2 rounded-xl bg-signature/10 text-signature">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black text-ivory font-display tracking-tight">{inReview}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
          <span>Awaiting curator decisions</span>
        </div>
      </div>

      {/* Action Needed */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1015] p-5 shadow-lg transition-all hover:border-white/20">
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider font-mono ${
              actionNeeded > 0 ? 'text-rose-400' : 'text-muted'
            }`}
          >
            Revisions Needed
          </span>
          <div
            className={`p-2 rounded-xl ${
              actionNeeded > 0
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-white/[0.05] text-muted'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black text-ivory font-display tracking-tight">{actionNeeded}</p>
        <div
          className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${
            actionNeeded > 0 ? 'text-rose-400' : 'text-muted'
          }`}
        >
          <span>{actionNeeded > 0 ? 'Curator notes require edits' : 'All submissions clear'}</span>
        </div>
      </div>
    </div>
  );
};
