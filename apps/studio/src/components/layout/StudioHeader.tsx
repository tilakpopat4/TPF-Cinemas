import React, { useState } from 'react';
import { Plus, LogOut, Clapperboard, Sparkles } from 'lucide-react';
import { Profile } from '../../types';

interface StudioHeaderProps {
  profile: Profile | null;
  email?: string;
  onNewFilm: () => void;
  onSignOut: () => void;
  isFilmmaker: boolean;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  profile,
  email,
  onNewFilm,
  onSignOut,
  isFilmmaker,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const displayName = profile?.display_name || email?.split('@')[0] || 'Creator';
  const role = profile?.role || 'viewer';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#08090c]/90 backdrop-blur-xl shadow-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-rose-600 shadow-lg shadow-rose-500/20">
              <Clapperboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-black tracking-wider text-white">
                  TPF<span className="text-amber-500">CINEMAS</span>
                </span>
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-display text-[9px] font-extrabold uppercase tracking-widest text-rose-400 border border-rose-500/25">
                  STUDIO
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
                Creator Portal & Film Submissions
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Primary Submit CTA */}
          {isFilmmaker && (
            <button
              onClick={onNewFilm}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg shadow-rose-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Submit Film</span>
            </button>
          )}

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 transition-colors focus:outline-none"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-zinc-700 to-zinc-600 text-xs font-bold text-white uppercase">
                {displayName.charAt(0)}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-semibold text-zinc-200 leading-tight truncate max-w-[120px]">
                  {displayName}
                </p>
                <span className="flex items-center gap-1 text-[10px] text-zinc-400 capitalize">
                  {role === 'admin' ? (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Sparkles className="h-2.5 w-2.5" /> Admin
                    </span>
                  ) : role === 'filmmaker' ? (
                    <span className="text-rose-400 font-semibold">Creator</span>
                  ) : (
                    role
                  )}
                </span>
              </div>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0f131c] border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs font-bold text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{email}</p>
                  <span className="inline-block mt-1.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25">
                    {role} tier
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onSignOut();
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
