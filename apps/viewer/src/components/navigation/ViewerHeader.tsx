import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bookmark, History, LogIn, LogOut, X, Globe, ChevronDown, Check } from 'lucide-react';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-canvas py-3 shadow-2xl'
          : 'bg-gradient-to-b from-canvas/95 via-canvas/80 to-transparent py-3.5 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Official Brand Logo */}
        <div className="flex items-center gap-6 lg:gap-8">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center group text-left focus:outline-none"
            aria-label="TPF Cinemas Home"
          >
            <img
              src="/tpf-cinemas-logo.png"
              alt="TPF Cinemas - Screening The Beginner Dreams"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain transition-opacity group-hover:opacity-90"
            />
          </button>

          {/* Minimalist Editorial Nav Links (Clean, No Underlines) */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('home')}
              className={`px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider transition-colors ${
                currentTab === 'home'
                  ? 'text-ivory font-semibold bg-graphite/60'
                  : 'text-muted hover:text-ivory hover:bg-graphite/40 font-medium'
              }`}
            >
              Curated
            </button>
            <button
              onClick={() => onSelectTab('browse')}
              className={`px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider transition-colors ${
                currentTab === 'browse'
                  ? 'text-ivory font-semibold bg-graphite/60'
                  : 'text-muted hover:text-ivory hover:bg-graphite/40 font-medium'
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
              className={`px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                currentTab === 'watchlist'
                  ? 'text-ivory font-semibold bg-graphite/60'
                  : 'text-muted hover:text-ivory hover:bg-graphite/40 font-medium'
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
              className={`px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                currentTab === 'history'
                  ? 'text-ivory font-semibold bg-graphite/60'
                  : 'text-muted hover:text-ivory hover:bg-graphite/40 font-medium'
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
                  className="p-1.5 sm:p-2 rounded-sm text-muted hover:text-ivory hover:bg-graphite transition-colors"
                  title="Search Catalogue"
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
            </AnimatePresence>
          </div>

          {/* Live Google Translator Dropdown — Solid Opaque, Multi-Lingual */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-black/70 border border-hairline hover:border-ivory/50 text-ivory text-xs font-sans transition-colors focus:outline-none ${
                isTranslating ? 'animate-pulse border-signature' : ''
              }`}
              title="Change Website Language (Live Google Translator)"
            >
              <Globe className="h-3.5 w-3.5 text-signature" />
              <span className="hidden sm:inline font-medium">{currentLanguage.nativeName}</span>
              <ChevronDown className={`h-3 w-3 text-muted transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>

            {showLangMenu && (
              <div
                className="absolute right-0 mt-1.5 w-48 rounded-sm border border-hairline/80 shadow-2xl py-1 z-50 font-sans max-h-72 overflow-y-auto"
                style={{ backgroundColor: '#141417' }}
              >
                <div className="px-3 py-1.5 border-b border-hairline/60 text-[10px] uppercase font-mono tracking-wider text-muted flex items-center justify-between">
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

          {/* User Profile / Netflix-Style Signature CTA Button */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm bg-graphite hover:bg-[#232328] border border-hairline transition-colors focus:outline-none"
              >
                <div className="h-5 w-5 bg-signature text-black flex items-center justify-center text-[10px] font-bold font-mono">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-ivory max-w-[100px] truncate">
                  {profile?.display_name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-muted" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    className="absolute right-0 mt-2 w-56 rounded-sm border border-hairline p-2 z-50 shadow-2xl"
                    style={{ backgroundColor: '#141417' }}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
                  >
                    <div className="px-3 py-2 border-b border-hairline">
                      <p className="text-xs font-semibold text-ivory truncate">
                        {profile?.display_name || 'Audience Member'}
                      </p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] uppercase font-mono font-medium px-1.5 py-0.5 bg-black border border-hairline text-signature">
                        {role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          onSelectTab('watchlist');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-ivory hover:bg-canvas rounded-sm transition-colors"
                      >
                        <Bookmark className="h-3.5 w-3.5 text-signature" />
                        <span>Curated Queue</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectTab('history');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-ivory hover:bg-canvas rounded-sm transition-colors"
                      >
                        <History className="h-3.5 w-3.5 text-muted" />
                        <span>Watch History</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-hairline">
                      <button
                        onClick={() => {
                          onSignOut();
                          setShowUserMenu(false);
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
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-1.5 rounded-sm bg-signature text-black font-semibold uppercase tracking-wider text-xs hover:bg-[#f79612] transition-colors flex items-center gap-1.5 shadow-sm"
              title="Sign In to TPF Cinemas"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
