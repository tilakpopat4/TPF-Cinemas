import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Search, Bookmark, History, LogIn, LogOut, X } from 'lucide-react';
import { Profile, AppRole } from '../../types';
import { useReducedMotion, springSnappy, springNatural } from '../../lib/motion';

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-[background-color,border-color,box-shadow,padding] duration-300 ${
        isScrolled
          ? 'bg-[#08090c]/90 backdrop-blur-md border-b border-white/10 shadow-2xl py-3'
          : 'bg-gradient-to-b from-[#08090c]/95 via-[#08090c]/50 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Film className="h-5 w-5 text-black" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-extrabold text-xl tracking-wider text-white flex items-center gap-1">
                TPF<span className="text-amber-500">CINEMAS</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase -mt-1">
                Independent Stream
              </span>
            </div>
          </button>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'home'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onSelectTab('browse')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'browse'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                currentTab === 'watchlist'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bookmark className="h-4 w-4 text-amber-400" />
              <span>My List</span>
            </button>
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                } else {
                  onSelectTab('history');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                currentTab === 'history'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="h-4 w-4 text-zinc-400" />
              <span>History</span>
            </button>
          </nav>
        </div>

        {/* Right Actions: Search, Portal Shortcuts, Auth */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <AnimatePresence mode="wait" initial={false}>
              {showSearch ? (
                <motion.div
                  key="search-open"
                  className="flex items-center bg-[#161a23] border border-amber-500/40 rounded-full px-3 py-1.5 shadow-lg w-56 sm:w-72"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scaleX: 0.7, originX: 1 }}
                  animate={{ opacity: 1, scaleX: 1, transition: springNatural }}
                  exit={{ opacity: 0, scaleX: 0.85, transition: { duration: 0.15 } }}
                >
                  <Search className="h-4 w-4 text-amber-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    placeholder="Search titles, directors, genres..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoFocus
                    className="bg-transparent border-none text-white text-xs placeholder:text-zinc-500 focus:outline-none w-full"
                  />
                  <button
                    onClick={() => {
                      onSearchChange('');
                      setShowSearch(false);
                    }}
                    className="text-zinc-400 hover:text-white ml-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-icon"
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Search Catalogue"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={reduced ? {} : { scale: 0.88, transition: springSnappy }}
                >
                  <Search className="h-5 w-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>


          {/* User Profile / Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-white/10 transition-colors focus:outline-none"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-xs font-bold text-black">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-zinc-300 max-w-[100px] truncate">
                  {profile?.display_name || user.email?.split('@')[0]}
                </span>
              </button>

              <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="absolute right-0 mt-2 w-56 bg-[#161a23] border border-white/10 rounded-xl shadow-2xl p-2 z-50"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0, transition: springNatural }}
                  exit={{ opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.15 } }}
                >
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-xs font-bold text-white truncate">
                      {profile?.display_name || 'Audience Member'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {role}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        onSelectTab('watchlist');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Bookmark className="h-4 w-4 text-amber-400" />
                      <span>My Watchlist</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectTab('history');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <History className="h-4 w-4 text-zinc-400" />
                      <span>Watch History</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-white/10">
                    <button
                      onClick={() => {
                        onSignOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20"
              whileHover={reduced ? {} : { scale: 1.04, transition: springSnappy }}
              whileTap={reduced ? {} : { scale: 0.93, transition: springSnappy }}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};
