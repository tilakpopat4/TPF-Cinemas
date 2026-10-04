import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useReducedMotion, scaleModal, fadeOnly } from '../../lib/motion';
import {
  X,
  Play,
  CheckCircle2,
  FileCheck2,
  Globe,
  Star,
  AlertTriangle,
  Send,
  Loader2,
  Calendar,
  User,
  Shield,
  Clock,
  Film as FilmIcon,
  Check,
  AlertCircle,
  Printer,
  Lock,
  Unlock,
  Flag,
} from 'lucide-react';
import { Film } from '../../types';
import { extractYouTubeId, formatDuration, formatDate } from '../../lib/utils';
import { DecisionBox } from './DecisionBox';
import { supabase } from '../../lib/supabase';
import { RightsUndertakingModal } from '../legal/RightsUndertakingModal';

interface ReviewModalProps {
  film: Film | null;
  onClose: () => void;
  onActionComplete: () => void;
  isAdmin: boolean;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  film,
  onClose,
  onActionComplete,
  isAdmin,
}) => {
  if (!film) return null;
  const f = film;
  const reduced = useReducedMotion();

  const [activeTab, setActiveTab] = useState<'decision' | 'media' | 'licence' | 'ip_hold'>('decision');
  const [verifyingLicence, setVerifyingLicence] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [featuring, setFeaturing] = useState(false);
  const [takingDown, setTakingDown] = useState(false);
  const [applyingHold, setApplyingHold] = useState(false);
  const [holdReason, setHoldReason] = useState(f.ip_hold_reason || '');
  const [actionError, setActionError] = useState<string | null>(null);
  const [showRightsDeed, setShowRightsDeed] = useState(false);

  const videoId = extractYouTubeId(f.video_ref);
  const licence = f.licence_agreements;
  const isLicenceVerified = !!licence?.verified_at;

  // Verify Licence RPC
  async function handleVerifyLicence() {
    setActionError(null);
    try {
      setVerifyingLicence(true);
      const { error } = await supabase.rpc('verify_licence', {
        p_film_id: f.id,
      });
      if (error) throw error;
      onActionComplete();
    } catch (err) {
      console.error('Licence verification failed:', err);
      setActionError((err as Error).message);
    } finally {
      setVerifyingLicence(false);
    }
  }

  // Publish Film RPC
  async function handlePublishFilm() {
    setActionError(null);
    try {
      setPublishing(true);
      const { error } = await supabase.rpc('publish_film', {
        p_film_id: f.id,
      });
      if (error) throw error;
      onActionComplete();
    } catch (err) {
      console.error('Publishing failed:', err);
      setActionError((err as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  // Toggle Feature Film RPC (Admin only)
  async function handleFeatureToggle() {
    setActionError(null);
    try {
      setFeaturing(true);
      const nextState = !f.is_featured;
      const { error } = await supabase.rpc('feature_film', {
        p_film_id: f.id,
        p_featured: nextState,
      });
      if (error) throw error;
      onActionComplete();
    } catch (err) {
      console.error('Feature toggle failed:', err);
      setActionError((err as Error).message);
    } finally {
      setFeaturing(false);
    }
  }

  // Takedown Film RPC (Admin only)
  async function handleTakedown() {
    const confirm = window.confirm(
      `Are you sure you want to take down "${f.title}"? The film will be archived and unfeatured globally.`
    );
    if (!confirm) return;

    setActionError(null);
    try {
      setTakingDown(true);
      const { error } = await supabase.rpc('takedown_film', {
        p_film_id: f.id,
      });
      if (error) throw error;
      onActionComplete();
    } catch (err) {
      console.error('Takedown failed:', err);
      setActionError((err as Error).message);
    } finally {
      setTakingDown(false);
    }
  }

  // IP Hold toggle (Admin only)
  async function handleIpHold(hold: boolean) {
    if (hold && !holdReason.trim()) {
      setActionError('Please enter a reason for the IP hold before applying it.');
      return;
    }
    setActionError(null);
    try {
      setApplyingHold(true);
      const { error } = await supabase
        .from('films')
        .update({
          ip_hold: hold,
          ip_hold_reason: hold ? holdReason.trim() : null,
          ip_hold_at: hold ? new Date().toISOString() : null,
        })
        .eq('id', f.id);
      if (error) throw error;
      onActionComplete();
    } catch (err) {
      console.error('IP Hold failed:', err);
      setActionError((err as Error).message);
    } finally {
      setApplyingHold(false);
    }
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl"
      {...fadeOnly(reduced)}
    >
      <motion.div
        className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1017] shadow-2xl flex flex-col max-h-[94vh]"
        {...scaleModal(reduced)}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#10141c]/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signature/10 text-signature">
              <FilmIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-white tracking-tight">
                  {f.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/10 text-zinc-300">
                  {f.status}
                </span>
                {f.is_featured && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-signature/10 text-signature">
                    Featured
                  </span>
                )}
                {f.ip_hold && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <Lock className="h-2.5 w-2.5" />
                    IP Hold
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Submitted by {f.profiles?.display_name || 'Creator'} • {formatDate(f.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* Admin Feature Toggle */}
            {isAdmin && f.status === 'published' && (
              <button
                onClick={handleFeatureToggle}
                disabled={featuring}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-ivory border-none transition-colors"
              >
                <Star className="h-3.5 w-3.5 text-signature" />
                <span>{f.is_featured ? 'Featured on Billboard' : 'Feature on Billboard'}</span>
              </button>
            )}

            {/* Admin Takedown */}
            {isAdmin && f.status === 'published' && (
              <button
                onClick={handleTakedown}
                disabled={takingDown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Takedown</span>
              </button>
            )}

            {/* Admin IP Hold */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('ip_hold')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  f.ip_hold
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-white/5 text-zinc-300 border-white/10 hover:text-rose-300 hover:border-rose-500/20'
                }`}
              >
                {f.ip_hold ? <Lock className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}
                <span>{f.ip_hold ? 'On IP Hold' : 'IP Hold'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Main Workstation Body: Split Player (Left) + Decision Drawer (Right) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left Column: Player & Quality Checklist */}
          <div className="lg:w-3/5 overflow-y-auto p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/[0.08] space-y-6">
            {/* Embedded 16:9 Video Player */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
              {videoId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
                  title={f.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                  <FilmIcon className="h-12 w-12 mb-2 opacity-30" />
                  <p className="text-xs">No video stream attached</p>
                </div>
              )}
            </div>

            {/* Quality & Compliance Checklist */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#10141c]/60 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-amber-500" />
                <span>Curation & Compliance Checklist</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Portrait Poster check */}
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-1">
                    <span>Portrait Poster (2:3)</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 font-bold ${f.poster_url ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {f.poster_url ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    <span>{f.poster_url ? 'Attached' : 'Missing'}</span>
                  </span>
                </div>

                {/* Landscape Backdrop check */}
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-1">
                    <span>Landscape Banner (16:9)</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 font-bold ${f.backdrop_url ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {f.backdrop_url ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    <span>{f.backdrop_url ? 'Attached' : 'Missing'}</span>
                  </span>
                </div>

                {/* Music clearance */}
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-1">
                    <span>Music Rights</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 font-bold ${licence?.music_cleared ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {licence?.music_cleared ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    <span>{licence?.music_cleared ? 'Cleared' : 'Pending'}</span>
                  </span>
                </div>

                {/* Age classification */}
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1 text-[11px] text-muted mb-1 font-mono uppercase">
                    <span>OTT Rating</span>
                  </div>
                  <span className="font-semibold text-ivory font-mono">
                    {f.age_rating || 'Unrated'}
                  </span>
                </div>

                {/* Licence verification */}
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1 text-[11px] text-muted mb-1 font-mono uppercase">
                    <span>Licence Status</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${isLicenceVerified ? 'text-emerald-400' : 'text-signature'}`}>
                    {isLicenceVerified ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    <span>{isLicenceVerified ? 'Verified' : 'Unverified'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Workstation Drawer Tabs */}
          <div className="lg:w-2/5 overflow-y-auto flex flex-col bg-[#0a0d14]">
            {/* Drawer Tabs */}
            <div className="flex border-b border-white/[0.08] bg-[#0d1017]">
              <button
                onClick={() => setActiveTab('decision')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === 'decision'
                    ? 'border-signature text-ivory bg-white/[0.04]'
                    : 'border-transparent text-muted hover:text-ivory'
                }`}
              >
                Curator Decision
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === 'media'
                    ? 'border-signature text-ivory bg-white/[0.04]'
                    : 'border-transparent text-muted hover:text-ivory'
                }`}
              >
                Metadata & Credits
              </button>
              <button
                onClick={() => setActiveTab('licence')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === 'licence'
                    ? 'border-signature text-ivory bg-white/[0.04]'
                    : 'border-transparent text-muted hover:text-ivory'
                }`}
              >
                Licence Rights
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('ip_hold')}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                    activeTab === 'ip_hold'
                      ? 'border-rose-500 text-rose-400 bg-rose-500/5'
                      : 'border-transparent text-zinc-400 hover:text-rose-300'
                  }`}
                >
                  {f.ip_hold ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" /> IP Hold
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Flag className="h-3.5 w-3.5" /> IP Hold
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="p-5 sm:p-6 flex-1 space-y-5">
              {/* Tab 1: Curator Decision */}
              {activeTab === 'decision' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Decision Box (if submitted) */}
                  {f.status === 'submitted' ? (
                    <DecisionBox
                      filmId={f.id}
                      filmTitle={f.title}
                      onDecisionSubmitted={onActionComplete}
                    />
                  ) : f.status === 'approved' ? (
                    /* If Approved: Ready to Publish */
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Curator Approved for Streaming</span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        This film has received curator approval. Once the legal licence agreement is verified, it can be published live to audiences worldwide.
                      </p>

                      {!isLicenceVerified ? (
                        <div className="p-3 bg-white/[0.04] rounded-xl text-xs text-muted flex items-center justify-between">
                          <span>Licence agreement pending staff verification</span>
                          <button
                            onClick={() => setActiveTab('licence')}
                            className="text-xs font-semibold text-signature underline ml-2 shrink-0"
                          >
                            Verify Rights
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handlePublishFilm}
                          disabled={publishing}
                          className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                          {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          <span>Publish Film Live to Catalogue</span>
                        </button>
                      )}
                    </div>
                  ) : f.status === 'published' ? (
                    /* If Published: Live Status */
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Film is Published & Live</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        This film is currently live on <strong className="text-white">tpfcinemas.com</strong>. Viewers can stream, comment, and add it to their personal watchlist.
                      </p>
                    </div>
                  ) : (
                    /* In Revision or Rejected */
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="capitalize">{f.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        This film is currently locked in revision state awaiting edits from the filmmaker.
                      </p>
                    </div>
                  )}

                  {/* Past Reviews Feed */}
                  {f.film_reviews && f.film_reviews.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Curation History
                      </h4>
                      <div className="space-y-2">
                        {f.film_reviews.map((rev) => (
                          <div key={rev.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white capitalize">{rev.decision}</span>
                              <span className="text-[10px] text-zinc-500">{formatDate(rev.created_at)}</span>
                            </div>
                            {rev.notes && (
                              <p className="text-xs text-zinc-400 italic">&ldquo;{rev.notes}&rdquo;</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Metadata & Credits */}
              {activeTab === 'media' && (
                <div className="space-y-4 animate-fade-in text-xs">

                  {/* ── Artwork Audit Panel ── */}
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[11px] mb-2.5">
                      Theatrical Artworks
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Portrait Poster */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-400 font-semibold">Portrait Poster (2:3)</span>
                          {f.poster_url
                            ? <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1"><Check className="h-3 w-3" /> Provided</span>
                            : <span className="text-rose-400 text-[10px] font-bold flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Missing</span>
                          }
                        </div>
                        <div className="aspect-[2/3] w-full max-w-[120px] rounded-lg overflow-hidden border border-white/10 bg-black/60">
                          {f.poster_url
                            ? <img src={f.poster_url} alt="Portrait Poster" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">No portrait</div>
                          }
                        </div>
                      </div>

                      {/* Landscape Backdrop */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-400 font-semibold">Landscape Banner (16:9)</span>
                          {f.backdrop_url
                            ? <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1"><Check className="h-3 w-3" /> Provided</span>
                            : <span className="text-rose-400 text-[10px] font-bold flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Missing</span>
                          }
                        </div>
                        <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black/60">
                          {f.backdrop_url
                            ? <img src={f.backdrop_url} alt="Landscape Backdrop" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">No landscape</div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[11px] mb-1">
                      Synopsis
                    </h4>
                    <p className="text-zinc-200 leading-relaxed">{f.synopsis || 'No synopsis provided.'}</p>
                  </div>

                  {f.director_note && (
                    <div>
                      <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[11px] mb-1">
                        Director&rsquo;s Note
                      </h4>
                      <p className="text-zinc-300 italic leading-relaxed">&ldquo;{f.director_note}&rdquo;</p>
                    </div>
                  )}

                  {/* Credits Roster */}
                  {f.film_credits && f.film_credits.length > 0 && (
                    <div>
                      <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[11px] mb-2">
                        Cast & Crew Credits ({f.film_credits.length})
                      </h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {f.film_credits.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="font-semibold text-white">{c.person_name}</span>
                            <span className="text-zinc-400 text-[11px]">{c.credit_role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Licence Rights */}
              {activeTab === 'licence' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  {licence ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Licence Scope</span>
                          <span className="font-bold text-white uppercase">{licence.licence_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Territory</span>
                          <span className="font-bold text-white capitalize">{licence.territory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Term Duration</span>
                          <span className="font-bold text-white">{licence.term_months} Months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Music Rights Clearance</span>
                          <span className={`font-bold ${licence.music_cleared ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {licence.music_cleared ? 'Cleared by Filmmaker' : 'Not Cleared'}
                          </span>
                        </div>
                      </div>

                      {/* Verification Status */}
                      <div className="p-4 rounded-2xl border border-white/10 bg-[#121620] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-ivory font-semibold text-xs">Staff Rights Verification</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${isLicenceVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-signature/10 text-signature'}`}>
                            {isLicenceVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>

                        {isLicenceVerified ? (
                          <p className="text-[11px] text-muted">
                            Verified on {formatDate(licence.verified_at!)} by staff member.
                          </p>
                        ) : (
                          <button
                            onClick={handleVerifyLicence}
                            disabled={verifyingLicence}
                            className="w-full py-2.5 px-4 rounded-xl bg-signature hover:bg-[#F2B94F] text-black font-semibold text-xs shadow-md shadow-signature/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            {verifyingLicence ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                            <span>Verify & Stamp Legal Clearance</span>
                          </button>
                        )}
                      </div>
                      {/* Print Official OTT Rights Deed & Undertaking */}
                      <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <FileCheck2 className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Official OTT Rights Deed</span>
                            <span className="text-[11px] text-zinc-400 block">Print formal deed & chain of title undertaking</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowRightsDeed(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Print Deed</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-500 italic text-center py-6">No licence agreement attached.</p>
                  )}
                </div>
              )}

              {/* Tab 4: IP Hold */}
              {activeTab === 'ip_hold' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Current Status Banner */}
                  <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
                    f.ip_hold
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-emerald-500/8 border-emerald-500/20'
                  }`}>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                      f.ip_hold ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {f.ip_hold ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${ f.ip_hold ? 'text-rose-300' : 'text-emerald-300' }`}>
                        {f.ip_hold ? 'Film is currently on IP Hold' : 'Film is not on IP Hold'}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {f.ip_hold
                          ? `Applied: ${f.ip_hold_at ? new Date(f.ip_hold_at).toLocaleString('en-IN') : 'Unknown'}`
                          : 'No active copyright complaint hold on this film.'}
                      </p>
                      {f.ip_hold && f.ip_hold_reason && (
                        <p className="text-[11px] text-zinc-300 mt-1.5 italic">Reason: {f.ip_hold_reason}</p>
                      )}
                    </div>
                  </div>

                  {/* Legal Context */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 text-xs text-zinc-400 space-y-1.5">
                    <p className="text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">IT Act 2000 §79 — Safe Harbour Protocol</p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li>IP Hold immediately hides the film from all public viewers</li>
                      <li>Filmmaker receives 14 days to submit counter-notice</li>
                      <li>If no counter-notice: permanently archive the film</li>
                      <li>All actions are logged for judicial record</li>
                    </ul>
                  </div>

                  {/* Reason Input */}
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 block">
                      Hold Reason / Complaint Reference <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={holdReason}
                      onChange={(e) => setHoldReason(e.target.value)}
                      placeholder="e.g. Copyright claim by [Complainant Name] — Report ID [REF]. Original work: [Title]. Violation: [Type]."
                      className="w-full resize-none rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/40 transition-colors leading-relaxed"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {!f.ip_hold ? (
                      <button
                        onClick={() => handleIpHold(true)}
                        disabled={applyingHold || !holdReason.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white shadow-lg shadow-rose-600/20 transition-colors"
                      >
                        {applyingHold ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                        Apply IP Hold
                      </button>
                    ) : (
                      <button
                        onClick={() => handleIpHold(false)}
                        disabled={applyingHold}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-lg shadow-emerald-600/20 transition-colors"
                      >
                        {applyingHold ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" />}
                        Lift IP Hold
                      </button>
                    )}
                    <p className="text-[10px] text-zinc-500">
                      {f.ip_hold ? 'Lifting hold will restore film to its previous status.' : 'Applying hold will immediately hide the film from public.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Official OTT Format Legal Rights Undertaking Modal */}
      {showRightsDeed && (
        <RightsUndertakingModal
          film={f}
          onClose={() => setShowRightsDeed(false)}
        />
      )}
    </motion.div>,
    document.body
  );
};
