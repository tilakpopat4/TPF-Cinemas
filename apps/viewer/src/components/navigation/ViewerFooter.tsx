import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ChevronDown, Check, Phone, Mail, ShieldCheck, X } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';

interface ViewerFooterProps {
  onSelectTab?: (tab: 'home' | 'browse' | 'watchlist' | 'history') => void;
  onOpenAuth?: () => void;
}

export const ViewerFooter: React.FC<ViewerFooterProps> = ({
  onSelectTab,
  onOpenAuth,
}) => {
  const { currentLanguage, setLanguage, isTranslating } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [activeModalInfo, setActiveModalInfo] = useState<{ title: string; content: string } | null>(null);

  const langContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langContainerRef.current && !langContainerRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = (title: string, content: string) => {
    setActiveModalInfo({ title, content });
  };

  return (
    <footer className="border-t border-hairline bg-canvas text-muted text-xs selection:bg-signature selection:text-black relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-8">
        {/* Support & Contact Prompt — Direct Netflix Pattern */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <div className="flex flex-wrap items-center gap-2">
            <span>Questions or curatorial inquiries?</span>
            <a
              href="tel:+917874903810"
              className="text-ivory hover:text-signature transition-colors underline underline-offset-4 flex items-center gap-1.5"
            >
              <Phone className="h-3.5 w-3.5 text-signature" />
              <span>Call +91 78749 03810</span>
            </a>
            <span className="hidden sm:inline text-hairline">•</span>
            <a
              href="mailto:work.tilakpopatfilms@gmail.com"
              className="text-ivory hover:text-signature transition-colors underline underline-offset-4 flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5 text-signature" />
              <span>work.tilakpopatfilms@gmail.com</span>
            </a>
          </div>
        </div>

        {/* 4-Column Structured Link Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-8 text-xs font-sans">
          {/* Column 1 */}
          <ul className="space-y-3">
            <li>
              <button
                onClick={() => handleLinkClick('Frequently Asked Questions', 'TPF Cinemas is an independent cinema platform dedicated to screening debut works and emerging auteur visions without studio compromise. All films are presented in their native aspect ratio with high-fidelity sound.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                FAQ
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Investor Relations', 'TPF Cinemas is backed by independent film preservation funds, cultural patrons, and emerging technology foundations committed to democratizing cinematic distribution.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Investor Relations
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Privacy & Anonymity', 'We collect zero advertising telemetry. Your viewing history and curated queue are protected with Supabase Row Level Security and never sold to third-party ad brokers.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Privacy
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Streaming & Playback Diagnostics', 'Optimal playback requires 15+ Mbps for 4K Ultra HD and 5.1 surround sound. Adaptive bitrate streaming dynamically matches your network throughput.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Speed Test & Quality
              </button>
            </li>
          </ul>

          {/* Column 2 */}
          <ul className="space-y-3">
            <li>
              <button
                onClick={() => handleLinkClick('Curatorial Centre', 'Our curatorial committee reviews unrepresented festival entries, graduation films from international cinema schools, and self-produced indie features year-round.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Help Centre
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Filmmaker Opportunities & Jobs', 'We are actively seeking regional film curators, subtitle translation specialists, and frontend engineers passionate about cinema preservation.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Jobs & Fellowships
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Cookie Preferences', 'TPF Cinemas uses only strictly necessary authentication session cookies and preference persistence tokens. Zero marketing or tracking cookies are utilized.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Cookie Preferences
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Legal Notices & Rights', 'All rights to films screened on TPF Cinemas remain exclusively with their respective directors and production houses under non-exclusive streaming licenses.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Legal Notices
              </button>
            </li>
          </ul>

          {/* Column 3 */}
          <ul className="space-y-3">
            <li>
              <button
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  else handleLinkClick('Viewer Account', 'Sign in to access your synchronized queue, continue watching bookmarks, and curatorial recommendations.');
                }}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Account
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Ways to Watch', 'Watch in any modern desktop or mobile browser. Cast to AirPlay and Chromecast-enabled smart TVs with cinema-grade color fidelity.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Ways to Watch
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Corporate & Production Information', 'TPF Cinemas operates as an artistic distribution entity committed to elevating debut filmmakers across South Asia and global cinema festivals.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Corporate Information
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  if (onSelectTab) onSelectTab('browse');
                }}
                className="hover:underline hover:text-signature transition-colors text-left"
              >
                Only on TPF Cinemas
              </button>
            </li>
          </ul>

          {/* Column 4 */}
          <ul className="space-y-3">
            <li>
              <button
                onClick={() => handleLinkClick('Media & Press Centre', 'Download official press kits, festival laurels, production stills, and high-resolution director portraits for official editorial coverage.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Media Centre
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Terms of Exhibition', 'Screenings are licensed for personal, non-commercial exhibition. Public screenings and festival retrospectives require specialized curatorial licensing.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Terms of Use
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Contact Curatorial Board', 'Direct submissions and archival inquiries can be addressed to our lead programming desk at work.tilakpopatfilms@gmail.com.')}
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Contact Us
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick('Debut Film Fund', '10% of all streaming patronage is contributed directly into the TPF Debut Film Fund to finance emerging directors first feature films.')}
                className="hover:underline hover:text-signature transition-colors text-left font-medium"
              >
                Debut Auteur Fund
              </button>
            </li>
          </ul>
        </div>

        {/* Live Google Language Selector — Borderless Pill Pattern */}
        <div className="relative inline-block text-left" ref={langContainerRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border-none text-ivory text-xs font-sans transition-colors focus:outline-none shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${isTranslating ? 'animate-pulse text-signature' : ''
              }`}
            aria-label="Select Language (Live Google Translator)"
          >
            <Globe className="h-3.5 w-3.5 text-signature" />
            <span className="font-medium">{currentLanguage.nativeName}</span>
            <span className="text-[10px] text-muted">({currentLanguage.name})</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted ml-1 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* 100% Solid Opaque Dropdown Container with Max-Height & Zero Background Bleed */}
          {isLangOpen && (
            <div
              className="absolute left-0 bottom-full mb-2 w-56 rounded-xl border border-white/[0.12] shadow-2xl py-1 z-50 font-sans max-h-64 overflow-y-auto bg-[#101117]"
            >
              <div className="px-3 py-1.5 border-b border-white/[0.08] text-[10px] uppercase font-mono tracking-wider text-muted flex items-center justify-between">
                <span>Translate Website</span>
                <span className="text-[9px] text-signature">Live</span>
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang);
                    setIsLangOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between text-ivory hover:bg-canvas transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-[10px] text-muted">({lang.name})</span>
                  </span>
                  {currentLanguage.code === lang.code && (
                    <Check className="h-3.5 w-3.5 text-signature" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Regional Tag — Netflix India Pattern */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs text-muted font-sans font-medium">
              TPF Cinemas
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted/70 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-signature/70 shrink-0" />
              <p>Curated for Cinephiles.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal for Link Dialogs — Portaled to document.body with maximum z-index */}
      {activeModalInfo &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setActiveModalInfo(null)}
          >
            <div
              className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#0A0A0B] p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.95)] text-ivory space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <span className="font-display text-[10px] uppercase tracking-[0.2em] text-signature font-semibold">
                    TPF Curatorial Dispatch
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl font-medium tracking-tight text-ivory mt-0.5">
                    {activeModalInfo.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModalInfo(null)}
                  className="text-muted hover:text-ivory h-8 w-8 rounded-lg border border-white/10 hover:bg-white/[0.06] flex items-center justify-center transition-colors shrink-0"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="font-sans text-xs sm:text-sm text-ivory/85 leading-relaxed font-normal">
                {activeModalInfo.content}
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-signature" />
                  <span>Curatorial Verification</span>
                </div>
                <button
                  onClick={() => setActiveModalInfo(null)}
                  className="px-5 py-2 rounded-lg bg-signature hover:bg-signature-hover text-black font-semibold text-xs uppercase tracking-wider transition-all shadow-[0_2px_12px_rgba(229,169,59,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </footer>
  );
};
