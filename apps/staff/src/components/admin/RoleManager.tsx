import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Profile, AppRole } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';

interface RoleManagerProps {
  currentUserId: string;
}

const ROLES: AppRole[] = ['viewer', 'filmmaker', 'curator', 'admin'];

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
          <div className="overflow-x-auto">
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
                          <div className="h-6 w-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] uppercase">
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
                        <span className={`badge ${
                          p.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : p.role === 'curator'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : p.role === 'filmmaker'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {p.role}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isUpdating && <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />}
                          <select
                            disabled={isSelf || isUpdating}
                            value={p.role}
                            onChange={(e) => handleRoleChange(p.id, e.target.value as AppRole)}
                            className="form-select text-xs py-1 px-2 w-32 bg-slate-900 border-white/10 text-white disabled:opacity-40"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r.toUpperCase()}
                              </option>
                            ))}
                          </select>
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
