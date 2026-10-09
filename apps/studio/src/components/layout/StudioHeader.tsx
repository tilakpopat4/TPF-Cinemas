import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, LogOut, Globe, ChevronDown, Check, Menu, X, ShieldCheck, ShieldAlert, FileText } from 'lucide-react';
import { Profile } from '../../types';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';

interface StudioHeaderProps {
  profile: Profile | null;
  email?: string;
  onNewFilm: () => void;
  onSignOut: () => void;
  isFilmmaker: boolean;
  activeFilter?: 'all' | 'drafts' | 'review' | 'published';
  onFilterChange?: (filter: 'all' | 'drafts' | 'review' | 'published') => void;
  hasSignedAgreement?: boolean;
  onOpenAgreement?: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  profile,
  email,
  onNewFilm,
  onSignOut,
  isFilmmaker,
  activeFilter,
  onFilterChange,
  hasSignedAgreement,
  onOpenAgreement,
}) => {
  const { currentLanguage, setLanguage, isTranslating } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.display_name || email?.split('@')[0] || 'Creator';
  const role = profile?.role || 'viewer';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setShowMobileNav(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-40 transition-all duration-500 border-0 outline-none ${
        isScrolled ? 'pt-3 sm:pt-4 pb-7 sm:pb-8' : 'pt-4 sm:pt-5 pb-7 sm:pb-8'
      }`}
      style={{
        background: isScrolled
          ? 'linear-gradient(to bottom, rgb(0,0,0) 0%, rgba(0,0,0,0.92) 35%, rgba(0,0,0,0.55) 70%, transparent 100%)'
          : 'linear-gradient(to bottom, rgb(0,0,0) 0%, rgba(0,0,0,0.82) 45%, rgba(0,0,0,0.25) 80%, transparent 100%)',
        boxShadow: 'none',
        borderBottom: 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Official Brand Logo & Nav */}
        <div className="flex items-center gap-6 lg:gap-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center group text-left">
              <img
                src="/tpf-cinemas-logo.png"
                alt="TPF Cinemas - Screening The Beginner Dreams"
                className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            </div>
            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-md bg-signature/10 border border-signature/30 text-signature font-mono text-[9px] uppercase tracking-widest font-bold">
              CREATOR STUDIO
            </span>
          </div>

          {/* Contextual Subnav / Filter links if onFilterChange provided */}
          {onFilterChange && (
            <nav className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => onFilterChange('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-150 ${
                  activeFilter === 'all'
                    ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                }`}
              >
                All Submissions
              </button>
              <button
                onClick={() => onFilterChange('drafts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-150 ${
                  activeFilter === 'drafts'
                    ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                }`}
              >
                Drafts
              </button>
              <button
                onClick={() => onFilterChange('review')}
                className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-150 ${
                  activeFilter === 'review'
                    ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                }`}
              >
                In Review
              </button>
              <button
                onClick={() => onFilterChange('published')}
                className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-150 ${
                  activeFilter === 'published'
                    ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                }`}
              >
                Live
              </button>
            </nav>
          )}
        </div>

        {/* Right Tools & Language & User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Primary Submit Film CTA */}
          {isFilmmaker && (
            <button
              onClick={onNewFilm}
              className="px-4 py-2 rounded-sm bg-signature text-black font-semibold uppercase tracking-wider text-xs sm:text-sm hover:bg-[#f79612] transition-colors flex items-center gap-1.5 shadow-md"
              title="Submit New Film"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Submit Film</span>
            </button>
          )}

          {/* Live Google Translator Dropdown — Matching Viewer & Footer */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border-none text-ivory text-xs sm:text-sm font-sans transition-colors focus:outline-none ${
                isTranslating ? 'animate-pulse text-signature' : ''
              }`}
              title="Change Website Language (Live Google Translator)"
            >
              <Globe className="h-4 w-4 text-signature" />
              <span className="hidden sm:inline font-medium">{currentLanguage.nativeName}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted transition-transform ${showLangMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showLangMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-xl border border-white/[0.12] shadow-2xl py-1 z-50 font-sans max-h-72 overflow-y-auto bg-[#101117]"
              >
                <div className="px-3 py-1.5 border-b border-white/[0.08] text-[10px] uppercase font-mono tracking-wider text-muted flex items-center justify-between">
                  <span>Translate Studio</span>
                  <span className="text-[9px] text-signature">Live</span>
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang);
                      setShowLangMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-ivory hover:bg-white/[0.06] transition-colors"
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

          {/* User Profile Menu — Seamless Borderless Trigger */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.08] transition-all duration-150 focus:outline-none group"
              aria-label="Creator Account Menu"
            >
              <div className="h-7 w-7 rounded-md bg-signature text-black flex items-center justify-center text-xs font-bold font-mono shadow-sm group-hover:scale-105 transition-transform">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs sm:text-sm font-medium text-ivory group-hover:text-white max-w-[140px] truncate">
                {displayName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted group-hover:text-ivory transition-colors" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 mt-2 w-56 rounded-2xl p-2 z-50 shadow-[0_20px_60px_rgba(0,0,0,0.95)] text-ivory bg-[#0F1015]"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
                >
                  <div className="px-3 py-2.5">
                    <p className="text-xs font-semibold text-ivory truncate">{displayName}</p>
                    <p className="text-[11px] text-muted truncate">{email}</p>
                    <span className="inline-block mt-1.5 text-[9px] uppercase font-mono font-medium px-2 py-0.5 bg-signature/15 text-signature rounded-full">
                      {role}
                    </span>
                  </div>

                  <div className="pt-1 mt-1 border-t border-white/[0.04] space-y-0.5">
                    {onOpenAgreement && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onOpenAgreement();
                        }}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs rounded-xl transition-colors ${
                          hasSignedAgreement
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-amber-400 hover:bg-amber-500/10'
                        }`}
                      >
                        {hasSignedAgreement ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span>Rights Deed Executed</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                            <span>Sign Rights Deed</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Navigation Toggle */}
          {onFilterChange && (
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="md:hidden p-2 rounded-lg text-muted hover:text-ivory hover:bg-white/[0.06] transition-colors focus:outline-none"
              aria-label="Toggle Studio Filter Navigation"
            >
              {showMobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 text-ivory" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      <AnimatePresence>
        {showMobileNav && onFilterChange && (
          <motion.div
            ref={mobileNavRef}
            className="md:hidden max-w-7xl mx-auto px-4 mt-3 pt-3 border-t border-white/[0.08]"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
          >
            <div className="bg-[#101117] border border-white/[0.10] rounded-2xl p-3 shadow-2xl grid grid-cols-2 gap-2 text-ivory">
              <button
                onClick={() => {
                  onFilterChange('all');
                  setShowMobileNav(false);
                }}
                className={`flex items-center justify-center p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                  activeFilter === 'all'
                    ? 'text-ivory font-semibold bg-white/[0.14] shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                }`}
              >
                All Submissions
              </button>
              <button
                onClick={() => {
                  onFilterChange('drafts');
                  setShowMobileNav(false);
                }}
                className={`flex items-center justify-center p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                  activeFilter === 'drafts'
                    ? 'text-ivory font-semibold bg-white/[0.14] shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                }`}
              >
                Drafts
              </button>
              <button
                onClick={() => {
                  onFilterChange('review');
                  setShowMobileNav(false);
                }}
                className={`flex items-center justify-center p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                  activeFilter === 'review'
                    ? 'text-ivory font-semibold bg-white/[0.14] shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                }`}
              >
                In Review
              </button>
              <button
                onClick={() => {
                  onFilterChange('published');
                  setShowMobileNav(false);
                }}
                className={`flex items-center justify-center p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                  activeFilter === 'published'
                    ? 'text-ivory font-semibold bg-white/[0.14] shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                }`}
              >
                Live
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
