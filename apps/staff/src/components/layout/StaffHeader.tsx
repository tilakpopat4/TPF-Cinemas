import React, { useState } from 'react';
import { ShieldCheck, Sparkles, LogOut, CheckSquare, Users, History } from 'lucide-react';
import { Profile, AppRole } from '../../types';

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
  const [showMenu, setShowMenu] = useState(false);
  const displayName = profile?.display_name || email?.split('@')[0] || 'Staff Member';
  const isAdmin = role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#08090c]/90 backdrop-blur-xl shadow-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/20 text-black font-black">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-black tracking-wider text-white">
                  TPF<span className="text-amber-500">CINEMAS</span>
                </span>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/25">
                  STAFF CONSOLE
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
                Curation & Content Moderation Portal
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] p-1 rounded-2xl">
            <button
              onClick={() => onTabChange('queue')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'queue'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Review Queue</span>
              {queueCount > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'queue'
                      ? 'bg-black text-amber-400'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {queueCount}
                </span>
              )}
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => onTabChange('roles')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'roles'
                      ? 'bg-white/10 text-white shadow-sm border border-white/10'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="h-4 w-4 text-sky-400" />
                  <span>Role Manager</span>
                </button>

                <button
                  onClick={() => onTabChange('audit')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'audit'
                      ? 'bg-white/10 text-white shadow-sm border border-white/10'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <History className="h-4 w-4 text-purple-400" />
                  <span>Audit Trail</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right Tools & User profile */}
        <div className="flex items-center gap-3">
          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 transition-colors focus:outline-none"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 text-xs font-black text-black uppercase">
                {displayName.charAt(0)}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-semibold text-zinc-200 leading-tight truncate max-w-[120px]">
                  {displayName}
                </p>
                <span className="flex items-center gap-1 text-[10px] text-zinc-400 capitalize">
                  {isAdmin ? (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Sparkles className="h-2.5 w-2.5" /> Platform Admin
                    </span>
                  ) : (
                    <span className="text-sky-400 font-semibold">Curator</span>
                  )}
                </span>
              </div>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0f131c] border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs font-bold text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{email}</p>
                  <span className="inline-block mt-1.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    {role} privilege
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
