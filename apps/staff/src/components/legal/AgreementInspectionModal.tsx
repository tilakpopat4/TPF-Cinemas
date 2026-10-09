import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  FileCheck2,
  X,
  Download,
  Loader2,
  Calendar,
  Globe,
  User,
  Film as FilmIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Terminal,
} from 'lucide-react';
import { LicenceAgreement } from '../../types';

interface AgreementInspectionModalProps {
  agreement: LicenceAgreement;
  onClose: () => void;
  onVerified: () => void;
  createSignedUrl: (path: string) => Promise<string | null>;
  verifyAgreement: (agreementId: string) => Promise<{ success: boolean; error?: string }>;
}

export const AgreementInspectionModal: React.FC<AgreementInspectionModalProps> = ({
  agreement,
  onClose,
  onVerified,
  createSignedUrl,
  verifyAgreement,
}) => {
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUrls() {
      try {
        setLoadingAssets(true);
        if (agreement.signature_image_url) {
          const sig = await createSignedUrl(agreement.signature_image_url);
          if (active) setSignatureUrl(sig);
        }
        if (agreement.agreement_pdf_url) {
          const pdf = await createSignedUrl(agreement.agreement_pdf_url);
          if (active) setPdfUrl(pdf);
        }
      } catch (err) {
        console.error('Failed to load signed agreement asset URLs:', err);
      } finally {
        if (active) setLoadingAssets(false);
      }
    }

    loadUrls();
    return () => {
      active = false;
    };
  }, [agreement, createSignedUrl]);

  const handleVerify = async () => {
    try {
      setVerifying(true);
      setVerifyError(null);
      const res = await verifyAgreement(agreement.id);
      if (res.success) {
        onVerified();
      } else {
        setVerifyError(res.error || 'Verification failed');
      }
    } catch (err: any) {
      setVerifyError(err?.message || 'Verification error');
    } finally {
      setVerifying(false);
    }
  };

  const isVerified = Boolean(agreement.verified_at);
  const formattedDate = agreement.signed_at
    ? new Date(agreement.signed_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Unknown';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl my-auto rounded-2xl border border-white/[0.12] bg-[#0c0d14] text-ivory shadow-[0_32px_80px_rgba(0,0,0,0.95)] flex flex-col max-h-[96vh] overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#10121a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-signature/15 border border-signature/30 flex items-center justify-center text-signature">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-signature font-bold">
                  Legal Inspection
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold border ${
                    isVerified
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isVerified ? 'Curator Verified' : 'Pending Verification'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Digital Streaming Rights Deed &bull; {agreement.legal_name || agreement.filmmaker?.display_name || 'Creator'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg border border-white/10 hover:bg-white/[0.06] text-muted hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#090a0f]">
          {verifyError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center gap-1">
                <User className="h-3 w-3 text-signature" />
                Legal Signer
              </span>
              <p className="text-sm font-semibold text-white truncate">
                {agreement.legal_name || 'Not Declared'}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                Account: {agreement.filmmaker?.display_name || 'Filmmaker'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center gap-1">
                <Clock className="h-3 w-3 text-signature" />
                Signed At
              </span>
              <p className="text-sm font-semibold text-white">
                {formattedDate}
              </p>
              <p className="text-[11px] text-zinc-400">
                Ver: {agreement.agreement_version || '1.0.0'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center gap-1">
                <Globe className="h-3 w-3 text-signature" />
                Territory &amp; Term
              </span>
              <p className="text-sm font-semibold text-white">
                {agreement.territory || 'Worldwide'}
              </p>
              <p className="text-[11px] text-zinc-400">
                {agreement.term_months} Months &bull; Non-Exclusive
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center gap-1">
                <FilmIcon className="h-3 w-3 text-signature" />
                Target Scope
              </span>
              <p className="text-sm font-semibold text-white capitalize">
                {agreement.film?.title ? agreement.film.title : 'Master Onboarding Deed'}
              </p>
              <p className="text-[11px] text-zinc-400 capitalize">
                {agreement.film_type_at_signing || 'All Formats'}
              </p>
            </div>
          </div>

          {/* Electronic Evidence & Audit Snapshot */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-signature" />
              Electronic Attestation Hash &bull; Information Technology Act, 2000
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-400 font-mono">
              <div>
                <span className="text-zinc-500">Signer IP: </span>
                <span className="text-zinc-300">{agreement.signed_ip || 'Captured (Encrypted Gateway)'}</span>
              </div>
              <div className="truncate" title={agreement.signed_user_agent || ''}>
                <span className="text-zinc-500">User Agent: </span>
                <span className="text-zinc-300">{agreement.signed_user_agent || 'Standard Web Browser'}</span>
              </div>
              <div>
                <span className="text-zinc-500">Music Clearance: </span>
                <span className="text-emerald-400 font-semibold">
                  {agreement.music_cleared ? '100% Cleared (Declared)' : 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Curator Verification: </span>
                <span className={isVerified ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                  {isVerified ? `Verified by ${agreement.verifier?.display_name || 'Staff'}` : 'Awaiting Review'}
                </span>
              </div>
            </div>
          </div>

          {/* Signature Preview & Official PDF Download */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Signature Box */}
            <div className="p-5 rounded-2xl bg-[#0f111a] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                    Captured Vector Signature
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-500">
                    PNG Vault Object
                  </span>
                </div>
                <div className="h-36 rounded-xl bg-[#fdfbf7] border border-zinc-200 flex items-center justify-center p-3 overflow-hidden shadow-inner relative">
                  {loadingAssets ? (
                    <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
                  ) : signatureUrl ? (
                    <img
                      src={signatureUrl}
                      alt={`Signature of ${agreement.legal_name || 'Filmmaker'}`}
                      className="max-h-full max-w-full object-contain filter contrast-125"
                    />
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No signature image asset</p>
                  )}
                  <span className="absolute bottom-2 right-3 font-mono text-[9px] text-zinc-400">
                    TPF DIGITAL INK
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-3">
                Drawn directly on interactive canvas by <strong className="text-zinc-300">{agreement.legal_name}</strong>.
              </p>
            </div>

            {/* Official PDF Action Card */}
            <div className="p-5 rounded-2xl bg-[#0f111a] border border-white/10 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-signature">
                  <FileCheck2 className="h-5 w-5" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                    Official OTT Rights Deed PDF
                  </h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The client-compiled A4 deed containing complete legal covenants, warranties of title, indemnification, and embedded digital signature.
                </p>
              </div>

              <div className="space-y-2">
                {pdfUrl ? (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Download className="h-4 w-4 text-signature" />
                    <span>Download Official PDF (Signed URL)</span>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400 ml-1" />
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] text-zinc-500 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    {loadingAssets ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating Secure Signed URL...</span>
                      </>
                    ) : (
                      <span>PDF Document Asset Unavailable</span>
                    )}
                  </button>
                )}

                <p className="text-[10px] text-zinc-500 text-center font-mono">
                  HMAC token protected &bull; 60 minute expiration
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-[#10121a] shrink-0">
          <div className="text-xs text-zinc-400">
            {isVerified ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                This agreement has been approved and logged.
              </span>
            ) : (
              <span>Curator action logs to immutable platform audit history.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Close
            </button>
            {!isVerified && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_2px_12px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify &amp; Log Agreement</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
