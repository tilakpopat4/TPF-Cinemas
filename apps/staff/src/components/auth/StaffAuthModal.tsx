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

function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);

    try {
      const { error: oAuthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (oAuthErr) throw oAuthErr;
    } catch (err) {
      console.error('Google auth error:', err);
      setError((err as Error).message);
      setGoogleLoading(false);
    }
  }

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
          <div className="mx-auto flex items-center justify-center mb-6">
            <img src="/tpf-cinemas-logo.png" alt="TPF Cinemas" className="h-10 sm:h-12 w-auto object-contain grayscale opacity-80" />
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
          <div className="mx-auto flex items-center justify-center mb-6">
            <img src="/tpf-cinemas-logo.png" alt="TPF Cinemas Staff" className="h-10 sm:h-12 w-auto object-contain" />
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

        <div className="mb-4">
          <button
            type="button"
            disabled={loading || googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-sans font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.35)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer disabled:opacity-60 border-none"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
            ) : (
              <GoogleIcon className="h-4 w-4 shrink-0" />
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <span className="relative px-3 bg-[#0f131c] text-[10px] uppercase font-mono tracking-widest text-muted">
              or continue with email
            </span>
          </div>
        </div>

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
