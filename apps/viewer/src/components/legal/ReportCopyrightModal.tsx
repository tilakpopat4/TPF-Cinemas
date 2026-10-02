import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileWarning,
  ChevronDown,
} from 'lucide-react';
import { Film } from '../../types';
import { supabase } from '../../lib/supabase';
import { useReducedMotion, fadeOnly, scaleModal } from '../../lib/motion';

interface ReportCopyrightModalProps {
  film: Film;
  onClose: () => void;
}

const VIOLATION_TYPES = [
  { value: 'full_film',   label: 'Full Film / Complete Work' },
  { value: 'screenplay',  label: 'Screenplay / Script / Story' },
  { value: 'music',       label: 'Music / Sound Recording' },
  { value: 'footage',     label: 'Video Footage / Clips' },
  { value: 'photograph',  label: 'Photograph / Still Image' },
  { value: 'other',       label: 'Other Intellectual Property' },
];

export const ReportCopyrightModal: React.FC<ReportCopyrightModalProps> = ({
  film,
  onClose,
}) => {
  const reduced = useReducedMotion();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    complainant_name: '',
    complainant_email: '',
    complainant_phone: '',
    original_work_title: '',
    original_work_year: '',
    violation_type: '',
    violation_description: '',
    owns_original_rights: false,
    good_faith_declaration: false,
    penalty_awareness: false,
  });

  const canSubmit =
    form.complainant_name.trim() &&
    form.complainant_email.trim() &&
    form.original_work_title.trim() &&
    form.violation_type &&
    form.violation_description.trim().length >= 30 &&
    form.owns_original_rights &&
    form.good_faith_declaration &&
    form.penalty_awareness;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      const { error: insertErr } = await supabase
        .from('copyright_reports')
        .insert({
          film_id: film.id,
          complainant_name: form.complainant_name.trim(),
          complainant_email: form.complainant_email.trim(),
          complainant_phone: form.complainant_phone.trim() || null,
          original_work_title: form.original_work_title.trim(),
          original_work_year: form.original_work_year
            ? parseInt(form.original_work_year)
            : null,
          violation_type: form.violation_type,
          violation_description: form.violation_description.trim(),
          owns_original_rights: form.owns_original_rights,
          good_faith_declaration: form.good_faith_declaration,
          penalty_awareness: form.penalty_awareness,
        });
      if (insertErr) throw insertErr;
      setStep('success');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function field(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="report-backdrop"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        {...fadeOnly(reduced)}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          key="report-panel"
          className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0d1117] border border-rose-500/20 shadow-2xl shadow-rose-900/30"
          {...(reduced ? fadeOnly(reduced) : scaleModal(reduced))}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 border border-rose-500/30">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-400">
                  Copyright Infringement Report
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Indian Copyright Act 1957 · IT Act 2000 §79
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          {step === 'success' ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center justify-center gap-4 px-8 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Report Submitted</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Our content team will review your complaint within{' '}
                  <strong className="text-white">72 hours</strong> as required
                  under IT Rules 2021.
                </p>
              </div>
              <div className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-left text-xs space-y-1.5 text-zinc-400">
                <p>
                  <span className="text-zinc-300 font-semibold">Film under review:</span>{' '}
                  {film.title}
                </p>
                <p>
                  <span className="text-zinc-300 font-semibold">What happens next:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Our staff will examine the content against your claim</li>
                  <li>The filmmaker will be given 14 days to respond with counter-notice</li>
                  <li>If valid, content will be removed under IT Act §79</li>
                  <li>You will be notified at your provided email address</li>
                </ul>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Film Being Reported */}
              <div className="rounded-xl bg-rose-500/8 border border-rose-500/20 p-3.5 flex items-start gap-3">
                <FileWarning className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="text-rose-300 font-semibold">Reporting:</p>
                  <p className="text-white font-bold">{film.title}</p>
                  <p className="text-zinc-400 mt-0.5">
                    {film.release_year} · {film.language}
                  </p>
                </div>
              </div>

              {/* Section 1: Your Details */}
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pb-1 border-b border-white/[0.06] w-full">
                  1 · Complainant Details
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">
                      Full Legal Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.complainant_name}
                      onChange={(e) => field('complainant_name', e.target.value)}
                      placeholder="As on government ID"
                      className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.06] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.complainant_email}
                      onChange={(e) => field('complainant_email', e.target.value)}
                      placeholder="For correspondence"
                      className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.06] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">
                    Phone Number (optional)
                  </label>
                  <input
                    type="tel"
                    value={form.complainant_phone}
                    onChange={(e) => field('complainant_phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.06] transition-colors"
                  />
                </div>
              </fieldset>

              {/* Section 2: Original Work */}
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pb-1 border-b border-white/[0.06] w-full">
                  2 · Your Original Work
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">
                      Title of Original Work <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.original_work_title}
                      onChange={(e) => field('original_work_title', e.target.value)}
                      placeholder="Name of your copyrighted work"
                      className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.06] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">
                      Year of Creation
                    </label>
                    <input
                      type="number"
                      min={1900}
                      max={new Date().getFullYear()}
                      value={form.original_work_year}
                      onChange={(e) => field('original_work_year', e.target.value)}
                      placeholder="e.g. 2022"
                      className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.06] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">
                    Type of Violation <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={form.violation_type}
                      onChange={(e) => field('violation_type', e.target.value)}
                      className="w-full appearance-none rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.06] transition-colors"
                    >
                      <option value="" disabled className="bg-zinc-900">
                        Select what was copied
                      </option>
                      {VIOLATION_TYPES.map((v) => (
                        <option key={v.value} value={v.value} className="bg-zinc-900">
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">
                    Description of Infringement <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    minLength={30}
                    value={form.violation_description}
                    onChange={(e) => field('violation_description', e.target.value)}
                    placeholder="Describe specifically what content has been infringed and how it matches your original work. Include timestamps or scenes if applicable."
                    className="w-full resize-none rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.06] transition-colors leading-relaxed"
                  />
                  <p className="text-right text-[10px] text-zinc-600 mt-0.5">
                    {form.violation_description.length} / 30 min characters
                  </p>
                </div>
              </fieldset>

              {/* Section 3: Declarations */}
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pb-1 border-b border-white/[0.06] w-full">
                  3 · Legal Declarations (Mandatory)
                </legend>

                {[
                  {
                    key: 'owns_original_rights' as const,
                    label:
                      'I am the copyright owner or am authorised to act on behalf of the copyright owner of the work described above.',
                  },
                  {
                    key: 'good_faith_declaration' as const,
                    label:
                      'I have a good faith belief that the use of the material is not authorised by the copyright owner, its agent, or the law.',
                  },
                  {
                    key: 'penalty_awareness' as const,
                    label:
                      'I understand that submitting a false copyright report is punishable under Section 209 IPC and may result in legal action against me.',
                  },
                ].map((decl) => (
                  <label
                    key={decl.key}
                    className={`flex items-start gap-3 rounded-xl p-3.5 border cursor-pointer transition-colors ${
                      form[decl.key]
                        ? 'bg-rose-500/8 border-rose-500/30'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        form[decl.key]
                          ? 'bg-rose-500 border-rose-500'
                          : 'border-white/20 bg-transparent'
                      }`}
                    >
                      {form[decl.key] && (
                        <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-white">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={form[decl.key]}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [decl.key]: e.target.checked }))
                      }
                      className="sr-only"
                    />
                    <p className="text-[11px] text-zinc-300 leading-relaxed">{decl.label}</p>
                  </label>
                ))}
              </fieldset>

              {/* Warning Box */}
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 p-3.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-200/80 leading-relaxed">
                  False reports are a criminal offence under §209 IPC. This report will be
                  logged with your IP address and may be shared with law enforcement if
                  found to be fraudulent.
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white shadow-lg shadow-rose-600/30 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}
                  Submit Infringement Report
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
