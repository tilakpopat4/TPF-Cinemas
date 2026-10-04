import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Globe, ChevronDown, Check, CheckSquare, Users, History, Menu, X, Sliders } from 'lucide-react';
import { Profile, AppRole } from '../../types';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';

interface StaffHeaderProps {
  profile: Profile | null;
  email?: string;
  role: AppRole;
  activeTab: 'queue' | 'roles' | 'audit' | 'uimanager';
  onTabChange: (tab: 'queue' | 'roles' | 'audit' | 'uimanager') => void;
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
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.display_name || email?.split('@')[0] || 'Staff Member';
  const isAdmin = role === 'admin';

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
        isScrolled ? 'pt-3 sm:pt-4 pb-7 sm:pb-8' : 'pt-4 sm:pt-5 pb-8 sm:pb-9'
      }`}
      style={{
        background: isScrolled
          ? 'linear-gradient(to bottom, rgb(0,0,0) 0%, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.6) 70%, transparent 100%)'
          : 'linear-gradient(to bottom, rgb(0,0,0) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.3) 80%, transparent 100%)',
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
              STAFF CONSOLE
            </span>
          </div>

          {/* Staff Section Tabs */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onTabChange('queue')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-150 ${
                activeTab === 'queue'
                  ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                  : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-150 ${
                    activeTab === 'roles'
                      ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                      : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                  }`}
                >
                  <Users className="h-3.5 w-3.5 text-muted" />
                  <span>Role Manager</span>
                </button>

                <button
                  onClick={() => onTabChange('audit')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-150 ${
                    activeTab === 'audit'
                      ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                      : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                  }`}
                >
                  <History className="h-3.5 w-3.5 text-muted" />
                  <span>Audit Trail</span>
                </button>

                <button
                  onClick={() => onTabChange('uimanager')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-150 ${
                    activeTab === 'uimanager'
                      ? 'text-signature font-semibold bg-signature/10 shadow-sm border border-signature/20'
                      : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5 text-signature" />
                  <span>UI Management</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right Tools & Language & User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Google Translator Dropdown — Borderless Pill Pattern */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border-none text-ivory text-xs sm:text-sm font-sans transition-colors focus:outline-none shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${
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
              aria-label="Staff Account Menu"
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
                      {role} privilege
                    </span>
                  </div>

                  <div className="pt-1 mt-1 border-t border-white/[0.04]">
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
          <button
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="md:hidden p-2 rounded-lg text-muted hover:text-ivory hover:bg-white/[0.06] transition-colors focus:outline-none"
            aria-label="Toggle Staff Navigation"
          >
            {showMobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 text-ivory" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            ref={mobileNavRef}
            className="md:hidden max-w-7xl mx-auto px-4 mt-3 pt-3"
            style={{ borderTop: '1px solid transparent', backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)', backgroundSize: '100% 1px', backgroundRepeat: 'no-repeat', backgroundPosition: 'top' }}

            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
          >
            <div className="bg-[#101117] border border-white/[0.10] rounded-2xl p-3 shadow-2xl space-y-2 text-ivory">
              <button
                onClick={() => {
                  onTabChange('queue');
                  setShowMobileNav(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                  activeTab === 'queue'
                    ? 'text-ivory font-semibold bg-white/[0.14] shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-signature" />
                  <span>Review Queue</span>
                </span>
                {queueCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-signature/20 text-signature">
                    {queueCount}
                  </span>
                )}
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      onTabChange('roles');
                      setShowMobileNav(false);
                    }}
                    className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                      activeTab === 'roles'
                        ? 'text-ivory font-semibold bg-white/[0.14] shadow-sm'
                        : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5 text-muted" />
                    <span>Role Manager</span>
                  </button>

                  <button
                    onClick={() => {
                      onTabChange('audit');
                      setShowMobileNav(false);
                    }}
                    className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                      activeTab === 'audit'
                        ? 'text-ivory font-semibold bg-white/[0.14] shadow-sm'
                        : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                    }`}
                  >
                    <History className="h-3.5 w-3.5 text-muted" />
                    <span>Audit Trail</span>
                  </button>

                  <button
                    onClick={() => {
                      onTabChange('uimanager');
                      setShowMobileNav(false);
                    }}
                    className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                      activeTab === 'uimanager'
                        ? 'text-signature font-semibold bg-signature/10 shadow-sm border border-signature/20'
                        : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5 text-signature" />
                    <span>UI Management</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
