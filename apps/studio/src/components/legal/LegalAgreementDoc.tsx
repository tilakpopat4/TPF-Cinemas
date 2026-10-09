import React, { useRef, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Award, Globe, Scale } from 'lucide-react';

interface LegalAgreementDocProps {
  filmType?: 'short' | 'feature' | 'all';
  filmmakerName?: string;
  legalName?: string;
  onScrolledToBottom?: () => void;
  referenceCode?: string;
}

export const LegalAgreementDoc: React.FC<LegalAgreementDocProps> = ({
  filmType = 'all',
  filmmakerName = 'Filmmaker / Content Creator',
  legalName,
  onScrolledToBottom,
  referenceCode = `TPF-DEED-${new Date().getFullYear()}`,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !onScrolledToBottom) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    if (isAtBottom) {
      onScrolledToBottom();
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Check if document fits without scroll
    if (el.scrollHeight <= el.clientHeight && onScrolledToBottom) {
      onScrolledToBottom();
    }
  }, [onScrolledToBottom]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="max-h-[380px] sm:max-h-[460px] overflow-y-auto rounded-xl border border-zinc-200 bg-white text-zinc-900 p-6 sm:p-8 shadow-inner font-serif text-[13px] leading-relaxed select-text"
    >
      {/* Official Letterhead */}
      <div className="border-b-2 border-zinc-900 pb-5 mb-6 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 font-serif uppercase">
              TPF CINEMAS
            </h2>
            <p className="text-[10px] font-sans uppercase tracking-widest text-zinc-600 font-semibold mt-0.5">
              Tilak Popat Films • Official Independent OTT Curatorial Platform
            </p>
          </div>
          <div className="text-right font-mono text-[10px] text-zinc-600 space-y-0.5 shrink-0">
            <p className="font-bold text-zinc-900">FORM: TPF-OTT/DEED-2026/V1</p>
            <p>REF: {referenceCode}</p>
            <p className="text-emerald-700 font-semibold">VERIFIABLE DIGITAL DEED</p>
          </div>
        </div>
      </div>

      {/* Deed Title */}
      <div className="text-center my-6 space-y-1">
        <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-zinc-950">
          Deed of Digital Streaming Rights Grant &amp; Intellectual Property Self-Declaration
        </h3>
        <p className="text-xs font-sans text-zinc-600 italic">
          Executed pursuant to the Indian Copyright Act, 1957 and Information Technology Act, 2000
        </p>
      </div>

      {/* Dynamic Category Callout */}
      <div className="my-4 p-3 rounded-lg bg-amber-50 border border-amber-200 font-sans text-xs flex items-center gap-2.5 text-amber-950">
        <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
        <div>
          <span className="font-bold">Applicable Scope: </span>
          {filmType === 'short' && (
            <span>Short Film Stream Grant (preserves all festival premiere eligibility &amp; student academy entries).</span>
          )}
          {filmType === 'feature' && (
            <span>Feature Film Stream Grant (non-exclusive OTT distribution co-existing with theatrical &amp; satellite windows).</span>
          )}
          {filmType === 'all' && (
            <span>Universal Filmmaker Stream Grant (governing all submitted short and feature titles under TPF curation).</span>
          )}
        </div>
      </div>

      {/* Preamble */}
      <div className="space-y-4 text-zinc-800">
        <p>
          This Deed of Digital Streaming Rights and Undertaking (the <strong>&ldquo;Agreement&rdquo;</strong>) is entered into as of the digital execution timestamp, by and between:
        </p>
        <p className="pl-4 border-l-2 border-zinc-300 italic">
          <strong>The Creator:</strong> {legalName || filmmakerName} (hereinafter referred to as the <strong>&ldquo;Filmmaker&rdquo;</strong> or <strong>&ldquo;Licensor&rdquo;</strong>, which expression shall unless repugnant to the context include heirs, legal representatives, and permitted assigns),
          <br /><br />
          <strong>AND</strong>
          <br /><br />
          <strong>TPF Cinemas</strong> (a division of Tilak Popat Films, having its registered curatorial offices in India, hereinafter referred to as the <strong>&ldquo;Platform&rdquo;</strong> or <strong>&ldquo;Licensee&rdquo;</strong>).
        </p>

        {/* Section 1 */}
        <div className="pt-2">
          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
            1. Non-Exclusive Digital Streaming Grant
          </h4>
          <p>
            1.1. The Licensor hereby grants to the Licensee a <strong>non-exclusive, worldwide, royalty-free digital streaming licence</strong> to host, transcode, display, and stream all titles submitted and approved via the TPF Filmmaker Studio portal.
          </p>
          <p className="mt-2">
            1.2. <strong>Retention of Copyright:</strong> The Licensor expressly retains 100% of the underlying copyright, moral rights, and commercial ownership in the cinematograph film, screenplays, and original sound recordings.
          </p>
          <p className="mt-2">
            1.3. <strong>Festival &amp; Theatrical Preservation:</strong> This licence does not restrict, encumber, or prohibit the Licensor from entering film festivals, pursuing theatrical releases, submitting to international film markets, or licensing television broadcasting rights.
          </p>
        </div>

        {/* Section 2 */}
        <div className="pt-2">
          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
            2. Intellectual Property &amp; Chain-of-Title Self-Declaration
          </h4>
          <p>
            2.1. The Licensor solemnly affirms and declares that they are the sole lawful author, producer, or duly authorized rights holder of the submitted works, with full legal capacity to enter into this Agreement.
          </p>
          <p className="mt-2">
            2.2. <strong>Music &amp; Synchronisation Clearance:</strong> The Licensor warrants that all background scores, lyrical compositions, master sound recordings, sound effects, and musical cues incorporated into the film have been lawfully cleared, purchased under royalty-free synchronization licences, or constitute original works composed specifically for the film.
          </p>
          <p className="mt-2">
            2.3. The Licensor warrants that the film does not infringe any third-party copyright, trademark, privacy, or publicity rights, nor contain defamatory matter under the laws of India.
          </p>
        </div>

        {/* Section 3 */}
        <div className="pt-2">
          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
            3. Platform Indemnification &amp; Good Faith Protection
          </h4>
          <p>
            3.1. The Platform operates as an intermediary curatorial publisher under Section 79 of the Information Technology Act, 2000, relying entirely on the Licensor&rsquo;s self-declaration and warranty of title.
          </p>
          <p className="mt-2">
            3.2. The Licensor agrees to indemnify, defend, and hold harmless TPF Cinemas, its directors, curators, and affiliates against any and all third-party claims, legal demands, copyright infringement notices, or liabilities arising directly or indirectly from the broadcast of the Licensor&rsquo;s submitted works.
          </p>
        </div>

        {/* Section 4 */}
        <div className="pt-2">
          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
            4. Term, Archival &amp; Takedown Procedure
          </h4>
          <p>
            4.1. <strong>Term:</strong> This Agreement shall remain valid for an initial period of twenty-four (24) months from execution, auto-renewing unless the Licensor requests takedown or withdrawal.
          </p>
          <p className="mt-2">
            4.2. <strong>Takedown Rights:</strong> The Licensor may request removal of any film by providing fourteen (14) days digital notice to TPF Cinemas staff.
          </p>
          <p className="mt-2">
            4.3. <strong>Permanent Evidentiary Archive:</strong> While video content and promotional materials shall be promptly unlisted upon approved takedown or account closure, the executed copy of this legal Deed, digital signature image, IP logs, and verification record shall be <strong>permanently retained</strong> in platform archival storage as evidence that TPF Cinemas published the work in good faith.
          </p>
        </div>

        {/* Section 5 */}
        <div className="pt-2">
          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
            5. Electronic Signature Validity
          </h4>
          <p>
            5.1. The parties agree that the drawn canvas signature and typed confirmation recorded herein constitute an electronic signature having the same legal effect, validity, and enforceability as a manually executed handwritten signature under the Indian Information Technology Act, 2000.
          </p>
        </div>
      </div>
    </div>
  );
};
