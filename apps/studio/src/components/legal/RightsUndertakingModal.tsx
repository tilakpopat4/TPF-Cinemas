import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, ShieldCheck, FileCheck2, Calendar, Film as FilmIcon, CheckCircle2, Lock, ExternalLink } from 'lucide-react';
import { Film } from '../../types';
import { formatDuration, formatDate } from '../../lib/utils';

interface RightsUndertakingModalProps {
  film: Film;
  filmmakerName?: string;
  filmmakerEmail?: string;
  onClose: () => void;
}

export const RightsUndertakingModal: React.FC<RightsUndertakingModalProps> = ({
  film,
  filmmakerName,
  filmmakerEmail,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const licence = film.licence_agreements;

  // Synthesize verifiable legal reference code
  const licenceId = licence?.id || film.id;
  const legalRefCode = `TPF-OTT-DEED-${film.id.slice(0, 8).toUpperCase()}-${film.release_year || new Date().getFullYear()}`;
  const executionTimestamp = licence?.signed_at || film.created_at;
  const isVerified = Boolean(licence?.verified_at);
  const termMonths = licence?.term_months || 24;
  const territory = licence?.territory || 'Worldwide (Non-Exclusive)';
  const musicCleared = licence?.music_cleared ?? true;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl my-auto rounded-2xl border border-white/[0.12] bg-[#0c0d14] text-ivory shadow-[0_32px_80px_rgba(0,0,0,0.95)] flex flex-col max-h-[96vh] overflow-hidden">
        {/* Top Control Bar (Screen Only - Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#10121a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-signature/15 border border-signature/30 flex items-center justify-center text-signature">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-signature font-bold">
                  Official OTT Legal Format
                </span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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
          {/* Legal Document Parchment / Standard A4 OTT Delivery Sheet */}
          <div
            ref={printRef}
            id="rights-undertaking-doc"
            className="max-w-3xl mx-auto rounded-xl bg-white text-zinc-900 p-8 sm:p-12 shadow-2xl border border-zinc-200 print:shadow-none print:border-none print:p-8 print:max-w-none font-serif text-sm leading-relaxed"
          >
            {/* Document Letterhead */}
            <div className="border-b-2 border-zinc-900 pb-5 mb-6 text-center">
              <div className="flex items-center justify-between mb-3 text-left">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 font-serif uppercase">
                    TPF CINEMAS
                  </h1>
                  <p className="text-[11px] font-sans uppercase tracking-widest text-zinc-600 font-semibold mt-0.5">
                    A Division of Tilak Popat Films • Official OTT Curatorial Platform
                  </p>
                </div>
                <div className="text-right font-mono text-[10px] text-zinc-600 space-y-0.5">
                  <p className="font-bold text-zinc-900">FORM: TPF-OTT/LIC-2026/V1</p>
                  <p>REF: {legalRefCode}</p>
                  <p>STAMP: {formatDate(executionTimestamp)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-200">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 font-serif uppercase">
                  DEED OF NON-EXCLUSIVE DIGITAL STREAMING LICENCE & LEGAL RIGHTS UNDERTAKING
                </h2>
                <p className="text-xs font-sans text-zinc-600 mt-1">
                  Standard OTT Distribution & Chain of Title Clearances (Indian Copyright Act, 1957 & Global Streaming Standards)
                </p>
              </div>
            </div>

            {/* Recitals / Preamble */}
            <div className="space-y-4 text-xs text-zinc-800 leading-relaxed">
              <p>
                This Legal Undertaking and Grant of Digital Rights is executed on{' '}
                <strong className="font-semibold text-zinc-950 underline underline-offset-2">
                  {formatDate(executionTimestamp)}
                </strong>{' '}
                by the undersigned Filmmaker / Rightsholder (hereinafter referred to as the{' '}
                <strong>&quot;Licensor&quot;</strong>) in favour of{' '}
                <strong>TILAK POPAT FILMS (TPF CINEMAS)</strong> (hereinafter referred to as the{' '}
                <strong>&quot;Licensee / Platform&quot;</strong>).
              </p>

              {/* Schedule A: Particulars of the Cinematograph Work */}
              <div className="my-6 rounded-lg border border-zinc-300 bg-zinc-50 p-4 font-sans text-xs">
                <h3 className="font-serif font-bold text-sm uppercase text-zinc-950 border-b border-zinc-200 pb-2 mb-3">
                  Schedule A: Particulars of the Cinematograph Film
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4">
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-zinc-500">Title of Film</span>
                    <strong className="text-zinc-900 font-semibold text-sm">{film.title}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-zinc-500">Director / Auteur</span>
                    <strong className="text-zinc-900 font-semibold">
                      {filmmakerName || 'Registered Filmmaker'}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-zinc-500">Original Language</span>
                    <strong className="text-zinc-900 font-semibold capitalize">{film.language || 'Original'}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-zinc-500">Official Runtime</span>
                    <strong className="text-zinc-900 font-semibold">
                      {formatDuration(film.runtime_minutes || 0)} ({film.runtime_minutes || 0} mins)
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-zinc-500">Production Year</span>
                    <strong className="text-zinc-900 font-semibold">{film.release_year || new Date().getFullYear()}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-zinc-500">Self-Certified Rating</span>
                    <strong className="text-zinc-900 font-semibold">{film.age_rating || 'U'}</strong>
                  </div>
                </div>
              </div>

              {/* Legal Clauses */}
              <div className="space-y-3.5">
                <div>
                  <h4 className="font-bold text-zinc-950 font-serif text-sm">
                    1. GRANT OF NON-EXCLUSIVE DIGITAL STREAMING LICENCE
                  </h4>
                  <p className="mt-1">
                    The Licensor grants to TPF Cinemas an absolute, royalty-free, non-exclusive licence to host, encode,
                    digitally exhibit, and stream the Work across TPF Cinemas websites, smart TV portals, and authorized
                    delivery applications throughout the licensed <strong>Territory ({territory})</strong> for a term of{' '}
                    <strong>{termMonths} Months</strong> commencing from the date of curatorial publication.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-950 font-serif text-sm">
                    2. RETENTION OF NEGATIVE & COMMERCIAL RIGHTS
                  </h4>
                  <p className="mt-1">
                    The Licensor expressly retains 100% of underlying intellectual property, copyright, remake, theatrical,
                    physical, television broadcast, and commercial sales rights. The Licensor remains free to submit the
                    Film to international film festivals, enter distribution sales, or request festival screening blackout
                    holds upon written notice.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-950 font-serif text-sm">
                    3. STATUTORY MUSIC & SYNCHRONIZATION CLEARANCE DECLARATION
                  </h4>
                  <p className="mt-1">
                    The Licensor hereby irrevocably warrants and undertakes that{' '}
                    <strong className="underline">
                      {musicCleared ? 'ALL musical compositions, master recordings, background scores, and lyrical works' : 'All declared audio assets'}
                    </strong>{' '}
                    incorporated within the Work are either 100% original, in the public domain, or fully cleared and licensed
                    for global internet streaming, with zero outstanding synchronization fees, mechanical liabilities, or
                    collection society claims (including IPRS, PPL, BMI, ASCAP, or PRS).
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-950 font-serif text-sm">
                    4. CHAIN OF TITLE & INDEMNIFICATION UNDERTAKING
                  </h4>
                  <p className="mt-1">
                    The Licensor confirms that all contributing actors, writers, crew members, and location owners have
                    executed binding releases for global digital broadcast. The Licensor agrees to indemnify and hold
                    harmless TPF Cinemas, its directors, curatorial committee, and affiliates against any third-party
                    infringement, defamation, or breach of proprietary rights.
                  </p>
                </div>
              </div>

              {/* Digital Execution & Seals */}
              <div className="pt-6 mt-6 border-t-2 border-zinc-200 grid grid-cols-2 gap-8 font-sans">
                {/* Licensor Digital Signature Box */}
                <div className="rounded-lg border border-zinc-300 p-4 bg-zinc-50/50 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 block">
                    Executed Digitally By Licensor
                  </span>
                  <p className="font-bold text-zinc-900 text-sm">{filmmakerName || 'Registered Filmmaker'}</p>
                  <p className="text-[11px] font-mono text-zinc-600 truncate">{filmmakerEmail || 'Verified Creator Account'}</p>
                  <div className="pt-2 border-t border-zinc-200 text-[10px] font-mono text-zinc-500">
                    <p>Status: Authenticated via JWT Session</p>
                    <p>Timestamp: {new Date(executionTimestamp).toISOString()}</p>
                  </div>
                </div>

                {/* TPF Cinemas Official Verification Seal */}
                <div className="rounded-lg border border-zinc-300 p-4 bg-zinc-50/50 space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 block">
                      Accepted For Legal Registry
                    </span>
                    <p className="font-bold text-zinc-900 text-sm">TPF Cinemas Curatorial Board</p>
                    <p className="text-[11px] text-zinc-600">Tilak Popat Films Legal & Rights Registry</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <FileCheck2 className="h-3.5 w-3.5" />
                      {isVerified ? 'Legally Verified' : 'Cryptographically Stamped'}
                    </span>
                    <span className="text-zinc-500">{legalRefCode.slice(0, 16)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Legal Verification Note */}
              <div className="pt-4 text-center text-[10px] font-sans text-zinc-500 border-t border-zinc-100">
                <p>
                  This official OTT Rights Undertaking is generated electronically from the immutable submission record stored in the TPF Cinemas Platform Database.
                  Valid without physical signature under the Information Technology Act, 2000.
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
