import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bookmark, History, LogIn, LogOut, X, Globe, ChevronDown, Check } from 'lucide-react';
import { Profile, AppRole } from '../../types';
import { useReducedMotion } from '../../lib/motion';

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

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'es', name: 'Español' },
];

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-canvas border-b border-hairline py-3 shadow-2xl'
          : 'bg-gradient-to-b from-canvas/95 via-canvas/80 to-transparent border-b border-hairline/20 py-3.5 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Editorial Masthead & Brand — Netflix-Inspired High-Impact Logo */}
        <div className="flex items-center gap-6 lg:gap-8">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 sm:gap-3 group text-left focus:outline-none"
          >
            {/* Architectural Sprocket Badge */}
            <div className="h-8 w-8 bg-graphite border border-hairline flex items-center justify-center rounded-sm transition-colors group-hover:border-signature">
              <div className="w-2.5 h-3.5 border-y-2 border-x border-signature flex items-center justify-center">
                <div className="w-1 h-1 bg-signature" />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="font-display text-2xl sm:text-3xl tracking-[0.08em] text-ivory leading-none">
                TPF <span className="text-signature">CINEMAS</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.22em] text-muted uppercase mt-0.5">
                Screening Beginners&apos; Dreams
              </span>
            </div>
          </button>

          {/* Minimalist Editorial Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('home')}
              className={`px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider font-medium transition-colors ${
                currentTab === 'home'
                  ? 'text-ivory bg-graphite border-b border-signature'
                  : 'text-muted hover:text-ivory hover:bg-graphite/40'
              }`}
            >
              Curated
            </button>
            <button
              onClick={() => onSelectTab('browse')}
              className={`px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider font-medium transition-colors ${
                currentTab === 'browse'
                  ? 'text-ivory bg-graphite border-b border-signature'
                  : 'text-muted hover:text-ivory hover:bg-graphite/40'
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
              className={`px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors ${
                currentTab === 'watchlist'
                  ? 'text-ivory bg-graphite border-b border-signature'
                  : 'text-muted hover:text-ivory hover:bg-graphite/40'
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
              className={`px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors ${
                currentTab === 'history'
                  ? 'text-ivory bg-graphite border-b border-signature'
                  : 'text-muted hover:text-ivory hover:bg-graphite/40'
              }`}
            >
              <History className="h-3.5 w-3.5 text-muted" />
              <span>History</span>
            </button>
          </nav>
        </div>

        {/* Right Actions: Search, Netflix-Style Language Selector & Auth */}
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

          {/* Language Selector Dropdown — Direct Netflix Pattern */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-black/60 border border-hairline hover:border-ivory/50 text-ivory text-xs font-sans transition-colors focus:outline-none"
              title="Select Language"
            >
              <Globe className="h-3.5 w-3.5 text-muted" />
              <span className="hidden sm:inline">{selectedLanguage.name}</span>
              <ChevronDown className="h-3 w-3 text-muted" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-sm bg-graphite border border-hairline shadow-2xl py-1 z-50 font-sans">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setShowLangMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs flex items-center justify-between text-ivory hover:bg-canvas transition-colors"
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

          {/* User Profile / Netflix-Style Signature CTA Button */}
          {user ? (
            <div className="relative">
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
                    className="absolute right-0 mt-2 w-56 bg-graphite border border-hairline rounded-sm p-2 z-50 shadow-2xl"
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
