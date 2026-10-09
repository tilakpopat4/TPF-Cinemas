import React, { useRef, useEffect } from 'react';
import { formatDate } from '../../lib/utils';

interface LegalAgreementDocProps {
  filmType?: 'short' | 'feature' | 'all';
  filmmakerName?: string;
  legalName?: string;
  productionName?: string;
  contactNo?: string;
  contactEmail?: string;
  onScrolledToBottom?: () => void;
  referenceCode?: string;
}

export const LegalAgreementDoc: React.FC<LegalAgreementDocProps> = ({
  filmmakerName = 'Filmmaker / Content Creator',
  legalName,
  productionName,
  contactNo,
  contactEmail,
  onScrolledToBottom,
  referenceCode = `TPF-CONSENT-${new Date().getFullYear()}`,
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

  const todayStr = formatDate(new Date().toISOString());

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="max-h-[380px] sm:max-h-[460px] overflow-y-auto rounded-xl border border-zinc-300 bg-white text-black p-6 sm:p-10 shadow-inner font-['Times_New_Roman',_Times,_serif] text-[12pt] leading-[1.6] select-text"
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

      {/* # NON-COMMERCIAL STREAMING RIGHTS CONSENT FORM */}
      <h1 className="text-[16pt] font-bold uppercase tracking-wide text-black text-center mb-6 leading-tight font-['Times_New_Roman',_Times,_serif]">
        NON-COMMERCIAL STREAMING RIGHTS CONSENT FORM
      </h1>

      {/* Date */}
      <div className="mb-6 text-[12pt] font-['Times_New_Roman',_Times,_serif]">
        <strong>Date: </strong>
        <span>{todayStr}</span>
      </div>

      {/* 1. Film Details */}
      <div className="space-y-3 mb-6 font-['Times_New_Roman',_Times,_serif]">
        <h2 className="text-[14pt] font-bold text-black tracking-tight">
          1. Film Details
        </h2>
        <div className="space-y-2 pl-2">
          <div>
            <strong>Title of Film / Web Series: </strong>
            <span>All titles submitted &amp; curated via TPF Filmmaker Studio</span>
          </div>
          <div>
            <strong>Director / Filmmaker: </strong>
            <span>{legalName || filmmakerName}</span>
          </div>
          <div>
            <strong>Production House (if applicable): </strong>
            <span>{productionName || 'Independent Production'}</span>
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
          <strong>{todayStr}</strong>{' '}
          for a period of <strong>24 Months</strong> (auto-renewable, takedown available upon 14 days digital notice).
        </p>
      </div>

      {/* 5. Declaration */}
      <div className="space-y-3 mb-6 font-['Times_New_Roman',_Times,_serif]">
        <h2 className="text-[14pt] font-bold text-black tracking-tight">
          5. Declaration
        </h2>
        <p className="pl-2 mb-4 text-justify">
          I confirm that I have the authority to grant this permission and voluntarily consent to the non-commercial streaming of the above-mentioned work under the terms stated in this document.
        </p>

        <div className="border border-black p-4 bg-white text-[11pt] space-y-2 font-['Times_New_Roman',_Times,_serif]">
          <p className="font-bold text-[12pt] border-b border-black pb-1 mb-2">
            Filmmaker / Rights Holder Details
          </p>
          <div>
            <strong>Full Legal Name: </strong>
            <span>{legalName || filmmakerName}</span>
          </div>
          <div>
            <strong>Production Name: </strong>
            <span>{productionName || 'Independent Production'}</span>
          </div>
          <div>
            <strong>Contact No: </strong>
            <span>{contactNo || 'Provided upon execution'}</span>
          </div>
          <div>
            <strong>Mail Id: </strong>
            <span>{contactEmail || 'Provided upon execution'}</span>
          </div>
          <div>
            <strong>Date: </strong>
            <span>{todayStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
