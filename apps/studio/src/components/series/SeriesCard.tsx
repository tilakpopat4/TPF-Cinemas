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
    series.backdrop_url ||
    series.poster_url ||
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=600&auto=format&fit=crop';

  return (
    <div className="group rounded-sm bg-graphite border border-hairline hover:border-hairline-accent transition-all duration-300 overflow-hidden flex flex-col shadow-lg">
      {/* Artwork Header — 16:9 Cinema Aspect */}
      <div className="relative aspect-[16/9] bg-canvas overflow-hidden border-b border-hairline">
        <img
          src={posterImage}
          alt={series.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-black/50" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {isPublished && (
            <span className="px-2.5 py-0.5 rounded-sm bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Live
            </span>
          )}
          {isApproved && (
            <span className="px-2.5 py-0.5 rounded-sm bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              Approved
            </span>
          )}
          {isSubmitted && (
            <span className="px-2.5 py-0.5 rounded-sm bg-signature/15 border border-hairline-signature text-signature text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> In Review
            </span>
          )}
          {isChangesRequested && (
            <span className="px-2.5 py-0.5 rounded-sm bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> Action Required
            </span>
          )}
          {isRejected && (
            <span className="px-2.5 py-0.5 rounded-sm bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              Rejected
            </span>
          )}
          {isDraft && (
            <span className="px-2.5 py-0.5 rounded-sm bg-graphite/80 border border-hairline text-ivory/80 text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              Draft
            </span>
          )}
        </div>

        {/* Season & Episode Count Badges */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-sm bg-black/75 backdrop-blur-md text-ivory border border-hairline text-[9px] font-mono flex items-center gap-1">
            <Tv className="w-3 h-3 text-signature" />
            {series.seasons?.length || series.total_seasons || 1} {series.seasons?.length === 1 ? 'Season' : 'Seasons'}
          </span>
          <span className="px-2 py-0.5 rounded-sm bg-black/75 backdrop-blur-md text-ivory border border-hairline text-[9px] font-mono flex items-center gap-1">
            <Film className="w-3 h-3 text-signature" />
            {series.episode_count || 0} Eps
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-signature font-bold">
              {series.language}
            </span>
            {series.age_rating && (
              <span className="text-[10px] font-mono text-muted">· {series.age_rating}</span>
            )}
          </div>
          <h3 className="font-display text-lg text-ivory uppercase tracking-wide line-clamp-1 group-hover:text-signature transition-colors">
            {series.title}
          </h3>
          {series.synopsis && (
            <p className="font-editorial italic text-xs text-muted/80 line-clamp-2 leading-relaxed">
              {series.synopsis}
            </p>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(isChangesRequested || isRejected) && (
              <button
                type="button"
                onClick={() => onViewFeedback(series)}
                className="px-2.5 py-1.5 rounded-sm bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-rose-500/30"
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
                className="px-3 py-1.5 rounded-sm bg-white/5 hover:bg-white/10 text-ivory text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-hairline"
              >
                <Edit3 className="w-3.5 h-3.5 text-muted" />
                <span>Edit Series</span>
              </button>
            )}

            {isPublished && (
              <button
                type="button"
                onClick={() => onEdit(series)}
                className="px-3 py-1.5 rounded-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-amber-500/25"
                title="Edit published series, add episodes, or update trailer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Series</span>
              </button>
            )}

            {isApproved && (
              <button
                type="button"
                onClick={() => onEdit(series)}
                className="px-3 py-1.5 rounded-sm bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-sky-500/25"
                title="Edit approved series"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Series</span>
              </button>
            )}
          </div>

          {isDraft && (
            <button
              type="button"
              onClick={() => onDelete(series.id)}
              className="p-1.5 rounded-sm text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
