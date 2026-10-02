import React from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquareQuote, Calendar, UserCheck } from 'lucide-react';
import { Film } from '../../types';
import { formatDate } from '../../lib/utils';

interface FeedbackModalProps {
  film: Film | null;
  onClose: () => void;
  onEdit: (film: Film) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ film, onClose, onEdit }) => {
  if (!film) return null;

  const sortedReviews = film.film_reviews
    ? [...film.film_reviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];
  const latestReview = sortedReviews[0] ?? null;
  const previousReviews = sortedReviews.slice(1);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0c0d14] shadow-[0_24px_64px_rgba(0,0,0,0.95)] max-h-[90vh] flex flex-col text-ivory">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-white font-display">Curation Feedback</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Film Submission
            </span>
            <h4 className="text-xl font-bold text-white mt-0.5">{film.title}</h4>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
              <span className={`badge badge-${film.status}`}>{film.status.replace('_', ' ')}</span>
              {latestReview?.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Reviewed on {formatDate(latestReview.created_at)}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 mb-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
              Latest Curator Notes & Instructions
            </h5>
            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {latestReview?.notes || 'No specific notes provided. Please ensure all video and licence details match platform guidelines.'}
            </p>
          </div>

          {/* Previous reviews accordion if multiple */}
          {previousReviews.length > 0 && (
            <div className="mb-4 space-y-2">
              <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Prior Review History ({previousReviews.length})
              </h6>
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-3 divide-y divide-white/5">
                {previousReviews.map((pr, idx) => (
                  <div key={pr.id || idx} className="pt-2 first:pt-0 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                      <span className="font-semibold uppercase text-slate-300">{pr.decision.replace('_', ' ')}</span>
                      <span>{formatDate(pr.created_at)}</span>
                    </div>
                    <p className="text-slate-300 text-xs">{pr.notes || 'No notes'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {film.status === 'changes_requested' && (
            <p className="text-xs text-slate-400 mb-6">
              You can modify your film metadata, video links, or licence details, then resubmit your film for a fresh curator evaluation.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn btn-secondary btn-sm">
              Close
            </button>
            {film.status === 'changes_requested' && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(film);
                }}
                className="btn btn-primary btn-sm"
              >
                Edit & Resubmit Film
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
