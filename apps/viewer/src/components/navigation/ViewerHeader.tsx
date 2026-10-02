import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bookmark, History, LogIn, LogOut, X, Globe, ChevronDown, Check, Menu } from 'lucide-react';
import { Profile, AppRole } from '../../types';
import { useReducedMotion } from '../../lib/motion';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';

interface ViewerHeaderProps {
  currentTab: 'home' | 'browse' | 'watchlist' | 'history';
  onSelectTab: (tab: 'home' | 'browse' | 'watchlist' | 'history') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  user: any;
  profile: Profile | null;
  role: AppRole;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const ViewerHeader: React.FC<ViewerHeaderProps> = ({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  user,
  profile,
  role,
  onOpenAuth,
  onSignOut,
}) => {
  const reduced = useReducedMotion();
  const { currentLanguage, setLanguage, isTranslating } = useLanguage();
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

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
        setShowUserMenu(false);
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
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 border-0 outline-none ${
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
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center group text-left focus:outline-none"
            aria-label="TPF Cinemas Home"
          >
            <img
              src="/tpf-cinemas-logo.png"
              alt="TPF Cinemas - Screening The Beginner Dreams"
              className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </button>

          {/* Minimalist Editorial Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onSelectTab('home')}
              className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-150 ${currentTab === 'home'
                  ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                  : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                }`}
            >
              Curated
            </button>
            <button
              onClick={() => onSelectTab('browse')}
              className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-150 ${currentTab === 'browse'
                  ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                  : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                }`}
            >
              Catalogue
            </button>
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                } else {
                  onSelectTab('watchlist');
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 ${currentTab === 'watchlist'
                  ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                  : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                }`}
            >
              <Bookmark className="h-3.5 w-3.5 text-signature" />
              <span>Queue</span>
            </button>
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                } else {
                  onSelectTab('history');
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 ${currentTab === 'history'
                  ? 'text-ivory font-semibold bg-white/[0.08] shadow-sm'
                  : 'text-muted hover:text-ivory hover:bg-white/[0.04] font-medium'
                }`}
            >
              <History className="h-3.5 w-3.5 text-muted" />
              <span>History</span>
            </button>
          </nav>
        </div>

        {/* Right Actions: Search, Netflix-Style Live Google Language Selector & Auth */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Expandable Search Input */}
          <div className="relative">
            <AnimatePresence mode="wait" initial={false}>
              {showSearch ? (
                <motion.div
                  key="search-open"
                  className="flex items-center bg-graphite border border-signature/60 rounded-sm px-3 py-1.5 w-52 sm:w-64"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, x: 10, transition: { duration: 0.1 } }}
                >
                  <Search className="h-3.5 w-3.5 text-signature shrink-0 mr-2" />
                  <input
                    type="text"
                    placeholder="Search title, auteur..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoFocus
                    className="bg-transparent border-none text-ivory text-xs placeholder:text-muted focus:outline-none w-full font-sans"
                  />
                  <button
                    onClick={() => {
                      onSearchChange('');
                      setShowSearch(false);
                    }}
                    className="text-muted hover:text-ivory ml-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ) : (
                <button
                  key="search-icon"
                  onClick={() => setShowSearch(true)}
                  className="p-2 sm:p-2.5 rounded-sm text-muted hover:text-ivory hover:bg-graphite transition-colors"
                  title="Search Catalogue"
                >
                  <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </button>
              )}
            </AnimatePresence>
          </div>

          {/* Live Google Translator Dropdown — Solid Opaque, Multi-Lingual */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm bg-black/70 border border-hairline hover:border-ivory/50 text-ivory text-xs sm:text-sm font-sans transition-colors focus:outline-none ${isTranslating ? 'animate-pulse border-signature' : ''
                }`}
              title="Change Website Language (Live Google Translator)"
            >
              <Globe className="h-4 w-4 text-signature" />
              <span className="hidden sm:inline font-medium">{currentLanguage.nativeName}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>

            {showLangMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-xl border border-white/[0.12] shadow-2xl py-1 z-50 font-sans max-h-72 overflow-y-auto bg-[#101117]"
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

          {/* User Profile / Seamless Borderless Trigger */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.08] transition-all duration-150 focus:outline-none group"
                aria-label="User Account Menu"
              >
                <div className="h-7 w-7 rounded-md bg-signature text-black flex items-center justify-center text-xs font-bold font-mono shadow-sm group-hover:scale-105 transition-transform">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline text-xs sm:text-sm font-medium text-ivory group-hover:text-white max-w-[140px] truncate">
                  {profile?.display_name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted group-hover:text-ivory transition-colors" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-white/[0.12] p-2 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-ivory bg-[#101117]"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
                  >
                    <div className="px-3 py-2 border-b border-white/[0.08]">
                      <p className="text-xs font-semibold text-ivory truncate">
                        {profile?.display_name || 'Audience Member'}
                      </p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] uppercase font-mono font-medium px-1.5 py-0.5 bg-black/60 border border-white/10 text-signature rounded-sm">
                        {role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          onSelectTab('watchlist');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-ivory hover:bg-white/[0.06] rounded-lg transition-colors"
                      >
                        <Bookmark className="h-3.5 w-3.5 text-signature" />
                        <span>Curated Queue</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectTab('history');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-ivory hover:bg-white/[0.06] rounded-lg transition-colors"
                      >
                        <History className="h-3.5 w-3.5 text-muted" />
                        <span>Watch History</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-white/[0.08]">
                      <button
                        onClick={() => {
                          onSignOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 sm:px-5 py-2 rounded-lg bg-signature hover:bg-signature-hover text-black font-semibold uppercase tracking-wider text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shadow-[0_2px_12px_rgba(229,169,59,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              title="Sign In to TPF Cinemas"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Navigation Toggle */}
          <button
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="md:hidden p-2 rounded-lg text-muted hover:text-ivory hover:bg-white/[0.06] transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
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
            className="md:hidden max-w-7xl mx-auto px-4 mt-3 pt-3 border-t border-white/[0.08]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
          >
            <div className="bg-[#101117] border border-white/[0.10] rounded-2xl p-3 shadow-2xl grid grid-cols-2 gap-2 text-ivory">
              <button
                onClick={() => {
                  onSelectTab('home');
                  setShowMobileNav(false);
                }}
                className={`flex items-center justify-center p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                  currentTab === 'home'
                    ? 'text-ivory font-semibold bg-white/[0.12] border border-signature/40 shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                }`}
              >
                <span>Curated</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('browse');
                  setShowMobileNav(false);
                }}
                className={`flex items-center justify-center p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                  currentTab === 'browse'
                    ? 'text-ivory font-semibold bg-white/[0.12] border border-signature/40 shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                }`}
              >
                <span>Catalogue</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  if (!user) onOpenAuth();
                  else onSelectTab('watchlist');
                }}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                  currentTab === 'watchlist'
                    ? 'text-ivory font-semibold bg-white/[0.12] border border-signature/40 shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5 text-signature" />
                <span>Queue</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  if (!user) onOpenAuth();
                  else onSelectTab('history');
                }}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs uppercase font-medium tracking-wider transition-all ${
                  currentTab === 'history'
                    ? 'text-ivory font-semibold bg-white/[0.12] border border-signature/40 shadow-sm'
                    : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
                }`}
              >
                <History className="h-3.5 w-3.5 text-muted" />
                <span>History</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
