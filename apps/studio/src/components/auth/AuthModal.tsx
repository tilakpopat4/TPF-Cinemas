import React, { useState } from 'react';
import { Clapperboard, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  onSuccess?: () => void;
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

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setSuccessMsg(null);
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

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) throw signUpError;
        setSuccessMsg('Account created! Check your email to confirm your account.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#07080A]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0E1015] p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center mb-6">
            <img src="/tpf-cinemas-logo.png" alt="TPF Cinemas Studio" className="h-10 sm:h-12 w-auto object-contain" />
          </div>
          <h2 className="text-2xl font-extrabold text-white font-display tracking-tight">
            TPF Cinemas Studio
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            {isSignUp ? 'Create your filmmaker creator account' : 'Sign in to manage your film submissions'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">
            {successMsg}
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
            <span className="relative px-3 bg-[#0E1015] text-[10px] uppercase font-mono tracking-widest text-muted">
              or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">Full Name / Studio Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Anand Kumar"
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="director@studio.com"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-sm font-semibold rounded-xl bg-signature text-black hover:bg-[#F2B94F] flex items-center justify-center gap-2 mt-6 shadow-lg shadow-signature/20 transition-all duration-150"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In to Studio'}</span>
                <ArrowRight className="h-4 w-4 text-black" />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setIsSignUp(false)}
                className="text-signature font-bold hover:underline ml-1"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account yet?{' '}
              <button
                onClick={() => setIsSignUp(true)}
                className="text-signature font-bold hover:underline ml-1"
              >
                Sign Up as Creator
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
