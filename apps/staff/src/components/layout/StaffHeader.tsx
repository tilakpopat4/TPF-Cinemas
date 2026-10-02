import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Globe, ChevronDown, Check, CheckSquare, Users, History, Film, Video } from 'lucide-react';
import { Profile, AppRole } from '../../types';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';
import { getPortalUrl } from '../../lib/portalNav';

interface StaffHeaderProps {
  profile: Profile | null;
  email?: string;
  role: AppRole;
  activeTab: 'queue' | 'roles' | 'audit';
  onTabChange: (tab: 'queue' | 'roles' | 'audit') => void;
  onSignOut: () => void;
  queueCount: number;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({
  profile,
  email,
  role,
  activeTab,
  onTabChange,
  onSignOut,
  queueCount,
}) => {
  const { currentLanguage, setLanguage, isTranslating } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.display_name || email?.split('@')[0] || 'Staff Member';
  const isAdmin = role === 'admin';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-canvas py-3 sm:py-3.5 shadow-2xl border-b border-hairline/80'
          : 'bg-gradient-to-b from-canvas/95 via-canvas/85 to-transparent py-4 sm:py-5 border-b border-hairline/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Official Brand Logo & Universal Portal Nav */}
        <div className="flex items-center gap-5 sm:gap-7">
          <div className="flex items-center gap-3">
            <a
              href={getPortalUrl('cinema')}
              className="flex items-center group text-left focus:outline-none"
              aria-label="TPF Cinemas Home"
            >
              <img
                src="/tpf-cinemas-logo.png"
                alt="TPF Cinemas - Screening The Beginner Dreams"
                className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            </a>
            <span className="hidden md:inline-block px-2 py-0.5 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] uppercase tracking-wider font-semibold">
              STAFF CONSOLE
            </span>
          </div>

          {/* Universal Cross-Portal Hub Switcher */}
          <div className="hidden lg:flex items-center border border-hairline/60 rounded-sm bg-black/40 p-0.5 text-[11px] font-mono uppercase tracking-wider">
            <a
              href={getPortalUrl('cinema')}
              className="px-2.5 py-1 rounded-sm text-muted hover:text-ivory hover:bg-graphite/60 transition-colors"
              title="Audience Streaming Portal"
            >
              Cinema
            </a>
            <a
              href={getPortalUrl('studio')}
              className="px-2.5 py-1 rounded-sm text-muted hover:text-ivory hover:bg-graphite/60 transition-colors"
              title="Filmmaker Studio & Submissions"
            >
              Studio
            </a>
            <a
              href={getPortalUrl('staff')}
              className="px-2.5 py-1 rounded-sm bg-signature text-black font-bold shadow-sm"
              title="Staff & Curation Console"
            >
              Staff
            </a>
          </div>

          {/* Staff Section Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider transition-colors ${
                activeTab === 'queue'
                  ? 'text-ivory font-semibold bg-graphite/70'
                  : 'text-muted hover:text-ivory hover:bg-graphite/40 font-medium'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5 text-signature" />
              <span>Review Queue</span>
              {queueCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-signature/20 text-signature border border-signature/30">
                  {queueCount}
                </span>
              )}
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => onTabChange('roles')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider transition-colors ${
                    activeTab === 'roles'
                      ? 'text-ivory font-semibold bg-graphite/70'
                      : 'text-muted hover:text-ivory hover:bg-graphite/40 font-medium'
                  }`}
                >
                  <Users className="h-3.5 w-3.5 text-sky-400" />
                  <span>Role Manager</span>
                </button>

                <button
                  onClick={() => onTabChange('audit')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider transition-colors ${
                    activeTab === 'audit'
                      ? 'text-ivory font-semibold bg-graphite/70'
                      : 'text-muted hover:text-ivory hover:bg-graphite/40 font-medium'
                  }`}
                >
                  <History className="h-3.5 w-3.5 text-purple-400" />
                  <span>Audit Trail</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right Tools & Language & User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Google Translator Dropdown — Matching Viewer & Studio */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm bg-black/70 border border-hairline hover:border-ivory/50 text-ivory text-xs sm:text-sm font-sans transition-colors focus:outline-none ${
                isTranslating ? 'animate-pulse border-signature' : ''
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
                className="absolute right-0 mt-2 w-48 rounded-sm border border-hairline/80 shadow-2xl py-1 z-50 font-sans max-h-72 overflow-y-auto"
                style={{ backgroundColor: '#141417' }}
              >
                <div className="px-3 py-1.5 border-b border-hairline/60 text-[10px] uppercase font-mono tracking-wider text-muted flex items-center justify-between">
                  <span>Translate Console</span>
                  <span className="text-[9px] text-signature">Live</span>
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang);
                      setShowLangMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-ivory hover:bg-canvas transition-colors"
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

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-sm bg-graphite hover:bg-[#232328] border border-hairline transition-colors focus:outline-none"
            >
              <div className="h-6 w-6 bg-signature text-black flex items-center justify-center text-[11px] font-bold font-mono">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs sm:text-sm font-medium text-ivory max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 mt-2 w-56 rounded-sm border border-hairline p-2 z-50 shadow-2xl"
                  style={{ backgroundColor: '#141417' }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
                >
                  <div className="px-3 py-2 border-b border-hairline">
                    <p className="text-xs font-semibold text-ivory truncate">{displayName}</p>
                    <p className="text-[11px] text-muted truncate">{email}</p>
                    <span className="inline-block mt-1 text-[9px] uppercase font-mono font-medium px-1.5 py-0.5 bg-black border border-hairline text-amber-400">
                      {role} privilege
                    </span>
                  </div>

                  {/* Cross-Portal Switcher Links */}
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-muted">
                      Portals
                    </div>
                    <a
                      href={getPortalUrl('cinema')}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ivory hover:bg-canvas rounded-sm transition-colors"
                    >
                      <Film className="h-3.5 w-3.5 text-signature" />
                      <span>Audience Cinema</span>
                    </a>
                    <a
                      href={getPortalUrl('studio')}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ivory hover:bg-canvas rounded-sm transition-colors"
                    >
                      <Video className="h-3.5 w-3.5 text-rose-400" />
                      <span>Filmmaker Studio</span>
                    </a>
                  </div>

                  <div className="pt-1 border-t border-hairline">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-sm transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
