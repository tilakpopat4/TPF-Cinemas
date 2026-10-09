import React from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { Series } from '../../types';

interface SeriesFeedbackModalProps {
  series: Series | null;
  onClose: () => void;
  onEdit: (series: Series) => void;
}

export const SeriesFeedbackModal: React.FC<SeriesFeedbackModalProps> = ({
  series,
  onClose,
  onEdit,
}) => {
  if (!series) return null;

  const reviews = series.series_reviews || [];
  const latestReview = reviews[0];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0d12] p-6 shadow-2xl text-white space-y-5">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Curator Feedback</h3>
              <p className="text-xs text-white/50 font-mono">{series.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {latestReview ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Decision: {latestReview.decision.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(latestReview.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed font-sans whitespace-pre-wrap">
                {latestReview.notes}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-white/50">
            No curation notes recorded for this series yet.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold uppercase tracking-wider text-white"
          >
            Close
          </button>

          {series.status === 'changes_requested' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(series);
              }}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider shadow-md shadow-amber-500/20"
            >
              Update Series Draft
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
