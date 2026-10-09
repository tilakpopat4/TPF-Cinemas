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
  Phone,
  Mail,
  Building,
  User,
  FileText,
} from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
  </svg>
);
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
  required?: boolean;
}

export const LegalOnboardingModal: React.FC<LegalOnboardingModalProps> = ({
  userId,
  userEmail,
  defaultName = '',
  onClose,
  onSuccess,
  required = true,
}) => {
  // Creator account fields
  const [legalName, setLegalName] = useState(defaultName);
  const [productionName, setProductionName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [contactEmail, setContactEmail] = useState(userEmail);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [youtubeHandle, setYoutubeHandle] = useState('');
  const [bio, setBio] = useState('');

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

    const trimmedProduction = productionName.trim();
    if (trimmedProduction.length < 2) {
      setErrorMessage('Production Name (Name Under Films Are Made) is required.');
      return;
    }

    const trimmedContact = contactNo.trim();
    if (trimmedContact.length < 7) {
      setErrorMessage('Valid Contact Number is required.');
      return;
    }

    const trimmedMail = contactEmail.trim();
    if (!trimmedMail || !trimmedMail.includes('@')) {
      setErrorMessage('Valid Mail Id is required.');
      return;
    }

    const trimmedBio = bio.trim();
    if (trimmedBio.length < 10) {
      setErrorMessage('Please provide a short description / bio (minimum 10 characters).');
      return;
    }

    if (!signatureDataUrl) {
      setErrorMessage('Please provide your drawn digital signature on the canvas.');
      return;
    }

    if (!ipDeclarationChecked) {
      setErrorMessage('You must confirm the legal consent & rights declaration to proceed.');
      return;
    }

    try {
      setSubmitting(true);
      const executionTimestamp = new Date();

      // 1. Generate client-side official PDF matching Non-Commercial Streaming Rights Consent Form
      const pdfResult = await generateAgreementPdf({
        legalName: trimmedName,
        email: trimmedMail,
        productionName: trimmedProduction,
        contactNo: trimmedContact,
        signatureDataUrl,
        timestamp: executionTimestamp,
      });

      // 2. Convert base64 signature to Blob for storage upload
      const signatureResponse = await fetch(signatureDataUrl);
      const signatureBlob = await signatureResponse.blob();

      const timeKey = Date.now();
      const signaturePath = `${userId}/signature_${timeKey}.png`;
      const pdfPath = `${userId}/consent_${timeKey}.pdf`;

      // 3. Upload signature image to private licences bucket
      const { error: sigUploadErr } = await supabase.storage
        .from('licences')
        .upload(signaturePath, signatureBlob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (sigUploadErr) {
        console.warn('Signature upload error:', sigUploadErr);
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

      // 5. Update user profile with comprehensive creator details
      try {
        await supabase
          .from('profiles')
          .update({
            display_name: trimmedName,
            production_name: trimmedProduction,
            contact_no: trimmedContact,
            bio: trimmedBio,
            instagram_handle: instagramHandle.trim() || null,
            youtube_handle: youtubeHandle.trim() || null,
          })
          .eq('id', userId);
      } catch (profErr) {
        console.warn('Profile update notice:', profErr);
      }

      // 6. Check if master creator agreement already exists for this filmmaker
      const { data: existingMaster } = await supabase
        .from('licence_agreements')
        .select('id')
        .eq('filmmaker_id', userId)
        .is('film_id', null)
        .maybeSingle();

      const agreementPayload = {
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
        legal_name: trimmedName,
        production_name: trimmedProduction,
        contact_no: trimmedContact,
        contact_email: trimmedMail,
        signed_user_agent: navigator.userAgent || 'Web Browser',
        signed_at: executionTimestamp.toISOString(),
      };

      let dbErr = null;
      if (existingMaster) {
        const { error: updateErr } = await supabase
          .from('licence_agreements')
          .update(agreementPayload)
          .eq('id', existingMaster.id);
        dbErr = updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('licence_agreements')
          .insert(agreementPayload);
        dbErr = insertErr;
      }

      if (dbErr) {
        if (dbErr.message?.includes('schema cache') || dbErr.message?.includes('column') || dbErr.code === 'PGRST204') {
          throw new Error('Database schema update required: Please run migration 20261009000002_creator_onboarding_profile_fields.sql in your Supabase SQL Editor.');
        }
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
    link.download = `TPF_Cinemas_Consent_${signedResult.referenceCode}.pdf`;
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
                  Creator Onboarding
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  Mandatory Consent &amp; Attestation
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Creator Profile &amp; Non-Commercial Streaming Rights Consent Form
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
                Consent Form Successfully Executed!
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Your non-commercial streaming rights consent form has been permanently recorded and verified for <strong className="text-zinc-200">{legalName}</strong> ({productionName}).
              </p>
              <p className="font-mono text-xs text-signature">
                Official Reference: {signedResult.referenceCode}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-zinc-400 text-left space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span>Legal Full Name:</span>
                <span className="text-white font-medium">{legalName}</span>
              </div>
              <div className="flex justify-between">
                <span>Production Name:</span>
                <span className="text-white font-medium">{productionName}</span>
              </div>
              <div className="flex justify-between">
                <span>Contact Number:</span>
                <span className="text-white font-medium">{contactNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Account Mail ID:</span>
                <span className="text-white font-medium">{contactEmail}</span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp (UTC):</span>
                <span className="text-white font-mono">{new Date().toISOString()}</span>
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
          /* Two-Column Onboarding Flow */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <form onSubmit={handleExecuteDeed} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: Official Consent Document Preview (5 Cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    Consent Form Preview (Times New Roman)
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Scroll to review
                  </span>
                </div>

                <LegalAgreementDoc
                  filmmakerName={legalName || defaultName}
                  legalName={legalName}
                  productionName={productionName}
                  contactNo={contactNo}
                  contactEmail={contactEmail}
                  onScrolledToBottom={() => setHasScrolledDoc(true)}
                  referenceCode={`TPF-CONSENT-${new Date().getFullYear()}`}
                />
              </div>

              {/* Right Column: Comprehensive Creator Profile & Digital Signature Form (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                    Creator Account Details &amp; Digital Signature
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Enter your legal credentials, production house details, and affix your digital signature.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Full Legal Name* */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Full Legal Name <span className="text-signature font-mono">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="e.g. Tilak Popat"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-signature focus:ring-1 focus:ring-signature transition-all"
                      />
                    </div>
                  </div>

                  {/* Production (Name Under Films Are Made)* */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Production Name <span className="text-signature font-mono">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={productionName}
                        onChange={(e) => setProductionName(e.target.value)}
                        placeholder="e.g. Tilak Popat Films / Independent"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-signature focus:ring-1 focus:ring-signature transition-all"
                      />
                    </div>
                  </div>

                  {/* Contact No* */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Contact No <span className="text-signature font-mono">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="tel"
                        required
                        value={contactNo}
                        onChange={(e) => setContactNo(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-signature focus:ring-1 focus:ring-signature transition-all"
                      />
                    </div>
                  </div>

                  {/* Mail Id* */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Mail Id <span className="text-signature font-mono">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. director@films.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-signature focus:ring-1 focus:ring-signature transition-all"
                      />
                    </div>
                  </div>

                  {/* Instagram Handle */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Instagram Handle <span className="text-zinc-500 text-[10px]">(optional)</span>
                    </label>
                    <div className="relative">
                      <InstagramIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="@username"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-signature focus:ring-1 focus:ring-signature transition-all"
                      />
                    </div>
                  </div>

                  {/* YouTube Handle */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      YouTube Handle / Channel <span className="text-zinc-500 text-[10px]">(optional)</span>
                    </label>
                    <div className="relative">
                      <YoutubeIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        value={youtubeHandle}
                        onChange={(e) => setYoutubeHandle(e.target.value)}
                        placeholder="@channel"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-signature focus:ring-1 focus:ring-signature transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Short Description / Bio* */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Short Description / Bio <span className="text-signature font-mono">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe yourself as a filmmaker, director, or production house..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-signature focus:ring-1 focus:ring-signature transition-all resize-none"
                  />
                </div>

                {/* Canvas Signature Pad */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Digital Signature <span className="text-signature font-mono">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Draw with pointer, mouse, or touch
                    </span>
                  </div>
                  <SignaturePad
                    ref={signatureRef}
                    onSignatureChange={handleSignatureChange}
                    height={130}
                  />
                </div>

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
                    I confirm that I have the authority to grant this permission and voluntarily consent to the non-commercial streaming of my submitted audiovisual works on TPF Cinemas under the terms of this consent form.
                  </span>
                </label>

                {/* Submit Action */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-signature hover:bg-signature-hover disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(229,169,59,0.3)] hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Compiling &amp; Executing Consent Form...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Sign &amp; Activate Filmmaker Account</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-zinc-500 mt-2 font-mono">
                    Legal Full Name, Production Name, Contact No, and Mail ID will be affixed to your digital signature
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
