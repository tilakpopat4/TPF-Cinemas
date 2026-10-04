import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, Shield, AlertCircle, CheckCircle, Loader2, ChevronDown, Check } from 'lucide-react';
import { Profile, AppRole } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';

interface RoleManagerProps {
  currentUserId: string;
}

const ROLES: AppRole[] = ['viewer', 'filmmaker', 'curator', 'admin'];

const RoleSelector: React.FC<{
  currentRole: AppRole;
  disabled: boolean;
  onSelect: (role: AppRole) => void;
}> = ({ currentRole, disabled, onSelect }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={`relative inline-block text-left ${open ? 'z-50' : 'z-10'}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-ivory text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-none focus:outline-none w-32 shadow-sm"
      >
        <span>{currentRole}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-white/[0.12] bg-[#101117] shadow-[0_12px_36px_rgba(0,0,0,0.85)] py-1.5 z-50 overflow-hidden font-sans">
          {ROLES.map((r) => {
            const isSelected = r === currentRole;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between font-mono uppercase tracking-wider transition-colors ${
                  isSelected
                    ? 'bg-signature/15 text-signature font-bold'
                    : 'text-ivory hover:bg-white/[0.08]'
                }`}
              >
                <span>{r}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-signature" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const RoleManager: React.FC<RoleManagerProps> = ({ currentUserId }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadProfiles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProfiles((data as Profile[]) || []);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function handleRoleChange(userId: string, newRole: AppRole) {
    if (userId === currentUserId) {
      setMessage({ type: 'error', text: "You cannot change your own role (protects last admin)." });
      return;
    }

    setMessage(null);
    setUpdatingId(userId);

    try {
      const { error } = await supabase.rpc('set_user_role', {
        p_user_id: userId,
        p_role: newRole,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: `Role updated to "${newRole}" successfully.` });
      // Update local state
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
    } catch (err) {
      console.error('Role update failed:', err);
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = profiles.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <span>Platform User & Role Administration</span>
          </h3>
          <p className="text-xs text-slate-400">
            Promote team members to curators or platform admins via the secure database RPC.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search profiles..."
            className="form-input pl-9 text-xs py-1.5"
          />
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="console-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading profiles...</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[320px] pb-16">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>User ID</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th>Current Role</th>
                  <th className="text-right">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const isSelf = p.id === currentUserId;
                  const isUpdating = updatingId === p.id;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="font-bold text-white flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] uppercase font-mono">
                            {(p.display_name || 'U').charAt(0)}
                          </div>
                          <span>{p.display_name || 'Anonymous User'}</span>
                          {isSelf && (
                            <span className="text-[10px] text-amber-400 font-normal">(You)</span>
                          )}
                        </div>
                      </td>

                      <td className="font-mono text-xs text-slate-400">{p.id.slice(0, 8)}...</td>
                      <td className="text-slate-400 text-xs">{p.city || '–'}</td>
                      <td className="text-slate-400 text-xs">{formatDate(p.created_at)}</td>

                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                          p.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300'
                            : p.role === 'curator'
                            ? 'bg-purple-500/20 text-purple-300'
                            : p.role === 'filmmaker'
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-white/[0.08] text-muted'
                        }`}>
                          {p.role}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isUpdating && <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />}
                          <RoleSelector
                            currentRole={p.role}
                            disabled={isSelf || isUpdating}
                            onSelect={(r) => handleRoleChange(p.id, r)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
