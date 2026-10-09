import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  FileCheck2,
  X,
  Download,
  Loader2,
  Printer,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Terminal,
} from 'lucide-react';
import { LicenceAgreement } from '../../types';
import { supabase } from '../../lib/supabase';
import { LegalAgreementDoc } from './LegalAgreementDoc';

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

  // Resolved metadata with fallbacks to master agreement
  const [resolvedLegalName, setResolvedLegalName] = useState<string>(
    agreement.legal_name || agreement.filmmaker?.display_name || ''
  );
  const [resolvedProduction, setResolvedProduction] = useState<string>(
    agreement.production_name || ''
  );
  const [resolvedContact, setResolvedContact] = useState<string>(
    agreement.contact_no || ''
  );
  const [resolvedEmail, setResolvedEmail] = useState<string>(
    agreement.contact_email || ''
  );

  useEffect(() => {
    let active = true;

    async function loadUrls() {
      try {
        setLoadingAssets(true);

        let sigPath = agreement.signature_image_url;
        let pdfTarget = agreement.agreement_pdf_url || agreement.agreement_path;
        let legalName = agreement.legal_name;
        let prodName = agreement.production_name;
        let contact = agreement.contact_no;
        let mail = agreement.contact_email;

        // If signature or credentials are missing on this record, query the filmmaker's master agreement
        if (!sigPath || !prodName || !contact) {
          const targetFilmmakerId = agreement.filmmaker_id;
          if (targetFilmmakerId) {
            const { data: master } = await supabase
              .from('licence_agreements')
              .select('signature_image_url, legal_name, production_name, contact_no, contact_email, agreement_pdf_url, agreement_path')
              .eq('filmmaker_id', targetFilmmakerId)
              .not('signature_image_url', 'is', null)
              .order('signed_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (master) {
              if (!sigPath && master.signature_image_url) sigPath = master.signature_image_url;
              if (!pdfTarget) pdfTarget = master.agreement_pdf_url || master.agreement_path;
              if (!legalName && master.legal_name) legalName = master.legal_name;
              if (!prodName && master.production_name) prodName = master.production_name;
              if (!contact && master.contact_no) contact = master.contact_no;
              if (!mail && master.contact_email) mail = master.contact_email;
            }

            // Also check filmmaker profile if still missing
            if (!prodName || !contact) {
              const { data: prof } = await supabase
                .from('profiles')
                .select('display_name, production_name, contact_no')
                .eq('id', targetFilmmakerId)
                .maybeSingle();

              if (prof) {
                if (!legalName && prof.display_name) legalName = prof.display_name;
                if (!prodName && prof.production_name) prodName = prof.production_name;
                if (!contact && prof.contact_no) contact = prof.contact_no;
              }
            }
          }
        }

        if (active) {
          if (legalName) setResolvedLegalName(legalName);
          if (prodName) setResolvedProduction(prodName);
          if (contact) setResolvedContact(contact);
          if (mail) setResolvedEmail(mail);
        }

        // Resolve signature image URL
        if (sigPath && active) {
          const sig = await createSignedUrl(sigPath);
          if (active) setSignatureUrl(sig);
        }

        // Resolve PDF document URL
        if (pdfTarget && active) {
          const pdf = await createSignedUrl(pdfTarget);
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

  const handlePrint = () => {
    window.print();
  };

  const isVerified = Boolean(agreement.verified_at);
  const legalRefCode = `TPF-CONSENT-${agreement.film?.title ? 'FILM' : 'MASTER'}-${agreement.id.slice(0, 8).toUpperCase()}`;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl my-auto rounded-2xl border border-white/[0.12] bg-[#0c0d14] text-ivory shadow-[0_32px_80px_rgba(0,0,0,0.95)] flex flex-col max-h-[96vh] overflow-hidden print:border-none print:shadow-none print:max-h-none print:h-auto print:rounded-none">
        {/* Top Control Bar (Screen only, hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#10121a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-signature/15 border border-signature/30 flex items-center justify-center text-signature">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-signature font-bold">
                  Official Legal Inspection
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
                Non-Commercial Streaming Rights Consent Form &bull; {resolvedLegalName || 'Filmmaker'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Print Deed in Times New Roman legal format"
            >
              <Printer className="h-3.5 w-3.5 text-signature" />
              <span className="hidden sm:inline">Print Document</span>
            </button>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg border border-white/10 hover:bg-white/[0.06] text-muted hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Document & Attestation */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#090a0f] print:bg-white print:p-0 print:overflow-visible">
          {verifyError && (
            <div className="no-print p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}

          {/* Exact Document Format: Non-Commercial Streaming Rights Consent Form */}
          <div className="max-w-3xl mx-auto shadow-2xl print:shadow-none">
            <LegalAgreementDoc
              filmTitle={agreement.film?.title}
              filmmakerName={agreement.filmmaker?.display_name}
              legalName={resolvedLegalName}
              productionName={resolvedProduction}
              contactNo={resolvedContact}
              contactEmail={resolvedEmail}
              signatureUrl={signatureUrl}
              loadingSignature={loadingAssets}
              executionDate={agreement.signed_at}
              referenceCode={legalRefCode}
              className="max-h-none print:border-none print:shadow-none print:p-0"
            />
          </div>

          {/* Electronic Evidence & Audit Details (Screen only, hidden in print) */}
          <div className="no-print max-w-3xl mx-auto p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-signature" />
              Electronic Attestation Metadata &bull; Information Technology Act, 2000
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
        </div>

        {/* Modal Footer Actions (Screen only, hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-[#10121a] shrink-0">
          <div className="flex items-center gap-3">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-signature" />
                <span>Download PDF</span>
                <ExternalLink className="h-3 w-3 text-zinc-400" />
              </a>
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
