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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg rounded-sm border border-hairline bg-canvas p-6 shadow-2xl text-ivory space-y-5">
        <div className="flex items-start justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-signature/15 border border-hairline-signature text-signature">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base uppercase tracking-wide text-ivory">Curator Jury Feedback</h3>
              <p className="text-xs text-muted font-mono">{series.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ivory rounded-sm hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {latestReview ? (
          <div className="space-y-4">
            <div className="p-4 rounded-sm bg-graphite border border-hairline space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-signature flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Decision: {latestReview.decision.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-muted font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(latestReview.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="font-editorial italic text-sm text-ivory/90 leading-relaxed whitespace-pre-wrap">
                "{latestReview.notes}"
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs font-mono text-muted">
            No curation notes recorded for this series yet.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm bg-graphite hover:bg-white/10 text-xs font-mono uppercase tracking-wider text-ivory border border-hairline transition-colors"
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
              className="px-5 py-2 rounded-sm bg-signature hover:bg-signature-hover text-black text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition-all"
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
