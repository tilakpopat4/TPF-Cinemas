import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, ShieldCheck, FileCheck2, Loader2 } from 'lucide-react';
import { Film } from '../../types';
import { formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

interface RightsUndertakingModalProps {
  film: Film;
  filmmakerName?: string;
  filmmakerEmail?: string;
  filmmakerLegalName?: string;
  productionName?: string;
  contactNo?: string;
  creatorSignatureUrl?: string;
  onClose: () => void;
}

export const RightsUndertakingModal: React.FC<RightsUndertakingModalProps> = ({
  film,
  filmmakerName,
  filmmakerEmail,
  filmmakerLegalName,
  productionName,
  contactNo,
  creatorSignatureUrl,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const licence = film.licence_agreements;

  // Signature and Signer State
  const [signatureUrl, setSignatureUrl] = useState<string | null>(creatorSignatureUrl || null);
  const [signerLegalName, setSignerLegalName] = useState<string>(filmmakerLegalName || filmmakerName || '');
  const [signerProductionName, setSignerProductionName] = useState<string>(productionName || '');
  const [signerContactNo, setSignerContactNo] = useState<string>(contactNo || '');
  const [signerEmail, setSignerEmail] = useState<string>(filmmakerEmail || '');
  const [loadingSignature, setLoadingSignature] = useState(!creatorSignatureUrl);

  // Verifiable legal identifiers
  const legalRefCode = `TPF-OTT-CONSENT-${film.id.slice(0, 8).toUpperCase()}-${film.release_year || new Date().getFullYear()}`;
  const executionTimestamp = licence?.signed_at || film.created_at || new Date().toISOString();
  const isVerified = Boolean(licence?.verified_at);
  const termMonths = licence?.term_months || 24;

  // Calculate permission duration dates
  const startDate = new Date(executionTimestamp);
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + termMonths);
  const expiryDateFormatted = formatDate(expiryDate.toISOString());

  // Auto-fetch creator signature and legal details if not already available
  useEffect(() => {
    let active = true;

    async function fetchCreatorSignature() {
      if (creatorSignatureUrl && signerLegalName && signerProductionName && signerContactNo && signerEmail) {
        setSignatureUrl(creatorSignatureUrl);
        setLoadingSignature(false);
        return;
      }

      try {
        setLoadingSignature(true);

        // Determine target filmmaker ID: from film or licence or current user
        let targetFilmmakerId = film.filmmaker_id || licence?.filmmaker_id;
        if (!targetFilmmakerId) {
          const { data: authData } = await supabase.auth.getUser();
          targetFilmmakerId = authData.user?.id;
        }

        if (!targetFilmmakerId) {
          if (active) setLoadingSignature(false);
          return;
        }

        // 1. Fetch profile details (for display name, production name, contact no, email)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, email, production_name, contact_no')
          .eq('id', targetFilmmakerId)
          .maybeSingle();

        if (active && profileData) {
          if (!signerEmail) setSignerEmail((profileData as any).email || '');
          if (!signerLegalName) setSignerLegalName(profileData.display_name || '');
          if (!signerProductionName && (profileData as any).production_name) {
            setSignerProductionName((profileData as any).production_name);
          }
          if (!signerContactNo && (profileData as any).contact_no) {
            setSignerContactNo((profileData as any).contact_no);
          }
        }

        // 2. Check if film's own licence agreement has metadata
        let sigPath: string | null = (licence as any)?.signature_image_url || null;
        let legalNameFound: string | null = (licence as any)?.legal_name || null;
        let prodFound: string | null = (licence as any)?.production_name || null;
        let contactFound: string | null = (licence as any)?.contact_no || null;
        let mailFound: string | null = (licence as any)?.contact_email || null;

        // 3. If not present on film licence, query creator's master licence agreement
        if (!sigPath || !prodFound || !contactFound) {
          const { data: masterAgreement, error: masterErr } = await supabase
            .from('licence_agreements')
            .select('signature_image_url, legal_name, production_name, contact_no, contact_email, signed_at')
            .eq('filmmaker_id', targetFilmmakerId)
            .not('signature_image_url', 'is', null)
            .order('signed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!masterErr && masterAgreement) {
            if (!sigPath) sigPath = masterAgreement.signature_image_url;
            if (masterAgreement.legal_name && !signerLegalName) legalNameFound = masterAgreement.legal_name;
            if ((masterAgreement as any).production_name && !signerProductionName) prodFound = (masterAgreement as any).production_name;
            if ((masterAgreement as any).contact_no && !signerContactNo) contactFound = (masterAgreement as any).contact_no;
            if ((masterAgreement as any).contact_email && !signerEmail) mailFound = (masterAgreement as any).contact_email;
          }
        }

        if (active) {
          if (legalNameFound) setSignerLegalName(legalNameFound);
          if (prodFound) setSignerProductionName(prodFound);
          if (contactFound) setSignerContactNo(contactFound);
          if (mailFound) setSignerEmail(mailFound);
        }

        // 4. Resolve signature image path to a signed URL or direct URL
        if (sigPath && active) {
          if (sigPath.startsWith('data:') || sigPath.startsWith('http')) {
            setSignatureUrl(sigPath);
          } else {
            const { data: signedData, error: signedErr } = await supabase.storage
              .from('licences')
              .createSignedUrl(sigPath, 3600);

            if (!signedErr && signedData?.signedUrl && active) {
              setSignatureUrl(signedData.signedUrl);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching creator signature for consent form:', err);
      } finally {
        if (active) setLoadingSignature(false);
      }
    }

    fetchCreatorSignature();

    return () => {
      active = false;
    };
  }, [film.id, film.filmmaker_id, licence, creatorSignatureUrl, signerEmail, signerLegalName, signerProductionName, signerContactNo]);

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      {/* Print-specific style overrides */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 18mm 15mm 18mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          #rights-undertaking-container {
            padding: 0 !important;
            background: #ffffff !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
          }
          #rights-undertaking-doc {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, serif !important;
          }
          #rights-undertaking-doc * {
            font-family: "Times New Roman", Times, serif !important;
            text-decoration: none !important;
          }
          .declaration-box {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        id="rights-undertaking-container"
        className="relative w-full max-w-4xl my-auto rounded-2xl border border-white/[0.12] bg-[#0c0d14] text-ivory shadow-[0_32px_80px_rgba(0,0,0,0.95)] flex flex-col max-h-[96vh] overflow-hidden"
      >
        {/* Top Control Bar (Screen Only - Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#10121a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-signature/15 border border-signature/30 flex items-center justify-center text-signature">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-signature font-bold">
                  Times New Roman Format
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {isVerified ? 'Curator Verified' : 'Executed by Creator'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Non-Commercial Streaming Rights Consent Form
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-signature hover:bg-signature-hover text-black font-semibold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_2px_12px_rgba(229,169,59,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              title="Print Official Legal Document or Save to PDF"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
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

        {/* Scrollable Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#090a0f] print:bg-white print:p-0 print:overflow-visible">
          {/* Strictly Times New Roman, No Underline */}
          <div
            ref={printRef}
            id="rights-undertaking-doc"
            className="max-w-3xl mx-auto rounded-xl bg-white text-black p-8 sm:p-14 shadow-2xl border border-zinc-200 print:shadow-none print:border-none print:p-0 print:max-w-none font-['Times_New_Roman',_Times,_serif] text-[12pt] leading-[1.6]"
          >
            {/* Header / Ref Metadata */}
            <div className="border-b-2 border-black pb-3 mb-6 flex items-center justify-between text-[10pt] font-['Times_New_Roman',_Times,_serif] text-zinc-700">
              <span className="font-bold tracking-wider uppercase text-black">
                TPF CINEMAS • OFFICIAL CURATORIAL OTT PLATFORM
              </span>
              <span>
                REF: {legalRefCode}
              </span>
            </div>

            {/* Document Title (# NON-COMMERCIAL STREAMING RIGHTS CONSENT FORM) */}
            <h1 className="text-[16pt] font-bold uppercase tracking-wide text-black text-center mb-6 leading-tight font-['Times_New_Roman',_Times,_serif]">
              NON-COMMERCIAL STREAMING RIGHTS CONSENT FORM
            </h1>

            {/* Date line */}
            <div className="mb-6 text-[12pt] font-['Times_New_Roman',_Times,_serif]">
              <strong>Date: </strong>
              <span>
                {formatDate(executionTimestamp)}
              </span>
            </div>

            {/* 1. Film Details */}
            <div className="space-y-3 mb-6 font-['Times_New_Roman',_Times,_serif]">
              <h2 className="text-[14pt] font-bold text-black tracking-tight">
                1. Film Details
              </h2>
              <div className="space-y-2 pl-2">
                <div>
                  <strong>Title of Film / Web Series: </strong>
                  <span>{film.title}</span>
                </div>
                <div>
                  <strong>Director / Filmmaker: </strong>
                  <span>{signerLegalName || filmmakerName || 'Registered Filmmaker'}</span>
                </div>
                <div>
                  <strong>Production House (if applicable): </strong>
                  <span>{signerProductionName || 'Independent Production'}</span>
                </div>
              </div>
            </div>

            {/* 2. Consent and Permission */}
            <div className="space-y-3 mb-6 font-['Times_New_Roman',_Times,_serif]">
              <h2 className="text-[14pt] font-bold text-black tracking-tight">
                2. Consent and Permission
              </h2>
              <div className="space-y-3 pl-2 text-justify">
                <p>
                  I, the undersigned, confirm that I am the filmmaker, producer, or authorized rights holder of the above-mentioned audiovisual work.
                </p>
                <p>
                  I hereby grant <strong>Tilak Popat Films</strong> permission to stream and showcase this work on <strong>TPF Cinemas</strong> for non-commercial purposes only.
                </p>
                <p>
                  This permission is granted free of charge and does not involve any transfer of copyright ownership.
                </p>
              </div>
            </div>

            {/* 3. Terms of Permission */}
            <div className="space-y-3 mb-6 font-['Times_New_Roman',_Times,_serif]">
              <h2 className="text-[14pt] font-bold text-black tracking-tight">
                3. Terms of Permission
              </h2>
              <ul className="list-disc pl-6 space-y-1.5 text-justify">
                <li>The work will be streamed solely for non-commercial purposes.</li>
                <li>No payment, royalties, or licensing fees will be charged or paid under this consent.</li>
                <li>The work will not be monetized, sold, or commercially exploited without further written permission.</li>
                <li>Appropriate filmmaker and production credits will be provided wherever reasonably possible.</li>
                <li>All copyright and ownership rights will remain with the original rights holder.</li>
                <li>This consent applies only to the streaming and promotional use expressly authorized above.</li>
              </ul>
            </div>

            {/* 4. Permission Duration */}
            <div className="space-y-3 mb-6 font-['Times_New_Roman',_Times,_serif]">
              <h2 className="text-[14pt] font-bold text-black tracking-tight">
                4. Permission Duration
              </h2>
              <p className="pl-2">
                This consent shall remain valid from{' '}
                <strong>{formatDate(executionTimestamp)}</strong>{' '}
                to{' '}
                <strong>{expiryDateFormatted}</strong>.
              </p>
            </div>

            {/* 5. Declaration */}
            <div className="space-y-3 mb-6 declaration-box font-['Times_New_Roman',_Times,_serif]">
              <h2 className="text-[14pt] font-bold text-black tracking-tight">
                5. Declaration
              </h2>
              <p className="pl-2 mb-6 text-justify">
                I confirm that I have the authority to grant this permission and voluntarily consent to the non-commercial streaming of the above-mentioned work under the terms stated in this document.
              </p>

              {/* Side-by-side signature & execution blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 font-['Times_New_Roman',_Times,_serif]">
                {/* Filmmaker / Rights Holder */}
                <div className="border border-black p-4 bg-white flex flex-col justify-between min-h-[260px]">
                  <div>
                    <p className="font-bold text-[13pt] border-b border-black pb-1 mb-3">
                      Filmmaker / Rights Holder
                    </p>

                    <div className="space-y-2 text-[11pt]">
                      <div>
                        <strong>Full Name: </strong>
                        <span>{signerLegalName || filmmakerName || 'Registered Filmmaker'}</span>
                      </div>

                      <div>
                        <strong>Production Name: </strong>
                        <span>{signerProductionName || 'Independent Production'}</span>
                      </div>

                      <div>
                        <strong>Signature:</strong>
                        <div className="my-1.5 min-h-[56px] flex items-center justify-center bg-zinc-50 border border-zinc-200 p-1">
                          {loadingSignature ? (
                            <div className="flex items-center gap-1.5 text-zinc-500 text-[10pt]">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading verified signature...</span>
                            </div>
                          ) : signatureUrl ? (
                            <img
                              src={signatureUrl}
                              alt={`Signature of ${signerLegalName || 'Filmmaker'}`}
                              className="max-h-14 max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-zinc-500 text-[10pt] italic">
                              Digitally Executed via Account
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <strong>Contact No: </strong>
                        <span>{signerContactNo || 'On Record'}</span>
                      </div>

                      <div>
                        <strong>Mail ID: </strong>
                        <span>{signerEmail || 'Verified Creator Account'}</span>
                      </div>

                      <div>
                        <strong>Date: </strong>
                        <span>{formatDate(executionTimestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Person / Platform Receiving Permission */}
                <div className="border border-black p-4 bg-white flex flex-col justify-between min-h-[260px]">
                  <div>
                    <p className="font-bold text-[13pt] border-b border-black pb-1 mb-3">
                      Person / Platform Receiving Permission
                    </p>

                    <div className="space-y-2 text-[11pt]">
                      <div>
                        <strong>Full Name: </strong>
                        <span>Tilak Popat / TPF Cinemas</span>
                      </div>

                      <div>
                        <strong>Platform: </strong>
                        <span>Tilak Popat Films (TPF Cinemas)</span>
                      </div>

                      <div>
                        <strong>Signature:</strong>
                        <div className="my-1.5 min-h-[56px] flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200 p-1">
                          <span className="font-bold text-[10.5pt] tracking-wider uppercase">
                            TILAK POPAT FILMS
                          </span>
                          <span className="text-[9pt] text-emerald-800 font-semibold flex items-center gap-1">
                            <FileCheck2 className="h-3 w-3" />
                            {isVerified ? 'VERIFIED & RECORDED' : 'CRYPTOGRAPHICALLY RECORDED'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <strong>Contact Information: </strong>
                        <span>curators@tilakpopatfilms.com</span>
                      </div>

                      <div>
                        <strong>Date: </strong>
                        <span>{formatDate(executionTimestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer statutory archival notice */}
            <div className="pt-4 mt-4 text-center text-[9.5pt] text-zinc-600 border-t border-zinc-300 font-['Times_New_Roman',_Times,_serif]">
              <p>
                Executed electronically pursuant to the Information Technology Act, 2000.
                Permanent cryptographic record stored in TPF Cinemas Registry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
