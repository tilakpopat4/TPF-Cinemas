import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ChevronDown, Check, Phone, Mail, ShieldCheck, X } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';

export const StaffFooter: React.FC = () => {
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
    <footer className="border-t border-hairline bg-canvas text-muted text-xs selection:bg-signature selection:text-black relative z-10 mt-auto">
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
                onClick={() =>
                  handleLinkClick(
                    'Curation & Moderation SOP',
                    'All curation decisions must review video quality, music synchronization clearance, and author declaration prior to publishing. Audit trails log every reviewer verdict with cryptographic non-repudiation.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Curation Handbook
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Governance & Board Oversight',
                    'TPF Cinemas operates under independent artistic advisory boards. Platform administrators hold security obligations defined in the platform security charter.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Governance & Board
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Privacy & Staff Confidentiality',
                    'Staff members are bound by non-disclosure agreements regarding unreleased films, festival submissions, and creator intellectual property.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Privacy & Confidentiality
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Content Security & Takedown Protocol',
                    'Emergency takedowns can be triggered by Platform Admins via the takedown_film RPC with mandatory audit logging reasons.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Takedown Protocol
              </button>
            </li>
          </ul>

          {/* Column 2 */}
          <ul className="space-y-3">
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Technical Support Desk',
                    'For database replication status, Cloudflare stream transcoding issues, or worker queue monitoring, contact engineering support.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Engineering Desk
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Staff Roles & Permissions',
                    'Roles are governed by PostgreSQL Row Level Security (RLS) and custom claims. Only Platform Admins may promote users to curator or staff status.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Role Security Matrix
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Session Security & Cookies',
                    'Staff sessions require secure, HTTP-only JWT verification with automatic expiration and refresh token rotation.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Session Security
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Licence Verification Checklist',
                    'Prior to approval, verify term months, music clearance declaration, territory restrictions, and agreement storage path.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Licence Checklist
              </button>
            </li>
          </ul>

          {/* Column 3 */}
          <ul className="space-y-3">
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Staff Account & Credentials',
                    'Manage your curator credentials, active review queue assignments, and audit logging history from the profile menu.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Staff Account
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Ways to Screen & Moderate',
                    'Access the curation console on any secure desktop or mobile workstation with high-fidelity streaming diagnostics.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Ways to Watch & Review
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Corporate & Production Information',
                    'TPF Cinemas operates as an artistic distribution entity committed to elevating debut filmmakers across South Asia and global cinema festivals.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Corporate Information
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Exclusive Curatorial Premieres',
                    'Only films meeting rigorous curatorial standards, music sync licenses, and original chain of title are certified for screening.'
                  )
                }
                className="hover:underline hover:text-signature transition-colors text-left font-medium"
              >
                Only on TPF Cinemas
              </button>
            </li>
          </ul>

          {/* Column 4 */}
          <ul className="space-y-3">
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Festival Press & Laurels',
                    'Access official digital laurel packs, press releases, and high-resolution TPF Official Selection assets for approved titles.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Press & Media
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Terms of Exhibition & Distribution',
                    'Screening licenses are executed digitally with verified timestamps. Non-exclusive rights ensure creators maintain independence.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Terms of Exhibition
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Contact Curatorial Desk',
                    'Reach our programming director directly at work.tilakpopatfilms@gmail.com for expedite requests or festival premiere co-ordination.'
                  )
                }
                className="hover:underline hover:text-ivory transition-colors text-left"
              >
                Contact Curators
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  handleLinkClick(
                    'Debut Auteur Grant Fund',
                    '10% of platform earnings are dedicated to funding second films for filmmakers who debuted their first film on TPF Cinemas.'
                  )
                }
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
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border-none text-ivory text-xs font-sans transition-colors focus:outline-none shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${
              isTranslating ? 'animate-pulse text-signature' : ''
            }`}
            aria-label="Select Language (Live Google Translator)"
          >
            <Globe className="h-3.5 w-3.5 text-signature" />
            <span className="font-medium">{currentLanguage.nativeName}</span>
            <span className="text-[10px] text-muted">({currentLanguage.name})</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted ml-1 transition-transform ${isLangOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* 100% Solid Opaque Dropdown Container */}
          {isLangOpen && (
            <div
              className="absolute left-0 bottom-full mb-2 w-56 rounded-xl border border-white/[0.12] shadow-2xl py-1 z-50 font-sans max-h-64 overflow-y-auto bg-[#101117]"
            >
              <div className="px-3 py-1.5 border-b border-white/[0.08] text-[10px] uppercase font-mono tracking-wider text-muted flex items-center justify-between">
                <span>Translate Console</span>
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

        {/* Regional Tag & Cryptographic Security Line */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted font-sans font-medium">
            TPF Cinemas
          </p>

          <div className="flex items-center gap-1.5 text-[11px] text-muted font-mono">
            <p>Made With ❤️ For Cinephiles</p>
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
              className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#0c0d14] p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.95)] text-ivory space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-signature font-semibold">
                    Staff & Curatorial Dispatch
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
