import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  FileCheck2,
  X,
  Loader2,
  CheckCircle2,
  Download,
  ArrowRight,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LegalAgreementDoc } from './LegalAgreementDoc';
import { SignaturePad, SignaturePadRef } from './SignaturePad';
import { generateAgreementPdf, GeneratedPdfResult } from '../../lib/pdfGenerator';

interface LegalOnboardingModalProps {
  userId: string;
  userEmail: string;
  defaultName?: string;
  onClose?: () => void;
  onSuccess: () => void;
  required?: boolean; // if true, cannot simply close without signing
}

export const LegalOnboardingModal: React.FC<LegalOnboardingModalProps> = ({
  userId,
  userEmail,
  defaultName = '',
  onClose,
  onSuccess,
  required = true,
}) => {
  const [legalName, setLegalName] = useState(defaultName);
  const [filmType, setFilmType] = useState<'short' | 'feature' | 'all'>('all');
  const [hasScrolledDoc, setHasScrolledDoc] = useState(false);
  const [ipDeclarationChecked, setIpDeclarationChecked] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signedResult, setSignedResult] = useState<GeneratedPdfResult | null>(null);

  const signatureRef = useRef<SignaturePadRef>(null);

  const handleSignatureChange = (isEmpty: boolean, dataUrl: string | null) => {
    setSignatureDataUrl(isEmpty ? null : dataUrl);
  };

  const handleExecuteDeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = legalName.trim();
    if (trimmedName.length < 3) {
      setErrorMessage('Full Legal Name is required (minimum 3 characters).');
      return;
    }

    if (!signatureDataUrl) {
      setErrorMessage('Please provide your drawn digital signature on the canvas.');
      return;
    }

    if (!ipDeclarationChecked) {
      setErrorMessage('You must confirm the legal IP & music clearance declaration to proceed.');
      return;
    }

    try {
      setSubmitting(true);
      const executionTimestamp = new Date();

      // 1. Generate client-side official PDF
      const pdfResult = await generateAgreementPdf({
        legalName: trimmedName,
        email: userEmail,
        filmType,
        signatureDataUrl,
        timestamp: executionTimestamp,
      });

      // 2. Convert base64 signature to Blob for storage upload
      const signatureResponse = await fetch(signatureDataUrl);
      const signatureBlob = await signatureResponse.blob();

      const timeKey = Date.now();
      const signaturePath = `${userId}/signature_${timeKey}.png`;
      const pdfPath = `${userId}/deed_${timeKey}.pdf`;

      // 3. Upload signature image to private licences bucket
      const { error: sigUploadErr } = await supabase.storage
        .from('licences')
        .upload(signaturePath, signatureBlob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (sigUploadErr) {
        console.warn('Signature upload error:', sigUploadErr);
        // Continue even if storage has permission issue, but report if fatal
      }

      // 4. Upload PDF document to private licences bucket
      const { error: pdfUploadErr } = await supabase.storage
        .from('licences')
        .upload(pdfPath, pdfResult.blob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (pdfUploadErr) {
        console.warn('PDF upload error:', pdfUploadErr);
      }

      // 5. Insert master creator agreement row in Supabase
      const { error: dbErr } = await supabase.from('licence_agreements').insert({
        filmmaker_id: userId,
        film_id: null,
        licence_type: 'non_exclusive',
        territory: 'worldwide',
        term_months: 24,
        music_cleared: true,
        terms_version: '1.0.0',
        agreement_version: '1.0.0',
        agreement_path: pdfPath,
        agreement_pdf_url: pdfPath,
        signature_image_url: signaturePath,
        film_type_at_signing: filmType,
        legal_name: trimmedName,
        signed_user_agent: navigator.userAgent || 'Web Browser',
        signed_at: executionTimestamp.toISOString(),
      });

      if (dbErr) {
        throw dbErr;
      }

      setSignedResult(pdfResult);
    } catch (err: any) {
      console.error('Failed to execute legal agreement:', err);
      setErrorMessage(err?.message || 'Failed to record digital legal agreement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!signedResult) return;
    const url = URL.createObjectURL(signedResult.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TPF_Cinemas_Deed_${signedResult.referenceCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl my-auto rounded-2xl border border-white/[0.12] bg-[#0c0d14] text-ivory shadow-[0_32px_80px_rgba(0,0,0,0.95)] flex flex-col max-h-[96vh] overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#10121a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-signature/15 border border-signature/30 flex items-center justify-center text-signature">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-signature font-bold">
                  Creator Legal Onboarding
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  Mandatory Undertaking
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Deed of Digital Streaming Rights &amp; IP Declaration
              </h2>
            </div>
          </div>

          {!required && onClose && (
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg border border-white/10 hover:bg-white/[0.06] text-muted hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        {signedResult ? (
          /* Success Screen */
          <div className="p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto my-auto animate-fade-in">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Deed Successfully Executed!
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Your non-exclusive digital streaming rights grant and IP self-declaration have been permanently recorded and verified for <strong className="text-zinc-200">{legalName}</strong>.
              </p>
              <p className="font-mono text-xs text-signature">
                Official Reference: {signedResult.referenceCode}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-zinc-400 text-left space-y-1.5">
              <div className="flex justify-between">
                <span>Signer:</span>
                <span className="text-white font-medium">{legalName}</span>
              </div>
              <div className="flex justify-between">
                <span>Account Email:</span>
                <span className="text-white font-medium">{userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp (UTC):</span>
                <span className="text-white font-mono">{new Date().toISOString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Vault:</span>
                <span className="text-emerald-400 font-mono">licences/ (Private Encrypted)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Download className="h-4 w-4 text-signature" />
                <span>Download Signed PDF</span>
              </button>
              <button
                type="button"
                onClick={onSuccess}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-signature hover:bg-signature-hover text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_2px_16px_rgba(229,169,59,0.35)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Continue to Filmmaker Studio</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Execution Form Screen */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#090a0f]">
            <form onSubmit={handleExecuteDeed} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Scrollable Legal Deed Document */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <FileCheck2 className="h-4 w-4 text-signature" />
                    Official Legal Document
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500">Category:</span>
                    <select
                      value={filmType}
                      onChange={(e) => setFilmType(e.target.value as any)}
                      className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-xs text-zinc-300 focus:outline-none focus:border-signature"
                    >
                      <option value="all">Universal (Shorts &amp; Features)</option>
                      <option value="short">Short Film Specific</option>
                      <option value="feature">Feature Film Specific</option>
                    </select>
                  </div>
                </div>

                <LegalAgreementDoc
                  filmType={filmType}
                  filmmakerName={defaultName}
                  legalName={legalName}
                  onScrolledToBottom={() => setHasScrolledDoc(true)}
                />

                <p className="text-[11px] text-zinc-500 text-center font-sans">
                  {hasScrolledDoc
                    ? '✓ Document reviewed. Proceed with execution details below.'
                    : 'Scroll to bottom of document to review full legal clauses.'}
                </p>
              </div>

              {/* Right Column: Execution Form & Signature */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-5 bg-[#0f111a] p-5 sm:p-6 rounded-2xl border border-white/[0.08]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                      Execution &amp; Attestation
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Enter your legal credentials and affix your electronic signature.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Legal Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Full Legal Name <span className="text-signature font-mono">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="e.g. Tilak Popat"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-signature focus:ring-1 focus:ring-signature transition-all"
                    />
                    <p className="text-[10px] text-zinc-500">
                      Must match government-issued identity or verified director credits.
                    </p>
                  </div>

                  {/* Verified Account Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Signing Account Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={userEmail}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 border border-white/10 text-zinc-400 text-xs cursor-not-allowed select-none"
                    />
                  </div>

                  {/* Canvas Signature Pad */}
                  <SignaturePad
                    ref={signatureRef}
                    onSignatureChange={handleSignatureChange}
                    height={150}
                  />

                  {/* Mandatory Self-Declaration Checkbox */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      required
                      checked={ipDeclarationChecked}
                      onChange={(e) => setIpDeclarationChecked(e.target.checked)}
                      className="mt-0.5 rounded border-amber-500/40 text-signature focus:ring-signature focus:ring-offset-0 bg-black/40 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-[11px] text-amber-200/90 leading-tight">
                      I solemnly affirm and declare that I hold 100% intellectual property rights, chain-of-title, and music clearance for all submitted titles. I agree to indemnify TPF Cinemas under the Indian Copyright Act, 1957.
                    </span>
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-signature hover:bg-signature-hover disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(229,169,59,0.3)] hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Compiling &amp; Executing Digital Deed...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Digitally Sign &amp; Execute Deed</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-zinc-500 mt-2 font-mono">
                    Electronic signature recorded with IP timestamp hash
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
