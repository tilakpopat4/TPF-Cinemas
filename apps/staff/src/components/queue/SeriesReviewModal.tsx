import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Tv,
  Film,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Check,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Series, Episode } from '../../types';
import { supabase } from '../../lib/supabase';

interface SeriesReviewModalProps {
  series: Series;
  onClose: () => void;
  onRefresh: () => void;
}

export const SeriesReviewModal: React.FC<SeriesReviewModalProps> = ({
  series,
  onClose,
  onRefresh,
}) => {
  const seasons = series.seasons || [];
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const currentSeason = seasons[selectedSeasonIdx] || seasons[0];
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(() => {
    return currentSeason?.episodes?.[0] || null;
  });

  // Decision box states
  const [decision, setDecision] = useState<'approved' | 'changes_requested' | 'rejected' | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isApproved = series.status === 'approved';
  const isPublished = series.status === 'published';

  const handleDecisionSubmit = async () => {
    if (!decision) return;
    setError(null);

    if (decision !== 'approved' && feedbackNotes.trim().length < 10) {
      setError('Review feedback must be at least 10 characters explaining the revision reason.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: rpcErr } = await supabase.rpc('review_series', {
        p_series_id: series.id,
        p_decision: decision,
        p_notes: feedbackNotes.trim() || 'Approved by curation jury',
      });

      if (rpcErr) throw rpcErr;

      setSuccessMsg(`Series successfully marked as ${decision.replace('_', ' ')}.`);
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error submitting series review:', err);
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishLive = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { error: pubErr } = await supabase.rpc('publish_series', {
        p_series_id: series.id,
      });

      if (pubErr) throw pubErr;

      setSuccessMsg('Series published live to the platform!');
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error publishing series:', err);
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-2xl border border-white/10 bg-[#0c0d12] shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                  {series.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-white/10 text-white/80">
                  {series.status}
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono mt-0.5">
                Creator: {series.profiles?.display_name || 'Independent Creator'} · {series.language} · {series.age_rating || 'UA13+'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split View */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Metadata & Interactive Episode Tree (5 cols) */}
          <div className="lg:col-span-5 space-y-5 border-r border-white/5 pr-0 lg:pr-6">
            {/* Show Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-bold">
                Series Overview
              </h3>
              {series.synopsis && (
                <p className="text-xs text-white/80 leading-relaxed font-sans">
                  {series.synopsis}
                </p>
              )}
              {series.creator_note && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                    Showrunner Note
                  </span>
                  <p className="text-xs text-white/70 italic">"{series.creator_note}"</p>
                </div>
              )}
            </div>

            {/* Season Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-bold">
                  Seasons & Episodes
                </h3>
                <span className="text-[10px] font-mono text-white/50">
                  {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {seasons.map((s, idx) => (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedSeasonIdx(idx);
                      setSelectedEpisode(s.episodes?.[0] || null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      selectedSeasonIdx === idx
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    {s.title || `Season ${s.season_number}`} ({s.episodes?.length || 0})
                  </button>
                ))}
              </div>

              {/* Episode Tree List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {currentSeason?.episodes?.map((ep) => {
                  const isSelected = selectedEpisode?.id === ep.id || selectedEpisode?.episode_number === ep.episode_number;

                  return (
                    <button
                      key={ep.id || ep.episode_number}
                      type="button"
                      onClick={() => setSelectedEpisode(ep)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-5 h-5 rounded bg-black/40 text-amber-500 font-mono text-[10px] font-bold">
                          {ep.episode_number}
                        </span>
                        <div>
                          <div className="text-xs font-semibold line-clamp-1">{ep.title}</div>
                          <div className="text-[10px] text-white/40 font-mono">{ep.runtime_minutes || 25} min</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500 text-black font-bold">
                            Screening
                          </span>
                        ) : (
                          <Play className="w-3.5 h-3.5 text-white/30" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Embedded Screening Player & Curator Decision Box (7 cols) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Episode Screening: {selectedEpisode ? `E${selectedEpisode.episode_number} · ${selectedEpisode.title}` : 'Select an Episode'}
                  </span>
                </div>
                {selectedEpisode?.video_ref && (
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedEpisode.video_ref}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <span>Open YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* 16:9 Screening Player */}
              <div className="w-full aspect-video rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl relative flex items-center justify-center">
                {selectedEpisode?.video_ref ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedEpisode.video_ref}?autoplay=0&rel=0`}
                    title={selectedEpisode.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <Film className="w-8 h-8 text-white/20 mx-auto" />
                    <p className="text-xs text-white/40 font-mono">Select an episode to inspect playback</p>
                  </div>
                )}
              </div>

              {selectedEpisode?.synopsis && (
                <p className="text-xs text-white/60 leading-relaxed font-sans pt-1">
                  <strong className="text-white font-medium">Episode Synopsis: </strong>
                  {selectedEpisode.synopsis}
                </p>
              )}
            </div>

            {/* Decision Controls Box */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-white/80 font-bold">
                  Curator Decision Engine
                </span>
                {isPublished && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live On Platform
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Actions */}
              {!isPublished && (
                <>
                  {isApproved ? (
                    <div className="space-y-3">
                      <p className="text-xs text-white/70">
                        This series is approved by the curation committee and ready for immediate deployment to the catalog.
                      </p>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handlePublishLive}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>Publish Web Series Live</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setDecision('approved')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                            decision === 'approved'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDecision('changes_requested')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                            decision === 'changes_requested'
                              ? 'bg-amber-500 text-black shadow-md'
                              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Request Changes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDecision('rejected')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                            decision === 'rejected'
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>

                      {decision && (
                        <div className="space-y-3 pt-2">
                          <textarea
                            rows={3}
                            value={feedbackNotes}
                            onChange={(e) => setFeedbackNotes(e.target.value)}
                            placeholder={
                              decision === 'approved'
                                ? 'Optional notes for the creator...'
                                : 'Mandatory feedback: Explain exactly what needs revision or why the show was rejected (minimum 10 characters)...'
                            }
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none resize-none"
                          />

                          <button
                            type="button"
                            disabled={submitting}
                            onClick={handleDecisionSubmit}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                          >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span>Confirm & Submit Decision</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
