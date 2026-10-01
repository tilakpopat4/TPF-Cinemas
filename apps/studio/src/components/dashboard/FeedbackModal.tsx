import React from 'react';
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

  const latestReview = film.film_reviews && film.film_reviews.length > 0
    ? film.film_reviews[film.film_reviews.length - 1]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-rose-500/30 bg-[#11141d] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5">
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
        <div className="p-6">
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

          <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 mb-6">
            <h5 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
              Curator Notes & Instructions
            </h5>
            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {latestReview?.notes || 'No specific notes provided. Please ensure all video and licence details match platform guidelines.'}
            </p>
          </div>

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
    </div>
  );
};
