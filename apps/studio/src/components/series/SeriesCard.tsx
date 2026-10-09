import React from 'react';
import { Tv, Film, Clock, MessageSquare, Edit3, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Series } from '../../types';

interface SeriesCardProps {
  series: Series;
  onEdit: (series: Series) => void;
  onDelete: (seriesId: string) => void;
  onViewFeedback: (series: Series) => void;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({
  series,
  onEdit,
  onDelete,
  onViewFeedback,
}) => {
  const isDraft = series.status === 'draft';
  const isSubmitted = series.status === 'submitted';
  const isApproved = series.status === 'approved';
  const isPublished = series.status === 'published';
  const isChangesRequested = series.status === 'changes_requested';
  const isRejected = series.status === 'rejected';

  const posterImage =
    series.poster_url ||
    series.backdrop_url ||
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=600&auto=format&fit=crop';

  return (
    <div className="group rounded-2xl bg-[#0e1017] border border-white/10 hover:border-amber-500/40 transition-all duration-300 overflow-hidden flex flex-col shadow-xl">
      {/* Artwork Header */}
      <div className="relative aspect-[16/10] bg-black/60 overflow-hidden">
        <img
          src={posterImage}
          alt={series.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1017] via-transparent to-black/40" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {isPublished && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Live
            </span>
          )}
          {isApproved && (
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
              Approved
            </span>
          )}
          {isSubmitted && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> In Review
            </span>
          )}
          {isChangesRequested && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/30 border border-amber-500/50 text-amber-300 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> Action Required
            </span>
          )}
          {isRejected && (
            <span className="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
              Rejected
            </span>
          )}
          {isDraft && (
            <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
              Draft
            </span>
          )}
        </div>

        {/* Season & Episode Count Badges */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-mono font-semibold flex items-center gap-1">
            <Tv className="w-3 h-3 text-amber-400" />
            {series.seasons?.length || series.total_seasons || 1} {series.seasons?.length === 1 ? 'Season' : 'Seasons'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-mono font-semibold flex items-center gap-1">
            <Film className="w-3 h-3 text-amber-400" />
            {series.episode_count || 0} Eps
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              {series.language}
            </span>
            {series.age_rating && (
              <span className="text-[10px] font-mono text-white/40">· {series.age_rating}</span>
            )}
          </div>
          <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
            {series.title}
          </h3>
          {series.synopsis && (
            <p className="text-xs text-white/60 line-clamp-2 leading-relaxed font-sans">
              {series.synopsis}
            </p>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {(isChangesRequested || isRejected) && (
              <button
                type="button"
                onClick={() => onViewFeedback(series)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Read Curator Feedback"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Feedback</span>
              </button>
            )}

            {(isDraft || isChangesRequested) && (
              <button
                type="button"
                onClick={() => onEdit(series)}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-white/70" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {isDraft && (
            <button
              type="button"
              onClick={() => onDelete(series.id)}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Draft"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
