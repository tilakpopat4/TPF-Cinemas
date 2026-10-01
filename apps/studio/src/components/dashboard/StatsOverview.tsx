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
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f131c]/90 p-5 shadow-lg backdrop-blur-md transition-all hover:border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Total Submissions
          </span>
          <div className="p-2 rounded-xl bg-white/5 text-zinc-300 border border-white/5">
            <Film className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black text-white font-display tracking-tight">{total}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
          <span>In your creator studio</span>
        </div>
        <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/[0.02] blur-xl" />
      </div>

      {/* Published Live */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-5 shadow-lg backdrop-blur-md transition-all hover:border-emerald-500/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Live on Platform
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black text-white font-display tracking-tight">{published}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Actively streaming to audiences</span>
        </div>
        <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl" />
      </div>

      {/* In Review */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/25 bg-sky-950/20 p-5 shadow-lg backdrop-blur-md transition-all hover:border-sky-500/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
            In Review Queue
          </span>
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black text-white font-display tracking-tight">{inReview}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-sky-400/90">
          <span>Awaiting curator decisions</span>
        </div>
        <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-sky-500/10 blur-xl" />
      </div>

      {/* Action Needed */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 shadow-lg backdrop-blur-md transition-all ${
          actionNeeded > 0
            ? 'border-rose-500/40 bg-rose-950/30 shadow-rose-950/40'
            : 'border-white/[0.08] bg-[#0f131c]/90'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${
              actionNeeded > 0 ? 'text-rose-400' : 'text-zinc-400'
            }`}
          >
            Revisions Needed
          </span>
          <div
            className={`p-2 rounded-xl border ${
              actionNeeded > 0
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-white/5 text-zinc-400 border-white/5'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-black text-white font-display tracking-tight">{actionNeeded}</p>
        <div
          className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${
            actionNeeded > 0 ? 'text-rose-400' : 'text-zinc-500'
          }`}
        >
          <span>{actionNeeded > 0 ? 'Curator notes require edits' : 'All submissions clear'}</span>
        </div>
        {actionNeeded > 0 && (
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-rose-500/15 blur-xl" />
        )}
      </div>
    </div>
  );
};
