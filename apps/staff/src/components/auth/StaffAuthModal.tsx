import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AppRole } from '../../types';

interface StaffAuthModalProps {
  currentRole?: AppRole;
  isLoggedIn: boolean;
  onSignOut: () => void;
  onSuccess: () => void;
}

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({
  currentRole,
  isLoggedIn,
  onSignOut,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) throw signInErr;
      onSuccess();
    } catch (err) {
      console.error('Staff login error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // User is logged in, but role is neither curator nor admin
  if (isLoggedIn && currentRole !== 'curator' && currentRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#07090e]">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0f131c] p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-bold text-white font-display">
            Staff Access Required
          </h2>

          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Your current account role is <strong className="text-amber-400 uppercase">{currentRole}</strong>.
            The Staff Console is restricted to verified Curators and Platform Administrators.
          </p>

          <p className="mt-3 text-[11px] text-slate-500">
            If you are the platform owner, ensure your profile role in <code className="text-slate-300">public.profiles</code> has been set to <code className="text-slate-300">'admin'</code>.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={onSignOut}
              className="btn btn-secondary w-full text-xs"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#07090e]">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f131c] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 shadow-xl shadow-amber-600/30 mb-4 text-slate-950 font-black">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-white font-display tracking-tight">
            TPF Staff Console
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Sign in with your Curator or Administrator credentials
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@tpfcinemas.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-6 shadow-xl shadow-amber-500/20"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight className="h-4 w-4 text-slate-950" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
