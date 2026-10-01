import React, { useState } from 'react';
import { Globe, ChevronDown, Check, Phone, Mail, ShieldCheck } from 'lucide-react';

interface ViewerFooterProps {
  onSelectTab?: (tab: 'home' | 'browse' | 'watchlist' | 'history') => void;
  onOpenAuth?: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
];

export const ViewerFooter: React.FC<ViewerFooterProps> = ({
  onSelectTab,
  onOpenAuth,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [activeModalInfo, setActiveModalInfo] = useState<{ title: string; content: string } | null>(null);

  const handleLinkClick = (title: string, content: string) => {
    setActiveModalInfo({ title, content });
  };

  return (
    <footer className="border-t border-hairline bg-canvas text-muted text-xs selection:bg-signature selection:text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-10">
        {/* Support & Contact Prompt — Direct Netflix Pattern */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Questions or curatorial inquiries?</span>
          <a
            href="tel:0008009191743"
            className="text-ivory hover:text-signature transition-colors underline underline-offset-4 flex items-center gap-1.5"
          >
            <Phone className="h-3.5 w-3.5 text-signature" />
            <span>Call 000-800-919-1743</span>
          </a>
          <span className="hidden sm:inline text-hairline">•</span>
          <a
            href="mailto:curators@tpfcinemas.com"
            className="text-ivory hover:text-signature transition-colors underline underline-offset-4 flex items-center gap-1.5"
          >
            <Mail className="h-3.5 w-3.5 text-signature" />
            <span>curators@tpfcinemas.com</span>
          </a>
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
                onClick={() => handleLinkClick('Contact Curatorial Board', 'Direct submissions and archival inquiries can be addressed to our lead programming desk at programming@tpfcinemas.com.')}
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

        {/* Language Selector — Matching Netflix's outlined box pattern */}
        <div className="relative inline-block text-left">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-sm bg-black/60 border border-hairline hover:border-ivory/50 text-ivory text-xs font-sans transition-colors focus:outline-none focus:border-signature"
            aria-label="Select Language"
          >
            <Globe className="h-3.5 w-3.5 text-muted" />
            <span>{selectedLanguage.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted ml-1" />
          </button>

          {isLangOpen && (
            <div className="absolute left-0 bottom-full mb-2 w-48 rounded-sm bg-graphite border border-hairline shadow-2xl py-1 z-30 font-sans">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setIsLangOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between text-ivory hover:bg-canvas transition-colors"
                >
                  <span>{lang.name}</span>
                  {selectedLanguage.code === lang.code && (
                    <Check className="h-3 w-3 text-signature" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Regional Tag — Netflix India Pattern */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted font-sans font-medium">
            TPF Cinemas India & International
          </p>

          {/* Security / Curatorial Protection Disclaimer — Inspired by Netflix reCAPTCHA notice */}
          <div className="flex items-center gap-2 text-[11px] text-muted/70 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-signature/70 shrink-0" />
            <p>
              Screening Beginners&apos; Dreams. This platform is protected by cryptographic DRM and curatorial integrity standards.
            </p>
          </div>
        </div>
      </div>

      {/* Info Modal for Link Dialogs */}
      {activeModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-graphite border border-hairline rounded-sm max-w-md w-full p-6 space-y-4 shadow-2xl text-ivory">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-display text-xl tracking-wider text-ivory uppercase">
                {activeModalInfo.title}
              </h3>
              <button
                onClick={() => setActiveModalInfo(null)}
                className="text-muted hover:text-ivory text-sm px-2 py-1 rounded-sm border border-hairline hover:bg-canvas"
              >
                ✕
              </button>
            </div>
            <p className="font-sans text-xs text-ivory/80 leading-relaxed">
              {activeModalInfo.content}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModalInfo(null)}
                className="px-4 py-1.5 rounded-sm bg-signature text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#f79612] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
