import React, { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export interface LegalAgreementDocProps {
  filmTitle?: string;
  filmType?: 'short' | 'feature' | 'all';
  filmmakerName?: string;
  legalName?: string;
  productionName?: string;
  contactNo?: string;
  contactEmail?: string;
  signatureUrl?: string | null;
  loadingSignature?: boolean;
  executionDate?: string;
  onScrolledToBottom?: () => void;
  referenceCode?: string;
  className?: string;
}

export const LegalAgreementDoc: React.FC<LegalAgreementDocProps> = ({
  filmTitle,
  filmmakerName = 'Filmmaker / Content Creator',
  legalName,
  productionName,
  contactNo,
  contactEmail,
  signatureUrl,
  loadingSignature = false,
  executionDate,
  onScrolledToBottom,
  referenceCode = `TPF-CONSENT-${new Date().getFullYear()}`,
  className = '',
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
    if (el.scrollHeight <= el.clientHeight && onScrolledToBottom) {
      onScrolledToBottom();
    }
  }, [onScrolledToBottom]);

  const displayDate = formatDate(executionDate || new Date().toISOString());
  const resolvedSignerName = legalName || filmmakerName || 'Registered Filmmaker';
  const resolvedProduction = productionName || 'Independent Production';
  const resolvedContact = contactNo || 'Provided upon execution';
  const resolvedEmail = contactEmail || 'Provided upon execution';

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={`rounded-xl border border-zinc-300 bg-white text-black p-6 sm:p-10 shadow-inner font-['Times_New_Roman',_Times,_serif] text-[12pt] leading-[1.6] select-text ${className}`}
    >
      {/* Top Header / Metadata */}
      <div className="border-b-2 border-black pb-3 mb-6 flex items-center justify-between text-[10pt] font-['Times_New_Roman',_Times,_serif] text-zinc-700">
        <span className="font-bold tracking-wider uppercase text-black">
          TPF CINEMAS • OFFICIAL CURATORIAL OTT PLATFORM
        </span>
        <span>
          REF: {referenceCode}
        </span>
      </div>

      {/* Document Title */}
      <h1 className="text-[16pt] font-bold uppercase tracking-wide text-black text-center mb-6 leading-tight font-['Times_New_Roman',_Times,_serif]">
        NON-COMMERCIAL STREAMING RIGHTS CONSENT FORM
      </h1>

      {/* Date */}
      <div className="mb-6 text-[12pt] font-['Times_New_Roman',_Times,_serif]">
        <strong>Date: </strong>
        <span>{displayDate}</span>
      </div>

      {/* 1. Film Details */}
      <div className="space-y-3 mb-6 font-['Times_New_Roman',_Times,_serif]">
        <h2 className="text-[14pt] font-bold text-black tracking-tight">
          1. Film Details
        </h2>
        <div className="space-y-2 pl-2">
          <div>
            <strong>Title of Film / Web Series: </strong>
            <span>{filmTitle || 'All titles submitted & curated via TPF Filmmaker Studio'}</span>
          </div>
          <div>
            <strong>Director / Filmmaker: </strong>
            <span>{resolvedSignerName}</span>
          </div>
          <div>
            <strong>Production House (if applicable): </strong>
            <span>{resolvedProduction}</span>
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
          <strong>{displayDate}</strong>{' '}
          for a period of <strong>24 Months</strong> (auto-renewable, takedown available upon 14 days digital notice).
        </p>
      </div>

      {/* 5. Declaration & Signature Blocks */}
      <div className="space-y-3 mb-6 font-['Times_New_Roman',_Times,_serif]">
        <h2 className="text-[14pt] font-bold text-black tracking-tight">
          5. Declaration
        </h2>
        <p className="pl-2 mb-4 text-justify">
          I confirm that I have the authority to grant this permission and voluntarily consent to the non-commercial streaming of the above-mentioned work under the terms stated in this document.
        </p>

        {/* Side-by-side signature & execution blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 font-['Times_New_Roman',_Times,_serif]">
          {/* Filmmaker / Rights Holder */}
          <div className="border border-black p-4 bg-white flex flex-col justify-between min-h-[250px]">
            <div>
              <p className="font-bold text-[13pt] border-b border-black pb-1 mb-3">
                Filmmaker / Rights Holder
              </p>

              <div className="space-y-2 text-[11pt]">
                <div>
                  <strong>Full Name: </strong>
                  <span>{resolvedSignerName}</span>
                </div>

                <div>
                  <strong>Production Name: </strong>
                  <span>{resolvedProduction}</span>
                </div>

                <div>
                  <strong>Signature:</strong>
                  <div className="my-1.5 min-h-[56px] flex items-center justify-center bg-zinc-50 border border-zinc-200 p-1">
                    {loadingSignature ? (
                      <div className="flex items-center gap-1.5 text-zinc-500 text-[10pt]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading signature...</span>
                      </div>
                    ) : signatureUrl ? (
                      <img
                        src={signatureUrl}
                        alt={`Signature of ${resolvedSignerName}`}
                        className="max-h-14 max-w-full object-contain filter contrast-125"
                      />
                    ) : (
                      <span className="text-zinc-500 text-[10pt] italic">
                        Digitally Executed via Platform
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <strong>Contact No: </strong>
                  <span>{resolvedContact}</span>
                </div>

                <div>
                  <strong>Mail ID: </strong>
                  <span>{resolvedEmail}</span>
                </div>

                <div>
                  <strong>Date: </strong>
                  <span>{displayDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Person / Platform Receiving Permission */}
          <div className="border border-black p-4 bg-white flex flex-col justify-between min-h-[250px]">
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
                    <span className="font-serif italic font-bold text-zinc-800 text-[13pt] tracking-wider">
                      Tilak Popat
                    </span>
                    <span className="text-[8pt] text-zinc-500 font-mono tracking-widest uppercase">
                      Authorized Digital Signatory
                    </span>
                  </div>
                </div>

                <div>
                  <strong>Official Platform: </strong>
                  <span>TPF Cinemas OTT Service</span>
                </div>

                <div>
                  <strong>Mail ID: </strong>
                  <span>licensing@tpfcinemas.com</span>
                </div>

                <div>
                  <strong>Date: </strong>
                  <span>{displayDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
