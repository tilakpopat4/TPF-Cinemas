import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, ShieldCheck, FileCheck2, Loader2, AlertCircle } from 'lucide-react';
import { Film } from '../../types';
import { formatDuration, formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

interface RightsUndertakingModalProps {
  film: Film;
  filmmakerName?: string;
  filmmakerEmail?: string;
  filmmakerLegalName?: string;
  creatorSignatureUrl?: string;
  onClose: () => void;
}

export const RightsUndertakingModal: React.FC<RightsUndertakingModalProps> = ({
  film,
  filmmakerName,
  filmmakerEmail,
  filmmakerLegalName,
  creatorSignatureUrl,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const licence = film.licence_agreements;

  // Signature and Signer State
  const [signatureUrl, setSignatureUrl] = useState<string | null>(creatorSignatureUrl || null);
  const [signerLegalName, setSignerLegalName] = useState<string>(filmmakerLegalName || filmmakerName || '');
  const [signerEmail, setSignerEmail] = useState<string>(filmmakerEmail || '');
  const [loadingSignature, setLoadingSignature] = useState(!creatorSignatureUrl);

  // Verifiable legal identifiers
  const legalRefCode = `TPF-OTT-DEED-${film.id.slice(0, 8).toUpperCase()}-${film.release_year || new Date().getFullYear()}`;
  const executionTimestamp = licence?.signed_at || film.created_at || new Date().toISOString();
  const isVerified = Boolean(licence?.verified_at);
  const termMonths = licence?.term_months || 24;
  const territory = licence?.territory || 'Worldwide (Non-Exclusive)';
  const musicCleared = licence?.music_cleared ?? true;

  // Auto-fetch creator signature and legal details if not already available
  useEffect(() => {
    let active = true;

    async function fetchCreatorSignature() {
      // If we already have the signatureUrl, nothing to fetch
      if (creatorSignatureUrl) {
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

        // 1. Fetch profile details (for legal name/email fallback)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('id', targetFilmmakerId)
          .maybeSingle();

        if (active && profileData) {
          if (!signerEmail) setSignerEmail(profileData.email || '');
          if (!signerLegalName) setSignerLegalName(profileData.display_name || '');
        }

        // 2. Check if film's own licence agreement has a signature_image_url
        let sigPath: string | null = (licence as any)?.signature_image_url || null;
        let legalNameFound: string | null = (licence as any)?.legal_name || null;

        // 3. If not present on film licence, query creator's master licence agreement
        if (!sigPath) {
          const { data: masterAgreement, error: masterErr } = await supabase
            .from('licence_agreements')
            .select('signature_image_url, legal_name, signed_at')
            .eq('filmmaker_id', targetFilmmakerId)
            .not('signature_image_url', 'is', null)
            .order('signed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!masterErr && masterAgreement) {
            sigPath = masterAgreement.signature_image_url;
            if (masterAgreement.legal_name && !signerLegalName) {
              legalNameFound = masterAgreement.legal_name;
            }
          }
        }

        if (legalNameFound && active) {
          setSignerLegalName(legalNameFound);
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
        console.error('Error fetching creator signature for deed preview:', err);
      } finally {
        if (active) setLoadingSignature(false);
      }
    }

    fetchCreatorSignature();

    return () => {
      active = false;
    };
  }, [film.id, film.filmmaker_id, licence, creatorSignatureUrl, signerEmail, signerLegalName]);

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
          .signature-box {
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
                  Official Legal Format (Times New Roman 12/14)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {isVerified ? 'Curator Verified' : 'Executed by Creator'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Deed of Digital Streaming Rights & Undertaking
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
          {/* Legal Document Sheet: Strictly Times New Roman 12/14pt */}
          <div
            ref={printRef}
            id="rights-undertaking-doc"
            className="max-w-3xl mx-auto rounded-xl bg-white text-black p-8 sm:p-14 shadow-2xl border border-zinc-200 print:shadow-none print:border-none print:p-0 print:max-w-none font-['Times_New_Roman',_Times,_serif] text-[12pt] leading-[1.6]"
          >
            {/* Formal Legal Letterhead */}
            <div className="border-b-2 border-black pb-4 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-[20pt] font-bold tracking-tight text-black uppercase font-['Times_New_Roman',_Times,_serif] leading-tight">
                    TPF CINEMAS
                  </h1>
                  <p className="text-[9.5pt] font-sans uppercase tracking-widest text-zinc-700 font-semibold mt-1">
                    A Division of Tilak Popat Films • Official OTT Curatorial Platform
                  </p>
                </div>
                <div className="text-right font-mono text-[9pt] text-zinc-700 space-y-0.5 shrink-0">
                  <p className="font-bold text-black">FORM: TPF-OTT/LIC-2026/V1</p>
                  <p>REF: {legalRefCode}</p>
                  <p>DATE: {formatDate(executionTimestamp)}</p>
                </div>
              </div>
            </div>

            {/* Document Title (16pt Bold Uppercase) */}
            <div className="text-center my-6 space-y-1">
              <h2 className="text-[15pt] sm:text-[16pt] font-bold uppercase tracking-wide text-black leading-snug">
                DEED OF NON-EXCLUSIVE DIGITAL STREAMING LICENCE &amp; LEGAL RIGHTS UNDERTAKING
              </h2>
              <p className="text-[10pt] font-sans text-zinc-700">
                Executed pursuant to the Indian Copyright Act, 1957 &amp; Information Technology Act, 2000
              </p>
            </div>

            {/* Recitals / Preamble (12pt Body) */}
            <div className="space-y-4 text-black text-[12pt] leading-[1.6] text-justify">
              <p>
                THIS DEED OF LICENCE AND LEGAL UNDERTAKING (the <strong>&ldquo;Deed&rdquo;</strong>) is made and executed on this{' '}
                <strong>{formatDate(executionTimestamp)}</strong> (the <strong>&ldquo;Execution Date&rdquo;</strong>), BY AND BETWEEN:
              </p>

              <p className="pl-6 border-l-2 border-black italic">
                <strong>THE LICENSOR / RIGHTSHOLDER:</strong>{' '}
                <strong className="underline underline-offset-2">{signerLegalName || filmmakerName || 'Registered Filmmaker'}</strong>{' '}
                {signerEmail ? `(Email: ${signerEmail})` : ''}, having full authorial authority, legal capacity, and chain-of-title rights in the cinematograph work described in Schedule A below (hereinafter referred to as the <strong>&ldquo;Licensor&rdquo;</strong>, which expression shall include heirs, legal representatives, and permitted assigns);
              </p>

              <div className="text-center font-bold uppercase text-[11pt] tracking-wider my-1">
                — AND —
              </div>

              <p className="pl-6 border-l-2 border-black italic">
                <strong>THE LICENSEE / PLATFORM:</strong>{' '}
                <strong>TILAK POPAT FILMS (TPF CINEMAS)</strong>, an independent curatorial OTT streaming platform having its registered administration and streaming repository in India (hereinafter referred to as the <strong>&ldquo;Licensee&rdquo;</strong> or <strong>&ldquo;Platform&rdquo;</strong>).
              </p>

              {/* Schedule A: Formal Legal Table */}
              <div className="my-6">
                <h3 className="text-[13pt] font-bold uppercase text-black tracking-wide mb-2 text-center border-b border-black pb-1">
                  SCHEDULE A: PARTICULARS OF THE CINEMATOGRAPH WORK
                </h3>
                <table className="w-full border-collapse border border-black text-[11pt]">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="w-2/5 p-2.5 font-bold bg-zinc-100 border-r border-black uppercase text-[10pt]">
                        Title of Cinematograph Film
                      </td>
                      <td className="p-2.5 font-bold text-[12pt] text-black">
                        {film.title}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2.5 font-bold bg-zinc-100 border-r border-black uppercase text-[10pt]">
                        Director / Auteur
                      </td>
                      <td className="p-2.5 text-black">
                        {signerLegalName || filmmakerName || 'Registered Filmmaker'}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2.5 font-bold bg-zinc-100 border-r border-black uppercase text-[10pt]">
                        Original Language
                      </td>
                      <td className="p-2.5 text-black capitalize">
                        {film.language || 'Original'}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2.5 font-bold bg-zinc-100 border-r border-black uppercase text-[10pt]">
                        Official Certified Runtime
                      </td>
                      <td className="p-2.5 text-black">
                        {formatDuration(film.runtime_minutes || 0)} ({film.runtime_minutes || 0} minutes)
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2.5 font-bold bg-zinc-100 border-r border-black uppercase text-[10pt]">
                        Production / Release Year
                      </td>
                      <td className="p-2.5 text-black">
                        {film.release_year || new Date().getFullYear()}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2.5 font-bold bg-zinc-100 border-r border-black uppercase text-[10pt]">
                        Self-Certified Rating
                      </td>
                      <td className="p-2.5 text-black font-semibold">
                        {film.age_rating || 'U'}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2.5 font-bold bg-zinc-100 border-r border-black uppercase text-[10pt]">
                        Licensed Territory
                      </td>
                      <td className="p-2.5 text-black">
                        {territory}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-zinc-100 border-r border-black uppercase text-[10pt]">
                        Licence Term
                      </td>
                      <td className="p-2.5 text-black font-semibold">
                        {termMonths} Months (Commencing from curatorial approval)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Operative Clauses (14pt Headings, 12pt Body) */}
              <div className="space-y-4 pt-2">
                <div>
                  <h3 className="text-[14pt] font-bold text-black uppercase tracking-tight">
                    1. GRANT OF NON-EXCLUSIVE DIGITAL STREAMING LICENCE
                  </h3>
                  <p className="mt-1">
                    The Licensor hereby grants to TPF Cinemas an absolute, non-exclusive, worldwide licence to encode, host,
                    digitally exhibit, and stream the Cinematograph Work identified in Schedule A across the Platform&rsquo;s web portals,
                    applications, and connected TV distribution surfaces for the licensed Term of {termMonths} Months.
                  </p>
                </div>

                <div>
                  <h3 className="text-[14pt] font-bold text-black uppercase tracking-tight">
                    2. RETENTION OF NEGATIVE, THEATRICAL &amp; COMMERCIAL RIGHTS
                  </h3>
                  <p className="mt-1">
                    The Licensor expressly retains 100% of underlying intellectual property, copyright, remake, television broadcast,
                    theatrical release, and commercial sales rights. This licence is non-exclusive and does not encumber or prohibit the Licensor
                    from submitting the Work to international film festivals, academy screenings, or entering distribution markets.
                  </p>
                </div>

                <div>
                  <h3 className="text-[14pt] font-bold text-black uppercase tracking-tight">
                    3. STATUTORY MUSIC &amp; SYNCHRONIZATION CLEARANCE DECLARATION
                  </h3>
                  <p className="mt-1">
                    The Licensor unconditionally warrants and declares that{' '}
                    <strong>
                      {musicCleared
                        ? 'all musical compositions, master recordings, background scores, and lyrical works'
                        : 'all declared audio assets'}
                    </strong>{' '}
                    incorporated within the Cinematograph Work are either 100% original, in the public domain, or fully cleared and licensed
                    for worldwide digital exhibition, with zero outstanding synchronization fees, mechanical liabilities, or collection society claims (including IPRS, PPL, BMI, ASCAP, or PRS).
                  </p>
                </div>

                <div>
                  <h3 className="text-[14pt] font-bold text-black uppercase tracking-tight">
                    4. CHAIN OF TITLE &amp; INDEMNIFICATION UNDERTAKING
                  </h3>
                  <p className="mt-1">
                    The Licensor warrants that all contributing cast members, crew, authors, and location owners have executed valid legal releases.
                    The Licensor agrees to indemnify and hold harmless TPF Cinemas, its directors, curators, and affiliates against any third-party
                    infringement notices, defamation actions, or proprietary disputes arising out of the exhibition of the Work.
                  </p>
                </div>

                <div>
                  <h3 className="text-[14pt] font-bold text-black uppercase tracking-tight">
                    5. ELECTRONIC SIGNATURE VALIDITY &amp; PERMANENT EVIDENTIARY ARCHIVE
                  </h3>
                  <p className="mt-1">
                    The parties agree that the digital signature affixed below constitutes an electronic signature valid and enforceable under the Indian Information Technology Act, 2000.
                    While streaming access may be revoked upon 14 days digital notice, this executed Deed and verification record shall be permanently retained in the Platform Registry as evidence of bona fide publication.
                  </p>
                </div>
              </div>

              {/* Execution & Attestation Section */}
              <div className="pt-6 mt-8 border-t-2 border-black signature-box">
                <p className="text-[11pt] font-serif italic mb-4 text-center">
                  IN WITNESS WHEREOF, the Licensor has executed this Deed of Undertaking on the date first above written.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Left: Licensor Digital Signature Box */}
                  <div className="border border-black p-4 bg-white flex flex-col justify-between min-h-[170px]">
                    <div>
                      <span className="text-[9.5pt] uppercase font-sans font-bold text-zinc-700 block border-b border-zinc-300 pb-1 mb-2">
                        EXECUTED DIGITALLY BY LICENSOR
                      </span>

                      {/* Render Fetched Digital Signature Image */}
                      <div className="my-2 min-h-[64px] flex items-center justify-center bg-zinc-50 border border-zinc-200 p-1">
                        {loadingSignature ? (
                          <div className="flex items-center gap-2 text-zinc-500 text-[10pt] font-sans">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading verified digital signature...</span>
                          </div>
                        ) : signatureUrl ? (
                          <img
                            src={signatureUrl}
                            alt={`Digital Signature of ${signerLegalName || 'Licensor'}`}
                            className="max-h-16 max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-zinc-500 text-[10pt] font-sans italic text-center p-2">
                            Digital Signature Verified via Authenticated Creator Session
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-black pt-2 font-['Times_New_Roman',_Times,_serif]">
                      <p className="font-bold text-black text-[12pt] leading-tight">
                        {signerLegalName || filmmakerName || 'Registered Filmmaker'}
                      </p>
                      <p className="text-[10pt] font-sans text-zinc-600">
                        {signerEmail || 'Verified Creator Account'}
                      </p>
                      <p className="text-[9pt] font-mono text-zinc-500 mt-1">
                        Executed: {new Date(executionTimestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* Right: Platform Acceptance Seal Box */}
                  <div className="border border-black p-4 bg-white flex flex-col justify-between min-h-[170px]">
                    <div>
                      <span className="text-[9.5pt] uppercase font-sans font-bold text-zinc-700 block border-b border-zinc-300 pb-1 mb-2">
                        ACCEPTED FOR LEGAL REGISTRY BY LICENSEE
                      </span>

                      <div className="my-2 min-h-[64px] flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200 p-2 text-center">
                        <span className="text-[11pt] font-bold text-zinc-900 tracking-wider font-['Times_New_Roman',_Times,_serif] uppercase">
                          TILAK POPAT FILMS
                        </span>
                        <span className="text-[8.5pt] font-sans text-emerald-800 font-semibold flex items-center gap-1 mt-0.5">
                          <FileCheck2 className="h-3.5 w-3.5" />
                          {isVerified ? 'OFFICIALLY VERIFIED DEED' : 'CRYPTOGRAPHICALLY RECORDED'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-black pt-2 font-['Times_New_Roman',_Times,_serif]">
                      <p className="font-bold text-black text-[12pt] leading-tight">
                        TPF Cinemas Curatorial Board
                      </p>
                      <p className="text-[10pt] font-sans text-zinc-600">
                        Authorized Legal &amp; Rights Registry
                      </p>
                      <p className="text-[9pt] font-mono text-zinc-500 mt-1">
                        Registry Ref: {legalRefCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Legal Footnote */}
              <div className="pt-4 mt-4 text-center text-[9pt] font-sans text-zinc-600 border-t border-zinc-300">
                <p>
                  This official OTT Deed is generated electronically pursuant to Section 65B of the Indian Evidence Act, 1872
                  and Sections 4 &amp; 5 of the Information Technology Act, 2000. Verified immutable copy preserved in Platform Database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
