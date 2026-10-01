import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, MessageSquareQuote, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { ReviewDecision } from '../../types';
import { supabase } from '../../lib/supabase';
import { useReducedMotion, springSnappy, easeMinimal } from '../../lib/motion';

interface DecisionBoxProps {
  filmId: string;
  filmTitle: string;
  onDecisionSubmitted: () => void;
}

const DECISIONS: { value: ReviewDecision; label: string; icon: React.ElementType; activeClass: string; iconClass: string }[] = [
  {
    value: 'approved',
    label: 'Approve Film',
    icon: CheckCircle2,
    activeClass: 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-lg shadow-purple-950/40',
    iconClass: 'text-purple-400',
  },
  {
    value: 'changes_requested',
    label: 'Request Edits',
    icon: MessageSquareQuote,
    activeClass: 'bg-rose-950/40 border-rose-500 text-rose-300 shadow-lg shadow-rose-950/40',
    iconClass: 'text-rose-400',
  },
  {
    value: 'rejected',
    label: 'Reject Film',
    icon: XCircle,
    activeClass: 'bg-red-950/40 border-red-500 text-red-300 shadow-lg shadow-red-950/40',
    iconClass: 'text-red-400',
  },
];

const SUBMIT_STYLES: Record<ReviewDecision, string> = {
  approved: 'btn btn-sm btn-emerald',
  changes_requested: 'btn btn-sm btn-rose',
  rejected: 'btn btn-sm btn-secondary',
};

const SUBMIT_LABELS: Record<ReviewDecision, string> = {
  approved: 'Submit Approval',
  changes_requested: 'Send Revision Request',
  rejected: 'Confirm Rejection',
};

export const DecisionBox: React.FC<DecisionBoxProps> = ({
  filmId,
  filmTitle,
  onDecisionSubmitted,
}) => {
  const reduced = useReducedMotion();
  const [selectedDecision, setSelectedDecision] = useState<ReviewDecision>('approved');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation: feedback is mandatory unless approved (schema line 102)
    if (selectedDecision !== 'approved' && !notes.trim()) {
      setError('Please provide feedback notes explaining the decision to the filmmaker.');
      return;
    }

    try {
      setSubmitting(true);
      const { error: rpcErr } = await supabase.rpc('review_film', {
        p_film_id: filmId,
        p_decision: selectedDecision,
        p_notes: notes.trim() || null,
      });

      if (rpcErr) throw rpcErr;

      onDecisionSubmitted();
    } catch (err) {
      console.error('Review decision submission failed:', err);
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
        Record Curator Decision
      </h4>

      {/* Error alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-2"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision buttons */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {DECISIONS.map(({ value, label, icon: Icon, activeClass, iconClass }) => {
          const isSelected = selectedDecision === value;
          return (
            <motion.button
              key={value}
              type="button"
              onClick={() => setSelectedDecision(value)}
              className={`relative p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors ${
                isSelected ? activeClass : 'border-white/10 text-slate-400 hover:bg-white/5'
              }`}
              whileTap={reduced ? {} : { scale: 0.95, transition: springSnappy }}
            >
              {/* Selected indicator — subtle scale punch */}
              {isSelected && !reduced && (
                <motion.span
                  className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10"
                  layoutId="decision-ring"
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                />
              )}
              <Icon className={`h-4 w-4 ${isSelected ? iconClass : 'text-slate-500'}`} />
              <span>{label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Feedback textarea — slides in when a decision requiring notes is active */}
      <div className="form-group mb-4">
        <label className="form-label text-[11px] flex items-center justify-between">
          <span>
            Curator Notes &amp; Filmmaker Instructions
            {selectedDecision !== 'approved' && ' * (Required)'}
          </span>
          <span className="text-slate-500 font-normal">Directly visible to creator</span>
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            selectedDecision === 'approved'
              ? 'Optional internal notes or words of praise for the filmmaker...'
              : 'Describe the required audio, visual, or legal adjustments needed before approval...'
          }
          className="form-textarea text-xs"
        />
        {/* Mandatory hint — slides in for non-approved decisions */}
        <AnimatePresence>
          {selectedDecision !== 'approved' && !notes.trim() && (
            <motion.p
              className="mt-1 text-[10px] text-rose-400/80"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0, transition: easeMinimal }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              Notes are required for this decision type.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Submit — color morphs with decision */}
      <div className="flex justify-end">
        <motion.button
          type="submit"
          disabled={submitting}
          className={SUBMIT_STYLES[selectedDecision]}
          whileTap={reduced ? {} : { scale: 0.95, transition: springSnappy }}
          layout
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{SUBMIT_LABELS[selectedDecision]}</span>
        </motion.button>
      </div>
    </form>
  );
};
